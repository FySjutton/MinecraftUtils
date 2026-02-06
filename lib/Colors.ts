export const Colors = {
    BLACK: "#000000",
    DARK_BLUE: "#0000AA",
    DARK_GREEN: "#00AA00",
    DARK_AQUA: "#00AAAA",
    DARK_RED: "#AA0000",
    DARK_PURPLE: "#AA00AA",
    GOLD: "#FFAA00",
    GRAY: "#AAAAAA",
    DARK_GRAY: "#555555",
    BLUE: "#5555FF",
    GREEN: "#55FF55",
    AQUA: "#55FFFF",
    RED: "#FF5555",
    LIGHT_PURPLE: "#FF55FF",
    YELLOW: "#FFFF55",
    WHITE: "#FFFFFF",
} as const

export const DyeColors: Record<string, string> = {
    white: "#F9FFFE",
    light_gray: "#9D9D97",
    gray: "#474F52",
    black: "#1D1D21",
    brown: "#835432",
    red: "#B02E26",
    orange: "#F9801D",
    yellow: "#FED83D",
    lime: "#80C71F",
    green: "#5E7C16",
    cyan: "#169C9C",
    light_blue: "#3AB3DA",
    blue: "#3C44AA",
    purple: "#8932B8",
    magenta: "#C74EBD",
    pink: "#F38BAA",
};


export const DyeColorsReverse = Object.fromEntries(
    Object.entries(DyeColors).map(([name, hex]) => [hex, name])
) as Record<string, string>

export const ColorList = Object.values(Colors) as readonly string[]

export const FireworkColors = {
    BLACK: 0x1e1b1b,
    RED: 0xb3312c,
    GREEN: 0x3b511a,
    BROWN: 0x51301a,
    BLUE: 0x253192,
    PURPLE: 0x7b2fbe,
    CYAN: 0x287697,
    LIGHT_GRAY: 0xabab9f,
    GRAY: 0x434343,
    PINK: 0xd88198,
    LIME: 0x41cd34,
    YELLOW: 0xdecf2a,
    LIGHT_BLUE: 0x6689d3,
    MAGENTA: 0xc354cd,
    ORANGE: 0xeb8844,
    WHITE: 0xf0f0f0,
} as const;
export const FireworkColorsReverse = Object.fromEntries(
    Object.entries(FireworkColors).map(([name, hex]) => [hex, name])
) as Record<string, string>

export const ColorMeta = [
    { key: "BLACK", name: "Black", formatting: "§0", motd: "\\u00A70" },
    { key: "DARK_BLUE", name: "Dark Blue", formatting: "§1", motd: "\\u00A71" },
    { key: "DARK_GREEN", name: "Dark Green", formatting: "§2", motd: "\\u00A72" },
    { key: "DARK_AQUA", name: "Dark Aqua", formatting: "§3", motd: "\\u00A73" },
    { key: "DARK_RED", name: "Dark Red", formatting: "§4", motd: "\\u00A74" },
    { key: "DARK_PURPLE", name: "Dark Purple", formatting: "§5", motd: "\\u00A75" },
    { key: "GOLD", name: "Gold", formatting: "§6", motd: "\\u00A76" },
    { key: "GRAY", name: "Gray", formatting: "§7", motd: "\\u00A77" },
    { key: "DARK_GRAY", name: "Dark Gray", formatting: "§8", motd: "\\u00A78" },
    { key: "BLUE", name: "Blue", formatting: "§9", motd: "\\u00A79" },
    { key: "GREEN", name: "Green", formatting: "§a", motd: "\\u00A7a" },
    { key: "AQUA", name: "Aqua", formatting: "§b", motd: "\\u00A7b" },
    { key: "RED", name: "Red", formatting: "§c", motd: "\\u00A7c" },
    { key: "LIGHT_PURPLE", name: "Light Purple", formatting: "§d", motd: "\\u00A7d" },
    { key: "YELLOW", name: "Yellow", formatting: "§e", motd: "\\u00A7e" },
    { key: "WHITE", name: "White", formatting: "§f", motd: "\\u00A7f" },
] as const

export const MinecraftFormatting = {
    BLACK: "0",
    DARK_BLUE: "1",
    DARK_GREEN: "2",
    DARK_AQUA: "3",
    DARK_RED: "4",
    DARK_PURPLE: "5",
    GOLD: "6",
    GRAY: "7",
    DARK_GRAY: "8",
    BLUE: "9",
    GREEN: "a",
    AQUA: "b",
    RED: "c",
    LIGHT_PURPLE: "d",
    YELLOW: "e",
    WHITE: "f",

    BOLD: "l",
    ITALIC: "o",
    UNDERLINE: "n",
    STRIKETHROUGH: "m",
    OBFUSCATED: "k",
    RESET: "r",
} as const;