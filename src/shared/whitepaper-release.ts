import manifestRaw from "../react-app/content/whitepaper/manifest.json?raw";

interface WhitepaperReleaseRecord {
	id: string;
	releasedAt: string;
	status: string;
}

interface WhitepaperManifest {
	policy: {
		latestPublished: string;
	};
	versions: WhitepaperReleaseRecord[];
}

const manifest = JSON.parse(manifestRaw) as WhitepaperManifest;

if (!manifest.policy?.latestPublished) throw new Error("Whitepaper manifest is missing policy.latestPublished");

export const WHITEPAPER_LATEST_PUBLISHED = manifest.policy.latestPublished;
export const WHITEPAPER_PUBLISHED_RELEASES = manifest.versions.filter((item) => item.status === "published");
