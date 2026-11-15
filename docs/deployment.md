# GitHub 与 Vercel 部署

v0.1 已自动连接 GitHub、部署并通过关键线上验收：[打开绘序](https://mermaid-live-editor-gamma.vercel.app/)。用户体验验收和 PR 状态见 [开发进度](progress.md)，无需重新手动配置 Vercel。

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
2. 本地 `origin` 已指向该仓库；后续先执行 `git remote -v`，不要重复添加或直接改写。
3. 使用 `codex/` 开发分支。检查 diff，明确选择源码、锁文件、配置与文档进行提交；不提交 `node_modules/`、`dist/` 或本地草稿。
4. 推送开发分支并建立 PR。GitHub 登录请用浏览器、Git Credential Manager 或受支持的 CLI 登录流程；不要把令牌粘贴到聊天、命令参数或文件中。

连接 GitHub 仅配置远程访问，不会实时上传本地改动。每一轮发布都需要明确的 Git 提交和推送。

## Vercel 连接

项目 `ogc9/mermaid-live-editor` 已通过官方登录与 CLI 自动创建、连接上述 GitHub 仓库并部署 READY，无需重复导入。已配置：

- Framework Preset：Vite。
- Root Directory：仓库根目录。
- Install Command：`npm ci`。
- Build Command：`npm run build`。
- Output Directory：`dist`。
- Node.js：22.x。
- Environment Variables：无需配置。

正式别名 [mermaid-live-editor-gamma.vercel.app](https://mermaid-live-editor-gamma.vercel.app/) 已返回 HTTP 200。Vercel 将首次开发分支 Git 推送归为 production，项目 Production Branch 仍显示 `main`，没有手工改动该设置；这不表示开发分支已经合并。PR 经检查和部署验收后再决定合并，当前不自动合并。

后续推送可触发 Vercel 自动部署，实际环境与网址以 Vercel 返回结果为准。建议今后的普通开发分支使用 Preview，正式主分支承担后续生产更新。

## 预览验收与发布

本地与远程 CI 已通过。正式别名的真实浏览器已验证中文流程图、错误保留与修复、保存刷新恢复、含中文与特殊标点的大纲转思维导图、帮助面板，验收期间控制台无 error / warn。具体覆盖见 [验证记录](verification.md)。

下一步进行用户体验验收，建立并审阅 PR 后再决定合并 `main`，同时补充真实手机与多浏览器验证。后续版本继续检查中文渲染、连续编辑、错误恢复、保存、覆盖保护、源文件往返及 SVG，记录网址、提交与结果。

本地、Preview 与 Production 的网址不同，它们的浏览器草稿也相互独立。升级不会把草稿上传到仓库；跨域名或跨设备请用 `.mmd` 转移。

## 常见问题

- 找不到仓库：确认 GitHub 登录账号、仓库权限以及 Vercel GitHub App 授权范围。
- 推送失败：先检查 `git remote -v` 和当前认证；不要在命令中嵌入令牌。
- 构建失败：使用相同 Node 版本执行 `npm ci`、测试、构建，检查提交是否包含锁文件。
- 部署后仍是旧版：检查已推送的提交、Vercel 构建状态及 Production Branch；本地保存不等于部署。
- 本机认证过期：通过正常 GitHub / Vercel 登录流程恢复，不要在聊天或项目文件中提供令牌；现有项目无需重新创建。

参考：[Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)、[Vercel Git 部署](https://vercel.com/docs/git)、[Node.js 支持版本](https://nodejs.org/en/about/previous-releases)。
