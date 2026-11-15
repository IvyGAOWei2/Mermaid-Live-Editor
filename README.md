# 绘序 · Mermaid 编辑器

一个中文、本地优先的 Mermaid 个人编辑器。粘贴外部 AI 生成的代码，修改文字和结构，实时预览流程图或思维导图，边编辑边查语法，再保存源码或 SVG。

**v0.1.0 已实现并完成本地关键验证，尚未部署正式站点。** 复用已有公共 [GitHub 仓库](https://github.com/IvyGAOWei2/Mermaid-Live-Editor)；提交、PR 和部署的准确状态见 [开发进度](docs/progress.md)。

## 当前功能

- CodeMirror 代码高亮、撤销重做；中文 `flowchart` / `mindmap` 实时预览。
- 语法错误提示并保留最近成功图形，修复后恢复。
- 两类模板、可展开的中文语法速查与可插入示例。
- 缩进大纲转思维导图，校验层级并提示错误行。
- 整图缩放、平移、适应窗口；电脑分栏与小屏响应式样式。
- 本地自动保存与刷新恢复；覆盖前确认、单份备份与恢复。
- UTF-8 `.mmd` 导入导出、SVG 导出；错误时明确标记“导出上次 SVG”。

图表在浏览器内处理，无 AI API、账号、数据库或内容上传。**草稿只在当前设备、浏览器和网站域名下保存，不会跨电脑同步。** 请通过 `.mmd` 导入导出转移；清理浏览器数据可能删除草稿。Mermaid 自动布局，不支持自由拖拽单个节点。

## 运行与检查

需要 **Node.js 22.12 或更新的 22.x 版本**；仓库包含 `.nvmrc` 与锁文件。全新克隆后：

```bash
npm ci
npm run dev
```

开发地址通常为 `http://127.0.0.1:5173`，以终端输出为准。当前 Windows 工作区已准备不提交的独立 Node 22.23.5（`.local/runtime`），系统 Node 仍为 18，可直接使用：

```powershell
.\scripts\dev.ps1
.\scripts\check.ps1
```

`dev.ps1` 固定使用 `http://127.0.0.1:5174`；`check.ps1` 执行测试、类型检查和生产构建。脚本优先使用项目独立运行时，否则要求系统 Node ≥22.12。全新克隆不包含该运行时，应先安装 Node 22。

跨平台检查与生产预览：

```bash
npm test
npm run build
npm run preview
```

`build` 内含 TypeScript 检查，静态产物为 `dist/`；无需 `.env` 或服务密钥。[验证记录](docs/verification.md)区分已验证和未覆盖场景。

## 部署

已准备 GitHub Actions 和 `vercel.json`。推荐：开发分支 → 检查 → 明确提交推送 → PR / Vercel Preview → 验收 → 合并与正式发布。连接 GitHub 不会实时同步本地文件。

Vercel 项目 `ogc9/mermaid-live-editor` 已创建并连接 GitHub。配置为 Vite、Node 22、构建 `npm run build`、输出 `dist`，无需应用环境变量。正在完成预览部署与验收；真实网址见 [开发进度](docs/progress.md)。步骤见 [部署说明](docs/deployment.md)。

## 文档

- [需求与验收](docs/requirements.md) · [技术方案](docs/architecture.md)
- [用户手册](docs/user-guide.md) · [开发进度](docs/progress.md)
- [验证记录](docs/verification.md) · [GitHub 与 Vercel 部署](docs/deployment.md)
- [变更记录](CHANGELOG.md) · [开发约定](AGENTS.md)

参考：[Mermaid 官方文档](https://mermaid.js.org/)、[Mermaid Live Editor](https://mermaid.live/)。本项目使用开源 Mermaid 渲染，不复刻其官网。
