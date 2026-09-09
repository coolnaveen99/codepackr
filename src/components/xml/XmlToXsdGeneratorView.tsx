import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, RefreshCw, FileCode2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface XmlToXsdGeneratorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<PurchaseOrder orderNumber="PO-987654" orderDate="2026-09-03" status="Active">
  <Buyer id="BUY-01">
    <Name>Global Buyer HQ</Name>
    <Address>
      <Street>100 Wall Street</Street>
      <City>New York</City>
      <State>NY</State>
      <ZipCode>10005</ZipCode>
      <Country>US</Country>
    </Address>
    <CreditLimit>50000.00</CreditLimit>
    <TaxExempt>false</TaxExempt>
  </Buyer>
  <Vendor id="VEN-99">
    <Name>Acme Industrial Supply</Name>
    <ContactEmail>orders@acmesupply.com</ContactEmail>
    <Rating>5</Rating>
  </Vendor>
  <LineItems>
    <Item lineNumber="1">
      <SKU>PROD-A101</SKU>
      <Description>Premium Cotton T-Shirt L</Description>
      <Quantity>50</Quantity>
      <UnitPrice>18.50</UnitPrice>
      <InStock>true</InStock>
    </Item>
    <Item lineNumber="2">
      <SKU>PROD-B202</SKU>
      <Description>Canvas Work Tote Bag</Description>
      <Quantity>100</Quantity>
      <UnitPrice>12.00</UnitPrice>
      <InStock>true</InStock>
    </Item>
  </LineItems>
  <TotalAmount>2125.00</TotalAmount>
