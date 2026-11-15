# 开发进度

## 当前版本

**绘序 v0.1.0 已上线，关键线上验收完成。** 日期：2026-11-15（Pacific/Auckland）。访问：[mermaid-live-editor-gamma.vercel.app](https://mermaid-live-editor-gamma.vercel.app/)。实现提交的本地关键检查和远程 CI 已通过；[PR #1](https://github.com/IvyGAOWei2/Mermaid-Live-Editor/pull/1) 已创建，待用户体验验收与审阅，尚未合并。

## 环境与仓库

- 初始目录为空 Git 仓库，没有父级项目指令或用户已有代码；先写入需求与约定，再实施。
- 系统 Node 18.20.8 / npm 10.8.2 / Git 2.45.2；现采用独立 Node 22.23.5（`.local/runtime`，不提交），工具链要求 ≥22.12。
- 复用已有空的**公共**仓库 [IvyGAOWei2/Mermaid-Live-Editor](https://github.com/IvyGAOWei2/Mermaid-Live-Editor)，已配置 `origin`。
- `main` 仍为文档基线 `0f259bf`；功能提交 [`3b2f4f5`](https://github.com/IvyGAOWei2/Mermaid-Live-Editor/commit/3b2f4f5) 已推送 `origin/codex/v0.1-editor`，尚未合并到 `main`。
- 部署与验证文档提交 [`b598911`](https://github.com/IvyGAOWei2/Mermaid-Live-Editor/commit/b598911) 已推送同一开发分支。
- 官方 GitHub CLI（忽略目录 `.local/gh-cli`）已通过正常设备授权，并创建 [PR #1](https://github.com/IvyGAOWei2/Mermaid-Live-Editor/pull/1)：`codex/v0.1-editor` → `main`。截至 Head `b598911`，状态 Open / Mergeable，未合并。不记录授权码或令牌。

## 已完成

- 中文双栏 CodeMirror 编辑器、高亮、撤销重做；流程图 / 思维导图实时渲染。
- 错误提示、保留成功图形、修复恢复；连续编辑只应用最新结果。
- 两类模板、六类中文可插入语法帮助、独立大纲转换与缩进校验。
- 整图缩放、平移、适应窗口、快捷键和响应式样式。
- 本地自动保存、刷新恢复、存储失败状态；覆盖确认、单份备份及恢复。
- `.mmd` 导入导出、SVG 下载；错误时明确导出上次成功图形。
- 严格 Mermaid 配置与 SVG 清理；图表不上传，无 AI API 或后端。
- 中文项目文档、Windows 启动 / 检查脚本、GitHub CI、Vercel 静态部署及安全响应头配置。
- 本地单元测试、类型检查、生产构建和浏览器核心验证；依赖审计为 0 漏洞。见 [verification.md](verification.md)。
- 实现提交 `3b2f4f5` 的 GitHub push 检查已完成并成功：[Actions 43690767568](https://github.com/IvyGAOWei2/Mermaid-Live-Editor/actions/runs/43690767568)。
- PR Head `b598911` 的 Vercel、Vercel Preview Comments、push / PR 两次检查全部通过；[Actions 43691707528](https://github.com/IvyGAOWei2/Mermaid-Live-Editor/actions/runs/43691707528)。此结果针对已确认的提交，后续新增提交需查看各自检查。
- Vercel 项目与 GitHub 自动连接，部署 READY；线上别名 HTTP 200，CSP / `nosniff` 响应头和中文标题已确认。
- 正式别名的真实浏览器已验证中文流程图、错误保留与修复、保存后刷新恢复、中文及引号 / 方括号大纲转换为思维导图、帮助面板；本次线上验收控制台 error / warn 为空。

## 进行中与待办

- 本地最终回归通过：5 个测试文件、60 项测试、TypeScript、生产构建。
- 用户体验验收与 [PR #1](https://github.com/IvyGAOWei2/Mermaid-Live-Editor/pull/1) 审阅，再决定是否合并 `main`；新增提交后复核对应 Head 检查。
- 补测真实手机 / 触摸和更多浏览器；549px 电脑窗口已验证，不能代替手机真机。

## 验证范围与限制

真实浏览器已检查中文两类图、错误保留与修复、快速连改、刷新恢复、撤销重做、帮助修改方向且注释不受影响、模板取消覆盖及备份恢复、源码下载后导入一致、SVG 下载与 XML 中文完整性。放大、适应窗口、鼠标拖动平移和滚轮缩放也已操作验证。

549px 宽浏览器已验证上下排列且无横向溢出，真实手机尚未验证。大纲引号、方括号、`::icon` 和 HTML 字样已复测为普通文字；渲染兼容处理只恢复 SVG 文字，不生成 HTML 元素。

## 部署状态

用户通过 Vercel 官方设备登录完成授权，CLI 65.16 已创建 `ogc9/mermaid-live-editor` 并自动连接 GitHub。开发分支推送后部署达到 READY，正式别名 [https://mermaid-live-editor-gamma.vercel.app/](https://mermaid-live-editor-gamma.vercel.app/) 返回 HTTP 200，CSP 和 `X-Content-Type-Options: nosniff` 正确，页面含中文标题。线上 UI、渲染、错误恢复、本地保存恢复、大纲和帮助的关键验收已完成。

正式别名当前 READY 部署对应实现提交 `3b2f4f5`；文档提交 `b598911` 另有 READY 的 [PR Preview](https://mermaid-live-editor-8wwjbu32y-ogc9.vercel.app/)，环境为 preview。预览与正式站的草稿按域名分别保存。

Vercel 将首次 Git 推送归为 production；项目 Production Branch 仍显示 `main`，没有手工变更，也没有合并开发分支。后续保留 PR → 验收 → 决定合并的流程。

部署输入已确认排除 `.env.local`、`.git`、`.local`、依赖和测试文件。应用不需要环境密钥；CLI 生成的本地认证环境文件不提交、不上传。无需用户重新导入或手动配置 Vercel。

## 已知使用限制

- 草稿只在当前浏览器和域名，不跨设备同步；通过 `.mmd` 转移。只留一份覆盖备份。
- Mermaid 自动布局，不支持单节点自由拖拽。大图性能受设备限制。
- 源码 100,000 字符、流程图 600 条连线；配置指令、YAML 头部、远程图片、链接和 HTML 不在支持范围。
- 系统 Node 18 不能直接运行当前工具链；本工作区用 PowerShell 脚本，新电脑先安装 Node 22。

## 下一步

用户体验验收 → 审阅现有 PR 并确认最新检查 → 决定合并 `main`；补充手机与多浏览器验证。后续继续 Node 22 开发分支 → 检查 → 提交推送 → PR → 部署验收。Vercel 已配置，后续推送可触发部署；GitHub 连接不等于同步本地文件。本轮仅更新文档，沿用代码提交 `3b2f4f5` 已成功的本地与远程检查，不重复运行未变化的代码测试。
