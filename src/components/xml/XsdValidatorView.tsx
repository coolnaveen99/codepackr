import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface XsdValidatorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'syntax' | 'root' | 'missing-element' | 'datatype' | 'attribute' | 'order';
  message: string;
  element?: string;
}

const PRESETS = [
  {
    id: 'note',
    label: 'Simple Note (W3C Standard)',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading>Project Deadline</heading>
  <body>Review the EDI and XSD mapping requirements by Friday.</body>
</note>`,
    xsd: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="note">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="to" type="xs:string"/>
        <xs:element name="from" type="xs:string"/>
        <xs:element name="heading" type="xs:string"/>
        <xs:element name="body" type="xs:string"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>`,
  },
  {
    id: 'purchase-order',
    label: 'Purchase Order (EDI / Commercial)',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<PurchaseOrder orderNumber="PO-2026-8890" orderDate="2026-09-09">
  <Buyer>
    <Name>Global Retail Enterprises</Name>
    <ContactEmail>procurement@globalretail.com</ContactEmail>
  </Buyer>
  <LineItem lineNumber="1">
    <SKU>TECH-990</SKU>
    <Quantity>25</Quantity>
    <UnitPrice>149.99</UnitPrice>
    <InStock>true</InStock>
  </LineItem>
  <TotalAmount>3749.75</TotalAmount>
</PurchaseOrder>`,
    xsd: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="PurchaseOrder">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Buyer">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="Name" type="xs:string"/>
              <xs:element name="ContactEmail" type="xs:string"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
        <xs:element name="LineItem">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="SKU" type="xs:string"/>
              <xs:element name="Quantity" type="xs:integer"/>
              <xs:element name="UnitPrice" type="xs:decimal"/>
              <xs:element name="InStock" type="xs:boolean"/>
            </xs:sequence>
            <xs:attribute name="lineNumber" type="xs:integer" use="required"/>
          </xs:complexType>
        </xs:element>
        <xs:element name="TotalAmount" type="xs:decimal"/>
      </xs:sequence>
      <xs:attribute name="orderNumber" type="xs:string" use="required"/>
      <xs:attribute name="orderDate" type="xs:date" use="required"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`,
  },
  {
    id: 'invoice',
    label: 'Customer Invoice (Financial / Tax)',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<Invoice invoiceId="INV-2026-104" currency="USD">
  <Issuer>Codepackr Cloud Systems</Issuer>
  <Recipient>Acme Corporation</Recipient>
  <IssueDate>2026-09-01</IssueDate>
  <SubTotal>1200.00</SubTotal>
  <TaxAmount>96.00</TaxAmount>
  <TotalPayable>1296.00</TotalPayable>
</Invoice>`,
    xsd: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="Invoice">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Issuer" type="xs:string"/>
        <xs:element name="Recipient" type="xs:string"/>
        <xs:element name="IssueDate" type="xs:date"/>
        <xs:element name="SubTotal" type="xs:decimal"/>
        <xs:element name="TaxAmount" type="xs:decimal"/>
        <xs:element name="TotalPayable" type="xs:decimal"/>
      </xs:sequence>
      <xs:attribute name="invoiceId" type="xs:string" use="required"/>
      <xs:attribute name="currency" type="xs:string" use="required"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`,
  }
];

