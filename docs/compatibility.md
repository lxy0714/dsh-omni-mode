# Compatibility

| Component | Current scope |
|---|---|
| Harness | `0.2.2-rc.1`, exact install gate |
| Node | Syntax/API minimum `22.16.0`; local tests used `24.22.1` |
| Platform | Local Android/Ubuntu host; other platforms not yet claimed |
| Model | Advertised metadata required for reasoning/capacity decisions; unknown data falls back, without inventing support |
| Third-party plugins | Generic visible tools can coexist; all combinations are not tested |

The exact gate is intentional. A future Harness upgrade may change lifecycle, session or composition contracts. Add an isolated test baseline and update the gate only after validation.

Reasoning effort IDs are opaque. Initialization ranks only recognizable advertised human labels and passes the original ID unchanged. It does not switch provider/model. Resume, clear and compact do not reapply the fresh-agent default.

Retention selects official immutable pools after reserving declared output plus 8192 tokens: unknown/small capacity uses an 8192-character threshold, at least 131072 available tokens uses 32768 characters, and at least 524288 uses 131072 characters. Characters are not tokens; this is not a universal no-overflow guarantee.

Official compaction uses 8192-token headroom, an 8192-token **summary** output cap and 0.12 recent retention. These are not caps on the main conversation's reasoning or output. Too-small fixed system/tool envelopes or missing model capacities can still fail.

Existing live agents retain prior revisions. Restart/resume resolves the current definition for the recorded preset ID. This project does not override unrelated presets or the global model default.
