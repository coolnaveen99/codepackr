import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CronExpressionParser } from 'cron-parser'
import { dump as dumpYaml, load as loadYaml } from 'js-yaml'
import JSZip from 'jszip'
import QRCode from 'qrcode'
import toolContent from './tool-content.json'
import './App.css'

type ToolId =
  | 'json-formatter'
  | 'json-minifier'
  | 'html-formatter'
  | 'css-formatter'
  | 'sql-formatter'
  | 'xml-formatter'
  | 'yaml-formatter'
  | 'js-minifier'
  | 'base64'
  | 'url-encode'
  | 'html-entity'
  | 'hash-generator'
  | 'crc32-checksum-generator'
  | 'hmac-generator'
  | 'jwt-decoder'
  | 'jwt-encoder'
  | 'base64-image'
  | 'diff-checker'
  | 'regex-tester'
  | 'json-validator'
  | 'json-path-tester'
  | 'xsd-validator'
  | 'csv-viewer'
  | 'json-xml-converter'
  | 'json-csv-converter'
  | 'csv-xml-converter'
  | 'case-converter'
  | 'yaml-json-converter'
  | 'number-base-converter'
  | 'markdown-html-converter'
  | 'html-markdown-converter'
  | 'curl-code-converter'
  | 'image-resizer'
  | 'favicon-generator'
  | 'slugify'
  | 'http-status-codes'
  | 'json-structural-diff'
  | 'mock-json-generator'
  | 'dotenv-formatter'
  | 'edi-x12-formatter'
  | 'edi-segment-viewer'
  | 'edi-json-converter'
  | 'uuid-generator'
  | 'qr-generator'
  | 'password-generator'
  | 'lorem-ipsum'
  | 'text-tools'
  | 'word-counter'
  | 'character-counter'
  | 'line-counter'
  | 'sentence-counter'
  | 'remove-duplicate-lines'
  | 'remove-empty-lines'
  | 'remove-extra-spaces'
  | 'sort-lines-alphabetically'
  | 'reverse-line-order'
  | 'what-is-my-screen-resolution'
  | 'what-is-my-user-agent'
  | 'markdown'
  | 'color-converter'
  | 'timestamp'
  | 'cron-expression'
  | 'calculator'
  | 'percentage-calculator'
  | 'tip-calculator'
  | 'sip-calculator'
  | 'loan-calculator'
  | 'contact'

type Tool = { id: ToolId; name: string; description: string; icon: string; category: string }
type ToolContent = { steps: string[]; faq: [string, string][] }
type DiffLine = { type: 'common' | 'added' | 'removed'; value: string }
type DiffPrecision = 'word' | 'char'
type DiffSegment = { value: string; changed: boolean }
type DiffSide = { num: number | null; value: string; type: 'common' | 'added' | 'removed' | 'empty'; segments?: DiffSegment[] }
type DiffRow =
  | { kind: 'row'; left: DiffSide; right: DiffSide; changed: boolean }
  | { kind: 'gap'; count: number }
type Status = { tone: 'ok' | 'warn' | 'info'; text: string }

