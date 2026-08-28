import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import './App.css'

type ToolId =
  | 'json-formatter'
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
  | 'jwt-decoder'
  | 'diff-checker'
  | 'regex-tester'
  | 'json-validator'
  | 'json-path-tester'
  | 'xsd-validator'
  | 'csv-viewer'
  | 'json-xml-converter'
  | 'json-csv-converter'
  | 'csv-xml-converter'
  | 'edi-x12-formatter'
  | 'edi-segment-viewer'
  | 'edi-json-converter'
  | 'uuid-generator'
  | 'qr-generator'
  | 'password-generator'
  | 'lorem-ipsum'
  | 'text-tools'
  | 'markdown'
  | 'color-converter'
  | 'timestamp'
  | 'cron-expression'
  | 'calculator'
  | 'contact'

type Tool = { id: ToolId; name: string; description: string; icon: string; category: string }
type DiffLine = { type: 'common' | 'added' | 'removed'; value: string }
type Status = { tone: 'ok' | 'warn' | 'info'; text: string }

const categories = [
  {
    name: 'Formatters',
    tools: [
      { id: 'json-formatter', name: 'JSON Formatter', description: 'Beautify, minify, and validate JSON', icon: '{ }' },
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
      { id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens', icon: 'JWT' },
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
    ],
  },
  {
    name: 'Converters',
    tools: [
      { id: 'json-xml-converter', name: 'JSON to XML Converter', description: 'Convert JSON and XML both ways', icon: 'JX' },
      { id: 'json-csv-converter', name: 'JSON to CSV Converter', description: 'Convert JSON arrays and CSV both ways', icon: 'JC' },
      { id: 'csv-xml-converter', name: 'CSV to XML Converter', description: 'Convert CSV records and XML both ways', icon: 'CX' },
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
      { id: 'markdown', name: 'Markdown Preview', description: 'Live markdown editor and preview', icon: 'MD' },
      { id: 'color-converter', name: 'Color Converter', description: 'Convert HEX, RGB, and HSL colors', icon: 'RGB' },
      { id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps and dates', icon: 'TS' },
      { id: 'cron-expression', name: 'Cron Expression', description: 'Build and explain cron schedules', icon: 'CR' },
      { id: 'calculator', name: 'Calculator', description: 'Scientific calculator for quick math', icon: 'CAL' },
    ],
  },
] satisfies { name: string; tools: Omit<Tool, 'category'>[] }[]

const contactTool: Tool = { id: 'contact', name: 'Contact', description: 'Contact form and project details', icon: '@', category: 'Contact' }

const tools: Tool[] = categories.flatMap((category) =>
  category.tools.map((tool) => ({ ...tool, category: category.name })),
)

const routeTools = [...tools, contactTool]
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

function updateSeo(tool: Tool | null) {
  const title = tool ? `${tool.name} - Codepackr` : 'Codepackr - Free Online Developer Tools'
  const description = tool
    ? `${tool.description}. Free online ${tool.name.toLowerCase()} from Codepackr. Runs locally in your browser.`
    : 'Free online developer tools for formatting, validating, encoding, converting, and inspecting data locally in your browser.'
  const canonical = `${siteUrl}${tool ? getToolPath(tool.id) : '/'}`
  const keywords = tool
    ? `${tool.name.toLowerCase()}, ${tool.category.toLowerCase()}, codepackr, developer tools, online tools`
    : 'developer tools, json formatter, sql formatter, yaml formatter, diff checker, base64 encoder, qr code generator, password generator, edi tools'

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
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [query, setQuery] = useState('')
  const [dark, setDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  const [menuOpen, setMenuOpen] = useState(false)
  const currentTool = activeTool ? routeTools.find((tool) => tool.id === activeTool) ?? null : null
  const filteredTools = tools.filter((tool) =>
    `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    setActiveTool(getToolIdFromLocation())
    const handleNavigation = () => setActiveTool(getToolIdFromLocation())
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  useEffect(() => {
    updateSeo(currentTool)
  }, [currentTool])

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

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="site-header">
        <div className="header-inner">
          <button className="logo" onClick={selectHome}>
            <span className="logo-mark">{'{ }'}</span>
            <span className="logo-text">Code</span>
            <span className="logo-pack">packr</span>
          </button>
          <nav className="main-nav" aria-label="Tool categories">
            {categories.map((category) => (
              <div className="nav-item" key={category.name}>
                <button type="button">{category.name} <span className="nav-arrow">v</span></button>
                <div className="nav-dropdown">
                  {category.tools.map((tool) => (
                    <button className={activeTool === tool.id ? 'active' : ''} key={tool.id} onClick={() => selectTool(tool.id)} type="button">
                      <span className="dd-icon">{tool.icon}</span>{tool.name}
                    </button>
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
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools..."
                value={query}
              />
            </div>
            <button className="theme-button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
              {dark ? 'Light' : 'Dark'}
            </button>
            <button className={activeTool === 'contact' ? 'contact-button active' : 'contact-button'} onClick={() => selectTool('contact')} type="button">Contact</button>
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
              <button className={activeTool === tool.id ? 'active' : ''} key={tool.id} onClick={() => selectTool(tool.id)} type="button">
                {tool.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      <main id="top" className="page">
        {!currentTool ? <HomePage filteredTools={filteredTools} onSelectTool={selectTool} query={query} /> : currentTool.id === 'contact' ? <ContactPage /> : <>
        <section className="hero">
          <div>
            <div className="breadcrumb">Home / {currentTool.category} / {currentTool.name}</div>
            <h1>{currentTool.name}</h1>
            <p className="intro">{currentTool.description}. All processing runs locally in your browser.</p>
          </div>
          <div className="hero-count"><strong>25+<i aria-hidden="true" className="count-light" /></strong><span>tools available</span></div>
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
                    <button
                      className={activeTool === tool.id ? 'tool-link active' : 'tool-link'}
                      key={tool.id}
                      onClick={() => selectTool(tool.id)}
                    >
                      <span>{tool.icon}</span>
                      <div><strong>{tool.name}</strong><small>{tool.description}</small></div>
                    </button>
                    ))}
                  </div>
                </details>
              )
            })}
          </aside>

          <section className="tool-shell">
            <ToolRenderer tool={currentTool} />
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

function HomePage({ filteredTools, onSelectTool, query }: { filteredTools: Tool[]; onSelectTool: (toolId: ToolId) => void; query: string }) {
  return (
    <>
      <section className="home-hero">
        <div>
          <div className="breadcrumb">Home / Developer Tools</div>
          <h1>Codepackr</h1>
          <p className="intro">Everything a developer needs, packed in one place. Format, validate, encode, convert, and inspect data locally in your browser.</p>
        </div>
        <div className="hero-count"><strong>25+<i aria-hidden="true" className="count-light" /></strong><span>tools available</span></div>
      </section>

      <section className="index-menu" aria-label="Tool index">
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
                  <button className="index-card" key={tool.id} onClick={() => onSelectTool(tool.id)} type="button">
                    <span className="index-icon">{tool.icon}</span>
                    <div>
                      <h3>{tool.name}</h3>
                      <p>{tool.description}</p>
                    </div>
                    <span className="index-arrow">-&gt;</span>
                  </button>
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

function ToolRenderer({ tool }: { tool: Tool }) {
  switch (tool.id) {
    case 'json-formatter':
      return <JsonFormatter />
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
    case 'jwt-decoder':
      return <JwtTool />
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
    case 'markdown':
      return <MarkdownTool />
    case 'color-converter':
      return <ColorTool />
    case 'timestamp':
      return <TimestampTool />
    case 'cron-expression':
      return <CronTool />
    case 'calculator':
      return <CalculatorTool />
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

function JwtTool() {
  const [token, setToken] = useState('')
  const decoded = useMemo(() => decodeJwt(token), [token])
  return <ToolPanel status={decoded.status}><div className="workbench"><TextareaBox label="JWT token" value={token} onChange={setToken} placeholder="Paste a JWT token" /><OutputBox label="Decoded header and payload" value={decoded.value} /></div></ToolPanel>
}

function DiffTool() {
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true)
  const [wrap, setWrap] = useState(true)
  const diff = useMemo(() => buildDiff(original, modified, ignoreWhitespace), [original, modified, ignoreWhitespace])
  const added = diff.filter((line) => line.type === 'added').length
  const removed = diff.filter((line) => line.type === 'removed').length

  return (
    <ToolPanel>
      <Actions><button className={ignoreWhitespace ? 'active-toggle' : ''} onClick={() => setIgnoreWhitespace((value) => !value)}>Ignore whitespace</button><button className={wrap ? 'active-toggle' : ''} onClick={() => setWrap((value) => !value)}>Wrap lines</button><button onClick={() => { setOriginal(''); setModified('') }}>Clear</button><span className="stat-pill">+{added} / -{removed}</span></Actions>
      <div className="workbench"><TextareaBox label="Original" value={original} onChange={setOriginal} /><TextareaBox label="Modified" value={modified} onChange={setModified} /></div>
      <div className={wrap ? 'diff-lines wrap' : 'diff-lines'}>{diff.map((line, index) => <div className={`diff-row ${line.type}`} key={`${line.type}-${index}`}><span>{line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}</span><code>{line.value || ' '}</code></div>)}</div>
    </ToolPanel>
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

const sampleEdi = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *260826*1200*U*00401*000000001*0*T*:~GS*PO*SENDER*RECEIVER*20260826*1200*1*X*004010~ST*850*0001~BEG*00*SA*12345**20260826~SE*3*0001~GE*1*1~IEA*1*000000001~'

function EdiFormatter() {
  const [input, setInput] = useState(sampleEdi)
  const parsed = useMemo(() => parseEdi(input), [input])
  const output = useMemo(() => formatEdi(input), [input])
  return <ToolPanel status={parsed.status}><div className="workbench"><TextareaBox label="EDI X12 input" value={input} onChange={setInput} /><OutputBox label="Formatted EDI" value={output} /></div></ToolPanel>
}

function EdiSegmentViewer() {
  const [input, setInput] = useState(sampleEdi)
  const parsed = useMemo(() => parseEdi(input), [input])
  const rows = useMemo(() => [['Segment', 'Name', 'Elements'], ...parsed.segments.map((segment) => [segment.tag, getEdiSegmentName(segment.tag), segment.elements.join(' | ')])], [parsed.segments])
  return <ToolPanel status={parsed.status}><TextareaBox label="EDI X12 input" value={input} onChange={setInput} /><DataTable rows={rows} /></ToolPanel>
}

function EdiJsonConverter() {
  const [input, setInput] = useState(sampleEdi)
  const parsed = useMemo(() => parseEdi(input), [input])
  const output = useMemo(() => JSON.stringify(parsed.segments.map((segment, index) => ({ index: index + 1, tag: segment.tag, name: getEdiSegmentName(segment.tag), elements: segment.elements })), null, 2), [parsed.segments])
  return <ToolPanel status={parsed.status}><div className="workbench"><TextareaBox label="EDI X12 input" value={input} onChange={setInput} /><OutputBox label="JSON output" value={output} /></div></ToolPanel>
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

function TextTools() {
  const [input, setInput] = useState('Paste your text here\nPaste your text here')
  const [find, setFind] = useState('Paste')
  const [replace, setReplace] = useState('Add')
  const [output, setOutput] = useState('')
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const stats = getTextStats(input)
  const transform = (mode: string) => { setActiveMode(mode); setOutput(transformText(input, mode, find, replace)) }
  return <ToolPanel status={{ tone: 'info', text: `${stats.words} words, ${stats.characters} characters, ${stats.lines} lines` }}><Actions><button className={activeMode === 'upper' ? 'primary' : ''} onClick={() => transform('upper')}>Uppercase</button><button className={activeMode === 'lower' ? 'primary' : ''} onClick={() => transform('lower')}>Lowercase</button><button className={activeMode === 'title' ? 'primary' : ''} onClick={() => transform('title')}>Title Case</button><button className={activeMode === 'dedupe' ? 'primary' : ''} onClick={() => transform('dedupe')}>Remove Duplicates</button><button className={activeMode === 'sort' ? 'primary' : ''} onClick={() => transform('sort')}>Sort Lines</button><button className={activeMode === 'trim' ? 'primary' : ''} onClick={() => transform('trim')}>Clean Spaces</button><button className={activeMode === 'reverse' ? 'primary' : ''} onClick={() => transform('reverse')}>Reverse</button></Actions><div className="inline-fields"><input value={find} onChange={(event) => setFind(event.target.value)} placeholder="Find" /><input value={replace} onChange={(event) => setReplace(event.target.value)} placeholder="Replace" /><button className={activeMode === 'replace' ? 'primary' : ''} onClick={() => transform('replace')}>Replace</button></div><div className="workbench"><TextareaBox label="Input" value={input} onChange={setInput} /><OutputBox label="Output" value={output} /></div></ToolPanel>
}

function MarkdownTool() {
  const [input, setInput] = useState('# Markdown Preview\n\nType **markdown** and see HTML preview.\n\n- JSON\n- Diff\n- Base64')
  return <ToolPanel><div className="workbench"><TextareaBox label="Markdown" value={input} onChange={setInput} /><div className="preview" dangerouslySetInnerHTML={{ __html: markdownToHtml(input) }} /></div></ToolPanel>
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
  const [cron, setCron] = useState('* * * * *')
  const explanation = useMemo(() => explainCron(cron), [cron])
  return <ToolPanel status={explanation.status}><label className="field"><span>Cron expression</span><input value={cron} onChange={(event) => setCron(event.target.value)} /></label><OutputBox label="Explanation" value={explanation.value} /></ToolPanel>
}

function CalculatorTool() {
  const [expression, setExpression] = useState('')
  const result = useMemo(() => calculateExpression(expression), [expression])
  const addInput = (value: string) => setExpression((currentExpression) => currentExpression + value)
  return <ToolPanel status={result.status}><Actions><button className="primary" onClick={() => setExpression('')}>Clear</button></Actions><label className="field"><span>Expression</span><input value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="Enter expression, for example sqrt(16) + 2^3" /></label><div className="calculator-pad">{['7','8','9','/','sqrt(','4','5','6','*','^','1','2','3','-','(', '0','.','C','+',')'].map((key) => <button key={key} onClick={() => key === 'C' ? setExpression('') : addInput(key)}>{key}</button>)}</div><Result label="Result" value={result.value} /></ToolPanel>
}

function ContactTool() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>({ tone: 'info', text: 'Your message is sent securely to our team.' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSending(true)
    setStatus({ tone: 'info', text: 'Sending message...' })

    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('_replyto', email)
    formData.append('_subject', `Codepackr: ${subject}`)
    formData.append('message', `Topic: ${subject}\n\n${message}`)

    try {
      const response = await fetch('https://formspree.io/f/xnjgovzw', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const errorMessage = Array.isArray(data.errors) ? data.errors.map((error: { message: string }) => error.message).join(', ') : `Error ${response.status}`
        throw new Error(errorMessage)
      }
      setSent(true)
      setStatus({ tone: 'ok', text: 'Message sent! Thank you for reaching out. We will get back to you within 24-48 hours.' })
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (error) {
      setStatus({ tone: 'warn', text: `${getErrorMessage(error)}. Please try again.` })
    } finally {
      setSending(false)
    }
  }

  return (
    <ToolPanel status={status}>
      {sent ? <div className="success-card"><strong>Message sent!</strong><span>Thank you for reaching out. We will get back to you within 24-48 hours.</span></div> : null}
      <form className="contact-form" onSubmit={submitContact}>
        <div className="contact-grid">
          <label className="field"><span>Your Name *</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Kumar" /></label>
          <label className="field"><span>Email Address *</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="kumar@example.com" /></label>
          <label className="field"><span>Subject *</span><select required value={subject} onChange={(event) => setSubject(event.target.value)}><option value="">Select a topic...</option><option value="bug">Bug Report</option><option value="feature">Feature / Tool Request</option><option value="feedback">General Feedback</option><option value="other">Other</option></select></label>
          <TextareaBox label="Message *" value={message} onChange={setMessage} placeholder="Describe your bug, suggestion, or feedback..." />
        </div>
        <button className="primary submit-button" disabled={sending} type="submit">{sending ? 'Sending...' : 'Send Message'}</button>
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
    if (!path.trim().startsWith('$')) return { status: { tone: 'warn', text: 'JSONPath must start with $' }, value: '' }
    const tokens = tokenizeJsonPath(path)
    let current: unknown = data
    for (const token of tokens) {
      if (Array.isArray(current) && typeof token === 'number') current = current[token]
      else if (current && typeof current === 'object' && typeof token === 'string') current = (current as Record<string, unknown>)[token]
      else return { status: { tone: 'warn', text: `No match at ${String(token)}` }, value: '' }
    }
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

function parseEdi(input: string): { status: Status; segments: { tag: string; elements: string[] }[] } {
  const delimiter = input.includes('~') ? '~' : '\n'
  const segments = input
    .split(delimiter)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [tag = '', ...elements] = segment.split('*')
      return { tag: tag.trim().toUpperCase(), elements }
    })

  if (!segments.length) return { status: { tone: 'info', text: 'Paste EDI X12 content to parse' }, segments }
  const hasTransaction = segments.some((segment) => segment.tag === 'ST') && segments.some((segment) => segment.tag === 'SE')
  const hasEnvelope = segments.some((segment) => segment.tag === 'ISA') && segments.some((segment) => segment.tag === 'IEA')
  const tone = hasTransaction ? 'ok' : 'warn'
  const envelopeText = hasEnvelope ? ' with interchange envelope' : ''
  return { status: { tone, text: `${segments.length} segments parsed${envelopeText}${hasTransaction ? '' : '. ST/SE transaction envelope not found'}` }, segments }
}

function formatEdi(input: string) {
  return parseEdi(input).segments.map((segment) => `${[segment.tag, ...segment.elements].join('*')}~`).join('\n')
}

function getEdiSegmentName(tag: string) {
  const names: Record<string, string> = {
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
  }
  return names[tag] ?? 'EDI Segment'
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
  return { words: value.trim() ? value.trim().split(/\s+/).length : 0, characters: value.length, lines: value ? value.split('\n').length : 0 }
}

function transformText(input: string, mode: string, find: string, replace: string) {
  switch (mode) {
    case 'upper': return input.toUpperCase()
    case 'lower': return input.toLowerCase()
    case 'title': return input.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
    case 'dedupe': return Array.from(new Set(input.split(/\r?\n/))).join('\n')
    case 'sort': return input.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n')
    case 'trim': return input.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    case 'reverse': return Array.from(input).reverse().join('')
    case 'replace': return find ? input.split(find).join(replace) : input
    default: return input
  }
}

function markdownToHtml(input: string) {
  return escapeHtml(input)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br>')
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
