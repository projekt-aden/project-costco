import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getSeoForPath } from '../../seo/routes'
import { SITE_NAME, toAbsoluteUrl } from '../../seo/site'

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let node = document.head.querySelector<HTMLMetaElement>(selector)

  if (!node) {
    node = document.createElement('meta')
    document.head.appendChild(node)
  }

  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value)
  }
}

function upsertLink(rel: string, href: string) {
  let node = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!node) {
    node = document.createElement('link')
    node.setAttribute('rel', rel)
    document.head.appendChild(node)
  }

  node.setAttribute('href', href)
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let node = document.head.querySelector<HTMLScriptElement>(`script[data-seo="${id}"]`)

  if (!node) {
    node = document.createElement('script')
    node.type = 'application/ld+json'
    node.dataset.seo = id
    document.head.appendChild(node)
  }

  node.textContent = JSON.stringify(data)
}

export function RouteSeo() {
  const location = useLocation()

  useEffect(() => {
    const seo = getSeoForPath(location.pathname)
    const canonicalUrl = toAbsoluteUrl(seo.canonicalPath)
    const pageUrl = toAbsoluteUrl(location.pathname)
    const imageUrl = toAbsoluteUrl(seo.imagePath || '/og-image.svg')

    document.title = seo.title

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: seo.description,
    })
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: seo.robots,
    })
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: 'website',
    })
    upsertMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: SITE_NAME,
    })
    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: seo.title,
    })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: seo.description,
    })
    upsertMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: pageUrl,
    })
    upsertMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: imageUrl,
    })
    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image',
    })
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: seo.title,
    })
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: seo.description,
    })
    upsertMeta('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: imageUrl,
    })
    upsertLink('canonical', canonicalUrl)

    upsertJsonLd('website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: toAbsoluteUrl('/'),
      potentialAction: {
        '@type': 'SearchAction',
        target: `${toAbsoluteUrl('/analysis')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    })

    upsertJsonLd('application', {
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
    })

    upsertJsonLd('page', {
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
    })

    upsertJsonLd('breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: toAbsoluteUrl('/'),
        },
        ...(location.pathname === '/'
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
    })
  }, [location.pathname])

  return null
}
