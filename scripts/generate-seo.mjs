import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const siteUrl = (process.env.VITE_SITE_URL || 'http://localhost:4173').replace(/\/+$/, '')
const routes = ['/', '/analysis', '/gas', '/trends', '/top', '/scan']
const outputDir = resolve(process.cwd(), 'public')

function toAbsoluteUrl(route) {
  const normalized = route === '/' ? '' : route.replace(/^\/+/, '')
  return new URL(normalized, `${siteUrl}/`).toString()
}

mkdirSync(outputDir, { recursive: true })

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${toAbsoluteUrl(route)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /
Disallow: /receipts
Disallow: /profile
Disallow: /transfer/

Sitemap: ${toAbsoluteUrl('/sitemap.xml')}
`

writeFileSync(resolve(outputDir, 'sitemap.xml'), sitemap)
writeFileSync(resolve(outputDir, 'robots.txt'), robots)
