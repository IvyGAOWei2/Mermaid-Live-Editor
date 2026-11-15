# Mermaid 随手画

一个中文 Mermaid 个人编辑器：粘贴外部 AI 生成的代码，修改文字和结构，实时查看流程图或思维导图，边编辑边查语法，再保存源码或 SVG。

目标版本 **v0.1.0，开发中，尚未发布**。当前实现和验证状态见 [开发进度](docs/progress.md)。

## v0.1 计划

代码高亮与撤销重做、实时预览、语法错误保留最近图形、两类模板、中文可插入语法帮助、缩进大纲转思维导图、缩放平移与适应窗口、本地自动保存、`.mmd` 导入导出、SVG 导出、覆盖确认与恢复。

图表在浏览器内处理，不需要 AI API、账号、数据库或付费服务。Mermaid 自动布局，第一版不支持自由拖拽单个节点。

**草稿只保存在当前浏览器，不会跨电脑同步。** 可通过 `.mmd` 导入导出转移；清理浏览器数据可能删除草稿。

## 本地开发

建议 Node.js 22 和 npm。初始开发机为 Node 18.20.8，已结束支持；工具链暂选择兼容版本。

以下命令为约定入口，脚本将随实现加入：

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
```

开发服务的地址以终端输出为准；生产构建输出到 `dist/`。首次安装依赖后可直接运行；不需要 `.env` 或服务密钥。

## GitHub 与 Vercel

推荐：`codex/` 开发分支 → 检查 → Git 提交与推送 → PR → Vercel Preview 验收 → 合并与正式发布。连接 GitHub 不会实时同步本地文件，必须明确提交和推送。

Vercel 选择 Vite：安装 `npm ci`，构建 `npm run build`，输出 `dist`，Node 22；运行时无需环境变量。当前仓库尚未配置 remote 或 Vercel 连接，不能视为已经部署。详细准备状态见开发进度。

## 项目文档

- [需求与验收](docs/requirements.md)
- [技术方案](docs/architecture.md)
- [用户手册](docs/user-guide.md)
- [开发进度](docs/progress.md)
- [GitHub 与 Vercel 部署](docs/deployment.md)
- [变更记录](CHANGELOG.md)
- [开发约定](AGENTS.md)

参考：[Mermaid 官方文档](https://mermaid.js.org/)、[Mermaid Live Editor](https://mermaid.live/)。本项目使用开源 Mermaid 渲染，不复刻其官网。
