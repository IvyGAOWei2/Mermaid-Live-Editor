# GitHub 与 Vercel 部署

本文件提供 v0.1 的部署操作。当前是否已提交、推送、建立 PR 或部署，必须以 [开发进度](progress.md) 的实际记录为准。

## 本地检查

建议 Node.js 22，使用仓库中的锁文件安装依赖：

```bash
npm ci
npm test
npm run build
npm run preview
```

构建生成 `dist/`。本项目是静态网站，不需要数据库、AI API、服务器或环境密钥。

## GitHub 仓库与提交

1. 当前已复用公共仓库 `IvyGAOWei2/Mermaid-Live-Editor`，保留其原有可见性。仓库只放应用代码与演示内容，不包含个人图表或密钥。
2. 将仓库 HTTPS 地址设置为本地 `origin`。首次连接前先执行 `git remote -v`，已有地址时不要重复添加或直接改写。
3. 使用 `codex/` 开发分支。检查 diff，明确选择源码、锁文件、配置与文档进行提交；不提交 `node_modules/`、`dist/` 或本地草稿。
4. 推送开发分支并建立 PR。GitHub 登录请用浏览器、Git Credential Manager 或受支持的 CLI 登录流程；不要把令牌粘贴到聊天、命令参数或文件中。

连接 GitHub 仅配置远程访问，不会实时上传本地改动。每一轮发布都需要明确的 Git 提交和推送。

## Vercel 连接

在 Vercel 中导入该 GitHub 仓库，选择正确账户与仓库访问权限，使用以下设置：

当前项目 `ogc9/mermaid-live-editor` 已创建、已连接上述 GitHub 仓库，无需重复导入。

- Framework Preset：Vite。
- Root Directory：仓库根目录。
- Install Command：`npm ci`。
- Build Command：`npm run build`。
- Output Directory：`dist`。
- Node.js：22.x。
- Environment Variables：无需配置。

先确认 Production Branch。建议正式主分支用于生产，`codex/` 分支用于 Preview；PR 经检查和预览验收后再合并。连接完成后，后续推送可触发 Vercel 自动部署，实际状态和网址以 Vercel 返回结果为准。

## 预览验收与发布

打开 Preview 地址，验证中文渲染、错误与修复、快速编辑、刷新恢复、大纲层级、模板覆盖保护、`.mmd` 往返和 SVG。确认构建检查通过后再合并至正式分支，并记录真实部署网址、提交与验证结果。

本地、Preview 与 Production 的网址不同，它们的浏览器草稿也相互独立。升级不会把草稿上传到仓库；跨域名或跨设备请用 `.mmd` 转移。

## 常见问题

- 找不到仓库：确认 GitHub 登录账号、仓库权限以及 Vercel GitHub App 授权范围。
- 推送失败：先检查 `git remote -v` 和当前认证；不要在命令中嵌入令牌。
- 构建失败：使用相同 Node 版本执行 `npm ci`、测试、构建，检查提交是否包含锁文件。
- 部署后仍是旧版：检查已推送的提交、Vercel 构建状态及 Production Branch；本地保存不等于部署。
- 当前没有远程仓库或 Vercel 登录：仍可本地运行、构建和导出；完成账号连接后继续发布，无需重写应用。

参考：[Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)、[Vercel Git 部署](https://vercel.com/docs/git)、[Node.js 支持版本](https://nodejs.org/en/about/previous-releases)。