export const XsdValidatorView: React.FC<XsdValidatorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [xmlInput, setXmlInput] = useState(() => initialInput || PRESETS[0].xml);
  const [xsdInput, setXsdInput] = useState(() => PRESETS[0].xsd);
  const [selectedPreset, setSelectedPreset] = useState('note');
  const [checkDataTypes, setCheckDataTypes] = useState(true);
  const [checkAttributes, setCheckAttributes] = useState(true);
  const [copiedReport, setCopiedReport] = useState(false);

  const [validationState, setValidationState] = useState<{
    valid: boolean;
    issues: ValidationIssue[];
    stats: {
      totalXmlElements: number;
      totalXsdElements: number;
      rootElement: string;
    };
  }>({
    valid: true,
    issues: [],
    stats: { totalXmlElements: 0, totalXsdElements: 0, rootElement: '' },
  });

  const performValidation = (xmlText: string, xsdText: string) => {
    if (!xmlText.trim()) {
      setValidationState({
        valid: false,
        issues: [{ type: 'error', category: 'syntax', message: 'XML Document is empty.' }],
        stats: { totalXmlElements: 0, totalXsdElements: 0, rootElement: '' },
      });
      return;
    }

    if (!xsdText.trim()) {
      setValidationState({
        valid: false,
        issues: [{ type: 'error', category: 'syntax', message: 'XSD Schema Definition is empty.' }],
        stats: { totalXmlElements: 0, totalXsdElements: 0, rootElement: '' },
      });
      return;
    }

    const issues: ValidationIssue[] = [];
    const parser = new DOMParser();

    // 1. Check XML well-formedness
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const xmlError = xmlDoc.querySelector('parsererror');
    if (xmlError) {
      const errLine = xmlError.textContent?.split('\n')[0] || 'Malformed XML';
      setValidationState({
        valid: false,
        issues: [{ type: 'error', category: 'syntax', message: `XML Syntax Error: ${errLine}` }],
        stats: { totalXmlElements: 0, totalXsdElements: 0, rootElement: '' },
      });
      return;
    }

    // 2. Check XSD well-formedness
    const xsdDoc = parser.parseFromString(xsdText, 'text/xml');
    const xsdError = xsdDoc.querySelector('parsererror');
    if (xsdError) {
      const errLine = xsdError.textContent?.split('\n')[0] || 'Malformed XSD Schema';
      setValidationState({
        valid: false,
        issues: [{ type: 'error', category: 'syntax', message: `XSD Syntax Error: ${errLine}` }],
        stats: { totalXmlElements: 0, totalXsdElements: 0, rootElement: '' },
      });
      return;
    }

    const xmlAllElements = Array.from(xmlDoc.querySelectorAll('*'));
    const xsdDeclaredElements = Array.from(xsdDoc.querySelectorAll('element, [name]')).filter((el) => {
      const tag = el.localName || el.tagName;
      return tag.endsWith('element');
    });

    const rootTag = xmlDoc.documentElement.tagName;
    const expectedRootEl = xsdDeclaredElements[0];
    const expectedRootName = expectedRootEl?.getAttribute('name');

    // 3. Root element match
    if (expectedRootName && expectedRootName !== rootTag) {
      issues.push({
        type: 'error',
        category: 'root',
        message: `Root element mismatch: Expected <${expectedRootName}> according to schema, but found <${rootTag}>.`,
        element: rootTag,
      });
    }

    // 4. Missing declared elements check
    xsdDeclaredElements.forEach((declared) => {
      const name = declared.getAttribute('name');
      const minOccurs = declared.getAttribute('minOccurs');
      const isMandatory = minOccurs === null || minOccurs !== '0';

      if (name && isMandatory) {
        const found = xmlDoc.getElementsByTagName(name);
        if (!found || found.length === 0) {
          issues.push({
            type: 'error',
            category: 'missing-element',
            message: `Mandatory element <${name}> declared in schema (minOccurs="${minOccurs ?? 1}") is missing from XML instance.`,
            element: name,
          });
        }
      }
    });

    // 5. Data Type checking
    if (checkDataTypes) {
      xsdDeclaredElements.forEach((declared) => {
        const name = declared.getAttribute('name');
        const type = declared.getAttribute('type');
        if (!name || !type) return;

        const matchingNodes = Array.from(xmlDoc.getElementsByTagName(name));
        matchingNodes.forEach((node) => {
          const val = node.textContent?.trim() || '';
          if (!val) return;

          const baseType = type.includes(':') ? type.split(':')[1] : type;
          if (['integer', 'int', 'positiveInteger', 'nonNegativeInteger'].includes(baseType)) {
            if (!/^-?\d+$/.test(val)) {
              issues.push({
                type: 'error',
                category: 'datatype',
                message: `Element <${name}> value "${val}" does not conform to data type xs:${baseType} (integer expected).`,
                element: name,
              });
            }
          } else if (['decimal', 'float', 'double'].includes(baseType)) {
            if (isNaN(Number(val))) {
              issues.push({
                type: 'error',
                category: 'datatype',
                message: `Element <${name}> value "${val}" does not conform to data type xs:${baseType} (numeric float/decimal expected).`,
                element: name,
              });
            }
          } else if (baseType === 'boolean') {
            if (!['true', 'false', '1', '0'].includes(val.toLowerCase())) {
              issues.push({
                type: 'error',
                category: 'datatype',
                message: `Element <${name}> value "${val}" is not a valid xs:boolean (expected "true", "false", "1", or "0").`,
                element: name,
              });
            }
          } else if (baseType === 'date') {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              issues.push({
                type: 'error',
                category: 'datatype',
                message: `Element <${name}> value "${val}" is not a valid xs:date (expected format YYYY-MM-DD).`,
                element: name,
              });
            }
          }
        });
      });
    }

    // 6. Required Attributes validation
    if (checkAttributes) {
      const xsdAttributes = Array.from(xsdDoc.querySelectorAll('attribute, [use]')).filter((el) => {
        const tag = el.localName || el.tagName;
        return tag.endsWith('attribute');
      });

      xsdAttributes.forEach((attr) => {
        const attrName = attr.getAttribute('name');
        const isRequired = attr.getAttribute('use') === 'required';
        const parentElem = attr.closest('element, [name]');
        const parentElemName = parentElem?.getAttribute('name');

        if (attrName && isRequired && parentElemName) {
          const matchedElems = Array.from(xmlDoc.getElementsByTagName(parentElemName));
          matchedElems.forEach((elem) => {
            if (!elem.hasAttribute(attrName)) {
              issues.push({
                type: 'error',
                category: 'attribute',
                message: `Required attribute "${attrName}" missing on element <${parentElemName}>.`,
                element: parentElemName,
              });
            }
          });
        }
      });
    }

    const isValid = issues.length === 0;
    setValidationState({
      valid: isValid,
      issues,
      stats: {
        totalXmlElements: xmlAllElements.length,
        totalXsdElements: xsdDeclaredElements.length,
        rootElement: rootTag,
      },
    });
  };

  useEffect(() => {
    performValidation(xmlInput, xsdInput);
  }, [xmlInput, xsdInput, checkDataTypes, checkAttributes]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = PRESETS.find((item) => item.id === presetId);
    if (p) {
      setXmlInput(p.xml);
      setXsdInput(p.xsd);
    }
  };

  const handleCopyReport = () => {
    const lines = [
      `XSD Schema Validation Audit Report`,
      `=================================`,
      `Status: ${validationState.valid ? 'PASSED (Conforming)' : 'FAILED (Discrepancies Detected)'}`,
      `Root Element: <${validationState.stats.rootElement}>`,
      `XML Elements Scanned: ${validationState.stats.totalXmlElements}`,
      `XSD Schema Elements Verified: ${validationState.stats.totalXsdElements}`,
      `Timestamp: ${new Date().toISOString()}`,
      ``,
      `Validation Issues (${validationState.issues.length}):`,
      ...validationState.issues.map((iss, i) => `  ${i + 1}. [${iss.category.toUpperCase()}] ${iss.message}`),
      ``,
      `Generated by Codepackr (www.codepackr.com)`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlInput], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validated-document.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToDefaults = () => {
    handleSelectPreset('edi850');
  };

  return (
    <div className="space-y-6">
      <ToolHeader
        tool={tool}
        onBackToHome={onBackToHome}
        onSelectRelated={onSelectRelated}
        onResetOrClear={handleResetToDefaults}
        resetLabel="Reset to Defaults"
      />

      {/* Controls & Options Bar */}
      <div
        className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--muted)]">Load Preset:</span>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="p-1.5 rounded-lg border text-xs font-semibold"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
            <input
              type="checkbox"
              checked={checkDataTypes}
              onChange={(e) => setCheckDataTypes(e.target.checked)}
              className="rounded accent-[var(--brand)] cursor-pointer"
            />
            <span>Validate Data Types (xs:integer, xs:date, xs:decimal, etc.)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
            <input
              type="checkbox"
              checked={checkAttributes}
              onChange={(e) => setCheckAttributes(e.target.checked)}
              className="rounded accent-[var(--brand)] cursor-pointer"
            />
            <span>Verify Required Attributes</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectPreset(selectedPreset)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            title="Reset preset code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: copiedReport ? 'var(--ok)' : 'var(--brand)' }}
          >
            {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'Report Copied!' : 'Copy Audit Report'}</span>
          </button>
          <button
            onClick={handleDownloadXml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XML</span>
          </button>
        </div>
      </div>

      {/* Live Validation Banner */}
      <div
        className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          validationState.valid
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {validationState.valid ? (
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <div>
            <div className="font-bold text-sm">
              {validationState.valid ? 'XML Conforms to W3C XSD Schema Definition' : 'Validation Discrepancies Detected'}
            </div>
            <p className="text-xs opacity-90 mt-0.5">
              {validationState.valid
                ? `All ${validationState.stats.totalXmlElements} elements under <${validationState.stats.rootElement}> successfully validated against ${validationState.stats.totalXsdElements} schema constraints.`
                : `${validationState.issues.length} schema discrepancy detected in XML document.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10">
            Root: &lt;{validationState.stats.rootElement || 'none'}&gt;
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10">
            {validationState.stats.totalXmlElements} Elements
          </span>
        </div>
      </div>

      {/* Discrepancies Details List (if any) */}
      {!validationState.valid && validationState.issues.length > 0 && (
        <div
          className="p-4 rounded-2xl border space-y-2 text-xs"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="font-semibold text-xs text-[var(--muted)] uppercase tracking-wider mb-2">
            Discrepancy Details ({validationState.issues.length})
          </div>
          {validationState.issues.map((issue, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl border flex items-start gap-2.5 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border-rose-200 dark:border-rose-900/60 font-mono text-xs"
            >
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-rose-200/80 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                {issue.category}
              </span>
              <span className="flex-1">{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* XML Instance Document Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              XML INSTANCE DOCUMENT (.xml)
            </span>
            <span className="text-[11px] text-[var(--muted)] font-mono">
              {xmlInput.split('\n').length} lines
            </span>
          </div>
          <textarea
            id="xsd-xml-instance-input"
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            rows={18}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste or write XML instance document here..."
            spellCheck={false}
          />
        </div>

        {/* XSD Schema Definition Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              XSD SCHEMA DEFINITION (.xsd)
            </span>
            <span className="text-[11px] text-[var(--muted)] font-mono">
              {xsdInput.split('\n').length} lines
            </span>
          </div>
          <textarea
            id="xsd-schema-definition-input"
            value={xsdInput}
            onChange={(e) => setXsdInput(e.target.value)}
            rows={18}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="Paste W3C XML Schema definition (<xs:schema>)..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
