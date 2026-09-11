const RC_RE = /^dsh-v(\d+)\.(\d+)\.(\d+)-rc\.(\d+)$/;
const STABLE_RE = /^dsh-v(\d+)\.(\d+)\.(\d+)$/;

export function classifyDshRelease(tag) {
  if (STABLE_RE.test(tag)) return "stable";
  if (RC_RE.test(tag)) return "rc";
  return null;
}

export function isSupportedDshRelease(tag) {
  return classifyDshRelease(tag) !== null;
}

export function assertSupportedDshRelease(tag) {
  const channel = classifyDshRelease(tag);
  if (!channel) {
    throw new Error(`Unsupported DSH whitepaper release: ${tag}. Only rc and stable tags are accepted.`);
  }
  return channel;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const samples = [
    ["dsh-v0.1.5-rc.1", "rc"],
    ["dsh-v0.1.5", "stable"],
    ["dsh-v0.1.5-alpha.1", null],
    ["dsh-v0.1.5-beta.2", null],
    ["dsh-v0.1.5-canary.1", null],
    ["master", null],
  ];
  for (const [tag, expected] of samples) {
    const actual = classifyDshRelease(tag);
    if (actual !== expected) throw new Error(`${tag}: expected ${expected}, got ${actual}`);
  }
  console.log("Whitepaper release policy passed: rc + stable only");
}
