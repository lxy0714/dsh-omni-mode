# Verification

Public verification notes live in [docs/verification.md](docs/verification.md). Local raw session logs, process IDs and machine-specific artifact paths are intentionally not published.

Reproduce with `npm ci --ignore-scripts` and `npm run verify`. Integration uses real Harness services and a deterministic local inference adapter; it does not call a paid model provider.
