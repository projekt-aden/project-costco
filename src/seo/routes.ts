import { matchPath } from 'react-router-dom'
import { DEFAULT_OG_IMAGE_PATH, SITE_NAME } from './site'

export interface SeoConfig {
  title: string
  description: string
  canonicalPath: string
  robots: string
  imagePath?: string
  schemaType?: 'WebPage' | 'CollectionPage' | 'ProfilePage' | 'SoftwareApplication'
}

interface RouteSeoDefinition extends SeoConfig {
  path: string
}

const routeSeo: RouteSeoDefinition[] = [
  {
    path: '/',
    title: `Costco Tracker Dashboard | ${SITE_NAME}`,
    description:
      'Track Costco receipts, monitor spending, and keep your purchase history organized in one place.',
    canonicalPath: '/',
    robots: 'index,follow',
    schemaType: 'SoftwareApplication',
  },
  {
    path: '/analysis',
    title: `Product Analysis | ${SITE_NAME}`,
    description:
      'Analyze Costco purchases by item number, total spend, purchase frequency, and historical unit prices.',
    canonicalPath: '/analysis',
    robots: 'index,follow',
    schemaType: 'CollectionPage',
  },
  {
    path: '/gas',
    title: `Costco Gas Tracking | ${SITE_NAME}`,
    description:
      'Review Costco gas purchases, compare fill-up prices over time, and spot trends in fuel spending.',
    canonicalPath: '/gas',
    robots: 'index,follow',
    schemaType: 'CollectionPage',
  },
  {
    path: '/trends',
    title: `Spending Trends | ${SITE_NAME}`,
    description:
      'Compare year-over-year Costco spending, inflation signals, and product price changes from your receipts.',
    canonicalPath: '/trends',
    robots: 'index,follow',
    schemaType: 'CollectionPage',
  },
  {
    path: '/top',
    title: `Top Costco Items | ${SITE_NAME}`,
    description:
      'See your most purchased Costco products, biggest spenders, price hikes, and recurring staples.',
    canonicalPath: '/top',
    robots: 'index,follow',
    schemaType: 'CollectionPage',
  },
  {
    path: '/scan',
    title: `Import Costco Receipts | ${SITE_NAME}`,
    description:
      'Import Costco receipts by barcode, bulk sync purchase history, and build a searchable receipt archive.',
    canonicalPath: '/scan',
    robots: 'index,follow',
    schemaType: 'WebPage',
  },
  {
    path: '/receipts',
    title: `Receipts | ${SITE_NAME}`,
    description:
      'Browse imported Costco receipts, totals, dates, and purchase timelines inside your private tracker.',
    canonicalPath: '/receipts',
    robots: 'noindex,nofollow',
    schemaType: 'CollectionPage',
  },
  {
    path: '/receipts/:id',
    title: `Receipt Details | ${SITE_NAME}`,
    description: 'Detailed Costco receipt line items and totals for your private purchase history.',
    canonicalPath: '/receipts',
    robots: 'noindex,nofollow',
    schemaType: 'WebPage',
  },
  {
    path: '/analysis/:itemNumber',
    title: `Product Details | ${SITE_NAME}`,
    description: 'Detailed purchase history and pricing for an item from your private Costco tracker.',
    canonicalPath: '/analysis',
    robots: 'noindex,nofollow',
    schemaType: 'WebPage',
  },
  {
    path: '/profile',
    title: `Profile | ${SITE_NAME}`,
    description: 'Export data, manage device transfer, and control settings for your private Costco tracker.',
    canonicalPath: '/profile',
    robots: 'noindex,nofollow',
    schemaType: 'ProfilePage',
  },
  {
    path: '/transfer/:peerId',
    title: `Secure Transfer | ${SITE_NAME}`,
    description: 'Receive a private Costco Tracker data transfer on this device.',
    canonicalPath: '/profile',
    robots: 'noindex,nofollow',
    schemaType: 'WebPage',
  },
]

const fallbackSeo: SeoConfig = {
  title: SITE_NAME,
  description:
    'Track Costco receipts, analyze spending, and monitor price changes across your warehouse purchases.',
  canonicalPath: '/',
  robots: 'noindex,nofollow',
  imagePath: DEFAULT_OG_IMAGE_PATH,
  schemaType: 'WebPage',
}

export const publicSeoRoutes = routeSeo.filter((route) => route.robots === 'index,follow')

export function getSeoForPath(pathname: string): SeoConfig {
  const match = routeSeo.find((route) =>
    matchPath({ path: route.path, end: true }, pathname),
  )

  if (!match) {
    return fallbackSeo
  }

  return {
    ...match,
    imagePath: match.imagePath || DEFAULT_OG_IMAGE_PATH,
  }
}
