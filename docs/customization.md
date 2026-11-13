# 自行修改 / Customization

[中文](#中文) · [English](#english)

## 中文

MIT 允许安装、修改、fork 和再分发，保留 LICENSE 与适用归属即可。推荐 clone/fork 后修改自己的源码，不要直接修改包管理器缓存。

```sh
git clone https://github.com/lxy0714/dsh-omni-mode.git
cd dsh-omni-mode
npm ci --ignore-scripts
npm run verify
```

### 改哪些文件

- `cordis.patch.yml`：persona、工具组合、配置与隔离组。只改需要的部分，保留 provider/consumer 的同 realm 关系。
- `quality.js`：最高可识别推理档位初始化。保留未知能力、并发手选、取消和恢复保护。
- `adaptive.js`：容量缓存和活动回合保留选择。不要在空闲 Session 写入替换 tool/result。
- `pool.js`：官方裁剪器桥接。避免把服务泄漏到 Host。
- `locale/` 与 `icon.svg`：插件管理器显示资源。图标可随 MIT 项目修改。

将修改后的目录绝对路径交给 DSH 插件管理器安装，重启引擎、新建会话再验证。无需构建普通运行时 JS。

### 替换与并存

若用自己的版本替换原版，先在管理器移除原版，保留 preset ID `omni`。若想两版同时出现，必须更换包名、`preset-omni` 声明 ID、`config.id`、私有 service/alias 名称及测试自引用。只改显示名称不足以避免冲突。

包导出、files 白名单或相对路径变化后运行完整验证，包括 TGZ 解包消费检查。保留 MIT 和 THIRD_PARTY_NOTICES；不要把自己的本机配置、API key 或测试日志放进仓库。

## English

MIT permits installation, modification, forks and redistribution while retaining LICENSE and applicable notices. Clone/fork your own source rather than editing package-manager caches.

```sh
git clone https://github.com/lxy0714/dsh-omni-mode.git
cd dsh-omni-mode
npm ci --ignore-scripts
npm run verify
```

### What to edit

- `cordis.patch.yml`: persona, tool composition, configuration and isolation groups. Keep providers and consumers in the same realm.
- `quality.js`: reasoning initialization. Preserve unknown-capability, concurrent-manual-selection, cancellation and resume protections.
- `adaptive.js`: capacity cache and active-turn retention. Do not append replacement tool results to idle sessions.
- `pool.js`: official pruner bridges. Avoid leaking services into the Host realm.
- `skills/omni-*/SKILL.md`: on-demand domain methods plus `omni-method` and `omni-code-media`. Editing these changes methods and workflow only, never tools or authority; keep the bilingual text and existing boundaries.
- `capabilities/`: capability index and local operations. `maturity` in `catalog.json` must match reality — `verified` means an independently tested local contract only. Change an operation and update the catalog and tests together, or `doctor --test` will fail.
- `media/`: the code-media runner. `toolchain/` is a separate optional dependency manifest; never add resvg and friends to the main package's production dependencies, and FFmpeg/ffprobe always come from the user.
- `research/`, `benchmark/`, `scripts/`: research evidence, case sets and verification scripts, **not shipped in the package**. Run `npm run verify` after changing them.
- `locale/` and `icon.svg`: plugin-manager resources; the icon may be modified under MIT.

Install the modified directory's absolute path through the Harness plugin manager, restart and create a new session. Ordinary runtime JavaScript needs no build.

### Replacement versus coexistence

To replace the original, remove it through the manager and keep preset ID `omni`. For parallel installation, consistently rename the package, `preset-omni` declaration, `config.id`, private services/aliases and test self-references. Changing only the display name does not avoid collisions.

After changing exports, the files allowlist or relative paths, run full verification including extracted-TGZ consumption. Preserve MIT and THIRD_PARTY_NOTICES. Never commit local profiles, API keys or test logs.