const categories = [
  {
    name: 'Formatters',
    tools: [
      { id: 'json-formatter', name: 'JSON Formatter', description: 'Beautify, minify, and validate JSON', icon: '{ }' },
      { id: 'json-minifier', name: 'JSON Minifier', description: 'Minify JSON and validate its syntax', icon: '{-}' },
      { id: 'html-formatter', name: 'HTML Formatter', description: 'Beautify and minify HTML markup', icon: '</>' },
      { id: 'css-formatter', name: 'CSS Formatter', description: 'Prettify and compress stylesheets', icon: '#' },
      { id: 'sql-formatter', name: 'SQL Formatter', description: 'Format SQL queries for readability', icon: 'SQL' },
      { id: 'xml-formatter', name: 'XML Formatter', description: 'Indent and prettify XML documents', icon: '<x>' },
      { id: 'yaml-formatter', name: 'YAML Formatter', description: 'Format and validate YAML-style documents', icon: 'YML' },
      { id: 'js-minifier', name: 'JS Minifier', description: 'Compress JavaScript for production', icon: 'JS' },
    ],
  },
  {
    name: 'Encoders',
    tools: [
      { id: 'base64', name: 'Base64 Encoder', description: 'Encode and decode Base64 strings', icon: 'B64' },
      { id: 'url-encode', name: 'URL Encoder', description: 'Encode and decode URL components', icon: 'URL' },
      { id: 'html-entity', name: 'HTML Entity Encoder', description: 'Encode and decode HTML entities', icon: '&lt;' },
      { id: 'hash-generator', name: 'Hash Generator', description: 'Generate SHA hashes in the browser', icon: '#!' },
      { id: 'crc32-checksum-generator', name: 'CRC32 Checksum Generator', description: 'Calculate a CRC32 checksum for text or a file', icon: 'CRC' },
      { id: 'hmac-generator', name: 'HMAC Generator', description: 'Create keyed HMAC signatures locally', icon: 'HMAC' },
      { id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens', icon: 'JWT' },
      { id: 'jwt-encoder', name: 'JWT Encoder', description: 'Build and sign HS256 JSON Web Tokens', icon: 'JWT+' },
      { id: 'base64-image', name: 'Base64 Image', description: 'Encode images as Base64 or decode data URLs', icon: 'IMG' },
    ],
  },
  {
    name: 'Calculators',
    tools: [
      { id: 'calculator', name: 'Calculator', description: 'Scientific calculator for quick math', icon: 'CAL' },
      { id: 'percentage-calculator', name: 'Percentage Calculator', description: 'Calculate percentages, increases, and decreases', icon: '%' },
      { id: 'tip-calculator', name: 'Tip Calculator', description: 'Calculate tips and split a bill', icon: 'TIP' },
      { id: 'sip-calculator', name: 'SIP Calculator', description: 'Estimate returns from monthly investments', icon: 'SIP' },
      { id: 'loan-calculator', name: 'Loan Calculator', description: 'Calculate loan EMI, interest, and repayment', icon: 'EMI' },
    ],
  },
  {
    name: 'Validators',
    tools: [
      { id: 'diff-checker', name: 'Diff Checker', description: 'Compare text and code side by side', icon: '!=' },
      { id: 'regex-tester', name: 'Regex Tester', description: 'Test and debug regular expressions', icon: '.*' },
      { id: 'json-validator', name: 'JSON Validator', description: 'Validate JSON and show parse errors', icon: 'OK' },
      { id: 'json-path-tester', name: 'JSON Path Tester', description: 'Query JSON with simple JSONPath expressions', icon: '$.' },
      { id: 'xsd-validator', name: 'XSD Validator', description: 'Check XML syntax and schema root hints', icon: 'XSD' },
      { id: 'csv-viewer', name: 'CSV Viewer', description: 'View and format CSV as a table', icon: 'CSV' },
      { id: 'json-structural-diff', name: 'Structural JSON Diff', description: 'Compare JSON by keys and values', icon: 'J!=' },
      { id: 'dotenv-formatter', name: 'dotenv Formatter', description: 'Format and validate .env files', icon: 'ENV' },
    ],
  },
  {
    name: 'Converters',
    tools: [
      { id: 'json-xml-converter', name: 'JSON to XML / XML to JSON', description: 'Convert JSON to XML or XML to JSON', icon: 'JX' },
      { id: 'json-csv-converter', name: 'JSON to CSV / CSV to JSON', description: 'Convert JSON to CSV or CSV to JSON', icon: 'JC' },
      { id: 'csv-xml-converter', name: 'CSV to XML / XML to CSV', description: 'Convert CSV to XML or XML to CSV', icon: 'CX' },
      { id: 'case-converter', name: 'Case Converter', description: 'Convert text between common naming conventions', icon: 'Aa' },
      { id: 'yaml-json-converter', name: 'YAML to JSON Converter', description: 'Convert YAML and JSON in either direction', icon: 'YJ' },
      { id: 'number-base-converter', name: 'Number Base Converter', description: 'Convert binary, octal, decimal, and hexadecimal', icon: '01' },
      { id: 'markdown-html-converter', name: 'Markdown to HTML', description: 'Convert Markdown into raw HTML', icon: 'M>H' },
      { id: 'html-markdown-converter', name: 'HTML to Markdown', description: 'Convert HTML markup into Markdown', icon: 'H>M' },
      { id: 'curl-code-converter', name: 'cURL to Code', description: 'Convert cURL commands to fetch, Axios, or Python', icon: 'cURL' },
      { id: 'image-resizer', name: 'Image Resizer', description: 'Resize and compress images in your browser', icon: 'RSZ' },
      { id: 'favicon-generator', name: 'Favicon Generator', description: 'Generate ICO and common PNG favicon sizes', icon: 'ICO' },
    ],
  },
  {
    name: 'EDI Tools',
    tools: [
      { id: 'edi-x12-formatter', name: 'EDI X12 Formatter', description: 'Format X12 EDI into readable segments', icon: 'X12' },
      { id: 'edi-segment-viewer', name: 'EDI Segment Viewer', description: 'Inspect EDI segments and elements in a table', icon: 'SEG' },
      { id: 'edi-json-converter', name: 'EDI to JSON Converter', description: 'Convert EDI X12 segments into JSON', icon: 'EJ' },
    ],
  },
  {
    name: 'Utilities',
    tools: [
      { id: 'uuid-generator', name: 'UUID Generator', description: 'Generate one or many UUIDs', icon: 'ID' },
      { id: 'qr-generator', name: 'QR Code Generator', description: 'Generate downloadable QR codes', icon: 'QR' },
      { id: 'password-generator', name: 'Password Generator', description: 'Create strong random passwords', icon: 'PW' },
      { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate placeholder text', icon: 'Aa' },
      { id: 'text-tools', name: 'Text Tools', description: 'Count, transform, sort, and clean text', icon: 'Tx' },
      { id: 'what-is-my-screen-resolution', name: 'What Is My Screen Resolution', description: 'See your current screen resolution', icon: 'SCR' },
      { id: 'what-is-my-user-agent', name: 'What Is My User Agent', description: 'See your browser user agent string', icon: 'UA' },
      { id: 'markdown', name: 'Markdown Preview', description: 'Live markdown editor and preview', icon: 'MD' },
      { id: 'color-converter', name: 'Color Converter', description: 'Convert HEX, RGB, and HSL colors', icon: 'RGB' },
      { id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps and dates', icon: 'TS' },
      { id: 'cron-expression', name: 'Cron Expression', description: 'Build and explain cron schedules', icon: 'CR' },
      { id: 'slugify', name: 'Slugify Tool', description: 'Turn text into a clean URL-safe slug', icon: '/-' },
      { id: 'http-status-codes', name: 'HTTP Status Code Lookup', description: 'Search HTTP codes, names, and descriptions', icon: 'HTTP' },
      { id: 'mock-json-generator', name: 'Mock JSON Generator', description: 'Generate fake records from a simple schema', icon: 'FAKE' },
    ],
  },
] satisfies { name: string; tools: Omit<Tool, 'category'>[] }[]

const contactTool: Tool = { id: 'contact', name: 'Contact', description: 'Contact form and project details', icon: '@', category: 'Contact' }

const tools: Tool[] = categories.flatMap((category) =>
  category.tools.map((tool) => ({ ...tool, category: category.name })),
)

const routeTools = [...tools, contactTool]
const textOperationRoutes: Tool[] = [
  { id: 'word-counter', name: 'Word Counter', description: 'Count words, characters, and sentences in text', icon: 'W', category: 'Text Tools' },
  { id: 'character-counter', name: 'Character Counter', description: 'Count characters in text online', icon: 'C', category: 'Text Tools' },
  { id: 'line-counter', name: 'Line Counter', description: 'Count lines in text online', icon: 'L', category: 'Text Tools' },
  { id: 'sentence-counter', name: 'Sentence Counter', description: 'Count sentences in text online', icon: 'S', category: 'Text Tools' },
  { id: 'remove-duplicate-lines', name: 'Remove Duplicate Lines', description: 'Remove duplicate lines from text', icon: 'D', category: 'Text Tools' },
  { id: 'remove-empty-lines', name: 'Remove Empty Lines', description: 'Remove blank lines from text', icon: 'E', category: 'Text Tools' },
  { id: 'remove-extra-spaces', name: 'Remove Extra Spaces', description: 'Collapse extra spaces and tabs in text', icon: 'SP', category: 'Text Tools' },
  { id: 'sort-lines-alphabetically', name: 'Sort Lines Alphabetically', description: 'Sort text lines alphabetically', icon: 'AZ', category: 'Text Tools' },
  { id: 'reverse-line-order', name: 'Reverse Line Order', description: 'Reverse the order of text lines', icon: 'REV', category: 'Text Tools' },
]
routeTools.push(...textOperationRoutes)
const siteUrl = 'https://www.codepackr.com'

const sampleJson = '{\n  "name": "Codepackr",\n  "tools": ["json", "diff", "base64"]\n}'

function getToolIdFromLocation(): ToolId | null {
  const hashTool = routeTools.find((tool) => tool.id === window.location.hash.slice(1))
  if (hashTool) return hashTool.id

  const path = window.location.pathname.replace(/^\//, '').replace(/\.html$/, '')
  const pathTool = routeTools.find((tool) => tool.id === path)
  return pathTool?.id ?? null
}

function getToolPath(toolId: ToolId) {
  return `/${toolId}.html`
}

// Lets the browser handle new-tab/middle clicks while keeping SPA routing for plain clicks.
function isPlainClick(event: React.MouseEvent) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function buildSeoKeywords(tool: Tool | null) {
  const baseKeywords = [
    'codepackr', 'free online developer tools', 'developer tools online', 'browser based tools', 'client side tools', 'no upload tools',
    'json formatter', 'json validator', 'json minifier', 'base64 encoder', 'url encoder', 'html formatter', 'css formatter', 'sql formatter',
    'xml formatter', 'yaml formatter', 'diff checker', 'regex tester', 'jwt decoder', 'jwt encoder', 'hash generator', 'hmac generator',
    'crc32 checksum', 'text tools', 'word counter', 'character counter', 'line counter', 'sentence counter', 'qr code generator',
    'password generator', 'timestamp converter', 'cron expression tool', 'percentage calculator', 'tip calculator', 'sip calculator', 'loan calculator',
  ]
  if (!tool) return baseKeywords.join(', ')

  const name = tool.name.toLowerCase()
  const category = tool.category.toLowerCase()
  const slug = tool.id.replace(/-/g, ' ')
  const words = `${tool.name} ${tool.description}`.toLowerCase().match(/[a-z0-9]+/g) ?? []
  const keywords = [
    name, slug, `${name} online`, `free ${name}`, `free ${name} online`, `${name} tool`, `${name} free`, `${name} browser`,
    `${name} no upload`, `${name} client side`, `${category} tools`, 'online developer tools', 'free developer tools', 'browser developer tools',
    'codepackr tools', 'web developer tools', 'frontend tools', 'backend tools', 'data tools', ...words,
  ]
  return Array.from(new Set(keywords)).slice(0, 40).join(', ')
}

function updateSeo(tool: Tool | null) {
  const title = tool ? `Free ${tool.name} Online | Codepackr` : 'Codepackr - Free Online Developer Tools'
  const description = tool
    ? `${tool.description}. Free online ${tool.name.toLowerCase()} from Codepackr. Runs locally in your browser.`
    : 'Free online developer tools for formatting, validating, encoding, converting, and inspecting data locally in your browser.'
  const canonical = `${siteUrl}${tool ? getToolPath(tool.id) : '/'}`
  const keywords = buildSeoKeywords(tool)

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('name', 'keywords', keywords)
  upsertMeta('name', 'robots', 'index, follow')
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', 'Codepackr')
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('name', 'twitter:card', 'summary')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertCanonical(canonical)
  upsertJsonLd({
    '@context': 'https://schema.org',
    '@type': tool ? 'WebApplication' : 'WebSite',
    name: tool ? tool.name : 'Codepackr',
    url: canonical,
    description,
    applicationCategory: tool ? 'DeveloperApplication' : undefined,
    operatingSystem: tool ? 'Web' : undefined,
    offers: tool ? { '@type': 'Offer', price: '0', priceCurrency: 'USD' } : undefined,
  })
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

function upsertJsonLd(data: Record<string, unknown>) {
  let element = document.head.querySelector<HTMLScriptElement>('script[data-codepackr-seo="jsonld"]')
  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.dataset.codepackrSeo = 'jsonld'
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)))
}

function App() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(() => getToolIdFromLocation())
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem('codepackr-theme')
    return savedTheme ? savedTheme === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })
  const [recentToolIds, setRecentToolIds] = useState<ToolId[]>(() => {
    try { return JSON.parse(localStorage.getItem('codepackr-recent') ?? '[]') }
    catch { return [] }
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const currentTool = activeTool ? routeTools.find((tool) => tool.id === activeTool) ?? null : null
  const filteredTools = tools.filter((tool) =>
    `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query.toLowerCase()),
  )

  useLayoutEffect(() => {
    document.getElementById('root')?.removeAttribute('data-codepackr-prerendered')
  }, [])

  useEffect(() => {
    const handleNavigation = () => setActiveTool(getToolIdFromLocation())
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  useEffect(() => {
    updateSeo(currentTool)
  }, [currentTool])

  useEffect(() => {
    if (!currentTool || currentTool.id === 'contact') return
    setRecentToolIds((current) => {
      const next = [currentTool.id, ...current.filter((id) => id !== currentTool.id)].slice(0, 8)
      localStorage.setItem('codepackr-recent', JSON.stringify(next))
      return next
    })
  }, [currentTool])

  useEffect(() => {
    localStorage.setItem('codepackr-theme', dark ? 'dark' : 'light')
  }, [dark])

  const selectHome = () => {
    setActiveTool(null)
    setMenuOpen(false)
    window.history.pushState(null, '', '/')
  }

  const selectTool = (toolId: ToolId) => {
    setActiveTool(toolId)
    setMenuOpen(false)
    window.history.pushState(null, '', getToolPath(toolId))
  }

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (activeTool) selectHome()
        requestAnimationFrame(() => searchRef.current?.focus())
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        document.querySelector<HTMLButtonElement>('.tool-shell .primary:not(:disabled)')?.click()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  })

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="site-header">
        <div className="header-inner">
          <a className="logo" href="/" onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); selectHome() }}>
            <span className="logo-mark">{'{ }'}</span>
            <span className="logo-text">Code</span>
            <span className="logo-pack">packr</span>
          </a>
          <nav className="main-nav" aria-label="Tool categories">
            {categories.map((category) => (
              <div className="nav-item" key={category.name}>
                <button type="button">{category.name} <span className="nav-arrow">v</span></button>
                <div className="nav-dropdown">
                  {category.tools.map((tool) => (
                    <a
                      className={activeTool === tool.id ? 'active' : ''}
                      href={getToolPath(tool.id)}
                      key={tool.id}
                      onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); selectTool(tool.id) }}
                    >
                      <span className="dd-icon">{tool.icon}</span>{tool.name}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="header-actions">
            <div className="search-wrap">
              <input
                aria-label="Search tools"
                className="search"
                ref={searchRef}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools..."
                value={query}
              />
            </div>
            <button className="theme-button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
              {dark ? 'Light' : 'Dark'}
            </button>
            <a className={activeTool === 'contact' ? 'contact-button active' : 'contact-button'} href={getToolPath('contact')} onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); selectTool('contact') }}>Contact</a>
            <button className={menuOpen ? 'hamburger open' : 'hamburger'} onClick={() => setMenuOpen((value) => !value)} aria-label="Open menu" type="button">
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <div className={menuOpen ? 'mobile-menu open' : 'mobile-menu'}>
        {categories.map((category) => (
          <div key={category.name}>
            <div className="mobile-section">{category.name}</div>
            {category.tools.map((tool) => (
              <a
                className={activeTool === tool.id ? 'active' : ''}
                href={getToolPath(tool.id)}
                key={tool.id}
                onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); selectTool(tool.id) }}
              >
                {tool.name}
              </a>
            ))}
          </div>
        ))}
        <a className={activeTool === 'contact' ? 'active' : ''} href={getToolPath('contact')} onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); selectTool('contact') }}>Contact</a>
      </div>

      <main id="top" className="page">
        {!currentTool ? <HomePage filteredTools={filteredTools} onSelectTool={selectTool} query={query} recentToolIds={recentToolIds} /> : currentTool.id === 'contact' ? <ContactPage /> : <>
        <section className="hero">
          <div>
            <div className="tool-page-bar">
              <div className="breadcrumb">Home / {currentTool.category} / {currentTool.name}</div>
            </div>
            <h1>{currentTool.name}</h1>
            <p className="intro">{currentTool.description}. All processing runs locally in your browser.</p>
          </div>
          <div className="hero-summary"><ToolPageActions /><div className="hero-count"><strong>{tools.length}<i aria-hidden="true" className="count-light" /></strong><span>tools available</span></div></div>
        </section>

        <section className="layout">
          <aside className="tool-rail" aria-label="Tools">
            {categories.map((category) => {
              const visibleTools = category.tools.filter((tool) => filteredTools.some((match) => match.id === tool.id))
              if (!visibleTools.length) return null
              return (
                <details className="tool-group" id={category.name.toLowerCase()} key={category.name} open={category.tools.some((tool) => tool.id === activeTool) || Boolean(query)}>
                  <summary>{category.name}<span>{visibleTools.length}</span></summary>
                  <div className="tool-menu-items">
                    {visibleTools.map((tool) => (
                    <a
                      className={activeTool === tool.id ? 'tool-link active' : 'tool-link'}
                      href={getToolPath(tool.id)}
                      key={tool.id}
                      onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); selectTool(tool.id) }}
                    >
                      <span>{tool.icon}</span>
                      <div><strong>{tool.name}</strong><small>{tool.description}</small></div>
                    </a>
                    ))}
                  </div>
                </details>
              )
            })}
          </aside>

          <section className="tool-shell">
            <ToolRenderer tool={currentTool} />
            <ToolInfo tool={currentTool} onSelectTool={selectTool} />
          </section>
        </section>
        </>}
      </main>

      <footer><span>Copyright 2026 Codepackr</span><span>Fast tools, clean code. Developed by TNK.</span><a href="/sitemap.xml">Sitemap</a></footer>
    </div>
  )
}

function ContactPage() {
  return (
    <section className="contact-page">
      <div className="breadcrumb">Home / Contact</div>
      <h1>Contact Us</h1>
      <p className="intro">Have a suggestion, found a bug, or want to request a new tool? We would love to hear from you.</p>
      <div className="contact-reasons" aria-label="Contact topics">
        <div className="reason-card"><span>FX</span><strong>Report a Bug</strong><p>Something not working? Let us know.</p></div>
        <div className="reason-card"><span>IDEA</span><strong>Suggest a Tool</strong><p>Want a new tool added? Tell us.</p></div>
        <div className="reason-card"><span>LOVE</span><strong>General Feedback</strong><p>Any thoughts or improvements.</p></div>
      </div>
      <ContactTool />
    </section>
  )
}

function HomePage({ filteredTools, onSelectTool, query, recentToolIds }: { filteredTools: Tool[]; onSelectTool: (toolId: ToolId) => void; query: string; recentToolIds: ToolId[] }) {
  const recentTools = recentToolIds.flatMap((id) => tools.find((tool) => tool.id === id) ?? [])
  return (
    <>
      <section className="home-hero">
        <div>
          <div className="breadcrumb">Home / Developer Tools</div>
          <h1>Codepackr</h1>
          <p className="intro">Everything a developer needs, packed in one place. Format, validate, encode, convert, and inspect data locally in your browser.</p>
        </div>
        <div className="hero-count"><strong>{tools.length}<i aria-hidden="true" className="count-light" /></strong><span>tools available</span></div>
      </section>

      <section className="index-menu" aria-label="Tool index">
        {!query && recentTools.length > 0 && <section className="index-section recent-tools"><div className="section-heading"><h2>Recently used</h2><span>{recentTools.length} tools</span></div><div className="recent-row">{recentTools.map((tool) => <a href={getToolPath(tool.id)} key={tool.id} onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onSelectTool(tool.id) }}><span>{tool.icon}</span>{tool.name}</a>)}</div></section>}
        {categories.map((category) => {
          const visibleTools = category.tools.filter((tool) => filteredTools.some((match) => match.id === tool.id))
          if (!visibleTools.length) return null
          return (
            <section className="index-section" id={category.name.toLowerCase()} key={category.name}>
              <div className="section-heading">
                <h2>{category.name}</h2>
                <span>{visibleTools.length} tools</span>
              </div>
              <div className="index-grid">
                {visibleTools.map((tool) => (
                  <a
                    className="index-card"
                    href={getToolPath(tool.id)}
                    key={tool.id}
                    onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onSelectTool(tool.id) }}
                  >
                    <span className="index-icon">{tool.icon}</span>
                    <div>
                      <h3>{tool.name}</h3>
                      <p>{tool.description}</p>
                    </div>
                    <span className="index-arrow">-&gt;</span>
                  </a>
                ))}
              </div>
            </section>
          )
        })}
        {query && !filteredTools.length && <div className="empty">No tools matched your search.</div>}
      </section>
    </>
  )
}

function ToolInfo({ tool, onSelectTool }: { tool: Tool; onSelectTool: (toolId: ToolId) => void }) {
  const related = tools.filter((candidate) => candidate.id !== tool.id && candidate.category === tool.category).slice(0, 4)
  const content = (toolContent[tool.id as keyof typeof toolContent] as ToolContent | undefined) ?? getDefaultToolContent(tool)
  const isTextOperation = textOperationRoutes.some((candidate) => candidate.id === tool.id)
  return <section className="tool-info"><div className="info-heading"><h2>How to use {tool.name}</h2><button onClick={() => copyToClipboard(window.location.href)}>Copy page link</button></div><ol>{content.steps.map((step) => <li key={step}>{step}</li>)}</ol><h2>Frequently asked questions</h2>{content.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}{isTextOperation && <p><a className="tool-inline-link" href={getToolPath('text-tools')}>Open all Text Tools</a></p>}{related.length > 0 && <><h2>Related tools</h2><div className="related-tools">{related.map((candidate) => <a href={getToolPath(candidate.id)} key={candidate.id} onClick={(event) => { if (!isPlainClick(event)) return; event.preventDefault(); onSelectTool(candidate.id) }}>{candidate.name}<span>-&gt;</span></a>)}</div></>}</section>
}

function getDefaultToolContent(tool: Tool): ToolContent {
  return {
    steps: [`Enter or select the data for ${tool.name}.`, 'Adjust the available options if needed.', 'Review the result and copy it for use in your project.'],
    faq: [['Does this tool upload my data?', 'No. All processing runs locally in your browser, and Codepackr does not upload your input.'], ['Can I use this tool for free?', 'Yes. This tool is free to use without an account or installation.']],
  }
}

function Icon({ name }: { name: 'share' | 'x' | 'facebook' | 'linkedin' | 'reddit' | 'whatsapp' | 'telegram' | 'email' | 'close' }) {
  const paths = {
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></>,
    x: <path d="M5 4h4.1l3.5 4.7L16.7 4H19l-5.3 6.1L19.4 20h-4.1l-3.9-5.3L6.8 20H4.5l5.8-6.7L5 4Z" />,
    facebook: <path d="M13.5 20v-7h2.4l.4-2.8h-2.8V8.4c0-.8.2-1.4 1.4-1.4h1.5V4.5c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7v2.1H8v2.8h2.6v7h2.9Z" />,
    linkedin: <><path d="M6.2 8.6H3.4V20h2.8V8.6ZM4.8 4A1.7 1.7 0 1 0 4.8 7.4 1.7 1.7 0 0 0 4.8 4Z" /><path d="M10.1 8.6V20h2.8v-5.6c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3V20h2.8v-6.1c0-3-1.6-4.4-3.7-4.4-1.7 0-2.5.9-2.9 1.6V8.6h-2.9Z" /></>,
    reddit: <><circle cx="12" cy="13" r="6.5" /><circle cx="9.5" cy="12.2" r=".9" fill="currentColor" /><circle cx="14.5" cy="12.2" r=".9" fill="currentColor" /><path d="M9.2 15.1c1.7 1.3 3.9 1.3 5.6 0M14 7l.8-3 2.3.6" /></>,
    whatsapp: <><path d="M19.1 4.9A9 9 0 0 0 4.8 15.7L4 20l4.4-1.1A9 9 0 1 0 19.1 4.9Z" /><path d="M8.5 8.2c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.3.1.5-.1.7l-.5.6c.5 1 1.3 1.8 2.3 2.3l.6-.5c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.2.6-.5.7-.5.2-1.1.3-1.7.1-2.6-.8-4.7-2.9-5.5-5.5-.2-.6-.1-1.2.1-1.7Z" /></>,
    telegram: <path d="m21 4-3.1 15.1c-.2 1.1-.9 1.4-1.8.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.3L5.4 12.8.5 11.3c-1.1-.3-1.1-1.1.2-1.6L19.8 2.3C20.7 2 21.2 2.4 21 4Z" />,
    email: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 7 8 6 8-6" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function ToolPageActions() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const canonicalUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || window.location.href
  const title = document.title

  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
      if (event.key === 'Tab') {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>('.share-modal button, .share-modal input, .share-modal a')).filter((element) => !element.hasAttribute('disabled'))
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!first || !last) return
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); triggerRef.current?.focus() }
  }, [isOpen])

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl)
    } catch {
      const input = document.querySelector<HTMLInputElement>('#share-page-url')
      input?.select()
      document.execCommand('copy')
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const encodedUrl = encodeURIComponent(canonicalUrl)
  const encodedTitle = encodeURIComponent(title)
  const shareLinks = [
    ['X', 'x', `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`],
    ['Facebook', 'facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`],
    ['LinkedIn', 'linkedin', `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`],
    ['Reddit', 'reddit', `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`],
    ['WhatsApp', 'whatsapp', `https://api.whatsapp.com/send?text=${encodedTitle}%3A%20${encodedUrl}`],
    ['Telegram', 'telegram', `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`],
    ['Email', 'email', `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Check out this tool: ${canonicalUrl}`)}`],
  ] as const

  return <>
    <div className="tool-page-actions" aria-label="Tool page actions">
      <button className="tool-share-button" type="button" onClick={() => setIsOpen(true)} ref={triggerRef}><Icon name="share" />Share</button>
    </div>
    {isOpen && <div className="share-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false) }}>
      <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
        <div className="share-modal-heading"><h2 id="share-modal-title">Share this tool</h2><button className="tool-action-icon" type="button" onClick={() => setIsOpen(false)} ref={closeRef} aria-label="Close share dialog"><Icon name="close" /></button></div>
        <div className="share-copy-row"><input id="share-page-url" readOnly value={canonicalUrl} aria-label="Page URL" /><button className="primary" type="button" onClick={copyUrl}>{copied ? 'Copied!' : 'Copy'}</button></div>
        <div className="share-links" aria-label="Share on social media">{shareLinks.map(([label, icon, href]) => <a href={href} key={label} target="_blank" rel="noopener" aria-label={`Share on ${label}`}><Icon name={icon} /><span>{label}</span></a>)}</div>
      </section>
    </div>}
  </>
}

function ToolRenderer({ tool }: { tool: Tool }) {
  switch (tool.id) {
    case 'json-formatter':
      return <JsonFormatter />
    case 'json-minifier':
      return <JsonMinifier />
    case 'html-formatter':
      return <FormatTool title="HTML Formatter" sample="<main><h1>Hello</h1><p>World</p></main>" format={formatMarkup} minify={minifyMarkup} />
    case 'css-formatter':
      return <FormatTool title="CSS Formatter" sample="body{margin:0;color:#172033}.card{padding:16px}" format={formatCss} minify={minifyCss} />
    case 'sql-formatter':
      return <FormatTool title="SQL Formatter" sample="select id,name from users where active=1 order by name" format={formatSql} />
    case 'xml-formatter':
      return <FormatTool title="XML Formatter" sample={'<root><item id="1">Codepackr</item></root>'} format={formatMarkup} minify={minifyMarkup} />
    case 'yaml-formatter':
      return <YamlTool />
    case 'js-minifier':
      return <FormatTool title="JavaScript Minifier" sample="function hello(name) {\n  console.log('Hello ' + name)\n}" format={(value) => value} minify={minifyJs} primaryLabel="Minify JS" />
    case 'base64':
      return <Base64Tool />
    case 'url-encode':
      return <UrlTool />
    case 'html-entity':
      return <HtmlEntityTool />
    case 'hash-generator':
      return <HashTool />
    case 'crc32-checksum-generator':
      return <Crc32Tool />
    case 'hmac-generator':
      return <HmacTool />
    case 'jwt-decoder':
      return <JwtTool />
    case 'jwt-encoder':
      return <JwtEncoder />
    case 'base64-image':
      return <Base64ImageTool />
    case 'diff-checker':
      return <DiffTool />
    case 'regex-tester':
      return <RegexTool />
    case 'json-validator':
      return <JsonValidator />
    case 'json-path-tester':
      return <JsonPathTool />
    case 'xsd-validator':
      return <XsdValidator />
    case 'csv-viewer':
      return <CsvViewer />
    case 'json-xml-converter':
      return <JsonXmlConverter />
    case 'json-csv-converter':
      return <JsonCsvConverter />
    case 'csv-xml-converter':
      return <CsvXmlConverter />
    case 'case-converter':
      return <CaseConverter />
    case 'yaml-json-converter':
      return <YamlJsonConverter />
    case 'number-base-converter':
      return <NumberBaseConverter />
    case 'markdown-html-converter':
      return <MarkdownHtmlConverter />
    case 'html-markdown-converter':
      return <HtmlMarkdownConverter />
    case 'json-structural-diff':
      return <JsonStructuralDiff />
    case 'mock-json-generator':
      return <MockJsonGenerator />
    case 'curl-code-converter':
      return <CurlCodeConverter />
    case 'dotenv-formatter':
      return <DotenvFormatter />
    case 'image-resizer':
      return <ImageResizer />
    case 'favicon-generator':
      return <FaviconGenerator />
    case 'edi-x12-formatter':
      return <EdiFormatter />
    case 'edi-segment-viewer':
      return <EdiSegmentViewer />
    case 'edi-json-converter':
      return <EdiJsonConverter />
    case 'uuid-generator':
      return <UuidTool />
    case 'qr-generator':
      return <QrTool />
    case 'password-generator':
      return <PasswordTool />
    case 'lorem-ipsum':
      return <LoremTool />
    case 'text-tools':
      return <TextTools />
    case 'word-counter': case 'character-counter': case 'line-counter': case 'sentence-counter': case 'remove-duplicate-lines': case 'remove-empty-lines': case 'remove-extra-spaces': case 'sort-lines-alphabetically': case 'reverse-line-order':
      return <TextTools initialMode={tool.id} />
    case 'what-is-my-screen-resolution':
      return <ScreenResolutionTool />
    case 'what-is-my-user-agent':
      return <UserAgentTool />
    case 'markdown':
      return <MarkdownTool />
    case 'color-converter':
      return <ColorTool />
    case 'timestamp':
      return <TimestampTool />
    case 'cron-expression':
      return <CronTool />
    case 'slugify':
      return <SlugifyTool />
    case 'http-status-codes':
      return <HttpStatusLookup />
    case 'calculator':
      return <CalculatorTool />
    case 'percentage-calculator':
      return <PercentageCalculator />
    case 'tip-calculator':
      return <TipCalculator />
    case 'sip-calculator':
      return <SipCalculator />
    case 'loan-calculator':
      return <LoanCalculator />
    case 'contact':
      return <ContactTool />
  }
}

function ToolPanel({ children, status }: { children: React.ReactNode; status?: Status }) {
  return (
    <div className="panel">
      {children}
      {status && <div className={`status ${status.tone}`}>{status.text}</div>}
    </div>
  )
}

function TextareaBox({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="field">
      <span>{label}<small>{value.split('\n').length} lines / {value.length} chars</small></span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} spellCheck={false} />
    </label>
  )
}

function OutputBox({ label, value }: { label: string; value: string }) {
  return (
    <label className="field output-field">
      <span>{label}<button onClick={() => copyToClipboard(value)}>Copy</button></span>
      <textarea readOnly value={value} />
    </label>
  )
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="toolbar">{children}</div>
}

function JsonFormatter() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'format' | 'minify' | null>(null)

  const run = (mode: 'format' | 'minify') => {
    setActiveMode(mode)
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, mode === 'format' ? 2 : 0))
      setStatus({ tone: 'ok', text: 'Valid JSON' })
    } catch (error) {
      setStatus({ tone: 'warn', text: getErrorMessage(error) })
    }
  }

  return (
    <ToolPanel status={status}>
      <Actions><button className={activeMode === 'format' ? 'primary' : ''} onClick={() => run('format')}>Beautify</button><button className={activeMode === 'minify' ? 'primary' : ''} onClick={() => run('minify')}>Minify</button><button onClick={() => { setInput(''); setOutput(''); setActiveMode(null) }}>Clear</button></Actions>
      <div className="workbench"><TextareaBox label="JSON input" value={input} onChange={setInput} /><OutputBox label="Output" value={output} /></div>
    </ToolPanel>
  )
}

function JsonMinifier() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Paste JSON and minify it locally' })
  const minify = () => {
    try { setOutput(JSON.stringify(JSON.parse(input))); setStatus({ tone: 'ok', text: 'Valid JSON minified' }) }
    catch (error) { setOutput(''); setStatus({ tone: 'warn', text: getErrorMessage(error) }) }
  }
  return <ToolPanel status={status}><Actions><button className="primary" onClick={minify}>Minify JSON</button><a className="tool-inline-link" href={getToolPath('json-formatter')}>Need to format instead? Try the JSON Formatter.</a></Actions><div className="workbench"><TextareaBox label="JSON input" value={input} onChange={setInput} /><OutputBox label="Minified JSON" value={output} /></div></ToolPanel>
}

function FormatTool({ title, sample, format, minify, primaryLabel = 'Beautify' }: { title: string; sample: string; format: (value: string) => string; minify?: (value: string) => string; primaryLabel?: string }) {
  const [input, setInput] = useState(sample)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'format' | 'minify' | null>(null)

  useEffect(() => {
    setInput(sample)
    setOutput('')
    setStatus(undefined)
    setActiveMode(null)
  }, [sample, title])

  const run = (mode: 'format' | 'minify') => {
    setActiveMode(mode)
    try {
      setOutput(mode === 'minify' && minify ? minify(input) : format(input))
      setStatus({ tone: 'ok', text: `${title} completed` })
    } catch (error) {
      setStatus({ tone: 'warn', text: getErrorMessage(error) })
    }
  }

  return (
    <ToolPanel status={status}>
      <Actions><button className={activeMode === 'format' ? 'primary' : ''} onClick={() => run('format')}>{primaryLabel}</button>{minify && <button className={activeMode === 'minify' ? 'primary' : ''} onClick={() => run('minify')}>Minify</button>}<button onClick={() => { setInput(''); setOutput(''); setActiveMode(null) }}>Clear</button></Actions>
      <div className="workbench"><TextareaBox label="Input" value={input} onChange={setInput} /><OutputBox label="Output" value={output} /></div>
    </ToolPanel>
  )
}

function YamlTool() {
  const [input, setInput] = useState('name: Codepackr\ntools:\n  - JSON Formatter\n  - Diff Checker\nactive: true')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()

  const run = () => {
    const result = formatYaml(input)
    setOutput(result.value)
    setStatus(result.status)
  }

  return <ToolPanel status={status}><Actions><button className="primary" onClick={run}>Format / Validate</button><button onClick={() => { setInput(''); setOutput(''); setStatus(undefined) }}>Clear</button></Actions><div className="workbench"><TextareaBox label="YAML input" value={input} onChange={setInput} /><OutputBox label="Output" value={output} /></div></ToolPanel>
}

function Base64Tool() {
  const [input, setInput] = useState('Codepackr')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'encode' | 'decode' | null>(null)
  const encode = () => { setActiveMode('encode'); setOutput(toBase64(input)); setStatus({ tone: 'ok', text: 'Encoded to Base64' }) }
  const decode = () => {
    setActiveMode('decode')
    try { setOutput(fromBase64(input)); setStatus({ tone: 'ok', text: 'Decoded from Base64' }) }
    catch { setStatus({ tone: 'warn', text: 'Invalid Base64 input' }) }
  }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} onClear={() => setActiveMode(null)} actions={<><button className={activeMode === 'encode' ? 'primary' : ''} onClick={encode}>Encode</button><button className={activeMode === 'decode' ? 'primary' : ''} onClick={decode}>Decode</button></>} />
}

function UrlTool() {
  const [input, setInput] = useState('https://codepackr.com/search?q=json formatter')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'encode' | 'decode' | null>(null)
  const encode = () => { setActiveMode('encode'); setOutput(encodeURIComponent(input)); setStatus({ tone: 'ok', text: 'URL encoded' }) }
  const decode = () => {
    setActiveMode('decode')
    try { setOutput(decodeURIComponent(input)); setStatus({ tone: 'ok', text: 'URL decoded' }) }
    catch { setStatus({ tone: 'warn', text: 'Invalid URL encoded text' }) }
  }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} onClear={() => setActiveMode(null)} actions={<><button className={activeMode === 'encode' ? 'primary' : ''} onClick={encode}>Encode</button><button className={activeMode === 'decode' ? 'primary' : ''} onClick={decode}>Decode</button></>} />
}

function HtmlEntityTool() {
  const [input, setInput] = useState('<button class="primary">Save & continue</button>')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'encode' | 'decode' | null>(null)
  const encode = () => { setActiveMode('encode'); setOutput(encodeHtmlEntities(input)); setStatus({ tone: 'ok', text: 'HTML entities encoded' }) }
  const decode = () => { setActiveMode('decode'); setOutput(decodeHtmlEntities(input)); setStatus({ tone: 'ok', text: 'HTML entities decoded' }) }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} onClear={() => setActiveMode(null)} actions={<><button className={activeMode === 'encode' ? 'primary' : ''} onClick={encode}>Encode</button><button className={activeMode === 'decode' ? 'primary' : ''} onClick={decode}>Decode</button></>} />
}

function HashTool() {
  const [input, setInput] = useState('Codepackr')
  const [algorithm, setAlgorithm] = useState('SHA-256')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const run = async () => {
    const bytes = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest(algorithm, bytes)
    setOutput(Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join(''))
    setStatus({ tone: 'ok', text: `${algorithm} generated` })
  }
  return <ToolPanel status={status}><Actions><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}><option>SHA-1</option><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select><button className="primary" onClick={run}>Generate Hash</button></Actions><div className="workbench"><TextareaBox label="Input" value={input} onChange={setInput} /><OutputBox label="Hash" value={output} /></div></ToolPanel>
}

function Crc32Tool() {
  const [input, setInput] = useState('Codepackr')
  const [output, setOutput] = useState('')
  const calculate = (value: string | ArrayBuffer) => setOutput(crc32(value))
  const readFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    file.arrayBuffer().then(calculate)
  }
  return <ToolPanel status={{ tone: output ? 'ok' : 'info', text: output ? 'CRC32 calculated locally' : 'Enter text or select a file' }}><Actions><button className="primary" onClick={() => calculate(input)}>Calculate CRC32</button><label className="inline-option">File <input type="file" onChange={readFile} /></label></Actions><div className="workbench"><TextareaBox label="Text input" value={input} onChange={setInput} /><OutputBox label="CRC32 checksum (hex)" value={output} /></div></ToolPanel>
}

function HmacTool() {
  const [message, setMessage] = useState('Codepackr')
  const [secret, setSecret] = useState('')
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [format, setFormat] = useState<'hex' | 'base64'>('hex')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Enter a message and secret key' })
  const generate = async () => {
    try {
      if (!secret) throw new Error('A secret key is required')
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: algorithm }, false, ['sign'])
      const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)))
      setOutput(format === 'hex' ? Array.from(signature).map((byte) => byte.toString(16).padStart(2, '0')).join('') : btoa(String.fromCharCode(...signature)))
      setStatus({ tone: 'ok', text: `${algorithm} HMAC generated locally` })
    } catch (error) { setOutput(''); setStatus({ tone: 'warn', text: getErrorMessage(error) }) }
  }
  return <ToolPanel status={status}><Actions><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value as typeof algorithm)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select><select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="hex">Hex</option><option value="base64">Base64</option></select><button className="primary" onClick={generate}>Generate HMAC</button></Actions><div className="workbench"><TextareaBox label="Message" value={message} onChange={setMessage} /><TextareaBox label="Secret key" value={secret} onChange={setSecret} /></div><OutputBox label="HMAC signature" value={output} /></ToolPanel>
}

function BrowserValueTool({ label, value }: { label: string; value: string }) {
  return <ToolPanel status={{ tone: 'ok', text: 'Read locally from your browser' }}><div className="browser-value"><span>{label}</span><strong>{value}</strong><button className="primary" onClick={() => copyToClipboard(value)}>Copy</button></div></ToolPanel>
}

function ScreenResolutionTool() {
  return <BrowserValueTool label="Your screen resolution" value={`${window.screen.width} x ${window.screen.height} pixels`} />
}

function UserAgentTool() {
  return <BrowserValueTool label="Your browser user agent" value={navigator.userAgent} />
}

function JwtTool() {
  const [token, setToken] = useState('')
  const decoded = useMemo(() => decodeJwt(token), [token])
  return <ToolPanel status={decoded.status}><div className="workbench"><TextareaBox label="JWT token" value={token} onChange={setToken} placeholder="Paste a JWT token" /><OutputBox label="Decoded header and payload" value={decoded.value} /></div></ToolPanel>
}

function JwtEncoder() {
  const [header, setHeader] = useState('{"alg":"HS256","typ":"JWT"}')
  const [payload, setPayload] = useState('{"sub":"1234567890","name":"Codepackr User","iat":1710000000}')
  const [secret, setSecret] = useState('change-me')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Enter a payload and secret to sign an HS256 token' })
  const sign = async () => {
    try {
      const parsedHeader = JSON.parse(header) as Record<string, unknown>
      if (parsedHeader.alg !== 'HS256') throw new Error('Header alg must be HS256')
      if (!secret) throw new Error('Secret is required')
      setOutput(await signJwtHs256(parsedHeader, JSON.parse(payload), secret))
      setStatus({ tone: 'ok', text: 'HS256 JWT signed locally with Web Crypto' })
    } catch (error) { setOutput(''); setStatus({ tone: 'warn', text: getErrorMessage(error) }) }
  }
  return <ToolPanel status={status}><Actions><button className="primary" onClick={sign}>Sign JWT</button></Actions><div className="workbench"><TextareaBox label="Header JSON" value={header} onChange={setHeader} /><TextareaBox label="Payload JSON" value={payload} onChange={setPayload} /></div><label className="field compact-field"><span>HMAC secret</span><input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} /></label><OutputBox label="Signed token" value={output} /></ToolPanel>
}

function MarkdownHtmlConverter() {
  const [input, setInput] = useState('# Hello\n\nConvert **Markdown** to HTML.\n\n- Fast\n- Private')
  const output = useMemo(() => markdownToHtml(input), [input])
  return <ToolPanel status={{ tone: input ? 'ok' : 'info', text: input ? 'HTML generated' : 'Enter Markdown to convert' }}><div className="workbench"><TextareaBox label="Markdown (MD)" value={input} onChange={setInput} /><OutputBox label="Raw HTML" value={output} /></div></ToolPanel>
}

function HtmlMarkdownConverter() {
  const [input, setInput] = useState('<h1>Hello</h1><p>Convert <strong>HTML</strong> to Markdown.</p><ul><li>Fast</li><li>Private</li></ul>')
  const result = useMemo(() => htmlToMarkdown(input), [input])
  return <ToolPanel status={result.status}><div className="workbench"><TextareaBox label="HTML" value={input} onChange={setInput} /><OutputBox label="Markdown" value={result.value} /></div></ToolPanel>
}

function JsonStructuralDiff() {
  const [left, setLeft] = useState('{"name":"Codepackr","version":1,"active":true}')
  const [right, setRight] = useState('{"name":"Codepackr","version":2,"tools":["json"]}')
  const result = useMemo(() => structuralJsonDiff(left, right), [left, right])
  return <ToolPanel status={result.status}><div className="workbench"><TextareaBox label="Original JSON" value={left} onChange={setLeft} /><TextareaBox label="Modified JSON" value={right} onChange={setRight} /></div><DataTable rows={[['Path', 'Change', 'Original', 'Modified'], ...result.changes.map((change) => [change.path, change.type, change.before, change.after])]} /></ToolPanel>
}

const mockTypes = ['string', 'number', 'boolean', 'date', 'uuid', 'email'] as const
type MockType = typeof mockTypes[number]

function MockJsonGenerator() {
  const [schema, setSchema] = useState('id:uuid\nname:string\nemail:email\ncreatedAt:date\nactive:boolean')
  const [count, setCount] = useState(5)
  const result = useMemo(() => generateMockJson(schema, count), [schema, count])
  return <ToolPanel status={result.status}><Actions><label className="inline-option">Records <input type="number" min="1" max="100" value={count} onChange={(event) => setCount(Number(event.target.value))} /></label></Actions><div className="workbench"><TextareaBox label="Schema (field:type)" value={schema} onChange={setSchema} placeholder="name:string" /><OutputBox label="Generated JSON" value={result.value} /></div><div className="hint">Supported types: {mockTypes.join(', ')}</div></ToolPanel>
}

function CurlCodeConverter() {
  const [input, setInput] = useState("curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -H 'Authorization: Bearer token' -d '{\"name\":\"Ada\"}'")
  const [language, setLanguage] = useState<'fetch' | 'axios' | 'python'>('fetch')
  const result = useMemo(() => convertCurl(input, language), [input, language])
  return <ToolPanel status={result.status}><Actions><span className="seg-group"><button className={language === 'fetch' ? 'active-toggle' : ''} onClick={() => setLanguage('fetch')}>Fetch</button><button className={language === 'axios' ? 'active-toggle' : ''} onClick={() => setLanguage('axios')}>Axios</button><button className={language === 'python' ? 'active-toggle' : ''} onClick={() => setLanguage('python')}>Python</button></span></Actions><div className="workbench"><TextareaBox label="cURL command" value={input} onChange={setInput} /><OutputBox label="Generated code" value={result.value} /></div></ToolPanel>
}

function DotenvFormatter() {
  const [input, setInput] = useState('API_URL=https://api.example.com\nDEBUG=true\nAPI_KEY=\nDEBUG=false')
  const result = useMemo(() => formatDotenv(input), [input])
  return <ToolPanel status={result.status}><div className="workbench"><TextareaBox label=".env input" value={input} onChange={setInput} /><OutputBox label="Formatted .env" value={result.value} /></div>{result.errors.length > 0 && <ul className="error-list">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul>}</ToolPanel>
}

function Base64ImageTool() {
  const [dataUrl, setDataUrl] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Choose an image or paste a Base64 data URL' })
  const choose = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setStatus({ tone: 'warn', text: 'Choose a valid image file' }); return }
    try { setDataUrl(await readFileAsDataUrl(file)); setStatus({ tone: 'ok', text: `${file.name} encoded as Base64` }) }
    catch (error) { setStatus({ tone: 'warn', text: getErrorMessage(error) }) }
  }
  const validImage = /^data:image\/[a-z0-9.+-]+;base64,/i.test(dataUrl)
  return <ToolPanel status={status}><label className="file-picker">Choose image<input type="file" accept="image/*" onChange={(event) => choose(event.target.files?.[0])} /></label><TextareaBox label="Base64 data URL" value={dataUrl} onChange={(value) => { setDataUrl(value); setStatus({ tone: /^data:image\//i.test(value) ? 'ok' : 'info', text: value ? 'Paste a complete image data URL to preview' : 'Choose an image or paste a Base64 data URL' }) }} />{validImage && <div className="image-output"><img src={dataUrl} alt="Decoded Base64 preview" /><a className="download-link" href={dataUrl} download="decoded-image.png">Download image</a></div>}</ToolPanel>
}

function ImageResizer() {
  const [source, setSource] = useState('')
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [quality, setQuality] = useState(0.85)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Choose an image to resize' })
  const fileInput = useRef<HTMLInputElement>(null)
  const choose = async (file?: File) => {
    if (!file?.type.startsWith('image/')) { setStatus({ tone: 'warn', text: 'Choose a valid image file' }); return }
    const url = await readFileAsDataUrl(file)
    const image = await loadImage(url)
    setSource(url); setWidth(image.naturalWidth); setHeight(image.naturalHeight); setOutput('')
    setStatus({ tone: 'ok', text: `Loaded ${image.naturalWidth} x ${image.naturalHeight}` })
  }
  const resize = async () => {
    try { setOutput(await resizeImage(source, width, height, 'image/jpeg', quality)); setStatus({ tone: 'ok', text: `Created ${width} x ${height} JPEG` }) }
    catch (error) { setStatus({ tone: 'warn', text: getErrorMessage(error) }) }
  }
  const reset = () => {
    setSource(''); setOutput(''); setWidth(800); setHeight(600); setQuality(0.85)
    if (fileInput.current) fileInput.current.value = ''
    setStatus({ tone: 'info', text: 'Choose an image to resize' })
  }
  return <ToolPanel status={status}><Actions><label className="file-picker">Choose image<input ref={fileInput} type="file" accept="image/*" onChange={(event) => choose(event.target.files?.[0])} /></label><label className="inline-option">Width <input type="number" min="1" max="8192" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label><label className="inline-option">Height <input type="number" min="1" max="8192" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label><label className="inline-option">Quality <input type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label><button className="primary" disabled={!source} onClick={resize}>Resize</button><button disabled={!source && !output} onClick={reset}>Reset</button></Actions>{source && <div className="image-preview-grid"><ImagePreview label="Original image" source={source} alt="Original image preview" />{output && <ImagePreview label="Resized image" source={output} alt="Resized preview"><a className="download-link" href={output} download={`resized-${width}x${height}.jpg`}>Download JPEG</a></ImagePreview>}</div>}</ToolPanel>
}

function FaviconGenerator() {
  const [source, setSource] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Choose a square image for best results' })
  const fileInput = useRef<HTMLInputElement>(null)
  const choose = async (file?: File) => {
    if (!file?.type.startsWith('image/')) { setStatus({ tone: 'warn', text: 'Choose a valid image file' }); return }
    setSource(await readFileAsDataUrl(file)); setStatus({ tone: 'ok', text: 'Image ready for favicon generation' })
  }
  const generate = async () => {
    try {
      const sizes = [16, 32, 180, 192, 512]
      const pngs = await Promise.all(sizes.map(async (size) => ({ size, data: await resizeImage(source, size, size, 'image/png', 1) })))
      const zip = new JSZip()
      pngs.forEach(({ size, data }) => zip.file(`favicon-${size}x${size}.png`, data.split(',')[1], { base64: true }))
      zip.file('favicon.ico', buildIco([pngs[0], pngs[1]]))
      downloadBlob(await zip.generateAsync({ type: 'blob' }), 'codepackr-favicons.zip')
      setStatus({ tone: 'ok', text: 'Downloaded ICO and five common PNG sizes as ZIP' })
    } catch (error) { setStatus({ tone: 'warn', text: getErrorMessage(error) }) }
  }
  const reset = () => {
    setSource('')
    if (fileInput.current) fileInput.current.value = ''
    setStatus({ tone: 'info', text: 'Choose a square image for best results' })
  }
  return <ToolPanel status={status}><Actions><label className="file-picker">Choose image<input ref={fileInput} type="file" accept="image/*" onChange={(event) => choose(event.target.files?.[0])} /></label><button className="primary" disabled={!source} onClick={generate}>Download favicon ZIP</button><button disabled={!source} onClick={reset}>Reset</button></Actions>{source && <ImagePreview label="Source image" source={source} alt="Favicon source preview" />}</ToolPanel>
}

function ImagePreview({ label, source, alt, children }: { label: string; source: string; alt: string; children?: React.ReactNode }) {
  return <section className="image-output"><strong>{label}</strong><img src={source} alt={alt} />{children}</section>
}

function DiffTool() {
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true)
  const [wrap, setWrap] = useState(true)
  const [precision, setPrecision] = useState<DiffPrecision>('word')
  const [hideUnchanged, setHideUnchanged] = useState(false)
  const diff = useMemo(() => buildDiff(original, modified, ignoreWhitespace), [original, modified, ignoreWhitespace])
  const rows = useMemo(() => buildDiffRows(diff, precision), [diff, precision])
  const visibleRows = useMemo(() => hideUnchanged ? collapseUnchanged(rows) : rows, [rows, hideUnchanged])
  const changeIndexes = useMemo(
    () => visibleRows.flatMap((row, index) => row.kind === 'row' && row.changed ? [index] : []),
    [visibleRows],
  )
  const added = diff.filter((line) => line.type === 'added').length
  const removed = diff.filter((line) => line.type === 'removed').length
  const countLines = (value: string) => value ? value.split('\n').length : 0
  const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

  const leftPane = useRef<HTMLDivElement>(null)
  const rightPane = useRef<HTMLDivElement>(null)
  const syncing = useRef(false)
  const cursor = useRef(-1)

  const syncScroll = (source: 'left' | 'right') => () => {
    if (syncing.current) return
    const from = source === 'left' ? leftPane.current : rightPane.current
    const to = source === 'left' ? rightPane.current : leftPane.current
    if (!from || !to) return
    // Guard against the mirrored scroll bouncing back and fighting the user.
    syncing.current = true
    to.scrollTop = from.scrollTop
    to.scrollLeft = from.scrollLeft
    requestAnimationFrame(() => { syncing.current = false })
  }

  const jumpToChange = (step: number) => {
    if (!changeIndexes.length) return
    const next = step === 0
      ? 0
      : (cursor.current + step + changeIndexes.length) % changeIndexes.length
    cursor.current = next
    leftPane.current?.children[changeIndexes[next]]?.scrollIntoView({ block: 'center' })
  }

  // Wrapped lines make paired rows different heights, which would drift the two panes out of alignment.
  useLayoutEffect(() => {
    const equalize = () => {
      const leftRows = Array.from(leftPane.current?.children ?? []) as HTMLElement[]
      const rightRows = Array.from(rightPane.current?.children ?? []) as HTMLElement[]
      leftRows.forEach((row) => { row.style.minHeight = '' })
      rightRows.forEach((row) => { row.style.minHeight = '' })
      leftRows.forEach((row, index) => {
        const twin = rightRows[index]
        if (!twin) return
        const height = `${Math.max(row.getBoundingClientRect().height, twin.getBoundingClientRect().height)}px`
        row.style.minHeight = height
        twin.style.minHeight = height
      })
    }

    equalize()
    window.addEventListener('resize', equalize)
    return () => window.removeEventListener('resize', equalize)
  }, [visibleRows, wrap])

  return (
    <ToolPanel>
      <Actions>
        <button className={ignoreWhitespace ? 'active-toggle' : ''} onClick={() => setIgnoreWhitespace((value) => !value)}>Ignore whitespace</button>
        <button className={wrap ? 'active-toggle' : ''} onClick={() => setWrap((value) => !value)}>Wrap lines</button>
        <button className={hideUnchanged ? 'active-toggle' : ''} onClick={() => setHideUnchanged((value) => !value)}>Hide unchanged</button>
        <span className="seg-group" role="group" aria-label="Diff precision">
          <button className={precision === 'word' ? 'active-toggle' : ''} onClick={() => setPrecision('word')}>Word</button>
          <button className={precision === 'char' ? 'active-toggle' : ''} onClick={() => setPrecision('char')}>Char</button>
        </span>
        <button disabled={!changeIndexes.length} onClick={() => jumpToChange(0)}>First change</button>
        <button disabled={!changeIndexes.length} onClick={() => jumpToChange(-1)}>Prev</button>
        <button disabled={!changeIndexes.length} onClick={() => jumpToChange(1)}>Next</button>
        <button onClick={() => { setOriginal(''); setModified('') }}>Clear</button>
        <span className="stat-pill">+{added} / -{removed}</span>
      </Actions>
      <div className="workbench"><TextareaBox label="Original" value={original} onChange={setOriginal} /><TextareaBox label="Modified" value={modified} onChange={setModified} /></div>
      <div className="diff-split">
        <section className="diff-side">
          <header className="diff-side-head">
            <span className="diff-tag removed">{plural(removed, 'removal')}</span>
            <span className="diff-meta">{plural(countLines(original), 'line')}</span>
            <button onClick={() => copyToClipboard(original)}>Copy</button>
          </header>
          <div className={wrap ? 'diff-scroll wrap' : 'diff-scroll'} onScroll={syncScroll('left')} ref={leftPane}>
            {visibleRows.map((row, index) => <DiffSideRow key={`left-${index}`} row={row} side="left" />)}
          </div>
        </section>
        <section className="diff-side">
          <header className="diff-side-head">
            <span className="diff-tag added">{plural(added, 'addition')}</span>
            <span className="diff-meta">{plural(countLines(modified), 'line')}</span>
            <button onClick={() => copyToClipboard(modified)}>Copy</button>
          </header>
          <div className={wrap ? 'diff-scroll wrap' : 'diff-scroll'} onScroll={syncScroll('right')} ref={rightPane}>
            {visibleRows.map((row, index) => <DiffSideRow key={`right-${index}`} row={row} side="right" />)}
          </div>
        </section>
      </div>
    </ToolPanel>
  )
}

function DiffSideRow({ row, side }: { row: DiffRow; side: 'left' | 'right' }) {
  if (row.kind === 'gap') {
    return <div className="diff-row gap"><span>&#8942;</span><code>{row.count} unchanged line{row.count === 1 ? '' : 's'}</code></div>
  }

  const cell = side === 'left' ? row.left : row.right
  return (
    <div className={`diff-row ${cell.type}`}>
      <span>{cell.num ?? ''}</span>
      <code>
        {cell.segments
          ? cell.segments.map((segment, index) => segment.changed
            ? <mark key={index}>{segment.value}</mark>
            : <span key={index}>{segment.value}</span>)
          : cell.value || ' '}
      </code>
    </div>
  )
}

function RegexTool() {
  const [pattern, setPattern] = useState('\\w+')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('Codepackr has JSON, CSV, XML, and text tools.')
  const result = useMemo(() => runRegex(pattern, flags, text), [pattern, flags, text])
  return <ToolPanel status={result.status}><Actions><input value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="Pattern" /><input value={flags} onChange={(event) => setFlags(event.target.value)} placeholder="flags" /></Actions><div className="workbench"><TextareaBox label="Test text" value={text} onChange={setText} /><OutputBox label="Matches" value={result.value} /></div></ToolPanel>
}

function JsonValidator() {
  const [input, setInput] = useState(sampleJson)
  const status = useMemo<Status>(() => {
    try { JSON.parse(input); return { tone: 'ok', text: 'Valid JSON' } }
    catch (error) { return { tone: 'warn', text: getErrorMessage(error) } }
  }, [input])
  return <ToolPanel status={status}><TextareaBox label="JSON input" value={input} onChange={setInput} /></ToolPanel>
}

function JsonPathTool() {
  const [input, setInput] = useState('{\n  "project": {\n    "name": "Codepackr",\n    "tools": ["JSON", "Diff", "Base64"]\n  }\n}')
  const [path, setPath] = useState('$.project.tools[0]')
  const result = useMemo(() => runJsonPath(input, path), [input, path])
  return <ToolPanel status={result.status}><Actions><input value={path} onChange={(event) => setPath(event.target.value)} placeholder="$.project.tools[0]" /></Actions><div className="workbench"><TextareaBox label="JSON input" value={input} onChange={setInput} /><OutputBox label="JSONPath result" value={result.value} /></div></ToolPanel>
}

function XsdValidator() {
  const [xml, setXml] = useState('<note><to>Team</to><body>Hello</body></note>')
  const [xsd, setXsd] = useState('<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"><xs:element name="note" /></xs:schema>')
  const status = useMemo(() => validateXmlWithSchemaHint(xml, xsd), [xml, xsd])
  return <ToolPanel status={status}><div className="workbench"><TextareaBox label="XML" value={xml} onChange={setXml} /><TextareaBox label="XSD schema" value={xsd} onChange={setXsd} /></div></ToolPanel>
}

function CsvViewer() {
  const [input, setInput] = useState('name,type\nJSON Formatter,Formatter\nDiff Checker,Validator')
  const rows = useMemo(() => parseCsv(input), [input])
  return <ToolPanel status={{ tone: 'info', text: `${Math.max(rows.length - 1, 0)} records` }}><TextareaBox label="CSV input" value={input} onChange={setInput} /><DataTable rows={rows} /></ToolPanel>
}

function JsonXmlConverter() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'jsonToXml' | 'xmlToJson' | null>(null)
  const jsonToXmlRun = () => { setActiveMode('jsonToXml'); try { setOutput(jsonToXml(JSON.parse(input), 'root')); setStatus({ tone: 'ok', text: 'JSON converted to XML' }) } catch (error) { setStatus({ tone: 'warn', text: getErrorMessage(error) }) } }
  const xmlToJsonRun = () => { setActiveMode('xmlToJson'); const parsed = xmlToJson(input); setOutput(parsed.value); setStatus(parsed.status) }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} onClear={() => setActiveMode(null)} actions={<><button className={activeMode === 'jsonToXml' ? 'primary' : ''} onClick={jsonToXmlRun}>JSON to XML</button><button className={activeMode === 'xmlToJson' ? 'primary' : ''} onClick={xmlToJsonRun}>XML to JSON</button></>} />
}

function JsonCsvConverter() {
  const [input, setInput] = useState('[{"name":"JSON Formatter","type":"Formatter"},{"name":"Diff Checker","type":"Validator"}]')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'jsonToCsv' | 'csvToJson' | null>(null)
  const toCsvRun = () => { setActiveMode('jsonToCsv'); try { setOutput(jsonToCsv(JSON.parse(input))); setStatus({ tone: 'ok', text: 'JSON converted to CSV' }) } catch (error) { setStatus({ tone: 'warn', text: getErrorMessage(error) }) } }
  const toJsonRun = () => { setActiveMode('csvToJson'); setOutput(JSON.stringify(csvToObjects(input), null, 2)); setStatus({ tone: 'ok', text: 'CSV converted to JSON' }) }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} onClear={() => setActiveMode(null)} actions={<><button className={activeMode === 'jsonToCsv' ? 'primary' : ''} onClick={toCsvRun}>JSON to CSV</button><button className={activeMode === 'csvToJson' ? 'primary' : ''} onClick={toJsonRun}>CSV to JSON</button></>} />
}

function CsvXmlConverter() {
  const [input, setInput] = useState('name,type\nJSON Formatter,Formatter\nDiff Checker,Validator')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'csvToXml' | 'xmlToCsv' | null>(null)
  const toXmlRun = () => { setActiveMode('csvToXml'); setOutput(jsonToXml(csvToObjects(input), 'records')); setStatus({ tone: 'ok', text: 'CSV converted to XML' }) }
  const toCsvRun = () => { setActiveMode('xmlToCsv'); const parsed = xmlToJson(input); try { setOutput(jsonToCsv(JSON.parse(parsed.value))); setStatus({ tone: 'ok', text: 'XML converted to CSV' }) } catch { setStatus(parsed.status) } }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} onClear={() => setActiveMode(null)} actions={<><button className={activeMode === 'csvToXml' ? 'primary' : ''} onClick={toXmlRun}>CSV to XML</button><button className={activeMode === 'xmlToCsv' ? 'primary' : ''} onClick={toCsvRun}>XML to CSV</button></>} />
}

function CaseConverter() {
  const [input, setInput] = useShareableInput('Codepackr developer tools')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Choose an output convention' })
  const convert = (mode: CaseMode) => {
    const value = convertCase(input, mode)
    setOutput(value)
    setStatus(value ? { tone: 'ok', text: `Converted to ${caseLabels[mode]}` } : { tone: 'info', text: 'Enter text to convert' })
  }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} actions={Object.entries(caseLabels).map(([mode, label]) => <button key={mode} onClick={() => convert(mode as CaseMode)}>{label}</button>)} />
}

function YamlJsonConverter() {
  const [input, setInput] = useShareableInput('name: Codepackr\ntools:\n  - JSON Formatter\n  - Diff Checker\nactive: true')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>()
  const [activeMode, setActiveMode] = useState<'yamlToJson' | 'jsonToYaml'>('yamlToJson')
  const yamlToJson = () => {
    try {
      setOutput(JSON.stringify(loadYaml(input), null, 2))
      setActiveMode('yamlToJson')
      setStatus({ tone: 'ok', text: 'YAML converted to JSON' })
    } catch (error) {
      setOutput('')
      setStatus({ tone: 'warn', text: getErrorMessage(error) })
    }
  }
  const jsonToYaml = () => {
    try {
      setOutput(dumpYaml(JSON.parse(input), { indent: 2, noRefs: true, lineWidth: 100 }))
      setActiveMode('jsonToYaml')
      setStatus({ tone: 'ok', text: 'JSON converted to YAML' })
    } catch (error) {
      setOutput('')
      setStatus({ tone: 'warn', text: getErrorMessage(error) })
    }
  }
  return <TwoPaneTool input={input} setInput={setInput} output={output} status={status} onClear={() => setActiveMode('yamlToJson')} actions={<><button className={activeMode === 'yamlToJson' ? 'primary' : ''} onClick={yamlToJson}>YAML to JSON</button><button className={activeMode === 'jsonToYaml' ? 'primary' : ''} onClick={jsonToYaml}>JSON to YAML</button></>} />
}

const numberBases = [
  { value: 2, label: 'Binary' },
  { value: 8, label: 'Octal' },
  { value: 10, label: 'Decimal' },
  { value: 16, label: 'Hexadecimal' },
]

function NumberBaseConverter() {
  const [input, setInput] = useShareableInput('255')
  const [sourceBase, setSourceBase] = useState(10)
  const result = useMemo(() => convertNumberBase(input, sourceBase), [input, sourceBase])
  return <ToolPanel status={result.status}><Actions><label className="inline-option">Input base <select value={sourceBase} onChange={(event) => setSourceBase(Number(event.target.value))}>{numberBases.map((base) => <option key={base.value} value={base.value}>{base.label}</option>)}</select></label></Actions><TextareaBox label="Number" value={input} onChange={setInput} placeholder="Enter an integer" /><div className="result-grid">{numberBases.map((base) => <Result key={base.value} label={base.label} value={result.values[base.value] ?? ''} />)}</div></ToolPanel>
}

function SlugifyTool() {
  const [input, setInput] = useShareableInput('Free Developer Tools by Codepackr')
  const output = useMemo(() => slugify(input), [input])
  return <ToolPanel status={{ tone: output ? 'ok' : 'info', text: output ? 'URL-safe slug ready' : 'Enter text to create a slug' }}><div className="workbench"><TextareaBox label="Text" value={input} onChange={setInput} /><OutputBox label="Slug" value={output} /></div></ToolPanel>
}

const httpStatuses = [
  [100, 'Continue', 'The client should continue the request.'], [101, 'Switching Protocols', 'The server is switching protocols.'],
  [200, 'OK', 'The request succeeded.'], [201, 'Created', 'A new resource was created.'], [202, 'Accepted', 'The request was accepted for processing.'], [204, 'No Content', 'The request succeeded with no response body.'],
  [301, 'Moved Permanently', 'The resource has a permanent new URL.'], [302, 'Found', 'The resource is temporarily at another URL.'], [304, 'Not Modified', 'The cached representation is still current.'], [307, 'Temporary Redirect', 'Repeat the request at another URL with the same method.'], [308, 'Permanent Redirect', 'Permanently repeat the request at another URL with the same method.'],
  [400, 'Bad Request', 'The server could not understand the request.'], [401, 'Unauthorized', 'Authentication is required.'], [403, 'Forbidden', 'The server refuses to authorize the request.'], [404, 'Not Found', 'The requested resource was not found.'], [405, 'Method Not Allowed', 'The HTTP method is not supported for this resource.'], [408, 'Request Timeout', 'The server timed out waiting for the request.'], [409, 'Conflict', 'The request conflicts with the current resource state.'], [410, 'Gone', 'The resource is no longer available.'], [415, 'Unsupported Media Type', 'The request media type is not supported.'], [418, "I'm a Teapot", 'The server refuses to brew coffee because it is a teapot.'], [422, 'Unprocessable Content', 'The request syntax is valid but its instructions cannot be processed.'], [429, 'Too Many Requests', 'The client sent too many requests.'],
  [500, 'Internal Server Error', 'The server encountered an unexpected condition.'], [501, 'Not Implemented', 'The server does not support the requested functionality.'], [502, 'Bad Gateway', 'An upstream server returned an invalid response.'], [503, 'Service Unavailable', 'The server is temporarily unavailable.'], [504, 'Gateway Timeout', 'An upstream server did not respond in time.'],
] satisfies Array<[number, string, string]>

function HttpStatusLookup() {
  const [query, setQuery] = useState('')
  const rows = useMemo(() => httpStatuses.filter((status) => status.join(' ').toLowerCase().includes(query.trim().toLowerCase())).map(([code, name, description]) => [String(code), name, description]), [query])
  return <ToolPanel status={{ tone: 'info', text: `${rows.length} HTTP status codes shown` }}><label className="field"><span>Search status codes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 404, redirect, unavailable..." /></label><DataTable rows={[['Code', 'Status', 'Description'], ...rows]} /></ToolPanel>
}

const sampleEdi = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260826*1200*U*00401*000000001*0*T*:~GS*PO*SENDER*RECEIVER*20260826*1200*1*X*004010~ST*850*0001~BEG*00*SA*12345**20260826~SE*3*0001~GE*1*1~IEA*1*000000001~'

function EdiFormatter() {
  const [input, setInput] = useState(sampleEdi)
  const parsed = useMemo(() => parseEdi(input), [input])
  const output = useMemo(() => formatEdi(input), [input])
  return <ToolPanel status={parsed.status}><div className="workbench"><TextareaBox label="X12 or EDIFACT input" value={input} onChange={setInput} /><OutputBox label={`Formatted ${parsed.format}`} value={output} /></div>{parsed.errors.length > 0 && <ul className="error-list">{parsed.errors.map((error) => <li key={error}>{error}</li>)}</ul>}</ToolPanel>
}

function EdiSegmentViewer() {
  const [input, setInput] = useState(sampleEdi)
  const parsed = useMemo(() => parseEdi(input), [input])
  const rows = useMemo(() => [['Segment', 'Name', 'Element', 'Annotation', 'Value'], ...parsed.segments.flatMap((segment) => segment.elements.map((value, index) => [segment.tag, getEdiSegmentName(segment.tag, parsed.format), `${segment.tag}${String(index + 1).padStart(2, '0')}`, getEdiElementName(segment.tag, index + 1, parsed.format), value]))], [parsed])
  return <ToolPanel status={parsed.status}><TextareaBox label="X12 or EDIFACT input" value={input} onChange={setInput} /><DataTable rows={rows} />{parsed.errors.length > 0 && <ul className="error-list">{parsed.errors.map((error) => <li key={error}>{error}</li>)}</ul>}</ToolPanel>
}

function EdiJsonConverter() {
  const [input, setInput] = useState(sampleEdi)
  const parsed = useMemo(() => parseEdi(input), [input])
  const output = useMemo(() => JSON.stringify({ format: parsed.format, validationErrors: parsed.errors, segments: parsed.segments.map((segment, index) => ({ index: index + 1, tag: segment.tag, name: getEdiSegmentName(segment.tag, parsed.format), elements: segment.elements.map((value, elementIndex) => ({ position: elementIndex + 1, name: getEdiElementName(segment.tag, elementIndex + 1, parsed.format), value })) })) }, null, 2), [parsed])
  return <ToolPanel status={parsed.status}><div className="workbench"><TextareaBox label="X12 or EDIFACT input" value={input} onChange={setInput} /><OutputBox label="JSON output" value={output} /></div></ToolPanel>
}

function UuidTool() {
  const [count, setCount] = useState(5)
  const [output, setOutput] = useState('')
  const generate = () => setOutput(Array.from({ length: Math.max(1, Math.min(count, 100)) }, () => crypto.randomUUID()).join('\n'))
  return <ToolPanel status={{ tone: 'info', text: 'Uses browser crypto.randomUUID for UUID v4' }}><Actions><input type="number" min="1" max="100" value={count} onChange={(event) => setCount(Number(event.target.value))} /><button className="primary" onClick={generate}>Generate UUIDs</button></Actions><OutputBox label="UUIDs" value={output} /></ToolPanel>
}

function QrTool() {
  const [input, setInput] = useState('https://www.codepackr.com')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Enter text or a URL to generate a QR code' })

  useEffect(() => {
    let cancelled = false
    if (!input.trim()) {
      setQrDataUrl('')
      setStatus({ tone: 'info', text: 'Enter text or a URL to generate a QR code' })
      return
    }
    QRCode.toDataURL(input, { margin: 2, width: 260, color: { dark: '#162033', light: '#ffffff' } })
      .then((url) => { if (!cancelled) { setQrDataUrl(url); setStatus({ tone: 'ok', text: 'QR code generated' }) } })
      .catch((error: unknown) => { if (!cancelled) setStatus({ tone: 'warn', text: getErrorMessage(error) }) })
    return () => { cancelled = true }
  }, [input])

  return <ToolPanel status={status}><TextareaBox label="QR content" value={input} onChange={setInput} placeholder="Enter URL or text" />{qrDataUrl && <div className="qr-output"><img src={qrDataUrl} alt="Generated QR code" /><a className="download-link" href={qrDataUrl} download="codepackr-qr.png">Download PNG</a></div>}</ToolPanel>
}

function PasswordTool() {
  const [length, setLength] = useState(16)
  const [includeUpper, setIncludeUpper] = useState(true)
  const [includeLower, setIncludeLower] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [passwords, setPasswords] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Choose options and generate passwords' })

  const generate = () => {
    const result = generatePasswords({ length, includeUpper, includeLower, includeNumbers, includeSymbols })
    setPasswords(result.value)
    setStatus(result.status)
  }

  return <ToolPanel status={status}><Actions><label className="inline-option">Length <input type="number" min="8" max="128" value={length} onChange={(event) => setLength(Number(event.target.value))} /></label><button className="primary" onClick={generate}>Generate</button></Actions><div className="option-grid"><label><input type="checkbox" checked={includeUpper} onChange={(event) => setIncludeUpper(event.target.checked)} /> Uppercase</label><label><input type="checkbox" checked={includeLower} onChange={(event) => setIncludeLower(event.target.checked)} /> Lowercase</label><label><input type="checkbox" checked={includeNumbers} onChange={(event) => setIncludeNumbers(event.target.checked)} /> Numbers</label><label><input type="checkbox" checked={includeSymbols} onChange={(event) => setIncludeSymbols(event.target.checked)} /> Symbols</label></div><OutputBox label="Generated passwords" value={passwords} /></ToolPanel>
}

function LoremTool() {
  const [count, setCount] = useState(3)
  const [mode, setMode] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs')
  const output = useMemo(() => makeLorem(count, mode), [count, mode])
  return <ToolPanel><Actions><select value={mode} onChange={(event) => setMode(event.target.value as 'paragraphs' | 'sentences' | 'words')}><option value="paragraphs">Paragraphs</option><option value="sentences">Sentences</option><option value="words">Words</option></select><input type="number" min="1" max="50" value={count} onChange={(event) => setCount(Number(event.target.value))} /></Actions><OutputBox label="Generated text" value={output} /></ToolPanel>
}

const textToolModes = [
  ['word-counter', 'Word Counter', 'Paste your text below to count words.'],
  ['character-counter', 'Character Counter', 'Paste your text below to count characters.'],
  ['line-counter', 'Line Counter', 'Paste your text below to count lines.'],
  ['sentence-counter', 'Sentence Counter', 'Paste your text below to count sentences.'],
  ['dedupe', 'Remove Duplicate Lines', 'Paste your text below to remove repeated lines.'],
  ['remove-empty-lines', 'Remove Empty Lines', 'Paste your text below to remove blank lines.'],
  ['remove-extra-spaces', 'Remove Extra Spaces', 'Paste your text below to collapse spaces and tabs.'],
  ['sort-lines-alphabetically', 'Sort Lines', 'Paste your text below to sort its lines alphabetically.'],
  ['reverse-line-order', 'Reverse Lines', 'Paste your text below to reverse line order.'],
] as const

function TextTools({ initialMode }: { initialMode?: string }) {
  const [input, setInput] = useState('Paste your text here\nPaste your text here')
  const [activeMode, setActiveMode] = useState(initialMode || window.location.hash.slice(1) || 'word-counter')
  const stats = getTextStats(input)
  const selected = textToolModes.find(([id]) => id === activeMode) ?? textToolModes[0]
  const output = textToolOutput(input, activeMode, stats)
  return <ToolPanel status={{ tone: 'info', text: `${stats.words} words, ${stats.characters} characters, ${stats.lines} lines, ${stats.sentences} sentences` }}><Actions>{textToolModes.map(([id, label]) => <button className={activeMode === id ? 'primary' : ''} onClick={() => { setActiveMode(id); window.history.replaceState(null, '', `${getToolPath('text-tools')}#${id}`) }} key={id}>{label}</button>)}</Actions><p className="tool-description">{selected[2]}</p><div className="workbench"><TextareaBox label="Text input" value={input} onChange={setInput} /><OutputBox label={selected[1]} value={output} /></div></ToolPanel>
}

