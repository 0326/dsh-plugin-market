import versionsRaw from "../react-app/content/whitepaper/versions.json?raw";

interface WhitepaperReleaseRecord {
	id: string;
	releasedAt: string;
	status: string;
}

interface WhitepaperReleaseConfig {
	latestPublished: string;
	versions: WhitepaperReleaseRecord[];
}

const config = JSON.parse(versionsRaw) as WhitepaperReleaseConfig;

if (!config.latestPublished) throw new Error("Whitepaper versions.json is missing latestPublished");

export const WHITEPAPER_LATEST_PUBLISHED = config.latestPublished;
export const WHITEPAPER_PUBLISHED_RELEASES = config.versions.filter((item) => item.status === "published");
