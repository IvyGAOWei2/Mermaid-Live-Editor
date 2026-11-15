import DOMPurify from 'dompurify'

export interface Diagram {
  svg: string
  width: number
  height: number
  code: string
}
let nextId = 0
let engine: Promise<typeof import('mermaid').default> | undefined

export function validateDiagramType(code: string) {
  if (code.length > 100_000) throw new Error('代码超过 100,000 字符，请拆分为较小的图表。')
  if (/%%\s*\{/.test(code) || /^\s*---/.test(code)) {
    throw new Error('本版不支持配置指令或 YAML 头部。请直接从 flowchart 或 mindmap 开始。')
  }
  const first = code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('%%'))
  if (!first) throw new Error('请输入 Mermaid 代码，或选择一个示例模板。')
  if (!/^(flowchart\s+(?:TD|TB|BT|LR|RL)\b|graph\s+(?:TD|TB|BT|LR|RL)\b|mindmap\b)/.test(first)) {
    throw new Error('v0.1 支持 flowchart 流程图和 mindmap 思维导图。流程图示例：flowchart TD。')
  }
}

export function prepareLabelEntities(source: string): {
  code: string
  labelMap: ReadonlyMap<string, string>
} {
  const named: Record<string, string> = {
    quot: '"',
    amp: '&',
    lt: '<',
    gt: '>',
    apos: "'",
    nbsp: '\u00a0',
  }
  const occupied = new Set(source)
  const labelMap = new Map<string, string>()
  const placeholders = new Map<string, string>()
  let next = 0xe000
  const code = source
    .split('\n')
    .map((line) => {
      // Configuration/style declarations and comments are not diagram labels.
      if (/^\s*(?:%%|style\b|classDef\b|linkStyle\b|click\b)/.test(line)) return line
      return line.replace(
        /"([^"\r\n]*)"/g,
        (_quoted, label: string) =>
          `"${label.replace(
            /#(?:(\d{1,7})|(quot|amp|lt|gt|apos|nbsp));/g,
            (entity, digits: string | undefined, name: string | undefined) => {
              const point = Number(digits)
              const valid =
                point === 9 ||
                point === 10 ||
                point === 13 ||
                (point >= 0x20 && point <= 0xd7ff) ||
                (point >= 0xe000 && point <= 0xfffd) ||
                (point >= 0x10000 && point <= 0x10ffff)
              if (!name && !valid) return entity
              const character = name ? named[name] : String.fromCodePoint(point)
              const existing = placeholders.get(character)
              if (existing) return existing
              while (next <= 0xf8ff && occupied.has(String.fromCharCode(next))) next += 1
              if (next > 0xf8ff) throw new Error('标签中的特殊字符过多，请拆分为较小的图表。')
              const placeholder = String.fromCharCode(next++)
              placeholders.set(character, placeholder)
              labelMap.set(placeholder, character)
              return placeholder
            },
          )}"`,
      )
    })
    .join('\n')
  return { code, labelMap }
}

export function cleanSvg(
  svg: string,
  labelMap?: ReadonlyMap<string, string>,
): Omit<Diagram, 'code'> {
  const clean = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['foreignObject', 'image', 'a', 'script'],
    FORBID_ATTR: ['href', 'xlink:href'],
  })
  const doc = new DOMParser().parseFromString(clean, 'image/svg+xml')
  const root = doc.documentElement
  if (root.localName !== 'svg' || doc.querySelector('parsererror'))
    throw new Error('无法生成有效 SVG。')
  // Single-character placeholders survive Mermaid parsing, measurement, and
  // line wrapping. Restore only label Text nodes, never markup or attributes.
  if (labelMap?.size) {
    const labels = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let textNode = labels.nextNode()
    while (textNode) {
      if (textNode.parentElement?.closest('text, tspan')) {
        textNode.nodeValue = (textNode.nodeValue ?? '').replace(
          /[\uE000-\uF8FF]/g,
          (character) => labelMap.get(character) ?? character,
        )
      }
      textNode = labels.nextNode()
    }
  }
  // Diagram content cannot fetch external images, fonts, or CSS resources.
  root.querySelectorAll('style').forEach((style) => {
    style.textContent = (style.textContent ?? '').replace(/@import[^;]*;|url\s*\([^)]*\)/gi, '')
  })
  root.querySelectorAll('[style]').forEach((node) => {
    node.setAttribute('style', (node.getAttribute('style') ?? '').replace(/url\s*\([^)]*\)/gi, ''))
  })
  const box = root
    .getAttribute('viewBox')
    ?.split(/[\s,]+/)
    .map(Number)
  const width = box && Number.isFinite(box[2]) && box[2] > 0 ? box[2] : 800
  const height = box && Number.isFinite(box[3]) && box[3] > 0 ? box[3] : 600
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  root.setAttribute('width', String(width))
  root.setAttribute('height', String(height))
  root.setAttribute('style', 'max-width:none;background:transparent;')
  root.setAttribute('role', 'img')
  root.setAttribute('aria-label', 'Mermaid 图表')
  return { svg: new XMLSerializer().serializeToString(root), width, height }
}

export async function renderDiagram(code: string): Promise<Diagram> {
  validateDiagramType(code)
  if (!engine)
    engine = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
        htmlLabels: false,
        look: 'classic',
        theme: 'base',
        fontFamily: '"Microsoft YaHei", "PingFang SC", Arial, sans-serif',
        maxTextSize: 100_000,
        maxEdges: 600,
        flowchart: { htmlLabels: false, useMaxWidth: false, curve: 'basis' },
        themeVariables: {
          primaryColor: '#edf4f8',
          primaryTextColor: '#31465b',
          primaryBorderColor: '#a7bdcc',
          lineColor: '#829aa9',
          secondaryColor: '#e2f2eb',
          tertiaryColor: '#f9f4e7',
          fontSize: '15px',
        },
      })
      return mermaid
    })
  const mermaid = await engine
  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-100000px;top:0;width:1200px;visibility:hidden;pointer-events:none;'
  document.body.append(host)
  try {
    const prepared = prepareLabelEntities(code)
    const { svg } = await mermaid.render(`mermaid-diagram-${++nextId}`, prepared.code, host)
    return { ...cleanSvg(svg, prepared.labelMap), code }
  } finally {
    host.remove()
  }
}
