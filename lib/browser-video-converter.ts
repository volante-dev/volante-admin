"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { describeUnknownError, toError } from "@/lib/error-utils";

export type VideoConversionPhase =
  | "loading"
  | "converting"
  | "uploading"
  | "finalizing";

export type VideoConversionStatus = {
  phase: VideoConversionPhase;
  progress: number | null;
  label: string;
};

type ProgressCallback = (status: VideoConversionStatus) => void;

const coreURL = "/vendor/ffmpeg/ffmpeg-core.js";
const wasmURL = "/vendor/ffmpeg/ffmpeg-core.wasm";
const inputFileName = "input.mov";
const outputFileName = "output.mp4";
const maxStoredLogs = 40;

let ffmpegPromise: Promise<FFmpeg> | null = null;
let ffmpegLoggerAttached = false;
let ffmpegLogs: string[] = [];
const movMimeTypes = new Set(["video/quicktime", "video/mov", "video/x-quicktime"]);

export const isMovVideoFile = (file: File) =>
  movMimeTypes.has(file.type.toLowerCase()) ||
  file.name.toLowerCase().endsWith(".mov");

export const getMp4FileName = (name: string) =>
  name.replace(/\.[^.]+$/, "") + ".mp4";

const rememberFFmpegLog = (message: string) => {
  ffmpegLogs = [...ffmpegLogs.slice(-(maxStoredLogs - 1)), message];
};

const getRecentFFmpegLogs = () => ffmpegLogs.join("\n");

const attachFFmpegLogger = (ffmpeg: FFmpeg) => {
  if (ffmpegLoggerAttached) return;
  ffmpegLoggerAttached = true;
  ffmpeg.on("log", ({ type, message }: { type: string; message: string }) => {
    const line = `[${type}] ${message}`;
    rememberFFmpegLog(line);
    if (type === "stderr") {
      console.debug("[video-converter:ffmpeg]", message);
    }
  });
};

const getFFmpeg = async (onProgress?: ProgressCallback) => {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      onProgress?.({
        phase: "loading",
        progress: null,
        label: "Chargement du moteur video",
      });
      const ffmpeg = new FFmpeg();
      attachFFmpegLogger(ffmpeg);
      try {
        await ffmpeg.load({ coreURL, wasmURL });
        console.info("[video-converter] FFmpeg charge", { coreURL, wasmURL });
        return ffmpeg;
      } catch (error) {
        ffmpegPromise = null;
        ffmpegLoggerAttached = false;
        console.error("[video-converter] Echec du chargement FFmpeg", {
          coreURL,
          wasmURL,
          error,
          message: describeUnknownError(error),
        });
        throw toError(error, "Le moteur de conversion video n'a pas pu etre charge.");
      }
    })();
  } else {
    onProgress?.({
      phase: "loading",
      progress: null,
      label: "Preparation du moteur video",
    });
  }

  return ffmpegPromise;
};

const toUint8Array = (data: Awaited<ReturnType<FFmpeg["readFile"]>>) => {
  if (typeof data === "string") return new TextEncoder().encode(data);
  return data;
};

const runConversion = async (
  ffmpeg: FFmpeg,
  args: string[],
  onProgress?: ProgressCallback,
) => {
  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.({
      phase: "converting",
      progress: Math.max(0, Math.min(1, progress)),
      label: "Conversion en MP4",
    });
  };

  ffmpeg.on("progress", progressHandler);
  try {
    return await ffmpeg.exec(args);
  } finally {
    ffmpeg.off("progress", progressHandler);
  }
};

export const convertVideoToMp4 = async (
  source: File | Blob,
  outputName: string,
  onProgress?: ProgressCallback,
) => {
  const ffmpeg = await getFFmpeg(onProgress);
  ffmpegLogs = [];

  onProgress?.({
    phase: "converting",
    progress: 0,
    label: "Conversion en MP4",
  });

  try {
    console.info("[video-converter] Debut de conversion", {
      outputName,
      sourceType: source.type,
      sourceSize: source.size,
    });
    await ffmpeg.deleteFile(inputFileName).catch(() => undefined);
    await ffmpeg.deleteFile(outputFileName).catch(() => undefined);
    await ffmpeg.writeFile(inputFileName, await fetchFile(source));

    const remuxCode = await runConversion(
      ffmpeg,
      [
        "-i",
        inputFileName,
        "-map",
        "0:v:0?",
        "-map",
        "0:a:0?",
        "-c",
        "copy",
        "-movflags",
        "faststart",
        outputFileName,
      ],
      onProgress,
    );

    if (remuxCode !== 0) {
      console.warn("[video-converter] Remux impossible, transcodage tente", {
        remuxCode,
        ffmpegLogs: getRecentFFmpegLogs(),
      });
      await ffmpeg.deleteFile(outputFileName).catch(() => undefined);
      const encodeCode = await runConversion(
        ffmpeg,
        [
          "-i",
          inputFileName,
          "-map",
          "0:v:0?",
          "-map",
          "0:a:0?",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "faststart",
          outputFileName,
        ],
        onProgress,
      );

      if (encodeCode !== 0) {
        throw new Error(
          `La conversion en MP4 a echoue (code ${encodeCode}). ${getRecentFFmpegLogs()}`,
        );
      }
    }

    const data = toUint8Array(await ffmpeg.readFile(outputFileName));
    const output = new Uint8Array(data.byteLength);
    output.set(data);
    onProgress?.({
      phase: "converting",
      progress: 1,
      label: "Conversion terminee",
    });

    return new File([output.buffer], getMp4FileName(outputName), {
      type: "video/mp4",
    });
  } catch (error) {
    console.error("[video-converter] Echec de conversion", {
      outputName,
      sourceType: source.type,
      sourceSize: source.size,
      ffmpegLogs: getRecentFFmpegLogs(),
      error,
      message: describeUnknownError(error),
    });
    throw toError(error, "La conversion en MP4 a echoue.");
  } finally {
    await ffmpeg.deleteFile(inputFileName).catch(() => undefined);
    await ffmpeg.deleteFile(outputFileName).catch(() => undefined);
  }
};
