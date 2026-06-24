"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

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

let ffmpegPromise: Promise<FFmpeg> | null = null;

export const isMovVideoFile = (file: File) =>
  file.type === "video/quicktime" || file.name.toLowerCase().endsWith(".mov");

export const getMp4FileName = (name: string) =>
  name.replace(/\.[^.]+$/, "") + ".mp4";

const getFFmpeg = async (onProgress?: ProgressCallback) => {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      onProgress?.({
        phase: "loading",
        progress: null,
        label: "Chargement du moteur video",
      });
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({ coreURL, wasmURL });
      return ffmpeg;
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

  onProgress?.({
    phase: "converting",
    progress: 0,
    label: "Conversion en MP4",
  });

  try {
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
        throw new Error("La conversion en MP4 a echoue.");
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
  } finally {
    await ffmpeg.deleteFile(inputFileName).catch(() => undefined);
    await ffmpeg.deleteFile(outputFileName).catch(() => undefined);
  }
};
