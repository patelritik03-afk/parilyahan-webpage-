import "server-only";

export function logFailures(label: string, results: PromiseSettledResult<unknown>[]) {
  for (const result of results) {
    if (result.status === "rejected") console.error(`${label} failed:`, result.reason);
  }
}
