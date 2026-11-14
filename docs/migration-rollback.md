# 本机迁移与回滚 / Local migration and rollback

[中文](#中文) · [English](#english)

## 中文

### 本机试用状态与历史回滚基线

2026-11-13 只读复核：用户明确要求本机升级后，该实例的 profile 已以 `link:` 指向 `dsh-omni-mode@1.7.0-dev.1`；这是开发版试用，不是稳定发行。本轮验收没有再次迁移。以下旧包记录是迁移前回滚基线，**不是当前生效包**：

- profile：`/root/.dsh/profiles/web`
- 迁移前预设包：`@local/dsh-omni-preset@1.2.0`，以 `link:` 指向 `/root/workspace/dsh-omni-preset`
- 同时装有一个临时的评测宿主包 `@local/omni-benchmark-host`（指向本仓库的 `tools/benchmark-host`），它不属于预设本身，迁移前应单独决定去留

上一个稳定版仍是 `v1.5.0`，可作回退目标；本版为正式版 `1.7.0`。整体行为验收仍未通过，正式版只表示版本已作为常规发行提供，不表示该行为门槛已达成。该机器的实际路径不是其他用户必须采用的安装路径。

### 迁移前必须先满足

1. 真实模型领域/跨域任务验收完成并保留原始记录（12 项已尝试，但[执行复核](domain-run-results.md#中文)明确仍未整体通过）。
2. 该层结果至少证明三类实际增强，且关键能力无退步。
3. 官方最新版本兼容性复核通过（接受 DSH `>=0.2.2-rc.1 <=0.2.2-rc.3`（即 rc.1、rc.2 与 rc.3），Node ≥ 24.9.0）。
4. 已经准备好本文的回滚步骤。

任一条不满足就不迁移，也不把"工具能用"说成"预设变强"。

### 回滚准备

迁移前先记录可以精确还原的状态，不要只依赖记忆：

```sh
# 1. 记录当前 profile 依赖与预设包来源
cp /root/.dsh/profiles/web/package.json /root/omni-rollback-profile-package.json
grep -n "dsh-omni-preset\|omni-benchmark-host" /root/.dsh/profiles/web/package.json

# 2. 备份当前生效的旧预设源码（它是回滚目标）
tar -czf /root/omni-rollback-preset-1.2.0.tar.gz -C /root/workspace dsh-omni-preset

# 3. 记录仓库当前提交，便于回到同一源码点
git -C /root/workspace/dsh-omni-mode rev-parse HEAD
```

`/root` 下这三个备份文件不在仓库内，也不会被 `npm run verify` 或打包改动。

**回滚演练已实际执行**：把备份解压到隔离临时目录后，确认还原出的包仍是 `preset-omni` / `omni` /「全能模式」、版本 `1.2.0`、24 个插件行，且 `quality.js` 哈希与当前仓库一致；演练目录随后已清理。这说明备份可还原，但**不代表已演练真实切换 profile**（切换需先完成行为验收）。

### 迁移步骤（验收通过后执行）

两条路径二选一，不要同时启用两个声明同一 `omni` ID 的包。

**A. 用已发布版本（推荐，可追溯）**

```sh
dsh plugin --profile web remove @local/dsh-omni-preset
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.7.0
```

**B. 用本地源码（调试用）**

```sh
dsh plugin --profile web remove @local/dsh-omni-preset
dsh plugin --profile web add /root/workspace/dsh-omni-mode
```

随后重启引擎，**新建对话**并选择「全能模式」。已有会话保留其启动时的预设版本，不会自动切换。

迁移后确认：

- 预设列表中只有一个 `omni` 条目，且显示名为「全能模式」。
- 新会话能加载 11 个 `omni-*` 技能与能力索引。
- 代码视觉按需准备工具环境后可以真实出片；未准备时明确报告阻塞，而不是假装成功。

### 回滚步骤

```sh
# 1. 移除新包
dsh plugin --profile web remove dsh-omni-mode   # 或按安装来源使用 github: 说明符

# 2. 恢复 profile 依赖记录
cp /root/omni-rollback-profile-package.json /root/.dsh/profiles/web/package.json

# 3. 如旧预设源码被改动，从备份还原
rm -rf /root/workspace/dsh-omni-preset
tar -xzf /root/omni-rollback-preset-1.2.0.tar.gz -C /root/workspace

# 4. 重启引擎并新建对话，确认「全能模式」回到原版本
```

回滚目标是**回到迁移前的可用状态**，不是删除用户数据：不要删除 profile 其他设置、会话或无关插件。删除任何目录前先确认绝对路径就是要操作的那个目录。

### 本机依赖注意事项

代码视觉需要显式准备，不随预设安装：

- Node ≥ 24。
- 一个**用户授权**的工具环境目录，内含按本仓库 `media/toolchain/package.json` 与锁文件安装的 `@resvg/resvg-js`。
- 系统 FFmpeg/ffprobe（本机为 6.1.1）。这部分体积不小，属于用户自行选择的系统依赖，不是预设的生产依赖。

这些都不应写进 profile 或主包依赖；缺失时运行器会明确报告阻塞。

## English

### Local development trial and historical rollback baseline

Read-only check on 2026-11-13: following the user's explicit upgrade request, this instance now links `dsh-omni-mode@1.7.0-dev.1`. This is a development trial, not stable publication. The present acceptance run performs no further migration. The old package below is the pre-migration rollback baseline, **not the active package**:

- Profile: `/root/.dsh/profiles/web`
- Pre-migration preset package: `@local/dsh-omni-preset@1.2.0`, a `link:` to `/root/workspace/dsh-omni-preset`
- A temporary evaluation host package `@local/omni-benchmark-host` (pointing at this repository's `tools/benchmark-host`) is also installed. It is not part of the preset and should be decided separately before migration.

The previous stable `v1.5.0` remains the rollback target; this is the regular release `1.7.0`. Overall behavioral acceptance is still unmet; a regular release means the version is distributed normally, not that this behavioral gate passed. Paths for this deployment are not universal installation requirements.

### Prerequisites before migrating

1. Real-model task acceptance with raw records retained (all twelve were attempted, but [execution review](domain-run-results.md#english) does not report overall acceptance).
2. That layer shows at least three genuine enhancements with no critical regression.
3. Official-latest compatibility rechecked (accepts DSH `>=0.2.2-rc.1 <=0.2.2-rc.3` (rc.1, rc.2 and rc.3), Node ≥ 24.9.0).
4. The rollback steps below are already prepared.

If any is unmet, do not migrate — and never present "the tools work" as "the preset got better".

### Preparing rollback

Record a precisely restorable state before migrating; do not rely on memory:

```sh
# 1. Record current profile dependencies and preset source
cp /root/.dsh/profiles/web/package.json /root/omni-rollback-profile-package.json
grep -n "dsh-omni-preset\|omni-benchmark-host" /root/.dsh/profiles/web/package.json

# 2. Back up the currently active old preset (the rollback target)
tar -czf /root/omni-rollback-preset-1.2.0.tar.gz -C /root/workspace dsh-omni-preset

# 3. Record the repository commit to return to the same source point
git -C /root/workspace/dsh-omni-mode rev-parse HEAD
```

These three files under `/root` live outside the repository and are untouched by `npm run verify` or packaging.

**The rollback was rehearsed for real**: the archive was extracted into an isolated temporary directory and confirmed to restore `preset-omni` / `omni` / `全能模式`, version `1.2.0`, 24 plugin rows, with a `quality.js` hash matching the current repository; the rehearsal directory was then cleaned up. This shows the backup restores, but it is **not a rehearsal of switching a real profile** (which requires behavioral acceptance first).

### Migration steps (after acceptance)

Choose one path; never enable two packages declaring the same `omni` ID.

**A. Released version (recommended, traceable)**

```sh
dsh plugin --profile web remove @local/dsh-omni-preset
dsh plugin --profile web add github:lxy0714/dsh-omni-mode#v1.7.0
```

**B. Local source (for debugging)**

```sh
dsh plugin --profile web remove @local/dsh-omni-preset
dsh plugin --profile web add /root/workspace/dsh-omni-mode
```

Then restart the engine, open a **new conversation** and select `全能模式`. Existing conversations keep the preset revision they started with; they do not switch automatically.

After migrating, confirm:

- Exactly one `omni` entry, displayed as `全能模式`.
- A new conversation can load all 11 `omni-*` skills and the capability index.
- Code media genuinely renders once a tool environment is prepared as needed; without one it reports an explicit block instead of pretending success.

### Rollback steps

```sh
# 1. Remove the new package
dsh plugin --profile web remove dsh-omni-mode   # or the github: specifier used to install it

# 2. Restore the profile dependency record
cp /root/omni-rollback-profile-package.json /root/.dsh/profiles/web/package.json

# 3. Restore the old preset source if it was modified
rm -rf /root/workspace/dsh-omni-preset
tar -xzf /root/omni-rollback-preset-1.2.0.tar.gz -C /root/workspace

# 4. Restart the engine, open a new conversation and confirm the original version
```

Rollback means returning to the last working state, not deleting user data: do not remove unrelated profile settings, sessions or plugins. Before deleting any directory, confirm the absolute path is the intended one.

### Local dependency notes

Code media is prepared explicitly and does not come with the preset:

- Node ≥ 24.
- A **user-authorized** tool-environment directory containing `@resvg/resvg-js` installed from this repository's `media/toolchain/package.json` and lockfile.
- A system FFmpeg/ffprobe (6.1.1 here). It is sizable and is a user-chosen system dependency, not a production dependency of the preset.

None of this belongs in the profile or the main package dependencies; when missing, the runner reports an explicit block.
