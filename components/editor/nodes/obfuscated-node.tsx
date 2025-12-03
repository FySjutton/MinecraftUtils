"use client"

import {
    DecoratorNode,
    LexicalNode,
    SerializedLexicalNode,
    Spread,
    NodeKey,
    DOMExportOutput,
} from "lexical"
import * as React from "react"

export type SerializedObfuscatedTextNode = Spread<
    {
        text: string
    },
    SerializedLexicalNode
>

export class ObfuscatedTextNode extends DecoratorNode<JSX.Element> {
    __text: string

    static getType() {
        return "obfuscated-text"
    }

    static clone(node: ObfuscatedTextNode) {
        return new ObfuscatedTextNode(node.__text, node.__key)
    }

    constructor(text: string, key?: NodeKey) {
        super(key)
        this.__text = text
    }

    createDOM(): HTMLElement {
        const span = document.createElement("span")
        span.classList.add("obfuscate-wrapper")
        return span
    }

    updateDOM(): false {
        return false
    }

    static importJSON(json: SerializedObfuscatedTextNode): ObfuscatedTextNode {
        return new ObfuscatedTextNode(json.text)
    }

    exportJSON(): SerializedObfuscatedTextNode {
        return {
            type: "obfuscated-text",
            version: 1,
            text: this.__text,
        }
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("span")
        element.textContent = this.__text
        return { element }
    }

    getTextContent(): string {
        return this.__text
    }

    decorate() {
        return (
            <span className="obfuscated-text">
        {this.__text}
                <span className="obfuscated-overlay">{this.__text}</span>
      </span>
        )
    }
}

export function $createObfuscatedTextNode(text: string) {
    return new ObfuscatedTextNode(text)
}

export function $isObfuscatedTextNode(
    node: LexicalNode | null | undefined
): node is ObfuscatedTextNode {
    return node instanceof ObfuscatedTextNode
}
