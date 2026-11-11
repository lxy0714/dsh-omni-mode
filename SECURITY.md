# Security

This bundle runs ordinary plugin code inside the DeepSeek Harness Host. Tool approval controls do not sandbox plugin code. Review source and use an isolated environment for unfamiliar changes.

The runtime requires no separate API key, does not collect telemetry, and does not read the author's credentials. It uses metadata/services provided by the host. Tasks performed by the agent may still call external providers or tools configured by the user.

Retain platform permissions, login requirements, user stop/cancel, plan mode and tool-specific authorization. “Quality first” does not authorize unrelated purchases, exfiltration, or indiscriminate file access.

Do not post secrets, private project files, raw session logs or exploit credentials in public Issues. For a suspected vulnerability, first open an issue containing only a non-sensitive description and request a private reporting channel; do not publish sensitive reproduction material until such a channel exists.

Support is limited to the exact documented Harness version until additional baselines are verified. Review releases and source before upgrading. A compatibility override is not a security fix.
