# 项目开发约定

## 目标与范围

开发一个中文 Mermaid 个人编辑器，v0.1 聚焦 `flowchart` 与 `mindmap`。采用 React、TypeScript、Vite、Mermaid 和 CodeMirror；优先浏览器内处理，不引入账号、后端、AI API 或遥测。

## 实现原则

- 保留已有用户改动，先检查 `git status`，不要覆盖无关文件。
- 不上传用户图表到 GitHub、日志或第三方服务；提交的示例只用项目自带演示内容。
- 渲染使用 Mermaid 开源库并开启严格安全配置；不承诺自由拖动节点或固定布局。
- 异步渲染必须避免旧结果覆盖新输入；语法错误保留上一次成功图形。
- 覆盖当前内容前提供明确确认及草稿恢复手段；本地保存失败要显示提示。
- 中文文案优先，控件有可访问名称；兼顾较小屏幕和键盘操作。
- 控制依赖和模块职责，优先成熟组件，不重复实现编辑器或绘图引擎。

## 开发与检查

使用 Node.js 22.12+ 的 22.x（本机系统仍为 18.20.8，工作区独立运行时在 `.local/runtime`），使用 npm 和提交的 `package-lock.json`。Windows 可使用 `scripts/dev.ps1` 和 `scripts/check.ps1`，不提交独立运行时。

标准命令：

```bash
npm ci
npm run dev
npm test
npm run build
```

提交前至少执行类型检查、相关测试和生产构建。关键变更验证中文、错误及修复、快速输入、刷新恢复、大纲层级、`.mmd` 往返、SVG。验证范围和结果写入 `docs/progress.md`；没有执行的检查不能写成已通过。

## Git 与发布

- 开发分支使用 `codex/` 前缀；提交时明确选择文件，检查 diff，避免提交构建输出、依赖目录、密钥或用户草稿。
- 推荐流程：开发分支 → 检查 → 提交并推送 GitHub → PR / Vercel Preview → 验收 → 正式发布。
- GitHub 连接不是文件实时同步；必须明确提交和推送。
- 未执行的提交、推送、预览或部署不得报告成功。认证与部署缺口记录在进度中，不要求用户在聊天粘贴密钥。
- 本工作区可使用 `.local/gh-cli/bin/gh.exe`；GitHub / Vercel 认证使用官方登录流程，不提取或打印令牌，认证文件和独立 CLI 不提交。

## 文档维护

功能、操作或技术选择变化时同步更新 README、`docs/requirements.md`、`docs/architecture.md`、`docs/user-guide.md`、`docs/progress.md` 和 CHANGELOG。明确区分计划、已实现、已验证、已部署；版本发布仅在实际完成后记录。
