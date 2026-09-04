import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, RefreshCw, Play, AlertTriangle, CheckCircle2, FileCode2, Sparkles } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface XsltTransformerViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

interface XsltPreset {
  name: string;
  description: string;
  xml: string;
  xslt: string;
}

const PRESETS: Record<string, XsltPreset> = {
  edi_to_canonical: {
    name: 'EDI XML to Canonical PO',
    description: 'Transform raw EDI 850 XML tags (BEG, PO1, N1) into clean canonical Purchase Order XML.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<Interchange>
  <ST>
    <TransactionSetId>850</TransactionSetId>
    <ControlNumber>0001</ControlNumber>
  </ST>
  <BEG>
    <Purpose>00</Purpose>
    <Type>NE</Type>
    <PONumber>PO-987654</PONumber>
    <Date>2026-09-03</Date>
  </BEG>
  <Parties>
    <N1 type="BT">
      <Name>GLOBAL BUYER HQ</Name>
      <City>NEW YORK</City>
      <State>NY</State>
    </N1>
    <N1 type="ST">
      <Name>EAST DISTRIBUTION CENTER</Name>
      <City>NEW YORK</City>
      <State>NY</State>
    </N1>
  </Parties>
  <LineItems>
    <PO1 line="1">
      <Quantity>50</Quantity>
      <UOM>EA</UOM>
      <UnitPrice>18.50</UnitPrice>
      <PartNumber>PROD-A101</PartNumber>
      <Description>PREMIUM COTTON T-SHIRT L</Description>
    </PO1>
    <PO1 line="2">
      <Quantity>100</Quantity>
      <UOM>EA</UOM>
      <UnitPrice>12.00</UnitPrice>
      <PartNumber>PROD-B202</PartNumber>
      <Description>CANVAS WORK TOTE BAG</Description>
    </PO1>
  </LineItems>
</Interchange>`,
    xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/Interchange">
    <PurchaseOrder orderNumber="{BEG/PONumber}" orderDate="{BEG/Date}">
      <Customer name="{Parties/N1[@type='BT']/Name}">
        <Location state="{Parties/N1[@type='BT']/State}"><xsl:value-of select="Parties/N1[@type='BT']/City"/></Location>
      </Customer>
      <Items>
        <xsl:for-each select="LineItems/PO1">
          <Item id="{@line}" sku="{PartNumber}">
            <Title><xsl:value-of select="Description"/></Title>
            <Qty unit="{UOM}"><xsl:value-of select="Quantity"/></Qty>
            <Price currency="USD"><xsl:value-of select="UnitPrice"/></Price>
          </Item>
        </xsl:for-each>
      </Items>
    </PurchaseOrder>
  </xsl:template>
</xsl:stylesheet>`,
  },
  html_report: {
    name: 'XML to HTML Table Report',
    description: 'Transform catalog records into a styled HTML table with headers and row counts.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
    <publish_date>2020-10-01</publish_date>
  </book>
  <book id="bk102">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2020-12-16</publish_date>
  </book>
  <book id="bk103">
    <author>Corets, Eva</author>
    <title>Maeve Ascendant</title>
    <genre>Fantasy</genre>
    <price>12.50</price>
    <publish_date>2021-11-17</publish_date>
  </book>
</catalog>`,
    xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes"/>

  <xsl:template match="/catalog">
    <div style="font-family: sans-serif; padding: 16px;">
      <h2 style="color: #4338ca; margin-bottom: 8px;">Book Inventory Report</h2>
      <p style="color: #64748b; font-size: 13px;">Total Titles: <xsl:value-of select="count(book)"/></p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; font-size: 13px;">
        <tr style="background-color: #f1f5f9; text-align: left;">
          <th>ID</th>
          <th>Title</th>
          <th>Author</th>
          <th>Genre</th>
          <th>Price ($)</th>
        </tr>
        <xsl:for-each select="book">
          <tr>
            <td><code><xsl:value-of select="@id"/></code></td>
            <td><strong><xsl:value-of select="title"/></strong></td>
            <td><xsl:value-of select="author"/></td>
            <td><xsl:value-of select="genre"/></td>
            <td align="right">$<xsl:value-of select="price"/></td>
          </tr>
        </xsl:for-each>
      </table>
    </div>
  </xsl:template>
</xsl:stylesheet>`,
  },
  strip_namespaces: {
    name: 'Strip XML Namespaces',
    description: 'Remove all xmlns declarations and namespace prefixes for universal processing.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:b2b="http://example.com/b2b">
  <soapenv:Header>
    <b2b:AuthToken>SECRET-KEY-9988</b2b:AuthToken>
  </soapenv:Header>
  <soapenv:Body>
    <b2b:SubmitOrderResponse>
      <b2b:Status>SUCCESS</b2b:Status>
      <b2b:TrackingId>TRK-104992</b2b:TrackingId>
    </b2b:SubmitOrderResponse>
  </soapenv:Body>
</soapenv:Envelope>`,
    xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <!-- Identity template with local-name element copy -->
  <xsl:template match="*">
    <xsl:element name="{local-name()}">
      <xsl:apply-templates select="@* | node()"/>
    </xsl:element>
  </xsl:template>

  <!-- Copy attributes while dropping namespace declarations -->
  <xsl:template match="@*">
    <xsl:attribute name="{local-name()}">
      <xsl:value-of select="."/>
    </xsl:attribute>
  </xsl:template>

  <!-- Copy text, comments, processing-instructions -->
  <xsl:template match="text() | comment() | processing-instruction()">
    <xsl:copy/>
  </xsl:template>
</xsl:stylesheet>`,
  },
  attr_to_elem: {
    name: 'Attributes to Elements',
    description: 'Convert XML attributes into nested child elements for flat relational ingest.',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<orders>
  <order id="101" date="2026-09-03" customer="ACME Corp" status="shipped" total="499.50"/>
  <order id="102" date="2026-09-04" customer="Beta Logistics" status="processing" total="1200.00"/>
</orders>`,
    xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>

  <xsl:template match="/*">
    <xsl:element name="{local-name()}">
      <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="*">
    <xsl:element name="{local-name()}">
      <xsl:for-each select="@*">
        <xsl:element name="{name()}">
          <xsl:value-of select="."/>
        </xsl:element>
      </xsl:for-each>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>
</xsl:stylesheet>`,
  },
};