function MarkdownTool() {
  const [input, setInput] = useState('# Markdown Preview\n\nType **markdown** and see HTML preview.\n\n- JSON\n- Diff\n- Base64')
  return <ToolPanel><div className="workbench"><TextareaBox label="Markdown (MD)" value={input} onChange={setInput} /><section className="preview-field"><span>Preview</span><div className="preview" dangerouslySetInnerHTML={{ __html: markdownToHtml(input) }} /></section></div></ToolPanel>
}

function ColorTool() {
  const [hex, setHex] = useState('#6c63ff')
  const color = useMemo(() => convertColor(hex), [hex])
  return <ToolPanel status={color.status}><Actions><input type="color" value={color.hex} onChange={(event) => setHex(event.target.value)} /><input value={hex} onChange={(event) => setHex(event.target.value)} /></Actions><div className="color-preview" style={{ background: color.hex }} /><OutputBox label="Color formats" value={color.value} /></ToolPanel>
}

function TimestampTool() {
  const [unix, setUnix] = useState(Math.floor(Date.now() / 1000).toString())
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const unixDate = new Date(Number(unix) * 1000)
  const iso = Number.isFinite(unixDate.getTime()) ? unixDate.toISOString() : 'Invalid timestamp'
  const fromDate = Math.floor(new Date(date).getTime() / 1000)
  return <ToolPanel><div className="workbench"><label className="field"><span>Unix timestamp</span><input value={unix} onChange={(event) => setUnix(event.target.value)} /></label><label className="field"><span>Date and time</span><input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></label></div><div className="result-grid"><Result label="Unix to date" value={iso} /><Result label="Date to Unix" value={Number.isFinite(fromDate) ? String(fromDate) : 'Invalid date'} /></div></ToolPanel>
}

