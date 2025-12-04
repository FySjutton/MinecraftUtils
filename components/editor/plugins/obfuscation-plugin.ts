import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {useEffect} from "react";
import {$applyNodeReplacement, TextNode} from "lexical";

export function RemoveHighlightStylePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerNodeTransform(TextNode, (node) => {
            if (node.hasFormat("highlight")) {
                node.__style = "";
            }
        });
    }, [editor]);

    return null;
}
