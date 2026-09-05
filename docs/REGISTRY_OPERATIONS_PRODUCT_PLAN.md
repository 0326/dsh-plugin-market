# Registry operations and product plan

This is the operating model for `dsh-plugin.market` on a Cloudflare Paid
account shared with other applications. Paid limits are capacity, not a target:
the registry keeps a deliberately small, predictable share and scales only
after observed usage supports it.

## Default shared-account budget

| Resource | Registry guardrail | Why |
| --- | ---: | --- |
| D1 reads | keep routine registry reads below 100M/month | leaves the great majority of the paid allowance for other apps and incidents |
| D1 writes | keep routine writes below 1M/month | scans and snapshots should be the dominant, observable write sources |
| Queue | keep normal traffic below 50k operations/month | submission and scanner recovery cannot crowd out other account workloads |
| GitHub API | one scan consumer, 900ms request spacing | protects the shared GitHub token and makes rate-limit failures rare |

These are alert thresholds, not hard service limits. If the account-wide D1
dashboard reaches 50% of its expected monthly allocation, reduce discovery and
rescan budgets before changing application behavior.

## Schedules and bounded work

| UTC schedule | Job | Bound |
| --- | --- | --- |
| `15 * * * *` | Incremental discovery | 100 repositories/run |
| `20 2 * * *` | Reconciliation discovery | 800 repositories/run |
| `5 */6 * * *` | Compatibility baseline refresh | one baseline refresh/run |
| `35 3 * * *` | Daily facts | one compact snapshot per plugin/day |
| `50 3 * * *` | Scanner rescan sweep + featured recompute | 250 repositories/day |

Queue execution is intentionally serialized (`max_concurrency: 1`, five
messages/batch). Each retry is delayed and keeps retrying until Cloudflare moves
the message to `dsh-plugin-scan-dlq` after five failed deliveries. This prevents
an upstream GitHub incident from silently deleting scanner work or multiplying
concurrent API requests.

## Operating procedure

1. Check `pipeline_runs` for a failed scheduled job and `scan_attempts` for its
   affected repository/error category.
2. For a GitHub rate-limit incident, leave the DLQ untouched, reduce
   `GITHUB_REQUEST_DELAY_MS` only after the token budget is healthy, and replay
   failed messages from the Cloudflare Queue dashboard after the incident.
3. For a scanner revision or baseline change, retain the 250/day sweep. Increase
   `RESCAN_DAILY_BUDGET` temporarily only after checking account-wide D1 and
   Queue consumption.
4. Before raising discovery limits, compare the last seven `pipeline_runs` with
   D1 account usage; change one variable at a time and observe for a week.

## Product read model

- `/api/home` supplies trust context and all three homepage rails in one cached
  response. Edge-rendered home HTML includes the same payload so hydration does
  not create a second first-screen fetch.
- Explore defaults to `DETECTED` and `FORMAT_VERIFIED` records. Topic candidates
  are available only through the explicit “include candidates” control.
- Search waits for three characters, debounces 400ms, skips the COUNT query, and
  uses the D1 FTS5 trigram index instead of leading-wildcard `LIKE` scans.
- Capability counts come from a small daily materialized table, not JSON-array
  aggregation on every page load.
- “7-day star growth” remains hidden until daily snapshots contain a comparable
  observation. It is never approximated from current stars and repository push
  time.

## Next measured increments

1. After seven daily snapshots, expose the real trending sort and validate the
   largest movers against GitHub.
2. Use `plugin_events` to add a compact changelog and per-plugin change history;
   keep the API paginated and cache public reads.
3. Add a lightweight compare page for two or three plugins using existing trust
   fields, only after analytics show users reach detail pages but fail to install.
4. Review Cloudflare Analytics and D1 account usage weekly for the first month;
   tune schedule limits only from measured account-wide headroom.
