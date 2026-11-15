const MAX_INPUT_LENGTH = 100_000
const MAX_NODES = 1_000
const MAX_DEPTH = 30

function fail(line: number, message: string): never {
  throw new Error(`第 ${line} 行：${message}`)
}

/** Mermaid entity codes keep outline text literal rather than executable syntax. */
function escapeLabel(label: string): string {
  return label.replace(/[&<>"'`#\[\]{}():;|\\]/g, (character) => `#${character.charCodeAt(0)};`)
}

/**
 * Convert one rooted outline into a Mermaid mindmap.
 * The first child selects two spaces, four spaces, or one tab per level.
 * Ambiguous indentation is rejected instead of silently changing the hierarchy.
 */
export function outlineToMindmap(input: string): string {
  if (input.length > MAX_INPUT_LENGTH) {
    fail(1, '大纲不能超过 100,000 个字符，请拆分后再转换。')
  }

  const lines = input
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
  const output = ['mindmap']
  let mode: 'spaces' | 'tabs' | undefined
  let spaceUnit: 2 | 4 | undefined
  let previousLevel = 0
  let nodeCount = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const lineNumber = index + 1
    if (!line.trim()) continue

    if (/[\u0000-\u0008\u000B-\u001F\u007F]/.test(line)) {
      fail(lineNumber, '包含不支持的控制字符，请移除后重试。')
    }

    const indentation = line.match(/^[ \t]*/)?.[0] ?? ''
    const content = line.slice(indentation.length)
    if (/^\s/u.test(content)) {
      fail(lineNumber, '缩进只支持普通空格或 Tab，请勿使用全角空格等特殊空白。')
    }
    if (indentation.includes(' ') && indentation.includes('\t')) {
      fail(lineNumber, '不能混用空格与 Tab 缩进，请统一格式。')
    }

    let level = 0
    if (nodeCount === 0 && indentation.length > 0) {
      fail(lineNumber, '第一个主题必须顶格书写，不能缩进。')
    }
    if (indentation.length > 0) {
      const currentMode = indentation.includes('\t') ? 'tabs' : 'spaces'
      if (mode && currentMode !== mode) {
        fail(lineNumber, '整个大纲不能混用空格与 Tab 缩进，请统一格式。')
      }
      if (!mode) {
        mode = currentMode
        if (mode === 'spaces') {
          if (indentation.length !== 2 && indentation.length !== 4) {
            fail(lineNumber, '首个子主题请缩进 2 或 4 个空格，后续层级使用相同单位。')
          }
          spaceUnit = indentation.length
        }
      }
      if (mode === 'spaces') {
        if (indentation.length % spaceUnit! !== 0) {
          fail(lineNumber, `缩进必须是 ${spaceUnit} 个空格的整数倍，请保持层级对齐。`)
        }
        level = indentation.length / spaceUnit!
      } else {
        level = indentation.length
      }
    }

    if (nodeCount > 0 && level === 0) {
      fail(lineNumber, '只能有一个根主题；其他主题请缩进到根主题下面。')
    }
    if (level > previousLevel + 1) {
      fail(lineNumber, '缩进跳过了层级，请先补上父主题或减少缩进。')
    }
    if (level >= MAX_DEPTH) {
      fail(lineNumber, `最多支持 ${MAX_DEPTH} 层（包含根主题），请减少层级。`)
    }

    const label = content.replace(/^[-*][ \t]+/, '').trim()
    if (!label || label === '-' || label === '*') {
      fail(lineNumber, '主题不能为空，请在列表标记后填写文字。')
    }
    nodeCount += 1
    if (nodeCount > MAX_NODES) {
      fail(lineNumber, '最多支持 1,000 个主题，请拆分后再转换。')
    }
    output.push(`${'  '.repeat(level + 1)}n${nodeCount - 1}["${escapeLabel(label)}"]`)
    previousLevel = level
  }

  if (nodeCount === 0) fail(1, '请先输入一个根主题和需要的子主题。')
  return `${output.join('\n')}\n`
}
