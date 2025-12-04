import { TextNode } from "lexical";

export class ObfuscatedTextNode extends TextNode {
    static getType(): string {
        return "text";
    }

    static clone(node: ObfuscatedTextNode): ObfuscatedTextNode {
        return new ObfuscatedTextNode(node.__text, node.__key);
    }

    createDOM(config) {
        const dom = super.createDOM(config);
        if (this.hasFormat("highlight")) {
            dom.removeAttribute("style");
            dom.classList.add("obfuscated-text");
        }
        return dom;
    }

    updateDOM(prevNode, dom) {
        const didChange = super.updateDOM(prevNode, dom);
        const has = this.hasFormat && this.hasFormat("highlight");
        const had = prevNode && typeof prevNode.hasFormat === "function" && prevNode.hasFormat("highlight");

        if (has && !had) {
            dom.classList.add("obfuscated-text");
            dom.removeAttribute("style");
        } else if (!has && had) {
            dom.classList.remove("obfuscated-text");
        }

        return didChange;
    }
}
