# Code media (2D) / 代码视觉（二维）

Same Omni preset; approved shell execution, not an image/video model, browser, Python or Blender pipeline. Use supplied or clearly licensed assets when available; otherwise draw **from scratch in code**. / 同一Omni预设，使用已有批准的shell，不调用图像/视频模型，也不要求浏览器、Python或Blender。优先用户提供或明确授权素材，否则**从零代码绘制**。

## Entry and trust / 入口与信任

Supported API: `node <BUNDLE>/media/runner.mjs doctor|render|validate`. Resolve `<BUNDLE>` from this installed skill's resource directory (`../../` from `skills/omni-code-media`), not an author's workspace or profile path. No native global tool or second preset is added. The normal shell permission, jobs, cancellation and `present` flow remain authoritative. / 支持上述CLI；从已安装技能资源目录向上两级解析包根目录，不能硬编码作者目录或配置档路径。不新增全局原生工具或第二套预设，继续使用原有shell权限、作业、停止和文件交付流程。

**Source scenes are reviewed executable JavaScript in an owned child process. This is NOT a sandbox. Never import a scene into DSH Host.** The renderer enforces output SVG/resource limits, not a security boundary around arbitrary JS. A malicious scene can access the child's ordinary OS privileges or deliberately escape process groups. Only run source approved under the existing shell policy; don't execute untrusted downloaded code. / **场景源码是在本作业子进程中执行的、需要审查的JavaScript，不是沙箱；不得导入DSH Host。** SVG与资源约束不是任意JS安全边界，恶意源码可使用进程原有系统权限或主动逃逸进程组；只按已有shell策略运行获准源码，不执行未信任下载代码。

## Explicit setup (never activation/render) / 显式配置（绝不在激活或渲染时安装）

Node >=24. Create a **user-authorized workspace tool environment**, then copy the exact nested manifest and lock; do not add production dependencies to the main package. No accidental hoisting, global module, profile `node_modules` or sharp fallback is used. / 需要Node24+。在**用户授权工作区工具环境**复制独立清单与锁文件，不把依赖强加到主生产包，不依赖提升、全局模块、配置档依赖或sharp回退。

```sh
# Set these to authorized locations / 设为授权位置
BUNDLE=<installed-bundle-root>
ENV=<authorized-workspace-tool-env>
mkdir -p "$ENV"
cp "$BUNDLE/media/toolchain/package.json" "$ENV/package.json"
cp "$BUNDLE/media/toolchain/package-lock.json" "$ENV/package-lock.json"
npm ci --prefix "$ENV" --ignore-scripts --registry=https://registry.npmjs.org
node "$BUNDLE/media/runner.mjs" doctor --tool-env "$ENV"
```

The lock pins `@resvg/resvg-js@2.6.2` and platform native optional packages. `--ignore-scripts` avoids lifecycle scripts; native packages are registry artifacts. Network and this installation need separate permission. No setup action runs implicitly. / 锁定resvg及平台原生可选包，跳过生命周期脚本；原生二进制来自包仓库。联网安装需单独授权，不会隐式执行。

External FFmpeg/ffprobe are managed separately. On authorized Debian/Ubuntu installations, `apt-get update && apt-get install -y ffmpeg` is an **explicit administrator setup**, not a render action. System packages can be large (this Linux arm64/proot verification added about 425 MB). Verify `ffmpeg -encoders` includes `libx264`/`aac` and `ffmpeg -filters` includes `palettegen`/`paletteuse`. Respect local FFmpeg licensing and packaging requirements. / FFmpeg与ffprobe外置管理，apt命令仅为显式管理员配置，不是渲染动作。系统包可能较大（本次arm64/proot实测约425 MB），应核验编码器与过滤器，并遵守本地FFmpeg许可和分发要求。

