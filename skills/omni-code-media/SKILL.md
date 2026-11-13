---
name: omni-code-media
description: Create, compose and verify editable 2D SVG/PNG/GIF/MP4 with approved local code, not image/video models; use for code-drawn graphics, infographics, Chinese typography, raster asset composition and deterministic animation. / 用获准本地代码制作并验证可编辑二维SVG/PNG/GIF/MP4，不调用生图/视频模型；用于代码绘图、信息图、中文排版、素材合成和确定性动画。
---

# Code media / 代码视觉

Use this inside the **same Omni preset**, through the existing approved shell/files/jobs/present workflow. No second preset, model/API, browser, Python or Blender is required. / 在**同一Omni预设**内使用原有shell、文件、作业与交付流程，无需另一套预设、图像视频模型/API、浏览器、Python或Blender。

## Before execution / 执行前

1. Prefer supplied/clearly licensed assets if available; otherwise create **from scratch with code**, not a synthesized lookalike or generative image service. Confirm intended dimensions, duration/cadence and deliverables when unclear. / 有素材则优先用户提供或明确授权素材，否则**从零代码制作**，不造相似替代品、不调用生图服务；尺寸、时长、节奏或交付不明确时询问。
2. For GIF/MP4 work, ask about audio **if unspecified**; an existing explicit requirement needs no repeated question. No answer/skip is not consent to silent output. Record the actual explicit choice in project JSON; its `decision: asked` field is not an authorization mechanism. Pure static SVG/PNG needs no audio question. / GIF/MP4任务音频未明确则询问，已有明确要求不重复；未答或跳过不代表同意静音。项目字段只记录真实选择，不代替权限；纯静态图不问音频。
3. Determine authorized project/output root, source/assets and explicit fonts. Read/review scene code before execution. **The child is NOT a sandbox**; never import generator code into DSH Host or execute untrusted external code. / 确认授权项目、输出根目录、源码素材和字体；执行前审查场景源码。**子进程不是沙箱**，禁止在Host导入生成器或执行不可信外来代码。

## Discover resources / 发现资源

Resolve the bundle root from this skill's provided resource directory: `../../` from `skills/omni-code-media`. Never hardcode an author's `/root/...`, a profile path, global dependency or undeclared transitive package. / 从技能资源目录向上两级确定包根目录，不硬编码作者工作区、配置档目录、全局依赖或未声明传递依赖。

Read these resources on demand / 按需读取：
- `../../media/README.md`: exact setup, API, source/asset/font contracts, safety, format dependencies and verification. Read **before the first render**. / 首次渲染前必读：配置、接口、源码素材字体契约、安全、依赖和核验。
- `../../media/project.schema.json`: strict project v1 JSON structure; runtime adds cross-field/realpath/size checks. / 严格项目JSON结构，运行时另查字段关联、实路径和大小。
- `../../media/examples/chinese/{project.json,scene.mjs}`: original Chinese infographic animation; font placeholder must be replaced with an authorized font path and real family. / 原创中文动画示例，须填授权字体路径与实际字体族。
- `../../media/examples/user-assets/{project.json,scene.mjs}`: user-raster composition, requires authorized `supplied.png`. / 用户位图合成示例，须提供授权图片。

## Supported CLI / 受支持命令

`node <BUNDLE>/media/runner.mjs doctor --tool-env <AUTHORIZED_ENV>`

`node <BUNDLE>/media/runner.mjs render --project <PROJECT_JSON> --output-root <EXISTING_AUTHORIZED_ROOT> --name <NEW_NAME> --tool-env <AUTHORIZED_ENV>`

`node <BUNDLE>/media/runner.mjs validate --artifact <COMPLETED_JOB_DIRECTORY>`

Optional explicit flags: `--ffmpeg`, `--ffprobe`, `--timeout-ms` (100–600000; job default120000). Dependency preflight subprocesses have separate timeouts. Track and collect existing shell background jobs; stop via the original approved job cancellation path. / 可显式指定程序和作业超时，预检另有超时；按原流程跟踪并收集后台作业，通过已有批准路径停止。

`doctor` emits `perFormat` readiness. SVG requires Node24+ and direct pinned resvg; PNG additionally requires FFmpeg/ffprobe for actual independent full decode; GIF needs palette filters; MP4 needs H264/AAC. `BLOCKED` means report the missing dependency and request authorized setup, **not** install during activation/render or silently use a profile's modules. / doctor按格式报告就绪状态，SVG需Node与resvg，PNG完整独立解码另需FFmpeg和ffprobe，动画还需相应编码/过滤器。缺失时明确阻塞并请求授权配置，**不能**激活/渲染时安装或偷用配置档依赖。

Tool environment is separately provisioned from `media/toolchain/package.json` + lock (`@resvg/resvg-js` exactly2.6.2); setup is documented, not automatic. FFmpeg is external and system installation may be large. / 工具环境独立按清单与锁文件安装，流程见README，不自动执行；FFmpeg外置且系统安装可能较大。

## Produce and verify / 生成与核验

Use a standalone scene `renderFrame(ctx)` driven by frame index/rational FPS/seed, returning **static SVG per frame**; no wall-clock animation. Preserve only the scene and explicitly declared resources; undeclared relative helper imports are unsupported. SVG subset, explicit canonical project-local image embedding and font coverage rules are in README. / 独立场景按帧序号、有理帧率与种子生成**逐帧静态SVG**，不按墙钟动画；仅保留独立场景与显式资源，不支持未声明辅助导入。SVG子集、项目内规范素材嵌入和字体规则见README。

The runner serially renders native resvg PNG, composes opaque backgrounds, encodes even-dimension H264/yuv420p faststart MP4 and palettegen+paletteuse GIF. GIF timing is centisecond-quantized, **not exact30fps**. Authorized provided audio is duration-checked, decoded and trimmed into MP4; no automatic TTS/music service. / 串行原生渲染PNG，显式不透明合成，编码偶数尺寸H264/yuv420p faststart MP4及调色板GIF；GIF百分之一秒量化，**不是精确30fps**。授权音频实测时长、解码并裁入MP4，不自动调用语音音乐服务。

Do not equate successful file creation, font cmap coverage or a mocked test with verified media. Require actual renderer output, ffprobe/full decode for raster/movie outputs, and representative decoded frames. **Read the proof PNGs** (including Chinese font proof) with the normal image reader and review clipping/layout/tofu/motion. Technical validation is not artistic acceptance. / 文件存在、字符表覆盖或mock通过不等于验证。需实际渲染、位图视频探测和完整解码及代表帧；**用读图工具检查证明图**，包括中文缺字、裁切、布局和运动。技术验证不等于美术验收。

Only publish completed verified output with a valid `.complete.json` marker. A new output name is required; no overwrite. Source/assets/font provenance, exact hashes/versions/commands/settings and reproduction template are in the manifest. External fonts are referenced, never bundled without audited redistribution license. / 只交付有完成标记且已核验的结果，必须新名称、不覆盖。清单含源码素材字体来源、哈希、版本、命令、设置与复现模板；外部字体只引用，未经许可审计不能打包。

Deliver **editable source + authorized assets + final + reproduce command** together using the original file/present workflow. Link/read image results where useful, keep user explanations bilingual and concise, and redact local author paths in public reports. / 使用原文件交付流程同时提供**可编辑源码、授权素材、成品与复现命令**；必要时展示实际图像，用户说明简洁双语，公开报告脱敏作者本机路径。
