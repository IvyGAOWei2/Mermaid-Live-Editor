import { describe, expect, it } from 'vitest'
import { cleanSvg, prepareLabelEntities, validateDiagramType } from './render'

describe('diagram validation', () => {
  it.each([
    'flowchart TD\nA[中文] --> B[结果]',
    'graph LR\nA --> B',
    '%% 注释\nmindmap\n  根主题\n    子主题',
  ])('accepts supported code: %s', (code) => {
    expect(() => validateDiagramType(code)).not.toThrow()
  })

  it.each([
    ['%%{init: {"securityLevel": "loose"}}%%\nflowchart TD\nA-->B', '配置指令'],
    ['---\nconfig:\n  theme: dark\n---\nflowchart TD\nA-->B', 'YAML'],
    ['sequenceDiagram\nA->>B: hello', 'v0.1'],
    ['', '请输入'],
    ['mindmap\n' + '字'.repeat(100_000), '100,000'],
  ])('rejects unsupported configuration or type', (code, message) => {
    expect(() => validateDiagramType(code)).toThrow(message)
  })
})

describe('SVG export', () => {
  it('serializes Chinese as a standalone SVG with numeric dimensions', () => {
    const result = cleanSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420.5 260"><text x="20" y="40">中文流程：需求 &amp; 验收</text></svg>',
    )
    expect(result.width).toBe(420.5)
    expect(result.height).toBe(260)
    const xml = new DOMParser().parseFromString(result.svg, 'image/svg+xml')
    expect(xml.querySelector('parsererror')).toBeNull()
    expect(xml.documentElement.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
    expect(xml.documentElement.getAttribute('width')).toBe('420.5')
    expect(xml.documentElement.getAttribute('height')).toBe('260')
    expect(xml.querySelector('text')?.textContent).toBe('中文流程：需求 & 验收')
  })

  it('removes executable markup, remote images, links, and CSS fetches', () => {
    const result =
      cleanSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" onload="alert(1)">
      <script>alert(1)</script>
      <foreignObject><div xmlns="http://www.w3.org/1999/xhtml">HTML</div></foreignObject>
      <image href="https://example.com/private-data" />
      <a href="https://example.com/"><text>链接</text></a>
      <style>@import 'https://example.com/font.css'; .node {fill:url(https://example.com/fill)}</style>
      <rect style="fill:url(https://example.com/pattern);stroke:red" width="50" height="20" />
      <text x="10" y="20">保留中文</text>
    </svg>`)
    const xml = new DOMParser().parseFromString(result.svg, 'image/svg+xml')
    expect(xml.querySelector('script, foreignObject, image, a, [onload], [href]')).toBeNull()
    expect(result.svg).not.toContain('https://')
    expect(xml.querySelector('text')?.textContent).toBe('链接')
    expect(xml.querySelector('rect')?.getAttribute('style')).toContain('stroke:red')
    expect(result.svg).toContain('保留中文')
  })

  it('restores placeholder punctuation across SVG text spans without creating HTML markup', () => {
    const prepared = prepareLabelEntities(
      'mindmap\n  n0["#34;中文#34; #91;A#93; #58;#58;icon#40;fa fa-book#41; #60;script#62;alert(1)#60;/script#62;"]',
    )
    const label = prepared.code.match(/"([^"\n]*)"/)![1]
    expect(label).not.toMatch(/#\d+;/)
    // Model wrapping between any two characters: no multi-character entity
    // remains for Mermaid to split between separate tspans.
    const spans = [...label].map((character) => `<tspan>${character}</tspan>`).join('')
    const result = cleanSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 100"><text>${spans}</text></svg>`,
      prepared.labelMap,
    )
    const xml = new DOMParser().parseFromString(result.svg, 'image/svg+xml')
    expect(xml.querySelector('text')?.textContent).toBe(
      '"中文" [A] ::icon(fa fa-book) <script>alert(1)</script>',
    )
    expect(xml.querySelector('parsererror, script, b, foreignObject')).toBeNull()
    expect(result.svg).toContain('<tspan>&lt;</tspan>')
  })

  it('avoids source collisions and restores only mapped label text once', () => {
    const prepared = prepareLabelEntities(
      'mindmap\n  n0["\uE000 #38;#35;34#59; #quot; #0; #55296; #1114112;"]',
    )
    expect(prepared.labelMap.has('\uE000')).toBe(false)
    const label = prepared.code.match(/"([^"\n]*)"/)![1]
    const quote = [...prepared.labelMap].find(([, character]) => character === '"')![0]
    const result = cleanSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
      <text><tspan>${label}</tspan></text>
      <rect data-label="${quote}" width="10" height="10" />
      <style>.node { --label: '${quote}'; }</style>
    </svg>`,
      prepared.labelMap,
    )
    const xml = new DOMParser().parseFromString(result.svg, 'image/svg+xml')
    expect(xml.querySelector('text')?.textContent).toBe('\uE000 &#34; " #0; #55296; #1114112;')
    expect(xml.querySelector('rect')?.getAttribute('data-label')).toBe(quote)
    expect(xml.querySelector('style')?.textContent).toContain(quote)
    expect(xml.querySelector('parsererror')).toBeNull()
  })

  it('prepares entities only inside quoted labels and preserves CSS colors and comments', () => {
    const source =
      'flowchart TD\n  A["#quot;中文#quot;"] --> B[#34;原样]\n  classDef red fill:#123;\n  style A fill:#456;\n  %% "#34;注释"'
    const prepared = prepareLabelEntities(source)
    expect(prepared.labelMap.size).toBe(1)
    expect(prepared.code).toContain('B[#34;原样]')
    expect(prepared.code).toContain('classDef red fill:#123;')
    expect(prepared.code).toContain('style A fill:#456;')
    expect(prepared.code).toContain('%% "#34;注释"')
    expect(source).toContain('A["#quot;中文#quot;"]')
  })

  it('rejects non-SVG output', () => {
    expect(() => cleanSvg('<p>不是 SVG</p>')).toThrow('有效 SVG')
  })
})
