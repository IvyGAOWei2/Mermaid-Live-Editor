import { describe, expect, it } from 'vitest'
import { outlineToMindmap } from './outline'

describe('outlineToMindmap', () => {
  it('preserves Chinese text, siblings, and two-space hierarchy', () => {
    expect(outlineToMindmap('学习计划\n  工作\n    数据分析\n  生活')).toBe(
      'mindmap\n  n0["学习计划"]\n    n1["工作"]\n      n2["数据分析"]\n    n3["生活"]\n',
    )
  })

  it('accepts four spaces and optional list markers', () => {
    expect(outlineToMindmap('- 项目\n    * 需求\n        - 验收')).toBe(
      'mindmap\n  n0["项目"]\n    n1["需求"]\n      n2["验收"]\n',
    )
  })

  it('accepts tabs, CRLF, BOM, and blank lines without losing physical line numbers', () => {
    expect(outlineToMindmap('\uFEFF根主题\r\n\r\n\t子主题\r\n\t\t孙主题\r\n')).toContain(
      '      n2["孙主题"]',
    )
    expect(() => outlineToMindmap('根\n\n  子\n   错误')).toThrow('第 4 行')
  })

  it('keeps syntax, HTML, quotes, and icon directives inside literal labels', () => {
    const result = outlineToMindmap(
      '中文 (计划)\n  ::icon(fa fa-book) [A] "B" <img src=x> & #34; `文字` \\',
    )
    expect(result).toContain('n0["中文 #40;计划#41;"]')
    expect(result).toContain('#58;#58;icon#40;fa fa-book#41;')
    expect(result).toContain(
      '#91;A#93; #34;B#34; #60;img src=x#62; #38; #35;34#59; #96;文字#96; #92;',
    )
    expect(result).not.toContain('<img')
    expect(result).not.toContain('::icon')
  })

  it.each([
    ['', '第 1 行'],
    ['\n \t\n', '请先输入'],
    ['  根', '第一个主题必须顶格'],
    ['根\n另一个根', '只能有一个根主题'],
    ['根\n 子', '2 或 4 个空格'],
    ['根\n   子', '2 或 4 个空格'],
    ['根\n      子', '2 或 4 个空格'],
    ['根\n  子\n   孙', '2 个空格的整数倍'],
    ['根\n    子\n  另一个子', '4 个空格的整数倍'],
    ['根\n  子\n      孙', '跳过了层级'],
    ['根\n\t\t子', '跳过了层级'],
    ['根\n \t子', '不能混用'],
    ['根\n  子\n\t另一个子', '不能混用'],
    ['根\n　子', '全角空格'],
    ['根\n  - ', '主题不能为空'],
    ['根\n  \u0000子', '控制字符'],
  ])('rejects ambiguous or unsupported input %j', (input, message) => {
    expect(() => outlineToMindmap(input)).toThrow(message)
  })

  it('accepts exactly 30 levels but rejects the 31st with a line number', () => {
    const thirtyLevels = Array.from({ length: 30 }, (_, level) => `${'  '.repeat(level)}主题`).join(
      '\n',
    )
    expect(outlineToMindmap(thirtyLevels).split('\n')).toHaveLength(32)
    expect(() => outlineToMindmap(`${thirtyLevels}\n${'  '.repeat(30)}太深`)).toThrow('第 31 行')
  })

  it('limits document size and node count', () => {
    expect(() => outlineToMindmap('字'.repeat(100_001))).toThrow('100,000')
    const thousandNodes = `根\n${Array.from({ length: 999 }, () => '  子').join('\n')}`
    expect(outlineToMindmap(thousandNodes)).toContain('n999["子"]')
    expect(() => outlineToMindmap(`${thousandNodes}\n  太多`)).toThrow('第 1001 行')
  })
})
