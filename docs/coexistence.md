# Coexistence

Omni mode is not a closed allowlist. A plugin or MCP tool can be used when installed, enabled, connected and visible to the current Agent. Plugins that only render UI need a tool/action interface before the agent can invoke them.

The retention provider, its official pools, bridge aliases and compaction consumers are in preset-private isolation groups. They do not replace the Host's global model or compaction service. A global replacement may therefore not affect this preset; isolation prevents unwanted overlap, not automatic integration.

Potential conflicts include duplicate preset IDs, same-scope tool/service names, competing model/request changes, multiple providers in one realm, incorrect event/lifecycle writes and unowned listeners. Core-service replacement plugins require focused testing.

The legacy local bundle `@local/dsh-omni-preset` declares the same `omni` ID. Do not enable both that bundle and `dsh-omni-mode`. For an independently selectable fork, rename package, declaration/preset IDs and private aliases consistently.

A useful compatibility test enables both plugins, creates a session, invokes their actual tools, switches models if relevant, persists/resumes, unloads one plugin and verifies the other. Existing tests verify native Harness composition and no service leakage; they do not certify every third-party combination.
