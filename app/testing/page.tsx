import React from "react";
import Editor from "@/components/editor/Editor";
import {Colors} from "@/lib/Colors";

export default function Page() {
    return (
        <Editor initialColor={Colors.WHITE} />
    )
}