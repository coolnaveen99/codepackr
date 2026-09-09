import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, RefreshCw, FileCode2, Sparkles, AlertTriangle } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface XsdToXmlGeneratorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_XSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="ShipmentNotice">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="NoticeNumber" type="xs:string"/>
        <xs:element name="NoticeDate" type="xs:date"/>
        <xs:element name="Shipper">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Name" type="xs:string"/>
              <xs:element name="WarehouseCode" type="xs:string"/>
              <xs:element name="Address" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
        <xs:element name="Packages">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Package" maxOccurs="unbounded">
                <xs:complexType>
                  <xs:sequence>
                    <xs:element name="TrackingNumber" type="xs:string"/>
                    <xs:element name="WeightKg" type="xs:decimal"/>
                    <xs:element name="ItemCount" type="xs:integer"/>
                    <xs:element name="Fragile" type="xs:boolean"/>
                  </xs:sequence>
                  <xs:attribute name="id" type="xs:string" use="required"/>
                </xs:complexType>
              </xs:element>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
      <xs:attribute name="version" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`;

function getSampleValueForType(typeName: string, elemName: string): string {
  const t = typeName.toLowerCase();
  const name = elemName.toLowerCase();

  if (name.includes('date')) return '2026-09-03';
  if (name.includes('time')) return '14:30:00';
  if (name.includes('email')) return 'contact@example.com';
  if (name.includes('price') || name.includes('amount')) return '49.99';
  if (name.includes('weight')) return '12.5';
  if (name.includes('qty') || name.includes('quantity') || name.includes('count')) return '10';
  if (name.includes('number') || name.includes('id') || name.includes('sku')) return 'SN-100293';
  if (name.includes('name')) return 'Alpha Logistics Corp';

  if (t.includes('boolean')) return 'true';
  if (t.includes('integer') || t.includes('int') || t.includes('long')) return '1';
  if (t.includes('decimal') || t.includes('float') || t.includes('double')) return '99.50';
  if (t.includes('date')) return '2026-09-03';
  if (t.includes('datetime')) return '2026-09-03T14:30:00Z';
  return 'Sample Text Value';
}

export const XsdToXmlGeneratorView: React.FC<XsdToXmlGeneratorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [xsdInput, setXsdInput] = useState<string>(initialInput || SAMPLE_XSD);
  const [xmlOutput, setXmlOutput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate XML sample from XSD
  useEffect(() => {
    if (!xsdInput.trim()) {
      setXmlOutput('');
      setParseError(null);
      return;
    }

    try {
      setParseError(null);
      const parser = new DOMParser();
      const doc = parser.parseFromString(xsdInput, 'application/xml');
      const parserError = doc.getElementsByTagName('parsererror')[0];
      if (parserError) {
        setParseError(`XSD Parse Error: ${parserError.textContent?.slice(0, 200)}`);
        setXmlOutput('');
        return;
      }

      // Find top-level element
      const schemaRoot = doc.documentElement;
      let rootElement: Element | null = null;

      for (let i = 0; i < schemaRoot.children.length; i++) {
        const ch = schemaRoot.children[i];
        if (ch.localName === 'element' && ch.getAttribute('name')) {
          rootElement = ch;
          break;
        }
      }

      if (!rootElement) {
        setParseError('No top-level <xs:element> found in schema.');
        return;
      }

      // Traverse element recursively
      const generateElementXml = (el: Element, indent: string): string => {
        const name = el.getAttribute('name') || 'Element';
        const type = el.getAttribute('type');

        // Look for nested complexType
        let complexType: Element | null = null;
        const attributes: { name: string; val: string }[] = [];

        for (let i = 0; i < el.children.length; i++) {
          if (el.children[i].localName === 'complexType') {
            complexType = el.children[i];
            break;
          }
        }

        if (!complexType && type) {
          const val = getSampleValueForType(type, name);
          return `${indent}<${name}>${val}</${name}>`;
        }

        if (complexType) {
          // Find attributes
          for (let i = 0; i < complexType.children.length; i++) {
            const ch = complexType.children[i];
            if (ch.localName === 'attribute') {
              const aName = ch.getAttribute('name') || 'attr';
              const aType = ch.getAttribute('type') || 'xs:string';
              attributes.push({ name: aName, val: getSampleValueForType(aType, aName) });
            }
          }

          // Look for sequence / all / choice
          let compositor: Element | null = null;
          for (let i = 0; i < complexType.children.length; i++) {
            const ch = complexType.children[i];
            if (['sequence', 'all', 'choice'].includes(ch.localName)) {
              compositor = ch;
              break;
            }
          }

          const attrString = attributes.map((a) => ` ${a.name}="${a.val}"`).join('');

          if (!compositor || compositor.children.length === 0) {
            return `${indent}<${name}${attrString}/>`;
          }

          let innerXml = '';
          for (let i = 0; i < compositor.children.length; i++) {
            const childElem = compositor.children[i];
            if (childElem.localName === 'element') {
              const maxOccurs = childElem.getAttribute('maxOccurs');
              const repeat = maxOccurs === 'unbounded' || parseInt(maxOccurs || '1', 10) > 1 ? 2 : 1;
              for (let r = 0; r < repeat; r++) {
                innerXml += generateElementXml(childElem, `${indent}  `) + '\n';
              }
            }
          }

          return `${indent}<${name}${attrString}>\n${innerXml}${indent}</${name}>`;
        }

        const fallbackVal = getSampleValueForType('xs:string', name);
        return `${indent}<${name}>${fallbackVal}</${name}>`;
      };

      const generated = `<?xml version="1.0" encoding="UTF-8"?>\n` + generateElementXml(rootElement, '');
      setXmlOutput(generated);
    } catch (err: any) {
      setParseError(err.message || 'Error generating XML from XSD.');
    }
  }, [xsdInput]);

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlOutput], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_instance.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearWorkspace = () => {
    setXsdInput('');
    setXmlOutput('');
    setParseError(null);
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleClearWorkspace}
        resetLabel="Clear Workspace"
      />

      {/* Control Bar */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[var(--muted)]">XSD Schema Input</span>
          <button
            onClick={() => setXsdInput(SAMPLE_XSD)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Sample XSD</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!xmlOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied XML!' : 'Copy Sample XML'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!xmlOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .xml</span>
          </button>
        </div>
      </div>

      {parseError && (
        <div className="p-3.5 rounded-xl border flex items-center gap-2 text-xs bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Editor & Output Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source XSD Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              INPUT W3C XML SCHEMA (.XSD)
            </span>
            <span className="text-[11px] text-[var(--muted)]">Definitions &amp; Types</span>
          </div>
          <textarea
            value={xsdInput}
            onChange={(e) => setXsdInput(e.target.value)}
            rows={16}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste XSD schema here..."
          />
        </div>

        {/* Conforming XML Instance Output */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              CONFORMING SAMPLE XML DOCUMENT
            </span>
            <span className="text-[11px] text-[var(--muted)]">Typed Mock Instance</span>
          </div>
          <textarea
            readOnly
            value={xmlOutput}
            rows={16}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Sample XML will appear here..."
          />
        </div>
      </div>
    </div>
  );
};