Dependencies per format / 各格式依赖：
- SVG: Node + explicit resvg tool environment; actual native render proof PNG is included. No FFmpeg is required. / SVG需Node和resvg，附真实渲染证明PNG，无需FFmpeg。
- PNG: same + FFmpeg and ffprobe, intentionally required for independent full decode and opaque pixel verification. / PNG额外需要FFmpeg与ffprobe，用于独立完整解码和不透明像素核验。
- GIF: same + palettegen/paletteuse. Requested rational FPS is quantized to GIF centiseconds; never claim exact 30 fps GIF. / GIF额外需要调色板过滤器；帧率量化为百分之一秒，不能宣称精确30fps。
- MP4: same + libx264 and AAC for provided audio. Even dimensions, H264/yuv420p, explicit opaque composition, checked faststart. / MP4需要libx264，音频用AAC；要求偶数宽高、H264/yuv420p、不透明合成及经核验的faststart。

`doctor` emits full-toolchain status and `perFormat` readiness; a missing nonrequired encoder may make the overall doctor exit 2 while SVG rendering remains supported. Missing dependencies are `BLOCKED`, not an invitation to auto-install. / doctor同时报告全工具链和分格式就绪状态，非必要编码器缺失可能使总状态退出2，但SVG仍可运行。缺依赖明确阻塞，不能自动安装。

## Project and scene contract / 项目与场景契约

`project.schema.json` is the declarative v1 shape; strict runtime validation adds cross-field/resource checks. Unknown fields are errors. / JSON Schema定义版本1结构，运行时补充字段关联与资源验证；拒绝未知字段。

```json
{
  "version": 1, "scene": "scene.mjs",
  "width": 640, "height": 360, "background": "#152238",
  "fps": {"num": 24, "den": 1}, "frameCount": 48, "seed": 9,
  "formats": ["svg", "png", "gif", "mp4"],
  "audio": {"decision": "asked", "choice": "silent"},
  "fonts": [{"path": "fonts/authorized-cjk.ttc", "family": "Noto Sans CJK SC"}],
  "assets": [{"id": "hero", "path": "assets/user.png", "license": "user-supplied / 用户提供"}]
}
```

For GIF/MP4, audio must reflect an **explicit user choice**. Ask once when unspecified; skipped/no answer is not silence consent. Existing explicit instructions need not be asked again. `decision: "asked"` records that choice, it is **not permission proof**, including in engineering fixtures. `choice: "provided"` requires an authorized project-local audio path and MP4 output; no TTS/music service is invoked. Pure SVG/PNG need no audio field/question. / GIF与MP4必须记录**用户明确选择**；未明确时询问一次，跳过不代表同意静音，已有明确要求不重复询问。asked字段只作记录，**不是权限证明**（测试输入亦然）。提供音频须为授权项目内文件并输出MP4，不会调用语音或音乐服务；纯SVG/PNG无需音频问题或字段。

Provided audio is actually probed, decoded, checked to be at least the timeline duration, then trimmed to that duration; output audio stream and duration are checked again. A GIF carries no audio track even when the parallel MP4 has audio. / 实际探测、解码音频，要求时长不短于时间线并裁到目标时长，再检查输出音轨与时长。并行MP4可以有音频，GIF没有音轨。

Scene: one standalone `.mjs` exporting `renderFrame(ctx)`, returning a static SVG string (or promise). Reproducible inputs: `width,height,background,fps,frameCount,index,time,progress,seed,random(),assets`. `time = index * fps.den / fps.num`; `random()` is seeded separately per frame. **No wall-clock animation**. The runner cannot force arbitrary JS to be deterministic; avoid `Date`, `Math.random`, network and environment-dependent rendering. / 单独mjs导出renderFrame，返回静态SVG或其Promise；ctx包含确定性尺寸、时间、种子随机数和嵌入素材；禁止按墙钟驱动动画。运行器不能强制任意JS确定性，源码应避免日期、非种子随机数、网络和环境变化。

Only the standalone scene, declared assets, audio, project JSON and generated SVG frames are preserved. Relative helper imports, undeclared external JS/dependencies and arbitrary directory copies are **not supported**. Builtin Node code remains executable under ordinary child privileges, not sandboxed. / 只保留独立场景、声明素材、音频、项目JSON与逐帧SVG；**不支持**未声明相对辅助模块、外部JS依赖或整目录复制。内建Node代码仍可使用普通子进程权限，不是沙箱。