function CronTool() {
  const [cron, setCron] = useShareableInput('* * * * *')
  const explanation = useMemo(() => explainCron(cron), [cron])
  const nextRuns = useMemo(() => getNextCronRuns(cron), [cron])
  return <ToolPanel status={nextRuns.status.tone === 'warn' ? nextRuns.status : explanation.status}><label className="field"><span>Cron expression</span><input value={cron} onChange={(event) => setCron(event.target.value)} /></label><div className="workbench"><OutputBox label="Explanation" value={explanation.value} /><OutputBox label="Next 5 runs (local time)" value={nextRuns.value} /></div></ToolPanel>
}

function CalculatorTool() {
  const [expression, setExpression] = useState('')
  const result = useMemo(() => calculateExpression(expression), [expression])
  const addInput = (value: string) => setExpression((currentExpression) => currentExpression + value)
  return <ToolPanel status={result.status}><Actions><button className="primary" onClick={() => setExpression('')}>Clear</button></Actions><label className="field"><span>Expression</span><input value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="Enter expression, for example sqrt(16) + 2^3" /></label><div className="calculator-pad">{['7','8','9','/','sqrt(','4','5','6','*','^','1','2','3','-','(', '0','.','C','+',')'].map((key) => <button key={key} onClick={() => key === 'C' ? setExpression('') : addInput(key)}>{key}</button>)}</div><Result label="Result" value={result.value} /></ToolPanel>
}

