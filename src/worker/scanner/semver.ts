/**
 * Minimal, conservative semver parsing and range checking.
 *
 * The scanner must never invent a compatibility claim: when a range cannot be
 * understood, the result is "UNKNOWN" rather than a guess. Only the range forms
 * that realistically appear in DSH plugin manifests are supported.
 */

export interface Semver {
	major: number;
	minor: number;
	patch: number;
	prerelease: string[];
}

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export function parseSemver(input: string): Semver | null {
	const m = SEMVER_RE.exec(input.trim());
	if (!m) return null;
	return {
		major: Number(m[1]),
		minor: Number(m[2]),
		patch: Number(m[3]),
		prerelease: m[4] ? m[4].split(".") : [],
	};
}

function comparePrerelease(a: string[], b: string[]): number {
	if (a.length === 0 && b.length === 0) return 0;
	if (a.length === 0) return 1;
	if (b.length === 0) return -1;
	const len = Math.max(a.length, b.length);
	for (let i = 0; i < len; i++) {
		const x = a[i];
		const y = b[i];
		if (x === undefined) return -1;
		if (y === undefined) return 1;
		const xn = Number(x);
		const yn = Number(y);
		const xNum = !Number.isNaN(xn);
		const yNum = !Number.isNaN(yn);
		if (xNum && yNum) {
			if (xn !== yn) return xn < yn ? -1 : 1;
		} else if (xNum !== yNum) {
			return xNum ? -1 : 1;
		} else if (x !== y) {
			return x < y ? -1 : 1;
		}
	}
	return 0;
}

export function compareSemver(a: Semver, b: Semver): number {
	if (a.major !== b.major) return a.major < b.major ? -1 : 1;
	if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
	if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
	return comparePrerelease(a.prerelease, b.prerelease);
}

export type RangeResult = { satisfied: true } | { satisfied: false } | { satisfied: null };

export function isPrerelease(v: Semver): boolean {
	return v.prerelease.length > 0;
}

export function satisfiesRange(version: string, range: string): RangeResult {
	const v = parseSemver(version);
	if (!v) return { satisfied: null };
	const r = range.trim();

	if (r === "" || r === "*" || r === "x" || r === "latest" || r === ">=0") {
		return { satisfied: true };
	}

	if (r.includes("||")) {
		const alternatives = r.split(/\s*\|\|\s*/);
		let sawUnknown = false;
		for (const alternative of alternatives) {
			if (!alternative) {
				sawUnknown = true;
				continue;
			}
			const res = satisfiesRange(version, alternative);
			if (res.satisfied === true) return res;
			if (res.satisfied === null) sawUnknown = true;
		}
		return sawUnknown ? { satisfied: null } : { satisfied: false };
	}

	if (/\s/.test(r)) {
		const clauses = r.split(/\s+/).filter(Boolean);
		let sawUnknown = false;
		for (const clause of clauses) {
			const res = satisfiesRange(version, clause);
			if (res.satisfied === false) return res;
			if (res.satisfied === null) sawUnknown = true;
		}
		return sawUnknown ? { satisfied: null } : { satisfied: true };
	}

	if (r.startsWith("^")) return caret(r.slice(1), v);
	if (r.startsWith("~")) return tilde(r.slice(1), v);
	if (r.startsWith(">=")) return cmp(r.slice(2), v, (c) => c >= 0);
	if (r.startsWith("<=")) return cmp(r.slice(2), v, (c) => c <= 0);
	if (r.startsWith(">")) return cmp(r.slice(1), v, (c) => c > 0);
	if (r.startsWith("<")) return cmp(r.slice(1), v, (c) => c < 0);
	if (r.startsWith("=")) return cmp(r.slice(1), v, (c) => c === 0);
	return cmp(r, v, (c) => c === 0);
}

function cmp(spec: string, v: Semver, predicate: (c: number) => boolean): RangeResult {
	const target = parseSemver(spec);
	if (!target) return { satisfied: null };
	return { satisfied: predicate(compareSemver(v, target)) };
}

function caret(spec: string, v: Semver): RangeResult {
	const target = parseSemver(spec);
	if (!target) return { satisfied: null };
	let upper: Semver;
	if (target.major === 0 && target.minor === 0) {
		upper = { major: 0, minor: 0, patch: target.patch + 1, prerelease: [] };
	} else if (target.major === 0) {
		upper = { major: 0, minor: target.minor + 1, patch: 0, prerelease: [] };
	} else {
		upper = { major: target.major + 1, minor: 0, patch: 0, prerelease: [] };
	}
	return { satisfied: compareSemver(v, target) >= 0 && compareSemver(v, upper) < 0 };
}

function tilde(spec: string, v: Semver): RangeResult {
	const target = parseSemver(spec);
	if (!target) return { satisfied: null };
	const upper: Semver = { major: target.major, minor: target.minor + 1, patch: 0, prerelease: [] };
	return { satisfied: compareSemver(v, target) >= 0 && compareSemver(v, upper) < 0 };
}
