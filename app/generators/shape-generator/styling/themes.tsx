import React, {JSX} from "react";

export const themeNames: string[] = ["Default", "Arcade", "Blueprint"] as const;
export type ThemeName = (typeof themeNames)[number];
export const defaultTheme: ThemeName = "Default";

export interface Theme {
    backgroundColor: string;
    checkedColor: string;
    cellColor: string;
    gridLineColor: string;
    gridCellColor: string;
    borderColor?: string;
    textColor: string;
    pattern?: JSX.Element;
}

export const themes: Record<ThemeName, Theme> = {
    Default: {
        backgroundColor: "#171717",
        checkedColor: "#9810fa",
        cellColor: "#fb2c36",
        gridLineColor: "rgb(41,41,41)",
        gridCellColor: "rgb(166,166,166)",
        textColor: "white"
    },
    Arcade: {
        backgroundColor: "#000000",
        checkedColor: "#001701",
        cellColor: "#005400",
        gridLineColor: "#003300",
        gridCellColor: "#6aa66c",
        borderColor: "#00ff00",
        textColor: "white"
    },
    Blueprint: {
        backgroundColor: "#1a2c96",
        checkedColor: "#0b205a",
        cellColor: "#386dff",
        gridLineColor: "#566670",
        gridCellColor: "#8794e8",
        borderColor: "white",
        textColor: "#8aabff",
        pattern: (
            <pattern
                id="blueprintStripes"
                width={4}
                height={4}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-45)"
            >
                <rect width={1} height={8} fill="white"/>
            </pattern>
        ),
    },
};
