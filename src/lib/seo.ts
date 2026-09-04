import toolMetadata from '../data/toolMetadata.json';

export interface RouteMetadata {
  name: string;
  title: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  category: string;
  features: string[];
  howToUse: string[];
  faqs: { question: string; answer: string }[];
}

const METADATA: Record<string, RouteMetadata> = toolMetadata as Record<string, RouteMetadata>;

export function getRouteMetadata(key: string): RouteMetadata {
  const normalizedKey = key.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
  return (
    METADATA[normalizedKey] ||
    METADATA[key] ||
    METADATA['home'] || {
      name: 'Codepackr',
      title: 'Codepackr - Free Online Developer Tools',
      description: 'Free online developer tools for formatting, validating, encoding, converting, and inspecting data locally in your browser.',
      canonicalPath: '/',
      canonicalUrl: 'https://www.codepackr.com/',
      category: 'general',
      features: [],
      howToUse: [],
      faqs: [],
    }
  );
}

/**
 * Updates all critical SEO tags and per-tool SoftwareApplication JSON-LD dynamically
 */
export function updateDocumentMetadata(routeKey: string): void {
  if (typeof document === 'undefined') return;

  const meta = getRouteMetadata(routeKey);

  // 1. Document Title
  document.title = meta.title;

  // 2. Canonical URL
  let canonicalEl = document.getElementById('canonical-url') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.querySelector('link[rel="canonical"]');
  }
  if (canonicalEl) {
    canonicalEl.href = meta.canonicalUrl;
  }

  // 3. Meta Description
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) {
    descEl.setAttribute('content', meta.description);
  }

  // 4. Open Graph Tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', meta.title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', meta.description);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', meta.canonicalUrl);

  // 5. Twitter Card Tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) twitterTitle.setAttribute('content', meta.title);

  const twitterDesc = document.querySelector('meta[name="twitter:description"]');
  if (twitterDesc) twitterDesc.setAttribute('content', meta.description);

  // 6. JSON-LD Structured Data: SoftwareApplication for tools
  let routeJsonLdEl = document.getElementById('route-jsonld') as HTMLScriptElement | null;
  if (!routeJsonLdEl) {
    routeJsonLdEl = document.createElement('script');
    routeJsonLdEl.id = 'route-jsonld';
    routeJsonLdEl.type = 'application/ld+json';
    document.head.appendChild(routeJsonLdEl);
  }

  if (routeKey !== 'home' && routeKey !== 'contact' && routeKey !== 'privacy') {
    const softwareAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: meta.name,
      description: meta.description,
      url: meta.canonicalUrl,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
    };
    routeJsonLdEl.textContent = JSON.stringify(softwareAppSchema, null, 2);
  } else {
    routeJsonLdEl.textContent = '';
  }
}