</PurchaseOrder>`;

function inferDataType(val: string): string {
  const trimmed = val.trim();
  if (trimmed === 'true' || trimmed === 'false') return 'xs:boolean';
  if (/^-?\d+$/.test(trimmed)) return 'xs:integer';
  if (/^-?\d+\.\d+$/.test(trimmed)) return 'xs:decimal';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return 'xs:date';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) return 'xs:dateTime';
  return 'xs:string';
}

interface NodeAnalysis {
  name: string;
  hasChildren: boolean;
  attributes: { name: string; type: string }[];
  children: Map<string, { count: number; sampleNode: Element }>;
  inferredType: string;
}

export const XmlToXsdGeneratorView: React.FC<XmlToXsdGeneratorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [xmlInput, setXmlInput] = useState<string>(initialInput || SAMPLE_XML);
  const [xsdOutput, setXsdOutput] = useState<string>('');
  const [targetNamespace, setTargetNamespace] = useState<string>('');
  const [minOccursDefault, setMinOccursDefault] = useState<'0' | '1'>('0');
  const [elementFormDefault, setElementFormDefault] = useState<'qualified' | 'unqualified'>('qualified');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate XSD schema from XML DOM
  useEffect(() => {
    if (!xmlInput.trim()) {
      setXsdOutput('');
      setParseError(null);
      return;
    }

    try {
      setParseError(null);
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlInput, 'application/xml');
      const parserError = doc.getElementsByTagName('parsererror')[0];
      if (parserError) {
        setParseError(`XML Syntax Error: ${parserError.textContent?.slice(0, 200)}`);
        setXsdOutput('');
        return;
      }

      const root = doc.documentElement;
      if (!root) {
        setParseError('No root element found.');
        return;
      }

      // Recursive schema builder
      const buildElementSchema = (element: Element, indent: string, isRoot: boolean = false): string => {
        const tagName = element.tagName;
        const attrs = Array.from(element.attributes);
        const childElements = Array.from(element.children);

        // Count child tag occurrences to detect maxOccurs="unbounded"
        const childCounts = new Map<string, { count: number; firstElem: Element }>();
        childElements.forEach((ch) => {
          const existing = childCounts.get(ch.tagName);
          if (existing) {
            existing.count += 1;
          } else {
            childCounts.set(ch.tagName, { count: 1, firstElem: ch });
          }
        });

        const isComplex = childElements.length > 0 || attrs.length > 0;

        if (!isComplex) {
          const text = element.textContent || '';
          const type = inferDataType(text);
          if (isRoot) {
            return `${indent}<xs:element name="${tagName}" type="${type}"/>`;
          }
          return `${indent}<xs:element name="${tagName}" type="${type}" minOccurs="${minOccursDefault}"/>`;
        }

        // Complex Type element
        let res = '';
        if (isRoot) {
          res += `${indent}<xs:element name="${tagName}">\n`;
        } else {
          res += `${indent}<xs:element name="${tagName}" minOccurs="${minOccursDefault}">\n`;
        }
        res += `${indent}  <xs:complexType>\n`;

        if (childElements.length > 0) {
          res += `${indent}    <xs:sequence>\n`;
          childCounts.forEach(({ count, firstElem }, childTag) => {
            const childIsComplex = firstElem.children.length > 0 || firstElem.attributes.length > 0;
            const maxOccursAttr = count > 1 ? ' maxOccurs="unbounded"' : '';

            if (!childIsComplex) {
              const childType = inferDataType(firstElem.textContent || '');
              res += `${indent}      <xs:element name="${childTag}" type="${childType}" minOccurs="${minOccursDefault}"${maxOccursAttr}/>\n`;
            } else {
              // Recurse for complex child
              const nested = buildElementSchema(firstElem, `${indent}      `, false);
              // If repeated, insert maxOccurs into the element declaration
              if (count > 1) {
                const updatedNested = nested.replace(
                  new RegExp(`<xs:element name="${childTag}" minOccurs="${minOccursDefault}">`),
                  `<xs:element name="${childTag}" minOccurs="${minOccursDefault}" maxOccurs="unbounded">`
                );
                res += `${updatedNested}\n`;
              } else {
                res += `${nested}\n`;
              }
            }
          });
          res += `${indent}    </xs:sequence>\n`;
        }

        // Add attributes
        attrs.forEach((attr) => {
          const aType = inferDataType(attr.value);
          res += `${indent}    <xs:attribute name="${attr.name}" type="${aType}" use="optional"/>\n`;
        });

        res += `${indent}  </xs:complexType>\n`;
        res += `${indent}</xs:element>`;
        return res;
      };

      let schemaHeader = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      schemaHeader += `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"`;
      if (targetNamespace.trim()) {
        schemaHeader += `\n  targetNamespace="${targetNamespace.trim()}"\n  xmlns="${targetNamespace.trim()}"`;
      }
      schemaHeader += `\n  elementFormDefault="${elementFormDefault}">\n\n`;

      const body = buildElementSchema(root, '  ', true);
      const schemaFooter = `\n\n</xs:schema>`;

      setXsdOutput(schemaHeader + body + schemaFooter);
    } catch (err: any) {
      setParseError(err.message || 'Failed to infer schema.');
      setXsdOutput('');
    }
  }, [xmlInput, targetNamespace, minOccursDefault, elementFormDefault]);

  const handleCopy = () => {
    navigator.clipboard.writeText(xsdOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xsdOutput], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.xsd';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearWorkspace = () => {
    setXmlInput('');
    setXsdOutput('');
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--muted)]">Target Namespace:</span>
            <input
              type="text"
              placeholder="http://example.com/schema (optional)"
              value={targetNamespace}
              onChange={(e) => setTargetNamespace(e.target.value)}
              className="w-56 p-1.5 rounded-lg border text-xs font-mono"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--muted)]">MinOccurs:</span>
            <select
              value={minOccursDefault}
              onChange={(e) => setMinOccursDefault(e.target.value as '0' | '1')}
              className="p-1.5 rounded-lg border text-xs font-semibold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="0">0 (Optional)</option>
              <option value="1">1 (Mandatory)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--muted)]">Form Default:</span>
            <select
              value={elementFormDefault}
              onChange={(e) => setElementFormDefault(e.target.value as 'qualified' | 'unqualified')}
              className="p-1.5 rounded-lg border text-xs font-semibold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              <option value="qualified">qualified</option>
              <option value="unqualified">unqualified</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setXmlInput(SAMPLE_XML)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border font-medium hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sample</span>
          </button>
          <button
            onClick={handleCopy}
            disabled={!xsdOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: copied ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied XSD!' : 'Copy Schema'}</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={!xsdOutput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .xsd</span>
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
        {/* Source XML Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              INPUT XML INSTANCE DOCUMENT
            </span>
            <span className="text-[11px] text-[var(--muted)]">Payload Structure</span>
          </div>
          <textarea
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            rows={16}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste XML document here..."
          />
        </div>

        {/* Inferred W3C XSD Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              INFERRED W3C XML SCHEMA (.XSD)
            </span>
            <span className="text-[11px] text-[var(--muted)]">W3C Schema Compliant</span>
          </div>
          <textarea
            readOnly
            value={xsdOutput}
            rows={16}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/20"
            style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Generated XSD schema will appear here..."
          />
        </div>
      </div>
    </div>
  );
};
