import type { MetadataRoute } from 'next'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'https://minecraftutils.com'
const APP_DIR = path.join(process.cwd(), 'app')

function getRoutes(dir: string, baseRoute = ''): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    let routes: string[] = []

    for (const entry of entries) {
        if (entry.name.startsWith('_')) continue
        if (entry.name.startsWith('(')) continue // route groups
        if (entry.name === 'api') continue

        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            routes = routes.concat(
                getRoutes(
                    fullPath,
                    `${baseRoute}/${entry.name}`
                )
            )
        }

        if (
            entry.isFile() &&
            entry.name === 'page.tsx'
        ) {
            routes.push(baseRoute || '/')
        }
    }

    return routes
}

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()
    const routes = getRoutes(APP_DIR)

    return routes.map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: now,
        priority: route === '/' ? 1 : 0.8,
    }))
}