function PercentageCalculator() {
  const [percent, setPercent] = useState('15')
  const [number, setNumber] = useState('200')
  const [increase, setIncrease] = useState('')
  const percentage = Number(percent)
  const base = Number(number)
  const change = Number(increase)
  const percentOf = Number.isFinite(percentage * base) ? percentage * base / 100 : 0
  return <ToolPanel><div className="workbench"><label className="field"><span>Percentage</span><input type="number" value={percent} onChange={(event) => setPercent(event.target.value)} /></label><label className="field"><span>Number</span><input type="number" value={number} onChange={(event) => setNumber(event.target.value)} /></label></div><Result label={`${percent || 0}% of ${number || 0}`} value={String(percentOf)} /><label className="field compact-field"><span>Increase or decrease amount (%)</span><input type="number" value={increase} onChange={(event) => setIncrease(event.target.value)} placeholder="For example, 10 or -10" /></label><Result label="Adjusted number" value={String(base * (1 + (Number.isFinite(change) ? change : 0) / 100))} /></ToolPanel>
}

function TipCalculator() {
  const [bill, setBill] = useState('100')
  const [tipPercent, setTipPercent] = useState('18')
  const [people, setPeople] = useState('1')
  const billAmount = Math.max(0, Number(bill) || 0)
  const tip = billAmount * Math.max(0, Number(tipPercent) || 0) / 100
  const total = billAmount + tip
  const split = Math.max(1, Math.floor(Number(people) || 1))
  return <ToolPanel><div className="workbench"><label className="field"><span>Bill amount</span><input type="number" min="0" step="0.01" value={bill} onChange={(event) => setBill(event.target.value)} /></label><label className="field"><span>Tip percentage</span><input type="number" min="0" value={tipPercent} onChange={(event) => setTipPercent(event.target.value)} /></label><label className="field"><span>People</span><input type="number" min="1" value={people} onChange={(event) => setPeople(event.target.value)} /></label></div><div className="result-grid"><Result label="Tip" value={tip.toFixed(2)} /><Result label="Total" value={total.toFixed(2)} /><Result label="Per person" value={(total / split).toFixed(2)} /></div></ToolPanel>
}

