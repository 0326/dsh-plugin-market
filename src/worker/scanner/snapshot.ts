/** Immutable repository snapshot fed into the pure scanner. */

export interface RepoFile {
	path: string;
	/** Text content when fetched and decoded; undefined when binary or not fetched. */
	content?: string;
}

export interface RepoSnapshot {
	owner: string;
	repo: string;
	defaultBranch: string;
	commitSha: string;
	files: RepoFile[];
}

export function hasFile(snapshot: RepoSnapshot, path: string): boolean {
	return snapshot.files.some((f) => f.path === path);
}

export function getFile(snapshot: RepoSnapshot, path: string): RepoFile | undefined {
	return snapshot.files.find((f) => f.path === path);
}

export function getFileContent(snapshot: RepoSnapshot, path: string): string | undefined {
	return getFile(snapshot, path)?.content;
}
