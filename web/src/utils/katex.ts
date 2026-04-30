import katex, { type KatexOptions } from "katex"
import "katex/dist/katex.css"
import type { MarkedExtension, Tokens, TokenizerAndRendererExtension } from "marked"

interface KatexToken {
  type: string
  raw: string
  text: string
}

export const katexExtensions = (options: KatexOptions = {}): MarkedExtension => {
  return {
    extensions: [
      inlineKatex(options),
      blockKatex(options)
    ]
  }
}

const inlineKatex = (options: KatexOptions): TokenizerAndRendererExtension => {
  return {
    name: "inlineKatex",
    level: "inline",
    start(src: string) {
      return src.indexOf("$")
    },
    tokenizer(src: string): KatexToken | undefined {
      const match = src.match(/^\$([^$\n]+?)\$/)
      if (match) {
        return {
          type: "inlineKatex",
          raw: match[0]!,
          text: match[1]!.trim()
        }
      }
    },
    renderer(token: Tokens.Generic) {
      return katex.renderToString((token as KatexToken).text, options)
    }
  }
}

const blockKatex = (options: KatexOptions): TokenizerAndRendererExtension => {
  return {
    name: "blockKatex",
    level: "block",
    start(src: string) {
      return src.indexOf("$$")
    },
    tokenizer(src: string): KatexToken | undefined {
      // 仅匹配段落级公式，要求独占一行
      const match = src.match(/^\$\$\s*\n([\s\S]+?)\n\$\$/)
      if (match) {
        return {
          type: "blockKatex",
          raw: match[0]!,
          text: match[1]!.trim()
        }
      }
    },
    renderer(token: Tokens.Generic) {
      return `<p>${katex.renderToString((token as KatexToken).text, { ...options, displayMode: true })}</p>`
    }
  }
}
