import { getFrontendAppUrl } from "./config";

export const notifyProjectIndexing = async (slug: string) => {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return;

  const site = new URL(getFrontendAppUrl());
  const urlList = [
    new URL(`/portfolio/${slug}`, site).toString(),
    new URL(`/en/portfolio/${slug}`, site).toString(),
    new URL("/portfolio", site).toString(),
    new URL("/en/portfolio", site).toString(),
  ];

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: site.host,
        key,
        keyLocation: new URL("/api/indexnow-key", site).toString(),
        urlList,
      }),
    });

    if (!response.ok) {
      console.error(`[indexnow] Submission failed with status ${response.status}.`);
    }
  } catch (error) {
    console.error(
      "[indexnow] Submission failed.",
      error instanceof Error ? error.message : error,
    );
  }
};