function SipCalculator() {
  const [monthlyInvestment, setMonthlyInvestment] = useState('5000')
  const [annualReturn, setAnnualReturn] = useState('12')
  const [years, setYears] = useState('10')
  const monthly = Math.max(0, Number(monthlyInvestment) || 0)
  const months = Math.max(0, Math.floor(Number(years) || 0) * 12)
  const monthlyRate = Math.max(0, Number(annualReturn) || 0) / 1200
  const invested = monthly * months
  const futureValue = monthlyRate === 0 ? invested : monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate)
  return <ToolPanel><div className="workbench"><label className="field"><span>Monthly investment</span><input type="number" min="0" value={monthlyInvestment} onChange={(event) => setMonthlyInvestment(event.target.value)} /></label><label className="field"><span>Expected annual return (%)</span><input type="number" min="0" step="0.1" value={annualReturn} onChange={(event) => setAnnualReturn(event.target.value)} /></label><label className="field"><span>Investment period (years)</span><input type="number" min="0" step="1" value={years} onChange={(event) => setYears(event.target.value)} /></label></div><div className="result-grid"><Result label="Amount invested" value={invested.toFixed(2)} /><Result label="Estimated returns" value={(futureValue - invested).toFixed(2)} /><Result label="Estimated maturity value" value={futureValue.toFixed(2)} /></div></ToolPanel>
}

function LoanCalculator() {
  const [principal, setPrincipal] = useState('500000')
  const [annualRate, setAnnualRate] = useState('8.5')
  const [years, setYears] = useState('5')
  const amount = Math.max(0, Number(principal) || 0)
  const months = Math.max(1, Math.floor(Number(years) || 0) * 12)
  const monthlyRate = Math.max(0, Number(annualRate) || 0) / 1200
  const emi = monthlyRate === 0 ? amount / months : amount * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1)
  const total = emi * months
  return <ToolPanel><div className="workbench"><label className="field"><span>Loan amount</span><input type="number" min="0" value={principal} onChange={(event) => setPrincipal(event.target.value)} /></label><label className="field"><span>Annual interest rate (%)</span><input type="number" min="0" step="0.1" value={annualRate} onChange={(event) => setAnnualRate(event.target.value)} /></label><label className="field"><span>Loan term (years)</span><input type="number" min="1" step="1" value={years} onChange={(event) => setYears(event.target.value)} /></label></div><div className="result-grid"><Result label="Monthly EMI" value={emi.toFixed(2)} /><Result label="Total interest" value={(total - amount).toFixed(2)} /><Result label="Total repayment" value={total.toFixed(2)} /></div></ToolPanel>
}

function ContactTool() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Your message is sent securely to our team.' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const submittingRef = useRef(false)
  const submitTimeoutRef = useRef<number>()

  useEffect(() => () => {
    if (submitTimeoutRef.current) window.clearTimeout(submitTimeoutRef.current)
  }, [])

  const completeContactSubmit = () => {
    if (!submittingRef.current) return
    submittingRef.current = false
    if (submitTimeoutRef.current) window.clearTimeout(submitTimeoutRef.current)
    setSending(false)
    setSent(true)
    setStatus({ tone: 'ok', text: 'Message submitted. Thank you for reaching out. We will get back to you within 24-48 hours.' })
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
  }

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      setStatus({ tone: 'warn', text: 'Enter a valid email address, for example name@example.com.' })
      return
    }

    try {
      setSending(true)
      setSent(false)
      setStatus({ tone: 'info', text: 'Submitting message...' })
      submittingRef.current = true
      if (submitTimeoutRef.current) window.clearTimeout(submitTimeoutRef.current)
      submitTimeoutRef.current = window.setTimeout(() => {
        if (!submittingRef.current) return
        submittingRef.current = false
        setSending(false)
        setStatus({ tone: 'warn', text: 'We could not confirm the message submission. Please try again.' })
      }, 12000)
      const form = document.createElement('form')
      form.action = 'https://script.google.com/macros/s/AKfycbxLtRspOxZaKhGdikBBlAjJk3ndSibOs0t3Im2Xf-K0podjAPItb90iOA9mDjRAbuT_Bg/exec'
      form.method = 'POST'
      form.target = 'contact-submit-frame'
      for (const [key, value] of Object.entries({ name, email: normalizedEmail, subject, message })) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      }
      document.body.appendChild(form)
      form.submit()
      form.remove()
    } catch (error) {
      submittingRef.current = false
      if (submitTimeoutRef.current) window.clearTimeout(submitTimeoutRef.current)
      setSending(false)
      setStatus({ tone: 'warn', text: `${getErrorMessage(error)}. Please try again.` })
    }
  }

  return (
    <ToolPanel status={status}>
      <iframe className="contact-submit-frame" name="contact-submit-frame" title="Contact form submission" onLoad={completeContactSubmit} />
      {sent ? <div className="success-card"><strong>Message submitted!</strong><span>Thank you for reaching out. We will get back to you within 24-48 hours.</span></div> : null}
      <form className="contact-form" onSubmit={submitContact}>
        <div className="contact-grid">
          <label className="field"><span>Your Name *</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Kumar" /></label>
          <label className="field"><span>Email Address *</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} onInvalid={(event) => { event.currentTarget.setCustomValidity('Enter a valid email address, for example name@example.com.'); setStatus({ tone: 'warn', text: 'Enter a valid email address, for example name@example.com.' }) }} onInput={(event) => event.currentTarget.setCustomValidity('')} placeholder="kumar@example.com" /></label>
          <label className="field"><span>Subject *</span><select required value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">Select a topic...</option><option value="bug">Bug Report</option><option value="feature">Feature / Tool Request</option><option value="feedback">General Feedback</option><option value="other">Other</option></select></label>
          <TextareaBox label="Message *" value={message} onChange={setMessage} placeholder="Describe your bug, suggestion, or feedback..." />
        </div>
        <button className="primary submit-button" disabled={sending} type="submit">{sending ? 'Submitting...' : 'Send Message'}</button>
      </form>
    </ToolPanel>
  )
}

function TwoPaneTool({ input, setInput, output, actions, status, onClear }: { input: string; setInput: (value: string) => void; output: string; actions: React.ReactNode; status?: Status; onClear?: () => void }) {
  return <ToolPanel status={status}><Actions>{actions}<button onClick={() => { setInput(''); onClear?.() }}>Clear</button></Actions><div className="workbench"><TextareaBox label="Input" value={input} onChange={setInput} /><OutputBox label="Output" value={output} /></div></ToolPanel>
}

function Result({ label, value }: { label: string; value: string }) {
  return <div className="result"><span>{label}</span><strong>{value}</strong></div>
}

function DataTable({ rows }: { rows: string[][] }) {
  if (!rows.length) return <div className="empty">No rows to preview</div>
  const [header, ...body] = rows
  return <div className="table-wrap"><table><thead><tr>{header.map((cell, index) => <th key={`${cell}-${index}`}>{cell || `Column ${index + 1}`}</th>)}</tr></thead><tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{header.map((_, cellIndex) => <td key={cellIndex}>{row[cellIndex] ?? ''}</td>)}</tr>)}</tbody></table></div>
}

function buildDiff(original: string, modified: string, ignoreWhitespace: boolean): DiffLine[] {
  const normalize = (line: string) => ignoreWhitespace ? line.replace(/\s+/g, ' ').trim() : line
  const leftOriginal = original.split('\n')
  const rightOriginal = modified.split('\n')
  const left = leftOriginal.map(normalize)
  const right = rightOriginal.map(normalize)
  const table = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0))

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      table[row][column] = left[row - 1] === right[column - 1]
        ? table[row - 1][column - 1] + 1
        : Math.max(table[row - 1][column], table[row][column - 1])
    }
  }

  const result: DiffLine[] = []
  let row = left.length
  let column = right.length
  while (row || column) {
    if (row && column && left[row - 1] === right[column - 1]) {
      result.unshift({ type: 'common', value: leftOriginal[row - 1] })
      row -= 1
      column -= 1
    } else if (column && (!row || table[row][column - 1] >= table[row - 1][column])) {
      result.unshift({ type: 'added', value: rightOriginal[column - 1] })
      column -= 1
    } else {
      result.unshift({ type: 'removed', value: leftOriginal[row - 1] })
      row -= 1
    }
  }
  return result
}

// Pairs the linear diff into aligned left/right rows so both panes stay line-for-line in sync.
function buildDiffRows(diff: DiffLine[], precision: DiffPrecision): DiffRow[] {
  const rows: DiffRow[] = []
  const blank: DiffSide = { num: null, value: '', type: 'empty' }
  let leftNum = 0
  let rightNum = 0
  let index = 0

  while (index < diff.length) {
    if (diff[index].type === 'common') {
      leftNum += 1
      rightNum += 1
      rows.push({
        kind: 'row',
        changed: false,
        left: { num: leftNum, value: diff[index].value, type: 'common' },
        right: { num: rightNum, value: diff[index].value, type: 'common' },
      })
      index += 1
      continue
    }

    const removedLines: string[] = []
    const addedLines: string[] = []
    while (index < diff.length && diff[index].type !== 'common') {
      if (diff[index].type === 'removed') removedLines.push(diff[index].value)
      else addedLines.push(diff[index].value)
      index += 1
    }

    for (let offset = 0; offset < Math.max(removedLines.length, addedLines.length); offset += 1) {
      const leftValue = removedLines[offset]
      const rightValue = addedLines[offset]
      const paired = leftValue !== undefined && rightValue !== undefined
      if (leftValue !== undefined) leftNum += 1
      if (rightValue !== undefined) rightNum += 1
      rows.push({
        kind: 'row',
        changed: true,
        left: leftValue === undefined
          ? blank
          : { num: leftNum, value: leftValue, type: 'removed', segments: paired ? inlineSegments(leftValue, rightValue, precision) : undefined },
        right: rightValue === undefined
          ? blank
          : { num: rightNum, value: rightValue, type: 'added', segments: paired ? inlineSegments(rightValue, leftValue, precision) : undefined },
      })
    }
  }

  return rows
}

const DIFF_CONTEXT_LINES = 3

function collapseUnchanged(rows: DiffRow[]): DiffRow[] {
  const keep = rows.map((row) => row.kind === 'row' && row.changed)
  rows.forEach((row, index) => {
    if (row.kind !== 'row' || !row.changed) return
    for (let offset = 1; offset <= DIFF_CONTEXT_LINES; offset += 1) {
      if (index - offset >= 0) keep[index - offset] = true
      if (index + offset < rows.length) keep[index + offset] = true
    }
  })

  const output: DiffRow[] = []
  let skipped = 0
  rows.forEach((row, index) => {
    if (keep[index]) {
      if (skipped) {
        output.push({ kind: 'gap', count: skipped })
        skipped = 0
      }
      output.push(row)
    } else {
      skipped += 1
    }
  })
  if (skipped) output.push({ kind: 'gap', count: skipped })
  return output
}

function inlineSegments(value: string, other: string, precision: DiffPrecision): DiffSegment[] {
  const split = (input: string) => precision === 'char' ? Array.from(input) : input.match(/\s+|\S+/g) ?? []
  const tokens = split(value)
  const otherTokens = split(other)
  if (!tokens.length) return []
  if (tokens.length * otherTokens.length > 40000) return [{ value, changed: true }]

  const table = Array.from({ length: tokens.length + 1 }, () => Array<number>(otherTokens.length + 1).fill(0))
  for (let row = 1; row <= tokens.length; row += 1) {
    for (let column = 1; column <= otherTokens.length; column += 1) {
      table[row][column] = tokens[row - 1] === otherTokens[column - 1]
        ? table[row - 1][column - 1] + 1
        : Math.max(table[row - 1][column], table[row][column - 1])
    }
  }

  const shared = Array<boolean>(tokens.length).fill(false)
  let row = tokens.length
  let column = otherTokens.length
  while (row && column) {
    if (tokens[row - 1] === otherTokens[column - 1]) {
      shared[row - 1] = true
      row -= 1
      column -= 1
    } else if (table[row - 1][column] >= table[row][column - 1]) {
      row -= 1
    } else {
      column -= 1
    }
  }

  const segments: DiffSegment[] = []
  tokens.forEach((token, position) => {
    const changed = !shared[position]
    const last = segments[segments.length - 1]
    if (last && last.changed === changed) last.value += token
    else segments.push({ value: token, changed })
  })
  return segments
}

function formatMarkup(value: string) {
  const compact = value.replace(/>\s+</g, '><').trim()
  let indent = 0
  return compact
    .replace(/></g, '>\n<')
    .split('\n')
    .map((line) => {
      if (/^<\//.test(line)) indent = Math.max(indent - 1, 0)
      const output = `${'  '.repeat(indent)}${line}`
      if (/^<[^!?/][^>]*[^/]?>/.test(line) && !/^<[^>]+>.*<\/[^>]+>$/.test(line)) indent += 1
      return output
    })
    .join('\n')
}

function minifyMarkup(value: string) {
  return value.replace(/<!--([\s\S]*?)-->/g, '').replace(/>\s+</g, '><').trim()
}

function formatCss(value: string) {
  return value.replace(/\s*{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*}\s*/g, '\n}\n').replace(/,\s*/g, ', ').trim()
}

function minifyCss(value: string) {
  return value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim()
}

function formatSql(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|AND|OR)\b/gi, '\n$1')
    .replace(/,\s*/g, ',\n  ')
    .trim()
}

function minifyJs(value: string) {
  return value.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}();,:=+\-*/<>])\s*/g, '$1').trim()
}

function formatYaml(value: string): { status: Status; value: string } {
  const lines = value.replace(/\t/g, '  ').split(/\r?\n/)
  const output: string[] = []
  const indentStack = [0]

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      output.push(trimmed)
      continue
    }
    const currentIndent = rawLine.match(/^ */)?.[0].length ?? 0
    if (currentIndent % 2 !== 0) return { status: { tone: 'warn', text: 'YAML indentation should use even spaces' }, value: output.join('\n') }
    if (!trimmed.startsWith('- ') && !trimmed.includes(':')) return { status: { tone: 'warn', text: `Expected key/value pair near: ${trimmed}` }, value: output.join('\n') }
    while (currentIndent < indentStack[indentStack.length - 1]) indentStack.pop()
    if (currentIndent > indentStack[indentStack.length - 1]) indentStack.push(currentIndent)
    output.push(`${' '.repeat(currentIndent)}${trimmed}`)
  }
  return { status: { tone: 'ok', text: 'YAML looks valid' }, value: output.join('\n').trim() }
}

function encodeHtmlEntities(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function decodeHtmlEntities(value: string) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

function runJsonPath(input: string, path: string): { status: Status; value: string } {
  try {
    const data = JSON.parse(input)
    const expression = path.trim()
    if (!expression.startsWith('$')) return { status: { tone: 'warn', text: 'JSONPath must start with $' }, value: '' }
    if (expression.includes('..')) return { status: { tone: 'warn', text: 'Recursive descent (..) is not supported' }, value: '' }
    const tokens = tokenizeJsonPath(expression)
    let current: unknown = data
    for (const token of tokens) {
      if (Array.isArray(current) && typeof token === 'number') {
        if (token >= current.length) return { status: { tone: 'warn', text: `No match at [${token}]` }, value: '' }
        current = current[token]
      } else if (current !== null && typeof current === 'object' && !Array.isArray(current) && typeof token === 'string') {
        if (!Object.prototype.hasOwnProperty.call(current, token)) return { status: { tone: 'warn', text: `No match at ${token}` }, value: '' }
        current = (current as Record<string, unknown>)[token]
      } else {
        return { status: { tone: 'warn', text: `No match at ${String(token)}` }, value: '' }
      }
    }
    if (current === undefined) return { status: { tone: 'warn', text: 'No match' }, value: '' }
    return { status: { tone: 'ok', text: 'JSONPath matched' }, value: JSON.stringify(current, null, 2) }
  } catch (error) {
    return { status: { tone: 'warn', text: getErrorMessage(error) }, value: '' }
  }
}

function tokenizeJsonPath(path: string): Array<string | number> {
  const body = path.trim().replace(/^\$\.?/, '')
  if (!body) return []
  const tokens: Array<string | number> = []
  const pattern = /([^.[\]]+)|\[(\d+|"[^"]+"|'[^']+')\]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(body))) {
    const value = match[1] ?? match[2]
    if (/^\d+$/.test(value)) tokens.push(Number(value))
    else tokens.push(value.replace(/^['"]|['"]$/g, ''))
  }
  return tokens
}

function toBase64(value: string) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(value)))
}

function fromBase64(value: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)))
}

