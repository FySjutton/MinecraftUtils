import React, {JSX} from "react";
import {IconImage} from "@/components/IconImage";
import {externals, tools} from "@/app/_structure/AppStructure";

export interface PageItem {
    name: string
    url: string
    icon?: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string
    description?: string
    external?: boolean
    type?: "beta" | "alpha"
    unlisted?: boolean
}

export interface ToolCategory {
    name: string
    icon: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string
    url: string
    defaultOpen?: boolean
    external?: boolean
    pages: PageItem[]
}

export const renderIcon = (icon: React.ReactNode | ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | string, size: number = 28) => {
    if (!icon) return null
    if (typeof icon === "string") return <IconImage name={icon} size={size} />
    if (React.isValidElement(icon)) return icon
    if (typeof icon === "function") return React.createElement(icon, { className: "size-4" })
    return null
}

export function getPage(categories: ToolCategory[], pageName: string): PageItem {
    for (const category of categories) {
        const page = category.pages.find(p => p.name === pageName)
        if (page) {
            return {
                ...page,
                url: `${category.url}/${page.url}`
            }
        }
    }
    throw new Error(`Page "${pageName}" not found in any category`)
}

interface PageWithCategory extends PageItem {
    categoryUrl: string
}

export function getCurrentPage(pathname: string) {
    const allPages: PageWithCategory[] = [
        ...tools.flatMap(t => t.pages.map(p => ({ ...p, categoryUrl: t.url }))),
        ...externals.flatMap(t => t.pages.map(p => ({ ...p, categoryUrl: t.url }))),
    ];

    const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    return allPages.find(
        p => `${p.categoryUrl.replace(/^\/+/, "")}/${p.url.replace(/^\/+/, "")}` === cleanPath
    );
}