Assets: PNG/JPEG/GIF rasters only, existing project-local canonical realpaths; traversal and escaping symlinks are rejected. Authorized image bytes become exact embedded data URIs through `ctx.assets[id]`. Missing/unknown resources fail. External URLs/network/fonts and SVG image assets are not accepted. / 素材仅PNG/JPEG/GIF位图，规范实路径须在项目内，拒绝遍历和逃逸软链接。通过ctx.assets提供精确嵌入URI，缺失或未知资源失败，不接受外部URL、网络字体或SVG图像素材。

Fonts: explicit local font paths and real family names. External paths are allowed only when the user has authorized them. SFNT/TTC Unicode cmap 4/12 and family names are checked; system-font scanning is disabled. Coverage is **not visual proof**: actual resvg text rendering plus a wrapped `proof/font-proof.png` is produced for review. That proof is a readability sample, not a layout specimen: the excerpt is capped and an explicit `…` marks truncation, so a clipped word there is sample truncation rather than renderer failure. / 该证明图只用于核对字形可读性，不是排版样张：节选有上限并用 `…` 明确标注截断，因此图末出现截断词属于取样而非渲染失败。 No third-party font is copied into the deliverable; manifest records its external path/hash, and reproduction needs the same user-provided file. Never infer redistribution rights from readability. / 字体须明确路径和实际字体族；项目外字体需用户授权。检查SFNT/TTC的字符表和字体族，禁用系统扫描；字符覆盖**不等于实渲染证明**，必须审核生成的中文字体证明图。不会复制第三方字体，清单记录外部路径与哈希，复现需要同一授权字体；可读不代表可再分发。

## SVG subset and limits / SVG子集与上限

Root must have exact `width`, `height`, `viewBox="0 0 W H"` and optional SVG namespace only. Supported elements: `svg,g,rect,circle,ellipse,line,polyline,polygon,path,text,tspan,defs,linearGradient,radialGradient,stop,clipPath,image`. Attributes are a fixed presentation/geometry allowlist in `svg.mjs` (no `style`/CSS). Local `url(#id)` references only, image href only the exact authorized raster URI. Explicitly reject script, event handlers, foreignObject, SMIL, nested SVG, declarations/DTD, external URLs, unknown fonts/resources and CSS escapes. / SVG根尺寸与viewBox须完全一致；仅支持列出的几何、文字、渐变、裁切和位图元素及固定属性白名单，无style/CSS。只允许本地ID引用及精确授权素材URI，拒绝脚本、事件、foreignObject、SMIL、嵌套SVG、DTD、外链、未知字体/资源与CSS转义。

Bounds / 上限：2048×2048; 4,194,304 pixels/frame; 300 frames; 314,572,800 total pixels; 1–60 rational fps; 30 seconds; SVG 2 MiB/10,000 nodes/32 levels; <=16 assets, 16 MiB each/32 MiB combined; <=8 fonts at 32 MiB each; audio <=64 MiB. Frames render **serially**, one in memory, with bounded child output (stderr tail 32 KiB). PNG intermediates and SVG snapshots are disk-backed; budget up to a few GiB free space at maximum bounds, including final no-overwrite copies. / 按上述范围限制尺寸、帧数、工作量、资源与日志；逐帧**串行**渲染，内存不缓存全序列，磁盘保存中间帧；最大规模及发布副本仍应预留数GiB磁盘空间。

Owned process groups receive cancellation/timeout, TERM then KILL, and Linux `/proc` exit checks; never kill by process name. This covers normal runner/producer/encoder descendants, not deliberately escaping hostile source. The job timeout is 120s default, configurable 100–600000ms; dependency preflight has separate 10s subprocess timeouts. / 取消或超时向本作业进程组发送TERM再KILL，并在Linux检查后代退出；不按进程名误杀。这覆盖正常生产者与编码器，不保证恶意源码主动逃逸。作业默认120秒，可配置范围如上，依赖预检子进程单独10秒超时。

## Render, inspect, deliver / 渲染、审核、交付

