import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { App } from './app'
import { getSeoForPath } from './seo/routes'
import { SITE_NAME, toAbsoluteUrl } from './seo/site'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildHeadTags(pathname: string) {
  const seo = getSeoForPath(pathname)
  const canonicalUrl = toAbsoluteUrl(seo.canonicalPath)
  const pageUrl = toAbsoluteUrl(pathname)
  const imageUrl = toAbsoluteUrl(seo.imagePath || '/og-image.svg')

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: toAbsoluteUrl('/'),
      potentialAction: {
        '@type': 'SearchAction',
        target: `${toAbsoluteUrl('/analysis')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: toAbsoluteUrl('/'),
      description:
        'A web app for importing Costco receipts, tracking spending, and analyzing product price history.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': seo.schemaType || 'WebPage',
      name: seo.title,
      description: seo.description,
      url: pageUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: toAbsoluteUrl('/'),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: toAbsoluteUrl('/'),
        },
        ...(pathname === '/'
          ? []
          : [
              {
                '@type': 'ListItem',
                position: 2,
                name: seo.title.replace(` | ${SITE_NAME}`, ''),
                item: pageUrl,
              },
            ]),
      ],
    },
  ]

  return `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="robots" content="${escapeHtml(seo.robots)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    ${jsonLd
      .map(
        (item, index) =>
          `<script type="application/ld+json" data-seo="ssg-${index}">${JSON.stringify(item)}</script>`,
      )
      .join('\n')}
  `
}

export function render(url: string) {
  const appHtml = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )

  return {
    appHtml,
    headTags: buildHeadTags(url),
  }
}
