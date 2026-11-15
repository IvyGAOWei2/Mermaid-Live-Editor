# 技术方案

v0.1.0 使用 React 18、TypeScript 5.9、Vite 8.3.8、Mermaid 12.3、CodeMirror 6、DOMPurify；锁文件随代码提交。最初开发机为 Node 18，评估后采用当前依赖，并在 `.local/runtime` 配置独立 Node 22.23.5。工具链要求 Node ≥22.12；CI / Vercel 使用 Node 22，不更改系统 Node。

产物是静态文件 `dist/`，无需后端、数据库、付费模型或环境密钥。目标部署为 GitHub → Vercel。

## 模块与数据流

- `src/App.tsx`：中文工作台、文件与模板操作、帮助、大纲弹窗、保存状态、覆盖确认与恢复。
- `src/components/CodeEditor.tsx`：CodeMirror 实例、基础 Mermaid 高亮、撤销重做、示例追加、输入长度限制。
- `src/hooks/useDiagram.ts`：280ms 去抖，取消过期结果的界面更新，保留最近成功图形。
- `src/lib/render.ts`：图类型校验、Mermaid 按需加载与严格安全渲染、SVG 清理。
- `src/components/Preview.tsx`：整图缩放、平移、适应窗口、预览快捷键。
- `src/lib/outline.ts`：单根大纲、缩进一致性与层级校验，生成文字节点。
- `src/lib/storage.ts`：版本化草稿、单份覆盖备份、数据校验与存储失败提示。
- `src/lib/files.ts`：源文件规范化、安全文件名、浏览器本地下载。
- `src/data/examples.ts`：两类模板和六类中文语法帮助。

编辑器变更 → 更新代码 → 独立自动保存 → 去抖渲染 → 成功替换 SVG / 失败更新错误并保留旧图。保存不依赖语法合法性，错误代码也可恢复或导出。渲染处理中避免把旧图当新结果；错误时按钮明确显示“导出上次 SVG”。

## 渲染与安全

仅接受 `flowchart`（兼容 `graph`）和 `mindmap`；拒绝配置指令与 YAML 头部，防止输入改变应用安全配置。Mermaid 使用 `securityLevel: strict`、SVG 文字和本地字体，不启用 HTML 标签。DOMPurify 再清理 SVG，移除脚本、链接、图片、`foreignObject` 和外部 CSS 资源。文字实体只在 SVG 文字节点中处理，不作为 HTML 解释。

依赖随站点打包，没有图表上传、分析 SDK 或内容日志。图表不进入 URL 或 Git。Vercel 配置提供 CSP 等响应头，禁止运行时网络连接与外部嵌入；开发环境 Vite 连接不使用该生产响应头。浏览器存储不是加密保险箱。

源码上限 100,000 字符，流程图最多 600 条连线；导入文件不超过 1MB。大纲上限 100,000 字符、1,000 主题、30 层；这些是保护上限，不保证大图性能。

## 保存与恢复

`localStorage` 以 `mermaid-studio:draft:v1` 保存代码、标题、更新时间。停止编辑约 400ms 后写入，页面离开前再尝试保存。已有草稿损坏时显示警告，开始修改前不自动覆盖它；写入失败显示错误并建议导出源码。多个标签页修改会提示冲突风险，不自动合并。

模板、文件导入、大纲应用与备份恢复都经过覆盖确认；`mermaid-studio:backup:v1` 只保留最近一次覆盖前的草稿。备份失败阻止普通替换，并提供“下载当前源码并替换”。重要内容应自行保留 `.mmd` 文件。

存储按 origin 隔离：电脑、浏览器、域名、localhost、Preview、Production 都不自动同步；清理浏览器数据会删除本地内容。跨设备转移采用 `.mmd`。

## 发布与验证

`npm test` 运行 Vitest，`npm run build` 先 TypeScript 检查再 Vite 构建。GitHub Actions 在 push / PR 使用 Node 22 执行安装、测试和构建；`vercel.json` 声明 Vite、`dist` 与安全响应头。Windows 脚本选择独立 Node 并保留原 PATH。

本地真实浏览器已验证核心流程，GitHub CI 已成功，Vercel 已连接仓库并自动部署；[验证记录](verification.md)区分本地和线上检查及未覆盖场景。首次开发分支推送被 Vercel 归为 production，项目 Production Branch 仍显示 `main`，未手动更改；部署成功不表示代码已经合并。实际 PR、线上验收与部署状态见 [进度](progress.md)。