function decodeJwt(token: string): { status: Status; value: string } {
  const parts = token.split('.')
  if (parts.length < 2) return { status: { tone: 'info', text: 'Paste a JWT to decode header and payload' }, value: '' }
  try {
    const decodePart = (part: string) => JSON.parse(fromBase64(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')))
    return { status: { tone: 'ok', text: 'JWT decoded' }, value: JSON.stringify({ header: decodePart(parts[0]), payload: decodePart(parts[1]) }, null, 2) }
  } catch (error) {
    return { status: { tone: 'warn', text: getErrorMessage(error) }, value: '' }
  }
}

function toBase64Url(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function signJwtHs256(header: Record<string, unknown>, payload: unknown, secret: string) {
  const body = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return `${body}.${toBase64Url(new Uint8Array(signature))}`
}

function htmlToMarkdown(input: string): { status: Status; value: string } {
  if (!input.trim()) return { status: { tone: 'info', text: 'Enter HTML to convert' }, value: '' }
  const documentNode = new DOMParser().parseFromString(input, 'text/html')
  const render = (node: Node, depth = 0): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (!(node instanceof HTMLElement)) return Array.from(node.childNodes).map((child) => render(child, depth)).join('')
    const content = Array.from(node.childNodes).map((child) => render(child, depth)).join('')
    const tag = node.tagName.toLowerCase()
    if (/^h[1-6]$/.test(tag)) return `${'#'.repeat(Number(tag[1]))} ${content.trim()}\n\n`
    if (tag === 'p') return `${content.trim()}\n\n`
    if (tag === 'strong' || tag === 'b') return `**${content}**`
    if (tag === 'em' || tag === 'i') return `*${content}*`
    if (tag === 'code') return node.parentElement?.tagName === 'PRE' ? content : `\`${content}\``
    if (tag === 'pre') return `\`\`\`\n${content.trim()}\n\`\`\`\n\n`
    if (tag === 'a') return `[${content}](${node.getAttribute('href') ?? ''})`
    if (tag === 'img') return `![${node.getAttribute('alt') ?? ''}](${node.getAttribute('src') ?? ''})`
    if (tag === 'blockquote') return `${content.trim().split('\n').map((line) => `> ${line}`).join('\n')}\n\n`
    if (tag === 'br') return '  \n'
    if (tag === 'hr') return '\n---\n\n'
    if (tag === 'li') return `${node.parentElement?.tagName === 'OL' ? `${Array.from(node.parentElement.children).indexOf(node) + 1}.` : '-'} ${content.trim()}\n`
    if (tag === 'ul' || tag === 'ol') return `${content}\n`
    return content
  }
  return { status: { tone: 'ok', text: 'HTML converted to Markdown' }, value: render(documentNode.body).replace(/\n{3,}/g, '\n\n').trim() }
}

type JsonChange = { path: string; type: 'added' | 'removed' | 'changed'; before: string; after: string }

function structuralJsonDiff(left: string, right: string): { status: Status; changes: JsonChange[] } {
  try {
    const before = JSON.parse(left) as unknown
    const after = JSON.parse(right) as unknown
    const changes: JsonChange[] = []
    const visit = (oldValue: unknown, newValue: unknown, path: string) => {
      if (Object.is(oldValue, newValue)) return
      const oldObject = oldValue !== null && typeof oldValue === 'object'
      const newObject = newValue !== null && typeof newValue === 'object'
      if (oldObject && newObject && Array.isArray(oldValue) === Array.isArray(newValue)) {
        const keys = new Set([...Object.keys(oldValue as object), ...Object.keys(newValue as object)])
        keys.forEach((key) => {
          const oldRecord = oldValue as Record<string, unknown>
          const newRecord = newValue as Record<string, unknown>
          const nextPath = Array.isArray(oldValue) ? `${path}[${key}]` : `${path}.${key}`
          if (!(key in oldRecord)) changes.push({ path: nextPath, type: 'added', before: '', after: JSON.stringify(newRecord[key]) })
          else if (!(key in newRecord)) changes.push({ path: nextPath, type: 'removed', before: JSON.stringify(oldRecord[key]), after: '' })
          else visit(oldRecord[key], newRecord[key], nextPath)
        })
      } else changes.push({ path, type: 'changed', before: JSON.stringify(oldValue), after: JSON.stringify(newValue) })
    }
    visit(before, after, '$')
    return { status: { tone: changes.length ? 'info' : 'ok', text: changes.length ? `${changes.length} structural changes found` : 'JSON structures are equal' }, changes }
  } catch (error) { return { status: { tone: 'warn', text: getErrorMessage(error) }, changes: [] } }
}

function generateMockJson(schema: string, count: number): { status: Status; value: string } {
  const fields: Array<{ name: string; type: MockType }> = []
  for (const [index, line] of schema.split(/\r?\n/).entries()) {
    if (!line.trim()) continue
    const match = line.match(/^\s*([A-Za-z_$][\w$.-]*)\s*:\s*(\w+)\s*$/)
    if (!match || !mockTypes.includes(match[2] as MockType)) return { status: { tone: 'warn', text: `Line ${index + 1}: use field:type with a supported type` }, value: '' }
    fields.push({ name: match[1], type: match[2] as MockType })
  }
  if (!fields.length) return { status: { tone: 'info', text: 'Define at least one field' }, value: '' }
  const names = ['Alex', 'Jordan', 'Morgan', 'Riley', 'Taylor', 'Casey']
  const makeValue = (type: MockType, index: number): string | number | boolean => {
    if (type === 'number') return randomInt(10000)
    if (type === 'boolean') return index % 2 === 0
    if (type === 'date') return new Date(Date.UTC(2024 + index % 3, index % 12, index % 28 + 1)).toISOString()
    if (type === 'uuid') return crypto.randomUUID()
    if (type === 'email') return `user${index + 1}@example.com`
    return `${names[index % names.length]} ${index + 1}`
  }
  const records = Array.from({ length: Math.max(1, Math.min(count || 1, 100)) }, (_, index) => Object.fromEntries(fields.map((field) => [field.name, makeValue(field.type, index)])))
  return { status: { tone: 'ok', text: `${records.length} mock records generated` }, value: JSON.stringify(records, null, 2) }
}

function shellTokens(input: string) {
  const tokens: string[] = []
  const pattern = /"((?:\\.|[^"])*)"|'([^']*)'|([^\s]+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(input.replace(/\\\r?\n/g, ' ')))) tokens.push((match[1] ?? match[2] ?? match[3]).replace(/\\"/g, '"'))
  return tokens
}

function convertCurl(input: string, language: 'fetch' | 'axios' | 'python'): { status: Status; value: string } {
  const tokens = shellTokens(input.trim())
  if (tokens[0]?.toLowerCase() !== 'curl') return { status: { tone: 'warn', text: 'Command must start with curl' }, value: '' }
  let method = 'GET'; let url = ''; let body = ''
  const headers: Record<string, string> = {}
  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === '-X' || token === '--request') method = (tokens[++index] ?? 'GET').toUpperCase()
    else if (token === '-H' || token === '--header') { const header = tokens[++index] ?? ''; const separator = header.indexOf(':'); if (separator > 0) headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim() }
    else if (['-d', '--data', '--data-raw', '--data-binary'].includes(token)) { body = tokens[++index] ?? ''; if (method === 'GET') method = 'POST' }
    else if (!token.startsWith('-')) url = token
  }
  if (!url) return { status: { tone: 'warn', text: 'No request URL found' }, value: '' }
  const headerJson = JSON.stringify(headers, null, 2)
  if (language === 'python') return { status: { tone: 'ok', text: 'Converted to Python requests' }, value: `import requests\n\nresponse = requests.request(\n    ${JSON.stringify(method)},\n    ${JSON.stringify(url)},\n    headers=${headerJson.replace(/true|false|null/g, (value) => ({ true: 'True', false: 'False', null: 'None' })[value] ?? value).replace(/^/gm, '    ').trim()},${body ? `\n    data=${JSON.stringify(body)},` : ''}\n)\nresponse.raise_for_status()` }
  if (language === 'axios') return { status: { tone: 'ok', text: 'Converted to Axios' }, value: `const response = await axios({\n  method: ${JSON.stringify(method.toLowerCase())},\n  url: ${JSON.stringify(url)},\n  headers: ${headerJson.replace(/^/gm, '  ').trim()},${body ? `\n  data: ${JSON.stringify(body)},` : ''}\n});` }
  return { status: { tone: 'ok', text: 'Converted to Fetch API' }, value: `const response = await fetch(${JSON.stringify(url)}, {\n  method: ${JSON.stringify(method)},\n  headers: ${headerJson.replace(/^/gm, '  ').trim()},${body ? `\n  body: ${JSON.stringify(body)},` : ''}\n});\nif (!response.ok) throw new Error(\`HTTP \${response.status}\`);` }
}

function formatDotenv(input: string): { status: Status; value: string; errors: string[] } {
  const errors: string[] = []
  const seen = new Map<string, number>()
  const output = input.split(/\r?\n/).map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return trimmed
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) { errors.push(`Line ${index + 1}: expected KEY=value syntax`); return trimmed }
    const [, key, value] = match
    if (seen.has(key)) errors.push(`Line ${index + 1}: duplicate key ${key} (first defined on line ${seen.get(key)})`)
    else seen.set(key, index + 1)
    if (!value) errors.push(`Line ${index + 1}: ${key} has an empty value`)
    if (/\s/.test(value) && !/^(['"]).*\1$/.test(value)) errors.push(`Line ${index + 1}: quote values containing spaces`)
    return `${key}=${value}`
  }).join('\n')
  return { status: { tone: errors.length ? 'warn' : 'ok', text: errors.length ? `${errors.length} dotenv issue${errors.length === 1 ? '' : 's'} found` : 'Valid dotenv file' }, value: output, errors }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read file'))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    if (!source) { reject(new Error('Choose an image first')); return }
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to decode image'))
    image.src = source
  })
}

async function resizeImage(source: string, width: number, height: number, type: 'image/png' | 'image/jpeg', quality: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192) throw new Error('Width and height must be whole numbers from 1 to 8192')
  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not available')
  context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL(type, quality)
}

function buildIco(images: Array<{ size: number; data: string }>) {
  const payloads = images.map(({ data }) => Uint8Array.from(atob(data.split(',')[1]), (char) => char.charCodeAt(0)))
  const directorySize = 6 + images.length * 16
  const output = new Uint8Array(directorySize + payloads.reduce((total, payload) => total + payload.length, 0))
  const view = new DataView(output.buffer)
  view.setUint16(2, 1, true); view.setUint16(4, images.length, true)
  let offset = directorySize
  images.forEach(({ size }, index) => {
    const entry = 6 + index * 16
    output[entry] = size >= 256 ? 0 : size; output[entry + 1] = size >= 256 ? 0 : size
    view.setUint16(entry + 4, 1, true); view.setUint16(entry + 6, 32, true)
    view.setUint32(entry + 8, payloads[index].length, true); view.setUint32(entry + 12, offset, true)
    output.set(payloads[index], offset); offset += payloads[index].length
  })
  return output
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function runRegex(pattern: string, flags: string, text: string): { status: Status; value: string } {
  try {
    const expression = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`)
    const matches = Array.from(text.matchAll(expression)).map((match, index) => `${index + 1}. ${match[0]} at index ${match.index}`)
    return { status: { tone: 'ok', text: `${matches.length} matches` }, value: matches.join('\n') }
  } catch (error) {
    return { status: { tone: 'warn', text: getErrorMessage(error) }, value: '' }
  }
}

function parseCsv(input: string) {
  return input.split(/\r?\n/).filter(Boolean).map((line) => {
    const cells: string[] = []
    let current = ''
    let quoted = false
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index]
      if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1 }
      else if (char === '"') quoted = !quoted
      else if (char === ',' && !quoted) { cells.push(current); current = '' }
      else current += char
    }
    cells.push(current)
    return cells
  })
}

function csvToObjects(input: string) {
  const [header = [], ...rows] = parseCsv(input)
  return rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])))
}

type EdiFormat = 'X12' | 'EDIFACT'
type ParsedEdi = { status: Status; format: EdiFormat; segments: { tag: string; elements: string[] }[]; errors: string[]; elementSeparator: string; segmentTerminator: string }

function splitEdi(value: string, delimiter: string, release = '') {
  const parts: string[] = []; let current = ''
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (release && character === release && value[index + 1] === delimiter) { current += delimiter; index += 1 }
    else if (release && character === release && value[index + 1] === release) { current += release; index += 1 }
    else if (character === delimiter) { parts.push(current); current = '' }
    else current += character
  }
  parts.push(current)
  return parts
}

function parseEdi(input: string): ParsedEdi {
  const source = input.trim()
  const format: EdiFormat = /^(UNA|UNB)[+:]/.test(source) ? 'EDIFACT' : 'X12'
  const hasUna = format === 'EDIFACT' && source.startsWith('UNA') && source.length >= 9
  const elementSeparator = format === 'EDIFACT' ? (hasUna ? source[4] : '+') : (source.startsWith('ISA') ? source[3] : '*')
  const segmentTerminator = format === 'EDIFACT' ? (hasUna ? source[8] : "'") : (source.startsWith('ISA') && source.length > 105 ? source[105] : source.includes('~') ? '~' : '\n')
  const release = format === 'EDIFACT' ? (hasUna ? source[6] : '?') : ''
  const ediBody = hasUna ? source.slice(9) : source
  const parsedSegments = splitEdi(ediBody, segmentTerminator, release).map((segment) => segment.trim()).filter(Boolean).map((segment) => {
    const values = splitEdi(segment, elementSeparator, release)
    return { tag: (values.shift() ?? '').trim().toUpperCase(), elements: values }
  })
  const segments = hasUna ? [{ tag: 'UNA', elements: [source.slice(3, 8)] }, ...parsedSegments] : parsedSegments
  if (!segments.length) return { status: { tone: 'info', text: 'Paste X12 or EDIFACT content to parse' }, format, segments, errors: [], elementSeparator, segmentTerminator }
  const errors = format === 'X12' ? validateX12(segments) : validateEdifact(segments)
  return { status: { tone: errors.length ? 'warn' : 'ok', text: `${segments.length} ${format} segments parsed${errors.length ? ` with ${errors.length} validation issue${errors.length === 1 ? '' : 's'}` : ' successfully'}` }, format, segments, errors, elementSeparator, segmentTerminator }
}

function formatEdi(input: string) {
  const parsed = parseEdi(input)
  return parsed.segments.map((segment) => segment.tag === 'UNA'
    ? `UNA${segment.elements[0]}${parsed.segmentTerminator}`
    : `${[segment.tag, ...segment.elements].join(parsed.elementSeparator)}${parsed.segmentTerminator === '\n' ? '' : parsed.segmentTerminator}`).join('\n')
}

function validateX12(segments: { tag: string; elements: string[] }[]) {
  const errors: string[] = []
  const tags = new Set(segments.map((segment) => segment.tag))
  const transaction = segments.find((segment) => segment.tag === 'ST')?.elements[0]
  const requireSegments = (setName: string, required: string[]) => required.forEach((tag) => { if (!tags.has(tag)) errors.push(`${setName}: required ${tag} segment is missing`) })
  if (!tags.has('ST') || !tags.has('SE')) errors.push('Transaction envelope must contain both ST and SE segments')
  if (transaction === '850') requireSegments('850 Purchase Order', ['BEG', 'PO1'])
  else if (transaction === '810') requireSegments('810 Invoice', ['BIG', 'IT1', 'TDS'])
  else if (transaction === '856') requireSegments('856 Ship Notice', ['BSN', 'HL'])
  else if (transaction) errors.push(`Transaction set ${transaction} is parsed, but validation rules are available only for 850, 810, and 856`)
  const startIndex = segments.findIndex((segment) => segment.tag === 'ST')
  const endIndex = segments.findIndex((segment, index) => index > startIndex && segment.tag === 'SE')
  if (startIndex >= 0 && endIndex > startIndex) {
    const declared = Number(segments[endIndex].elements[0])
    const actual = endIndex - startIndex + 1
    if (Number.isFinite(declared) && declared !== actual) errors.push(`SE01 declares ${declared} segments, but the transaction contains ${actual}`)
    if (segments[startIndex].elements[1] && segments[endIndex].elements[1] !== segments[startIndex].elements[1]) errors.push('ST02 and SE02 transaction control numbers do not match')
  }
  return errors
}

function validateEdifact(segments: { tag: string; elements: string[] }[]) {
  const tags = new Set(segments.map((segment) => segment.tag))
  const errors: string[] = []
  if (!tags.has('UNB') || !tags.has('UNZ')) errors.push('Interchange envelope must contain both UNB and UNZ segments')
  if (tags.has('UNH') !== tags.has('UNT')) errors.push('Message envelope must contain both UNH and UNT segments')
  return errors
}

function getEdiSegmentName(tag: string, format: EdiFormat = 'X12') {
  const x12Names: Record<string, string> = {
    ISA: 'Interchange Control Header',
    IEA: 'Interchange Control Trailer',
    GS: 'Functional Group Header',
    GE: 'Functional Group Trailer',
    ST: 'Transaction Set Header',
    SE: 'Transaction Set Trailer',
    BEG: 'Beginning Segment for Purchase Order',
    BIG: 'Beginning Segment for Invoice',
    BHT: 'Beginning of Hierarchical Transaction',
    NM1: 'Individual or Organizational Name',
    N1: 'Name',
    N3: 'Address Information',
    N4: 'Geographic Location',
    REF: 'Reference Information',
    DTM: 'Date/Time Reference',
    HL: 'Hierarchical Level',
    CLM: 'Claim Information',
    LX: 'Assigned Number',
    SV1: 'Professional Service',
    PO1: 'Purchase Order Baseline Item Data',
    PID: 'Product/Item Description',
    CTT: 'Transaction Totals',
    BSN: 'Beginning Segment for Ship Notice',
    IT1: 'Baseline Item Data for Invoice',
    TDS: 'Total Monetary Value Summary',
  }
  const edifactNames: Record<string, string> = { UNA: 'Service String Advice', UNB: 'Interchange Header', UNZ: 'Interchange Trailer', UNH: 'Message Header', UNT: 'Message Trailer', BGM: 'Beginning of Message', DTM: 'Date or Time or Period', NAD: 'Name and Address', LIN: 'Line Item', QTY: 'Quantity', MOA: 'Monetary Amount', RFF: 'Reference', UNS: 'Section Control' }
  return (format === 'EDIFACT' ? edifactNames : x12Names)[tag] ?? `${format} Segment`
}

function getEdiElementName(tag: string, position: number, format: EdiFormat) {
  const annotations: Record<string, string[]> = format === 'EDIFACT' ? {
    UNA: ['Component, element, decimal, release, and repetition characters'],
    UNB: ['Syntax identifier', 'Interchange sender', 'Interchange recipient', 'Preparation date/time', 'Interchange control reference'],
    UNH: ['Message reference number', 'Message identifier'],
    BGM: ['Document/message name', 'Document/message number', 'Message function'],
    DTM: ['Date/time/period details'],
    NAD: ['Party function qualifier', 'Party identification details', 'Name and address', 'Party name', 'Street', 'City', 'Country subdivision', 'Postal code', 'Country code'],
    LIN: ['Line item identifier', 'Action request', 'Item number identification'],
    QTY: ['Quantity details'],
  } : {
    ISA: ['Authorization qualifier', 'Authorization information', 'Security qualifier', 'Security information', 'Sender qualifier', 'Sender ID', 'Receiver qualifier', 'Receiver ID', 'Interchange date', 'Interchange time', 'Repetition separator', 'Control version', 'Control number', 'Acknowledgment requested', 'Usage indicator', 'Component separator'],
    ST: ['Transaction set identifier', 'Transaction control number', 'Implementation convention reference'],
    BEG: ['Purpose code', 'Purchase order type', 'Purchase order number', 'Release number', 'Purchase order date'],
    BIG: ['Invoice date', 'Invoice number', 'Purchase order date', 'Purchase order number'],
    BSN: ['Purpose code', 'Shipment identification', 'Shipment date', 'Shipment time', 'Hierarchical structure code'],
    PO1: ['Assigned identification', 'Quantity ordered', 'Unit of measure', 'Unit price', 'Basis of unit price'],
    IT1: ['Assigned identification', 'Quantity invoiced', 'Unit of measure', 'Unit price', 'Basis of unit price'],
    HL: ['Hierarchical ID number', 'Parent ID number', 'Level code', 'Child code'],
    SE: ['Number of included segments', 'Transaction control number'],
  }
  return annotations[tag]?.[position - 1] ?? `Element ${position}`
}

function jsonToCsv(value: unknown) {
  const rows = Array.isArray(value) ? value : [value]
  const objects = rows.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null && !Array.isArray(row))
  const headers = Array.from(new Set(objects.flatMap((row) => Object.keys(row))))
  const escapeCell = (cell: unknown) => `"${String(cell ?? '').replace(/"/g, '""')}"`
  return [headers.join(','), ...objects.map((row) => headers.map((header) => escapeCell(row[header])).join(','))].join('\n')
}

