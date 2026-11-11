# Verification layers

The local 1.2 baseline passed 31 strategy/Cordis tests and full native Harness session recovery. Public 1.3 retains that runtime behavior and adds portable test-runtime discovery and extracted-package consumption.

Commands:

```sh
npm ci --ignore-scripts
npm run verify
```

The full check includes:

1. Runtime JavaScript syntax, package metadata, unique composition IDs, module/schema resolution, locale/icon exports and exact Harness version.
2. 31 tests covering reasoning selection, unknown capabilities, manual choices, errors/cancellation, retention tiers, model switches, idle lifecycle protection, official pruner behavior and service isolation/cleanup.
3. Full preset activation in a real isolated Harness Host, real tool execution, pressure pruning, switching to a smaller declared model, manual compaction, JSONL validation, and normal shutdown/resume in two independent processes. Manual reasoning choices must survive resume.
4. `npm pack`, release-file allowlist checks, TGZ extraction and repeating the full Host/recovery scenario against the extracted package rather than the source checkout.

The model adapter is local and deterministic. This proves execution/lifecycle behavior under fixtures, not real-provider quality or universal compatibility. The test does not restart the user's engine, touch their profile, copy credentials or create a Web server.

Raw fixture sessions and logs stay in ignored `.verification/` directories. No author-machine artifact paths or process IDs are published.

Local platform evidence: Android/Ubuntu, Node 24.22.1, DSH 0.2.2-rc.1. Cloud CI is configured for Ubuntu and Node 24; its actual status must be checked on GitHub Actions, not inferred from the workflow file. Other systems, paid suppliers, long-running load, abrupt power loss and all third-party plugin combinations are unverified.
