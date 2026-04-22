export const SITE_NAME = 'Costco Tracker'
export const DEFAULT_SITE_URL = 'http://localhost:4173'
export const DEFAULT_OG_IMAGE_PATH = '/og-image.svg'

function getSiteUrlObject() {
  const configured = import.meta.env.VITE_SITE_URL?.trim()
  const current =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : DEFAULT_SITE_URL
  const base = configured || current

  return new URL(base)
}

export function getSiteUrl() {
  const url = getSiteUrlObject()
  const pathname = url.pathname.replace(/\/+$/, '')
  return `${url.origin}${pathname === '' ? '' : pathname}`
}

export function getBasePath() {
  const envBase = import.meta.env.BASE_URL || '/'
  if (envBase === '/') return '/'
  return envBase.endsWith('/') ? envBase : `${envBase}/`
}

export function withBasePath(path: string) {
  const cleanPath = path === '/' ? '' : path.replace(/^\/+/, '')
  const base = getBasePath()

  if (!cleanPath) {
    return base
  }

  if (base === '/') {
    return `/${cleanPath}`
  }

  return `${base}${cleanPath}`
}

export function toAbsoluteUrl(path: string) {
  const site = getSiteUrlObject()
  return new URL(withBasePath(path).replace(/^\/+/, ''), `${site.origin}/`).toString()
}
