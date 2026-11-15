import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Download,
  FileCode2,
  FolderOpen,
  GitBranch,
  History,
  Info,
  Layers3,
  ListTree,
  LockKeyhole,
  Network,
  Redo2,
  Undo2,
  Upload,
  X,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { CodeEditor, type CodeEditorHandle } from './components/CodeEditor'
import { Preview } from './components/Preview'
import { Modal } from './components/Modal'
import { flowchartTemplate, mindmapTemplate, outlineExample, syntaxHelp } from './data/examples'
import { useDiagram } from './hooks/useDiagram'
import { backupDraft, loadBackup, loadDraft, saveDraft, type Draft } from './lib/storage'
import { downloadFile, normalizeSource, safeFilename, validateSourceFile } from './lib/files'
import { outlineToMindmap } from './lib/outline'

function initialDraft() {
  try {
    return loadDraft(window.localStorage)
  } catch {
    return { draft: null, warning: '此浏览器无法使用本地存储，请及时导出源文件保存。' }
  }
}

export default function App() {
  const [initial] = useState(initialDraft)
  const [code, setCode] = useState(initial.draft?.code ?? flowchartTemplate)
  const [title, setTitle] = useState(initial.draft?.title ?? '我的第一张流程图')
  const [saveStatus, setSaveStatus] = useState<'pending' | 'saved' | 'error'>('pending')
  const [saveError, setSaveError] = useState(initial.warning ?? '')
  const [savedTime, setSavedTime] = useState(initial.draft?.updatedAt ?? '')
  const [help, setHelp] = useState(false)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [outline, setOutline] = useState(outlineExample)
  const [outlineError, setOutlineError] = useState('')
  const [outlineResult, setOutlineResult] = useState('')
  const [guide, setGuide] = useState(false)
  const [backupAvailable, setBackupAvailable] = useState(() => {
    try {
      return !!loadBackup(window.localStorage)
    } catch {
      return false
    }
  })
  const [replacement, setReplacement] = useState<{
    code: string
    title: string
    label: string
  } | null>(null)
  const [replaceError, setReplaceError] = useState('')
  const [notice, setNotice] = useState('')
  const [edited, setEdited] = useState(false)
  const editor = useRef<CodeEditorHandle>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const current = useRef<Draft>({ code, title, updatedAt: new Date().toISOString() })
  current.current = { code, title, updatedAt: new Date().toISOString() }
  const { diagram, error, busy } = useDiagram(code)
  const isMindmap = /^\s*(?:%%[^\n]*\n\s*)*mindmap\b/.test(code)

  function changeCode(next: string) {
    setCode(next)
    setEdited(true)
  }
  useEffect(() => {
    if (initial.warning && !edited) {
      setSaveStatus('error')
      return
    }
    setSaveStatus('pending')
    const timer = window.setTimeout(() => {
      try {
        const draft = current.current
        saveDraft(window.localStorage, draft)
        setSavedTime(draft.updatedAt)
        setSaveStatus('saved')
        setSaveError('')
      } catch (cause) {
        setSaveStatus('error')
        setSaveError(cause instanceof Error ? cause.message : '本地保存失败，请导出源文件。')
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [code, title, edited, initial.warning])

  useEffect(() => {
    const flush = () => {
      if (initial.warning && !edited) return true
      try {
        saveDraft(window.localStorage, current.current)
        return true
      } catch {
        return false
      }
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!flush()) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('pagehide', flush)
    }
  }, [edited, initial.warning])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const otherTab = (event: StorageEvent) => {
      if (event.key === 'mermaid-studio:draft:v1')
        setNotice('另一个标签页修改了本地草稿。当前编辑内容保留；请避免同时编辑，并及时导出。')
    }
    window.addEventListener('storage', otherTab)
    return () => window.removeEventListener('storage', otherTab)
  }, [])

  function sourceDownload() {
    downloadFile(code, 'text/plain;charset=utf-8', `${safeFilename(title)}.mmd`)
    setNotice('已生成 .mmd 源文件下载，可在其他电脑重新导入。')
  }

  function requestReplacement(nextCode: string, nextTitle: string, label: string) {
    if (nextCode === code && nextTitle === title) {
      setNotice('内容与当前草稿一致，无需替换。')
      return
    }
    setReplaceError('')
    setReplacement({ code: nextCode, title: nextTitle, label })
  }

  function applyReplacement(downloadFirst = false) {
    if (!replacement) return
    try {
      if (downloadFirst) sourceDownload()
      else {
        backupDraft(window.localStorage, current.current)
        setBackupAvailable(true)
      }
      changeCode(replacement.code)
      setTitle(replacement.title)
      setReplacement(null)
      setReplaceError('')
      setNotice(
        downloadFirst
          ? '已替换内容。请保留刚下载的源文件。'
          : '已替换内容，可用“恢复上份草稿”找回覆盖前的内容。',
      )
    } catch (cause) {
      setReplaceError(cause instanceof Error ? cause.message : '无法备份，请先导出当前源码。')
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      validateSourceFile(file)
      const imported = normalizeSource(await file.text())
      requestReplacement(
        imported,
        file.name.replace(/\.[^.]+$/, '').slice(0, 200),
        `导入「${file.name}」`,
      )
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '读取文件失败，请使用 UTF-8 文本文件。')
    }
  }

  function restoreBackup() {
    try {
      const backup = loadBackup(window.localStorage)
      if (!backup) {
        setBackupAvailable(false)
        setNotice('未找到可恢复的备份。')
        return
      }
      requestReplacement(backup.code, backup.title, '恢复上份草稿')
    } catch {
      setNotice('无法读取本地备份，请使用导出的 .mmd 文件。')
    }
  }

  function insertExample(index: number) {
    const item = syntaxHelp[index]
    if (item.type === 'mindmap') requestReplacement(item.code, '思维导图练习', '使用思维导图示例')
    else if (isMindmap || !/^\s*(?:%%[^\n]*\n\s*)*(flowchart|graph)\b/.test(code)) {
      requestReplacement(
        item.title === '流程方向' ? item.code : `flowchart TD\n${item.code}`,
        '流程图练习',
        '使用流程图示例',
      )
    } else if (item.title === '流程方向')
      changeCode(code.replace(/^(\s*(?:flowchart|graph)\s+)(TD|TB|BT|LR|RL)\b/m, '$1LR'))
    else editor.current?.append(item.code)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#" aria-label="绘序首页">
          <span className="brand-mark">
            <GitBranch size={21} />
          </span>
          <span>
            绘序<span className="brand-separator">/</span>
            <span className="brand-subtitle">Mermaid 编辑器</span>
          </span>
          <span className="version">v0.1</span>
        </a>
        <div className="header-right">
          <span className="privacy-label">
            <LockKeyhole size={13} />
            本地优先 · 无需登录
          </span>
          <button className="text-button guide-button" onClick={() => setGuide(true)}>
            <BookOpen size={15} />
            使用指南
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">从文字，到清晰的思路</div>
            <h1>
              让想法，自然成图<span>。</span>
            </h1>
            <p>粘贴 Mermaid，修改几行文字，让流程与灵感一目了然。</p>
          </div>
          <button
            className={`help-toggle ${help ? 'active' : ''}`}
            aria-expanded={help}
            aria-controls="syntax-panel"
            onClick={() => setHelp(!help)}
          >
            <BookOpen size={17} />
            语法速查<span className="keycap">?</span>
          </button>
        </div>

        <section className="workspace" aria-label="Mermaid 编辑工作台">
          <div className="workspace-toolbar">
            <div className="document-name">
              <FileCode2 size={17} />
              <input
                aria-label="图表名称"
                maxLength={200}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setEdited(true)
                }}
              />
              <span className="file-extension">.mmd</span>
              <ChevronDown size={13} className="document-chevron" />
            </div>
            <div className="file-actions">
              <button className="button subtle" onClick={() => fileInput.current?.click()}>
                <Upload size={15} />
                导入
              </button>
              <button className="button subtle" onClick={sourceDownload}>
                <FileCode2 size={15} />
                <span>导出源码</span>
              </button>
              <button
                className="button primary"
                disabled={!diagram || (busy && diagram.code !== code)}
                title={error ? '导出保留的上一次成功图形' : '下载可使用的 SVG 矢量图'}
                onClick={() => {
                  if (!diagram) return
                  downloadFile(
                    diagram.svg,
                    'image/svg+xml;charset=utf-8',
                    `${safeFilename(title)}.svg`,
                  )
                  setNotice(
                    error
                      ? '已下载上一次成功预览的 SVG；当前错误代码请另存为 .mmd。'
                      : '已生成 SVG 下载，文字与图形可在浏览器打开。',
                  )
                }}
              >
                <Download size={15} />
                {error && diagram ? '导出上次 SVG' : '导出 SVG'}
              </button>
            </div>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept=".mmd,.mermaid,.txt"
              aria-label="导入 Mermaid 文件"
              onChange={importFile}
            />
          </div>

          <div className="workspace-grid">
            <section className="editor-panel" aria-labelledby="editor-title">
              <div className="panel-heading">
                <div className="panel-title">
                  <Code2 size={15} />
                  <h2 id="editor-title">代码编辑</h2>
                  <span>MERMAID</span>
                </div>
                <div className="history-actions">
                  <button
                    className="icon-button"
                    onClick={() => editor.current?.undo()}
                    title="撤销（Ctrl / ⌘ Z）"
                    aria-label="撤销"
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    className="icon-button"
                    onClick={() => editor.current?.redo()}
                    title="重做（Ctrl Shift Z / Ctrl Y）"
                    aria-label="重做"
                  >
                    <Redo2 size={15} />
                  </button>
                </div>
              </div>
              <div className="template-bar">
                <span>从模板开始</span>
                <button
                  className={!isMindmap ? 'template-chip selected' : 'template-chip'}
                  onClick={() =>
                    requestReplacement(flowchartTemplate, '我的第一张流程图', '切换流程图模板')
                  }
                >
                  <GitBranch size={13} />
                  流程图
                </button>
                <button
                  className={isMindmap ? 'template-chip selected' : 'template-chip'}
                  onClick={() =>
                    requestReplacement(mindmapTemplate, '我的学习计划', '切换思维导图模板')
                  }
                >
                  <Network size={13} />
                  思维导图
                </button>
              </div>
              <CodeEditor
                ref={editor}
                value={code}
                onChange={changeCode}
                onLimit={() => setNotice('代码最多支持 100,000 个字符，本次超长输入未应用。')}
              />
              <div className="editor-bottom">
                <button
                  className="outline-entry"
                  onClick={() => {
                    setOutlineOpen(true)
                    setOutlineError('')
                    setOutlineResult('')
                  }}
                >
                  <ListTree size={15} />
                  大纲转思维导图
                  <ArrowRight size={13} />
                </button>
                <span>{code.split('\n').length} 行 · UTF-8</span>
              </div>
            </section>

            <section className="preview-panel" aria-labelledby="preview-title">
              <div className="panel-heading">
                <div className="panel-title">
                  <Layers3 size={15} />
                  <h2 id="preview-title">实时预览</h2>
                </div>
                <span className={`render-status ${error && !busy ? 'error' : ''}`}>
                  {busy ? (
                    <>
                      <span className="spinner" />
                      渲染中
                    </>
                  ) : error ? (
                    <>
                      <AlertCircle size={13} />
                      需要修正代码
                    </>
                  ) : (
                    <>
                      <span className="live-dot" />
                      已更新
                    </>
                  )}
                </span>
              </div>
              {error && !busy && (
                <div className="error-panel" role="alert">
                  <div>
                    <AlertCircle size={16} />
                    <strong>语法需要调整</strong>
                    <span>{diagram ? '已保留上一次成功预览' : '修复后将自动预览'}</span>
                  </div>
                  <pre>{error}</pre>
                </div>
              )}
              <Preview diagram={diagram} busy={busy} />
            </section>

            {help && (
              <aside id="syntax-panel" className="syntax-panel" aria-label="中文语法速查">
                <div className="panel-heading">
                  <div className="panel-title">
                    <BookOpen size={15} />
                    <h2>语法速查</h2>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => setHelp(false)}
                    aria-label="关闭语法帮助"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="syntax-intro">
                  边画边学，从一个小改动开始。
                  <br />
                  <span>示例 ID 请按需修改，避免与现有节点重名。</span>
                </div>
                <div className="syntax-list">
                  {syntaxHelp.map((item, index) => (
                    <details key={item.title} open={index === 0 || undefined}>
                      <summary>
                        {item.title}
                        <ChevronDown size={14} />
                      </summary>
                      <p>{item.description}</p>
                      <pre>{item.code}</pre>
                      <button className="insert-button" onClick={() => insertExample(index)}>
                        {item.type === 'mindmap'
                          ? '使用此示例'
                          : item.title === '流程方向'
                            ? '改为从左到右'
                            : '插入示例'}
                        <ArrowRight size={13} />
                      </button>
                    </details>
                  ))}
                </div>
                <a
                  className="official-link"
                  href="https://mermaid.js.org/intro/"
                  target="_blank"
                  rel="noreferrer"
                >
                  查看 Mermaid 官方文档 ↗
                </a>
              </aside>
            )}
          </div>

          <div className="workspace-status">
            <div
              className={`save-state ${saveStatus}`}
              aria-live="polite"
              title={
                saveError ||
                (savedTime ? `保存于 ${new Date(savedTime).toLocaleTimeString('zh-CN')}` : '')
              }
            >
              {saveStatus === 'saved' ? (
                <CheckCircle2 size={13} />
              ) : saveStatus === 'error' ? (
                <AlertCircle size={13} />
              ) : (
                <span className="spinner" />
              )}
              <span>
                {saveStatus === 'saved'
                  ? '已自动保存到此浏览器'
                  : saveStatus === 'error'
                    ? '本地保存不可用，请导出源码'
                    : '正在保存…'}
              </span>
            </div>
            <button className="backup-button" disabled={!backupAvailable} onClick={restoreBackup}>
              <History size={13} />
              恢复上份草稿
            </button>
          </div>
        </section>

        {saveError && (
          <div className="storage-warning" role="alert">
            <AlertCircle size={15} />
            {saveError}
          </div>
        )}
        <footer className="page-footer">
          <span>
            <LockKeyhole size={12} />
            图表在浏览器内处理。草稿仅保存在此设备、此浏览器，不会跨电脑同步。
          </span>
          <button onClick={() => setGuide(true)}>
            通过 .mmd 文件转移草稿
            <ArrowRight size={12} />
          </button>
        </footer>
      </main>

      {notice && (
        <div className="toast" role="status">
          <Info size={17} />
          <span>{notice}</span>
          <button className="icon-button" aria-label="关闭提示" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {replacement && (
        <Modal title={replacement.label} onClose={() => setReplacement(null)}>
          <div className="replace-illustration">
            <FileCode2 size={25} />
            <ArrowRight size={18} />
            <FolderOpen size={25} />
          </div>
          <p className="modal-description">
            这会替换当前编辑内容。继续前会在本浏览器保留一份覆盖前备份，可用“恢复上份草稿”找回。
          </p>
          <div className="modal-tip">
            <Info size={16} />
            <span>只保留最近一次覆盖备份。重要内容请先导出 .mmd 文件。</span>
          </div>
          {replaceError && (
            <p className="form-error" role="alert">
              {replaceError}
            </p>
          )}
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setReplacement(null)}>
              取消
            </button>
            {replaceError ? (
              <button className="button primary" onClick={() => applyReplacement(true)}>
                下载当前源码并替换
              </button>
            ) : (
              <button className="button primary" onClick={() => applyReplacement()}>
                备份并替换
              </button>
            )}
          </div>
        </Modal>
      )}

      {outlineOpen && (
        <Modal title="把大纲，变成思维导图" wide onClose={() => setOutlineOpen(false)}>
          <p className="modal-description">
            一个根主题，逐层缩进。适合把会议要点、学习计划和灵感整理成图。
          </p>
          <div className="outline-rules">
            <span>
              <Check size={13} />
              单个顶格根主题
            </span>
            <span>
              <Check size={13} />
              每层 2 / 4 空格或 Tab
            </span>
            <span>
              <Check size={13} />
              同级对齐，不混用
            </span>
          </div>
          <label className="field-label" htmlFor="outline-input">
            缩进大纲<span>支持 - / * 列表标记</span>
          </label>
          <textarea
            id="outline-input"
            className="outline-input"
            maxLength={100000}
            value={outline}
            spellCheck={false}
            onChange={(event) => {
              setOutline(event.target.value)
              setOutlineResult('')
              setOutlineError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Tab') {
                event.preventDefault()
                const input = event.currentTarget
                const from = input.selectionStart,
                  to = input.selectionEnd
                setOutline(outline.slice(0, from) + '  ' + outline.slice(to))
                setOutlineResult('')
                requestAnimationFrame(() => {
                  input.selectionStart = input.selectionEnd = from + 2
                })
              }
            }}
          />
          {outlineError && (
            <p className="form-error" role="alert">
              {outlineError}
            </p>
          )}
          {outlineResult && (
            <div className="outline-result">
              <div>
                <CheckCircle2 size={15} />
                转换成功 · 可继续编辑
              </div>
              <pre>{outlineResult}</pre>
            </div>
          )}
          <p className="small-note">
            最多 1,000 个主题、30 层。首个子主题确定缩进单位；不明确的层级会提示行号。
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setOutlineOpen(false)}>
              取消
            </button>
            {outlineResult ? (
              <button
                className="button primary"
                onClick={() => {
                  setOutlineOpen(false)
                  requestReplacement(
                    outlineResult,
                    outline
                      .trim()
                      .split('\n')[0]
                      .replace(/^[-*]\s+/, '')
                      .slice(0, 200),
                    '使用转换后的思维导图',
                  )
                }}
              >
                使用此思维导图
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => {
                  try {
                    setOutlineResult(outlineToMindmap(outline))
                    setOutlineError('')
                  } catch (cause) {
                    setOutlineError(cause instanceof Error ? cause.message : '转换失败')
                  }
                }}
              >
                <Sparkles size={15} />
                转换为 Mermaid
              </button>
            )}
          </div>
        </Modal>
      )}

      {guide && (
        <Modal title="欢迎使用绘序" wide onClose={() => setGuide(false)}>
          <div className="guide-content">
            <p className="modal-description">
              像修改 Markdown 一样，用文字描述结构，让 Mermaid 自动排版。
            </p>
            <ol className="guide-steps">
              <li>
                <strong>粘贴或选择模板</strong>
                <p>把外部 AI 生成的 flowchart / mindmap 粘贴到左侧，或从示例开始。</p>
              </li>
              <li>
                <strong>修改文字与关系</strong>
                <p>
                  右侧会自动更新；“语法速查”提供中文解释和可插入示例。遇到错误时会保留上一次成功图形。
                </p>
              </li>
              <li>
                <strong>保存你的成果</strong>
                <p>
                  源码可导出为 .mmd 并重新导入；SVG 是可在浏览器打开的矢量图。出错时导出的 SVG
                  对应上一次成功预览。
                </p>
              </li>
            </ol>
            <div className="guide-card">
              <LockKeyhole size={18} />
              <div>
                <strong>本地草稿 ≠ 跨设备同步</strong>
                <p>
                  草稿自动保存在当前浏览器和网站域名下。换电脑、换浏览器、换域名或清理网站数据，都无法读取这里的草稿。请导出
                  .mmd，再在另一台电脑导入。隐私模式可能无法保存。
                </p>
              </div>
            </div>
            <div className="guide-card">
              <Network size={18} />
              <div>
                <strong>结构由代码控制，布局由 Mermaid 生成</strong>
                <p>
                  可以缩放和平移整张图；需要调整结构时，请修改节点、连线、方向或缩进。暂不支持自由拖动单个节点、AI
                  调用、账号和多人协作。
                </p>
              </div>
            </div>
            <p className="small-note">
              撤销：Ctrl / ⌘ Z · 重做：Ctrl Shift Z / Ctrl Y · 预览聚焦后可用 + / − 缩放、0
              适应窗口。源码限 100,000 字符，流程图最多 600 条连线；不支持配置指令、远程图片和 HTML
              标签。
            </p>
          </div>
          <div className="modal-actions">
            <button className="button primary" onClick={() => setGuide(false)}>
              开始绘图
              <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
