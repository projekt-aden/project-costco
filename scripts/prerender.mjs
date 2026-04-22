import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const root = process.cwd()
const distDir = resolve(root, 'dist')

async function main() {
  const vite = await createServer({
    root,
    logLevel: 'error',
    server: { middlewareMode: true },
    appType: 'custom',
  })

  try {
    const [{ render }, { publicSeoRoutes }] = await Promise.all([
      vite.ssrLoadModule('/src/entry-server.tsx'),
      vite.ssrLoadModule('/src/seo/routes.ts'),
    ])

    const template = readFileSync(resolve(distDir, 'index.html'), 'utf8')
    const publicPaths = publicSeoRoutes.map((route) => route.canonicalPath)

    for (const route of publicPaths) {
      const { appHtml, headTags } = await render(route)
      const html = template
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
        .replace('</head>', `${headTags}\n</head>`)

      const outputFile =
        route === '/'
          ? resolve(distDir, 'index.html')
          : resolve(distDir, route.replace(/^\/+/, ''), 'index.html')

      mkdirSync(dirname(outputFile), { recursive: true })
      writeFileSync(outputFile, html)
    }

    const fallbackFile = resolve(distDir, '404.html')
    if (!existsSync(fallbackFile)) {
      cpSync(resolve(distDir, 'index.html'), fallbackFile)
    }
  } finally {
    await vite.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
