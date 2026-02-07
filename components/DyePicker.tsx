import {DyeColors} from "@/lib/Colors";
import ImageObj from "next/image";

export default function DyePicker({selected, onSelectAction, onHoverAction, onLeaveAction, colorList = DyeColors}: { selected: string[], onSelectAction: (hex: string) => void, onHoverAction?: (hex: string) => void, onLeaveAction?: () => void, colorList?: Record<string, string>}) {
    return (
        <div className="flex flex-wrap gap-2 justify-center">
            {Object.keys(colorList).map((colorKey) => {
                const hex = colorList[colorKey]
                return (
                    <button
                        key={hex}
                        className={`w-16 rounded-md border p-2 hover:ring-2 cursor-pointer ${selected.includes(hex) ? 'ring-2 ring-offset-1' : ''}`}
                        style={{backgroundColor: hex}}
                        onMouseEnter={() => onHoverAction?.(hex)}
                        onMouseLeave={() => onLeaveAction?.()}
                        onClick={() => onSelectAction(hex)}
                    >
                        <ImageObj
                            src={`/assets/dyes/${colorKey}.png`}
                            alt={colorKey}
                            width={16}
                            height={16}
                            className="w-full image-pixelated"
                        />
                    </button>
                )
            })}
        </div>
    )
}