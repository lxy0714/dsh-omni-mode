# Omni mode for DeepSeek Harness

[中文](README.md) · [Compatibility](docs/compatibility.md#english) · [Coexistence](docs/coexistence.md#english) · [Customization](docs/customization.md#english)

A cross-project, quality-first native agent preset: understand the goal, plan when useful, combine available capabilities, verify, and deliver. It is a configurable bundle, not a new model or a permission bypass. Preset ID: `omni`; display name: `全能模式`.

## Install

The current compatibility gate is **DSH 0.2.2-rc.1**.

```sh
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.5.0
```

Or download the fixed-version TGZ from [Releases](https://github.com/lxy0714/dsh-omni-mode/releases) and add it through the Harness plugin manager. Use your actual profile; desktop applications should use their own plugin-management entry point.

Restart the engine, create a new conversation, and select `全能模式`. Existing live conversations retain their earlier preset revision. Plain JavaScript runtime files are shipped; no user-side build is required.

The former local bundle `@local/dsh-omni-preset` declares the same `omni` ID: remove that bundle through the manager before enabling this one. Do not delete your whole profile. This is a GitHub/Release distribution, **not an npm publication**; `private: true` intentionally prevents accidental npm publishing.

## Bundled grilling skill

Omni mode bundles Matt Pocock's MIT-licensed `grilling` skill (verbatim; no copy into `~/.dsh/skills`). **Enabled by default**: when a task contains a design trade-off you own — architecture or stack selection, dependency replacement, data model, permission or security boundary, destructive or irreversible action, scope and acceptance criteria, cost trade-offs — or the requirement still has ambiguity that would change the implementation direction, the model first loads grilling, interviews in rounds over a design tree, asks only what you can decide now with a recommended answer, and implements after explicit agreement. Plain execution, already-specified steps, mechanical edits, fact lookups and fixes of an identified defect do not enter an interview, so ordinary tasks do not turn into multi-round questioning. You can tell it to skip the interview at any time. See [using grilling](docs/grilling.md#english).

## Behavior

- Discover and combine capabilities actually available to the current agent: files, search, shells, skills, tools, plugins, MCP, libraries and subagents.
- On fresh-agent initialization, attempt the highest advertised reasoning level with a recognizable human label. Keep the selected provider/model and respect subsequent manual choices.
- Choose immutable, isolated official retention pools using declared model capacity and output reservation; use conservative metadata when switching to smaller models.
- Retain native compaction, overflow recovery and durable session semantics. Unknown metadata falls back conservatively instead of inventing capacity.
- Prioritize quality over saving fees, without pointless calls, unbounded retry loops, or overlapping concurrent writes.

This does not alter model weights, guarantee better answers, enable missing services, or remove authorization, user-stop and plan-mode rules. A UI-only plugin is not automatically callable by an agent. Core-service replacements need explicit coexistence testing. Installing plugins executes Host code; tool approvals are not a sandbox for that code.

## Modify and redistribute

MIT licensed: use, modify, fork and redistribute while retaining the license and applicable notices. Clone/fork the repository, edit the source and install its absolute local directory through the plugin manager. Restart the engine and create a new conversation after code changes. Avoid editing package-manager caches, which upgrades may overwrite.

`cordis.patch.yml` contains persona/tool composition; `quality.js` controls initialization; `adaptive.js` controls retention; `pool.js` bridges private services. See the [customization guide](docs/customization.md#english). A parallel fork must rename package, preset/declaration IDs and private services to avoid collisions.

## Development and verification

```sh
npm ci --ignore-scripts
npm run verify
```

The development Harness version is pinned. Tests discover the local runtime dependency, or accept `DSH_TEST_BASE` pointing to an existing installation package.json. No author-machine path is required.

Checks cover manifests/syntax, 31 policy/Cordis tests, full native session persistence across independent processes and extracted TGZ consumption. **Inference uses a deterministic local adapter. These checks do not establish real-provider quality, long-term stability, or universal platform/plugin compatibility.** See [verification](docs/verification.md#english) and the actual [Actions](https://github.com/lxy0714/dsh-omni-mode/actions) results.

For upgrades, back up customizations, remove the previous bundle through the manager, install the fixed version and restart. Uninstall only this bundle, not unrelated settings or sessions. Report sanitized reproduction details through [Issues](https://github.com/lxy0714/dsh-omni-mode/issues).

[MIT original](LICENSE) · [License explanation](docs/license.md#english) · [Third-party notices](THIRD_PARTY_NOTICES.md#english) · [Security](SECURITY.md#english) · [Documentation index](docs/README.md#english)