export const XsltTransformerView: React.FC<XsltTransformerViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
}) => {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('edi_to_canonical');
  const [xmlSource, setXmlSource] = useState<string>(PRESETS.edi_to_canonical.xml);
  const [xsltSource, setXsltSource] = useState<string>(PRESETS.edi_to_canonical.xslt);
  const [transformOutput, setTransformOutput] = useState<string>('');
  const [transformError, setTransformError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'xml' | 'xslt' | 'both'>('both');
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  // Execute XSLT Transformation using browser native XSLTProcessor
  const executeTransform = () => {
    try {
      setTransformError(null);
      if (!xmlSource.trim()) {
        setTransformOutput('');
        return;
      }
      if (!xsltSource.trim()) {
        setTransformError('Please provide an XSLT stylesheet.');
        return;
      }

      const parser = new DOMParser();

      // 1. Parse XML
      const xmlDoc = parser.parseFromString(xmlSource, 'application/xml');
      const xmlParserError = xmlDoc.getElementsByTagName('parsererror')[0];
      if (xmlParserError) {
        setTransformError(`XML Syntax Error: ${xmlParserError.textContent?.slice(0, 300)}`);
        return;
      }

      // 2. Parse XSLT
      const xsltDoc = parser.parseFromString(xsltSource, 'application/xml');
      const xsltParserError = xsltDoc.getElementsByTagName('parsererror')[0];
      if (xsltParserError) {
        setTransformError(`XSLT Stylesheet Error: ${xsltParserError.textContent?.slice(0, 300)}`);
        return;
      }

      // 3. Transform via XSLTProcessor
      if (typeof window.XSLTProcessor === 'undefined') {
        setTransformError('Browser XSLTProcessor API is not available in this runtime environment.');
        return;
      }

      const processor = new XSLTProcessor();
      processor.importStylesheet(xsltDoc);

      const resultFragment = processor.transformToFragment(xmlDoc, document);
      if (!resultFragment) {
        setTransformError('XSLT transformation produced no output. Please verify template matches and roots.');
        return;
      }

      const serializer = new XMLSerializer();
      let serialized = serializer.serializeToString(resultFragment);

      // Pretty format serialized XML if it starts with <
      if (serialized.trim().startsWith('<') && !serialized.includes('<html')) {
        // Basic indentation
        let formatted = '';
        let pad = 0;
        serialized
          .replace(/>\s*</g, '>\n<')
          .split('\n')
          .forEach((line) => {
            let indent = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
              indent = 0;
            } else if (line.match(/^<\/\w/)) {
              if (pad > 0) pad -= 1;
            } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
              indent = 1;
            }
            formatted += '  '.repeat(pad) + line + '\n';
            pad += indent;
          });
        serialized = formatted.trim();
      }

      setTransformOutput(serialized);
    } catch (err: any) {
      setTransformError(err.message || 'XSLT transformation execution failed.');
    }
  };

  // Run initial transform or whenever input changes
  useEffect(() => {
    executeTransform();
  }, [xmlSource, xsltSource]);

  const handleCopy = () => {
    navigator.clipboard.writeText(transformOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isHtml = transformOutput.includes('<div') || transformOutput.includes('<table');
    const blob = new Blob([transformOutput], { type: isHtml ? 'text/html;charset=utf-8' : 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isHtml ? 'transformed_output.html' : 'transformed_output.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToolHeader tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />

      {/* Preset Buttons Bar */}
      <div
        className="p-4 rounded-2xl border space-y-3 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between font-semibold">
          <span style={{ color: 'var(--ink)' }}>XSLT Mapping &amp; Transformation Presets:</span>
          <span className="text-[var(--muted)]">{Object.keys(PRESETS).length} Presets Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const isSelected = selectedPresetKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedPresetKey(key);
                  setXmlSource(preset.xml);
                  setXsltSource(preset.xslt);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-[var(--brand)] shadow-sm' : 'hover:opacity-85'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--surface-2)' : 'var(--bg)',
                  borderColor: isSelected ? 'var(--brand)' : 'var(--line)',
                }}
              >
                <div className="font-semibold text-xs mb-1" style={{ color: isSelected ? 'var(--brand)' : 'var(--ink)' }}>
                  {preset.name}
                </div>
                <div className="text-[11px] text-[var(--muted)] line-clamp-2">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action and Layout Bar */}
      <div
        className="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={executeTransform}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Transform Now</span>
          </button>

          {/* View mode toggle if HTML */}
          {transformOutput.includes('<div') || transformOutput.includes('<table') ? (
            <div className="flex rounded-xl border p-0.5" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}>
              <button
                onClick={() => setViewMode('code')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  viewMode === 'code' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  viewMode === 'preview' ? 'bg-white dark:bg-slate-700 shadow-sm text-[var(--brand)]' : 'text-[var(--muted)]'
                }`}
              >
                HTML Preview
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!transformOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Output!' : 'Copy Result'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!transformOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {transformError && (
        <div className="p-3.5 rounded-xl border flex items-start gap-2.5 text-xs bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Transformation Failed:</div>
            <div className="font-mono mt-0.5">{transformError}</div>
          </div>
        </div>
      )}

      {/* 3-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Source XML Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              1. SOURCE XML DOCUMENT
            </span>
            <span className="text-[11px] text-[var(--muted)]">Input Data</span>
          </div>
          <textarea
            value={xmlSource}
            onChange={(e) => setXmlSource(e.target.value)}
            rows={18}
            className="w-full flex-1 p-3 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste source XML here..."
          />
        </div>

        {/* XSLT Stylesheet Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              2. XSLT STYLESHEET (1.0 / 2.0)
            </span>
            <span className="text-[11px] text-[var(--muted)]">Transformation Rules</span>
          </div>
          <textarea
            value={xsltSource}
            onChange={(e) => setXsltSource(e.target.value)}
            rows={18}
            className="w-full flex-1 p-3 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste XSLT stylesheet here..."
          />
        </div>

        {/* Output Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              3. TRANSFORMED RESULT
            </span>
            <span className="text-[11px] text-[var(--muted)]">Live Evaluated</span>
          </div>
          {viewMode === 'preview' && (transformOutput.includes('<div') || transformOutput.includes('<table')) ? (
            <div
              className="w-full flex-1 p-3 rounded-xl border overflow-auto bg-white text-black"
              dangerouslySetInnerHTML={{ __html: transformOutput }}
            />
          ) : (
            <textarea
              readOnly
              value={transformOutput}
              rows={18}
              className="w-full flex-1 p-3 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
              style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
              placeholder="Transformation output will appear here..."
            />
          )}
        </div>
      </div>
    </div>
  );
};