Output root must already exist and be authorized. `--name` is a **new** simple directory name. Staging is under that root with a random runId and ownership file; cleanup recursively removes **only this verified owned staging**, never arbitrary user paths. Publication reserves the new name and copies verified files with `COPYFILE_EXCL` (not an atomic directory rename, portable to proot); `.complete.json` commits the manifest hash last. An interrupted crash may leave an incomplete directory; validation refuses it and retries never overwrite it. Normal failed/cancelled publication removes only recorded inode-owned entries. / 输出根目录须已存在且授权，名称必须新建；在其下创建带随机作业ID和所有权标记的暂存，仅递归清理本作业暂存。发布先预占新名称，再用排他复制写入已核验文件（不是原子目录重命名，兼容proot），最后写提交标记。崩溃可能留下未完成目录，验证会拒绝且不会覆盖重试；正常失败或取消只移除记录过的本作业节点。

```sh
node "$BUNDLE/media/runner.mjs" render \
  --project <authorized-project/project.json> \
  --output-root <existing-authorized-output-root> --name <new-name> \
  --tool-env "$ENV" --ffmpeg ffmpeg --ffprobe ffprobe
node "$BUNDLE/media/runner.mjs" validate --artifact <completed-job-directory>
```

Final artifacts / 最终产物：`poster.svg`, `poster.png`, `animation.gif`, `animation.mp4` as requested; `source/{scene.mjs,project.json,assets/,frames/*.svg}`; representative actually decoded first/middle/last frames under `proof/`; `manifest.json` with hashes, Node/resvg/FFmpeg versions, argv/settings, source/asset/font provenance, exact measured probe/decode results and a reproduction template. No environment dump, credentials or service keys are included. Local manifests contain local external-font/executable paths; redact author paths before public reports. / 按需交付SVG/PNG/GIF/MP4、可编辑源码素材和逐帧SVG、从实际编码结果解码的代表帧、包含哈希、版本、命令、设置、来源和实测结果的清单及复现模板；不转储环境变量、凭据或密钥。本地清单含本地字体/程序路径，公开报告前需脱敏。

Verification checks complete inventory/hashes, SVG subset and actual text coverage, ffprobe dimensions/codec/frame count/duration/audio, full FFmpeg decoding, opaque PNG RGBA pixels, and MP4 moov-before-mdat faststart. Read actual `proof/` images with the normal image-reading tool before claiming visual quality. Technical verification is **not** an automatic artistic/layout review. Use `present` only after final verification, with editable source/assets + final + command available together. / 验证文件哈希、SVG子集与文字覆盖，探测尺寸/编码/帧数/时长/音频、完整解码、PNG不透明像素和MP4 faststart。声明视觉质量前必须用常规读图工具检查证明图；技术验证**不是**自动美术/排版验收。核验完成才交付，并同时提供源码素材、成品和复现命令。

## Examples and tests / 示例与测试

- `examples/chinese/`: original Chinese infographic animation. Font path is a placeholder, not a distributed font. Make an authorized working copy, set `fonts[0].path` to an actual authorized font and its real family. Engineering fixture audio choice is only test input; ask real users when not specified. / 原创中文信息图动画；字体路径为占位符，不附字体。复制到授权项目并填入真实授权字体路径与字体族，测试的音频选择不能代替用户真实选择。
- `examples/user-assets/`: composition of `supplied.png`; intentionally no invented copyrighted asset. Provide the authorized raster and document its license. / 用户素材合成示例；有意不附虚构版权素材，须提供授权图片并注明许可。

```sh
OMNI_MEDIA_TOOL_ENV="$ENV" \
OMNI_MEDIA_TEST_FONT=<authorized-CJK-font-file> \
node --test "$BUNDLE"/media/*.test.mjs
```

Tests explicitly mark missing real dependencies/fonts `BLOCKED`/skipped; no mocks count as render evidence. Safety tests cover schemas, paths/symlinks, unsafe SVG, resource bounds, fonts, collisions, bounded logs, timeout/cancel and descendant exit. Real fixtures cover PNG/GIF/MP4, rational GIF timing, Chinese rendering, asset composition, actual audio duration, failed source cleanup and CLI SIGTERM. Core preset tests remain separate and unchanged by this module. / 缺真实依赖/字体的测试明确阻塞或跳过，不用mock冒充渲染。覆盖安全、路径、字体、资源、碰撞、输出有界、超时取消与后代退出，以及真实媒体、中文、素材、音频和失败清理；核心预设测试独立且不由此模块改动。