function jsonToXml(value: unknown, rootName: string): string {
  const node = (key: string, data: unknown): string => {
    if (Array.isArray(data)) return data.map((item) => node(key === rootName ? 'item' : key, item)).join('')
    if (typeof data === 'object' && data !== null) {
      return `<${key}>${Object.entries(data).map(([childKey, childValue]) => node(cleanTag(childKey), childValue)).join('')}</${key}>`
    }
    return `<${key}>${escapeXml(String(data ?? ''))}</${key}>`
  }
  return formatMarkup(node(rootName, value))
}

function xmlToJson(xml: string): { status: Status; value: string } {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const error = doc.querySelector('parsererror')
  if (error) return { status: { tone: 'warn', text: 'Invalid XML' }, value: '' }
  return { status: { tone: 'ok', text: 'XML converted to JSON' }, value: JSON.stringify(xmlElementToObject(doc.documentElement), null, 2) }
}

function xmlElementToObject(element: Element): string | Record<string, unknown> {
  if (!element.children.length) return element.textContent ?? ''
  const output: Record<string, unknown> = {}
  Array.from(element.children).forEach((child) => {
    const value = xmlElementToObject(child)
    if (output[child.tagName]) output[child.tagName] = Array.isArray(output[child.tagName]) ? [...output[child.tagName] as unknown[], value] : [output[child.tagName], value]
    else output[child.tagName] = value
  })
  return output
}

function validateXmlWithSchemaHint(xml: string, xsd: string): Status {
  const parsedXml = new DOMParser().parseFromString(xml, 'application/xml')
  if (parsedXml.querySelector('parsererror')) return { tone: 'warn', text: 'XML is not well formed' }
  const parsedXsd = new DOMParser().parseFromString(xsd, 'application/xml')
  if (parsedXsd.querySelector('parsererror')) return { tone: 'warn', text: 'XSD is not well formed XML' }
  const rootName = parsedXsd.querySelector('element[name]')?.getAttribute('name')
  if (rootName && parsedXml.documentElement.tagName !== rootName) return { tone: 'warn', text: `XML root should be ${rootName}` }
  return { tone: 'ok', text: 'XML is well formed and matches the schema root hint' }
}

function makeLorem(count: number, mode: 'paragraphs' | 'sentences' | 'words') {
  const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ')
  const safeCount = Math.max(1, Math.min(count, 50))
  const sentence = (offset: number) => Array.from({ length: 12 }, (_, index) => words[(index + offset) % words.length]).join(' ').replace(/^./, (char) => char.toUpperCase()) + '.'
  if (mode === 'words') return Array.from({ length: safeCount }, (_, index) => words[index % words.length]).join(' ')
  if (mode === 'sentences') return Array.from({ length: safeCount }, (_, index) => sentence(index)).join(' ')
  return Array.from({ length: safeCount }, (_, index) => `${sentence(index)} ${sentence(index + 5)} ${sentence(index + 9)}`).join('\n\n')
}

function generatePasswords(options: { length: number; includeUpper: boolean; includeLower: boolean; includeNumbers: boolean; includeSymbols: boolean }): { status: Status; value: string } {
  const pools = [
    options.includeUpper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    options.includeLower ? 'abcdefghijklmnopqrstuvwxyz' : '',
    options.includeNumbers ? '0123456789' : '',
    options.includeSymbols ? '!@#$%^&*()-_=+[]{};:,.?/|' : '',
  ].filter(Boolean)
  const pool = pools.join('')
  const length = Math.max(8, Math.min(options.length, 128))
  if (!pool) return { status: { tone: 'warn', text: 'Select at least one character set' }, value: '' }

  const makePassword = () => {
    const required = pools.map((set) => set[randomInt(set.length)])
    const remaining = Array.from({ length: Math.max(length - required.length, 0) }, () => pool[randomInt(pool.length)])
    return shuffle([...required, ...remaining]).join('')
  }

  return { status: { tone: 'ok', text: 'Passwords generated with crypto randomness' }, value: Array.from({ length: 5 }, makePassword).join('\n') }
}

function randomInt(max: number) {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % max
}

function shuffle(values: string[]) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function getTextStats(value: string) {
  return { words: value.trim() ? value.trim().split(/\s+/).length : 0, characters: value.length, lines: value ? value.split(/\r?\n/).length : 0, sentences: value.trim() ? (value.match(/[.!?]+(?=\s|$)/g) ?? []).length || 1 : 0 }
}

function textToolOutput(input: string, mode: string, stats: ReturnType<typeof getTextStats>) {
  switch (mode) {
    case 'word-counter': return String(stats.words)
    case 'character-counter': return String(stats.characters)
    case 'line-counter': return String(stats.lines)
    case 'sentence-counter': return String(stats.sentences)
    case 'dedupe': return Array.from(new Set(input.split(/\r?\n/))).join('\n')
    case 'remove-empty-lines': return input.split(/\r?\n/).filter((line) => line.trim()).join('\n')
    case 'remove-extra-spaces': return input.replace(/[ \t]+/g, ' ')
    case 'sort-lines-alphabetically': return input.split(/\r?\n/).sort((left, right) => left.localeCompare(right)).join('\n')
    case 'reverse-line-order': return input.split(/\r?\n/).reverse().join('\n')
    default: return input
  }
}

function crc32(value: string | ArrayBuffer) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value)
  let checksum = 0xffffffff
  for (const byte of bytes) {
    checksum ^= byte
    for (let bit = 0; bit < 8; bit += 1) checksum = (checksum >>> 1) ^ (checksum & 1 ? 0xedb88320 : 0)
  }
  return ((checksum ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0').toUpperCase()
}

function markdownToHtml(input: string) {
  const output: string[] = []
  let listOpen = false
  const inline = (value: string) => escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
  const closeList = () => {
    if (!listOpen) return
    output.push('</ul>')
    listOpen = false
  }

  input.split(/\r?\n/).forEach((line) => {
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    const listItem = line.match(/^[-*]\s+(.*)$/)
    if (listItem) {
      if (!listOpen) { output.push('<ul>'); listOpen = true }
      output.push(`<li>${inline(listItem[1])}</li>`)
    } else if (heading) {
      closeList()
      const level = heading[1].length
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (line.trim()) {
      closeList()
      output.push(`<p>${inline(line)}</p>`)
    } else {
      closeList()
    }
  })
  closeList()
  return output.join('\n')
}

function convertColor(input: string): { status: Status; hex: string; value: string } {
  const match = input.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!match) return { status: { tone: 'warn', text: 'Enter a 6 digit HEX color' }, hex: '#000000', value: '' }
  const hex = `#${match[1]}`
  const red = parseInt(match[1].slice(0, 2), 16)
  const green = parseInt(match[1].slice(2, 4), 16)
  const blue = parseInt(match[1].slice(4, 6), 16)
  const hsl = rgbToHsl(red, green, blue)
  return { status: { tone: 'ok', text: 'Color converted' }, hex, value: `HEX: ${hex}\nRGB: rgb(${red}, ${green}, ${blue})\nHSL: hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)` }
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let hue = 0
  let saturation = 0
  const lightness = (max + min) / 2
  if (max !== min) {
    const delta = max - min
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    hue = max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
    hue /= 6
  }
  return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(lightness * 100)]
}

function explainCron(cron: string): { status: Status; value: string } {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return { status: { tone: 'warn', text: 'Cron should have 5 fields' }, value: 'Expected: minute hour day-of-month month day-of-week' }
  const labels = ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week']
  return { status: { tone: 'ok', text: 'Cron expression parsed' }, value: parts.map((part, index) => `${labels[index]}: ${describeCronPart(part)}`).join('\n') }
}

function describeCronPart(part: string) {
  if (part === '*') return 'every value'
  if (part.includes('/')) return `every ${part.split('/')[1]} units`
  if (part.includes(',')) return `at ${part.split(',').join(', ')}`
  if (part.includes('-')) return `from ${part.split('-').join(' through ')}`
  return `at ${part}`
}

const caseLabels = {
  camel: 'camelCase',
  snake: 'snake_case',
  kebab: 'kebab-case',
  pascal: 'PascalCase',
  constant: 'CONSTANT_CASE',
  title: 'Title Case',
} as const

type CaseMode = keyof typeof caseLabels

function splitWords(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
}

function convertCase(input: string, mode: CaseMode) {
  const words = splitWords(input)
  const capitalize = (word: string) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : ''
  if (mode === 'camel') return words.map((word, index) => index ? capitalize(word) : word).join('')
  if (mode === 'pascal') return words.map(capitalize).join('')
  if (mode === 'snake') return words.join('_')
  if (mode === 'kebab') return words.join('-')
  if (mode === 'constant') return words.join('_').toUpperCase()
  return words.map(capitalize).join(' ')
}

function convertNumberBase(input: string, sourceBase: number): { status: Status; values: Record<number, string> } {
  const normalized = input.trim().replace(/_/g, '')
  if (!normalized) return { status: { tone: 'info', text: 'Enter an integer to convert' }, values: {} }
  const signless = normalized.replace(/^[+-]/, '')
  const digitPatterns: Record<number, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[\da-f]+$/i }
  if (!digitPatterns[sourceBase]?.test(signless)) return { status: { tone: 'warn', text: `Invalid base ${sourceBase} integer` }, values: {} }
  try {
    const sign = normalized.startsWith('-') ? -1n : 1n
    const prefixes: Record<number, string> = { 2: '0b', 8: '0o', 10: '', 16: '0x' }
    const value = sign * BigInt(`${prefixes[sourceBase]}${signless}`)
    return { status: { tone: 'ok', text: 'Integer converted exactly' }, values: Object.fromEntries(numberBases.map((base) => [base.value, value.toString(base.value).toUpperCase()])) }
  } catch (error) {
    return { status: { tone: 'warn', text: getErrorMessage(error) }, values: {} }
  }
}

function slugify(input: string) {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
}

function getNextCronRuns(cron: string): { status: Status; value: string } {
  try {
    const interval = CronExpressionParser.parse(cron.trim())
    const runs = Array.from({ length: 5 }, () => interval.next().toDate().toLocaleString())
    return { status: { tone: 'ok', text: 'Cron expression parsed' }, value: runs.map((run, index) => `${index + 1}. ${run}`).join('\n') }
  } catch (error) {
    return { status: { tone: 'warn', text: getErrorMessage(error) }, value: '' }
  }
}

function useShareableInput(defaultValue: string): [string, (value: string) => void] {
  const [value, setValue] = useState(() => new URLSearchParams(window.location.search).get('input') ?? defaultValue)
  const updateValue = (nextValue: string) => {
    setValue(nextValue)
    const url = new URL(window.location.href)
    if (nextValue && nextValue.length <= 3000) url.searchParams.set('input', nextValue)
    else url.searchParams.delete('input')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }
  return [value, updateValue]
}

function calculateExpression(input: string): { status: Status; value: string } {
  if (!input.trim()) return { status: { tone: 'info', text: 'Enter an expression to calculate' }, value: '' }
  try {
    const result = parseMathExpression(input)
    if (!Number.isFinite(result)) return { status: { tone: 'warn', text: 'Result is not a finite number' }, value: '' }
    return { status: { tone: 'ok', text: 'Calculated' }, value: String(result) }
  } catch (error) {
    return { status: { tone: 'warn', text: getErrorMessage(error) }, value: '' }
  }
}

function parseMathExpression(input: string) {
  const tokens = input.match(/sqrt|sin|cos|tan|\d*\.?\d+(?:e[+-]?\d+)?|[()+\-*/^]/gi) ?? []
  if (tokens.join('').toLowerCase() !== input.replace(/\s+/g, '').toLowerCase()) throw new Error('Unsupported character in expression')
  let position = 0

  const peek = () => tokens[position]
  const take = () => tokens[position++]
  const parseExpression = (): number => {
    let value = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const operator = take()
      const nextValue = parseTerm()
      value = operator === '+' ? value + nextValue : value - nextValue
    }
    return value
  }
  const parseTerm = (): number => {
    let value = parsePower()
    while (peek() === '*' || peek() === '/') {
      const operator = take()
      const nextValue = parsePower()
      value = operator === '*' ? value * nextValue : value / nextValue
    }
    return value
  }
  const parsePower = (): number => {
    let value = parseFactor()
    if (peek() === '^') {
      take()
      value = value ** parsePower()
    }
    return value
  }
  const parseFactor = (): number => {
    const token = take()
    if (!token) throw new Error('Incomplete expression')
    if (token === '+') return parseFactor()
    if (token === '-') return -parseFactor()
    if (token === '(') {
      const value = parseExpression()
      if (take() !== ')') throw new Error('Missing closing parenthesis')
      return value
    }
    if (/^(sqrt|sin|cos|tan)$/i.test(token)) {
      if (take() !== '(') throw new Error(`${token} requires parentheses`)
      const value = parseExpression()
      if (take() !== ')') throw new Error('Missing closing parenthesis')
      const fn = token.toLowerCase()
      if (fn === 'sqrt') return Math.sqrt(value)
      if (fn === 'sin') return Math.sin(value)
      if (fn === 'cos') return Math.cos(value)
      return Math.tan(value)
    }
    const number = Number(token)
    if (Number.isNaN(number)) throw new Error(`Unexpected token: ${token}`)
    return number
  }

  const result = parseExpression()
  if (position < tokens.length) throw new Error(`Unexpected token: ${tokens[position]}`)
  return result
}

function cleanTag(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '') || 'item'
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeHtml(value: string) {
  return escapeXml(value).replace(/"/g, '&quot;')
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

function copyToClipboard(value: string) {
  navigator.clipboard?.writeText(value)
}

export default App
