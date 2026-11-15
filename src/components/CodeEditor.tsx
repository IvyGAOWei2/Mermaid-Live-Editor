import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { indentWithTab, undo, redo } from '@codemirror/commands'
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { MAX_SOURCE_LENGTH } from '../lib/files'

export interface CodeEditorHandle {
  undo: () => void
  redo: () => void
  append: (text: string) => void
}

const mermaidLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.match('%%')) {
      stream.skipToEnd()
      return 'comment'
    }
    if (stream.match(/"[^"\n]*"/)) return 'string'
    if (stream.match(/\|[^|\n]*\|/)) return 'string'
    if (
      stream.match(
        /\b(flowchart|graph|mindmap|subgraph|end|style|classDef|class|direction|TD|TB|BT|LR|RL)\b/,
      )
    )
      return 'keyword'
    if (stream.match(/[-=.]+[<>ox]?|[<>][-=.]+/)) return 'operator'
    if (stream.match(/[\[\]{}()]/)) return 'bracket'
    if (stream.match(/#[\da-fA-F]{3,8}\b/)) return 'color'
    stream.next()
    return null
  },
})

const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#8d55ad', fontWeight: '600' },
  { tag: tags.string, color: '#247d65' },
  { tag: tags.operator, color: '#9a752f' },
  { tag: tags.bracket, color: '#36749e' },
  { tag: tags.comment, color: '#8c98a4', fontStyle: 'italic' },
  { tag: tags.color, color: '#b16357' },
])

export const CodeEditor = forwardRef<
  CodeEditorHandle,
  { value: string; onChange: (code: string) => void; onLimit: () => void }
>(function CodeEditor({ value, onChange, onLimit }, ref) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView>()
  const callbacks = useRef({ onChange, onLimit })
  callbacks.current = { onChange, onLimit }

  useImperativeHandle(
    ref,
    () => ({
      undo: () => {
        if (view.current) {
          undo(view.current)
          view.current.focus()
        }
      },
      redo: () => {
        if (view.current) {
          redo(view.current)
          view.current.focus()
        }
      },
      append: (text) => {
        const current = view.current
        if (!current) return
        const insert = `\n${text}\n`
        current.dispatch({
          changes: { from: current.state.doc.length, insert },
          scrollIntoView: true,
        })
        current.focus()
      },
    }),
    [],
  )

  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          mermaidLanguage,
          syntaxHighlighting(highlight),
          EditorState.tabSize.of(2),
          EditorView.contentAttributes.of({ 'aria-label': 'Mermaid 代码', spellcheck: 'false' }),
          EditorState.transactionFilter.of((transaction) => {
            if (transaction.newDoc.length > MAX_SOURCE_LENGTH) {
              queueMicrotask(() => callbacks.current.onLimit())
              return []
            }
            return transaction
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = editor
    return () => {
      editor.destroy()
      view.current = undefined
    }
    // The editor owns its undo history; external values are reconciled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const current = view.current
    if (current && value !== current.state.doc.toString()) {
      current.dispatch({ changes: { from: 0, to: current.state.doc.length, insert: value } })
    }
  }, [value])

  return <div ref={host} className="code-editor" />
})
