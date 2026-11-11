# 自行修改 / Customization

MIT 允许安装、修改、fork 和再分发，保留 LICENSE 与适用归属即可。推荐 clone/fork 后修改自己的源码，不要直接修改包管理器缓存。

```sh
git clone https://github.com/lxy0714/dsh-omni-mode.git
cd dsh-omni-mode
npm ci --ignore-scripts
npm run verify
```

## 改哪些文件

- `cordis.patch.yml`：persona、工具组合、配置与隔离组。只改需要的部分，保留 provider/consumer 的同 realm 关系。
- `quality.js`：最高可识别推理档位初始化。保留未知能力、并发手选、取消和恢复保护。
- `adaptive.js`：容量缓存和活动回合保留选择。不要在空闲 Session 写入替换 tool/result。
- `pool.js`：官方裁剪器桥接。避免把服务泄漏到 Host。
- `locale/` 与 `icon.svg`：插件管理器显示资源。图标可随 MIT 项目修改。

将修改后的目录绝对路径交给 DSH 插件管理器安装，重启引擎、新建会话再验证。无需构建普通运行时 JS。

## 替换与并存

若用自己的版本替换原版，先在管理器移除原版，保留 preset ID `omni`。若想两版同时出现，必须更换包名、`preset-omni` 声明 ID、`config.id`、私有 service/alias 名称及测试自引用。只改显示名称不足以避免冲突。

包导出、files 白名单或相对路径变化后运行完整验证，包括 TGZ 解包消费检查。保留 MIT 和 THIRD_PARTY_NOTICES；不要把自己的本机配置、API key 或测试日志放进仓库。
