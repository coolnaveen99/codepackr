import React, { useState, useEffect } from 'react';
import { Copy, Check, Search, Code, CheckCircle2, AlertTriangle, Play, Sparkles, Terminal, FileCode2 } from 'lucide-react';
import { ToolDef } from '../../types';
import { ToolHeader } from '../ToolHeader';

interface XPathEvaluatorViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Interchange id="INT-88092">
  <Header>
    <Sender id="ACME" country="US">Acme Supply Corp</Sender>
    <Receiver id="GLOBAL" country="UK">Global Retail Logistics</Receiver>
    <Date>2026-09-03</Date>
  </Header>
  <PurchaseOrder number="PO-987654" currency="USD">
    <Buyer type="HQ">
      <Name>Global Retail London Office</Name>
      <City>London</City>
      <Email>buyer@globalretail.co.uk</Email>
    </Buyer>
    <LineItems totalLines="3">
      <Item id="1" sku="PROD-A101" department="Apparel">
        <Title>Premium Cotton T-Shirt L</Title>
        <Quantity>50</Quantity>
        <UnitPrice>18.50</UnitPrice>
      </Item>
      <Item id="2" sku="PROD-B202" department="Accessories">
        <Title>Canvas Work Tote Bag</Title>
        <Quantity>100</Quantity>
        <UnitPrice>12.00</UnitPrice>
      </Item>
      <Item id="3" sku="PROD-C303" department="Apparel">
        <Title>Merino Wool Winter Beanie</Title>
        <Quantity>30</Quantity>
        <UnitPrice>24.00</UnitPrice>
      </Item>
    </LineItems>
  </PurchaseOrder>
</Interchange>`;

interface MatchItem {
  index: number;
  type: string;
  name: string;
  value: string;
  xmlSnippet: string;
}

export const XPathEvaluatorView: React.FC<XPathEvaluatorViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [xmlInput, setXmlInput] = useState<string>(initialInput || SAMPLE_XML);
  const [xpathQuery, setXpathQuery] = useState<string>('//Item[@department="Apparel"]');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [scalarResult, setScalarResult] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Evaluate XPath
  const evaluateXPath = () => {
    try {
      setEvalError(null);
      setScalarResult(null);
      setMatches([]);

      if (!xmlInput.trim() || !xpathQuery.trim()) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlInput, 'application/xml');
      const parseErr = doc.getElementsByTagName('parsererror')[0];
      if (parseErr) {
        setEvalError(`XML Syntax Error: ${parseErr.textContent?.slice(0, 200)}`);
        return;
      }

      const evaluator = new XPathEvaluator();
      const result = evaluator.evaluate(
        xpathQuery,
        doc,
        null,
        XPathResult.ANY_TYPE,
        null
      );

      const serializer = new XMLSerializer();

      if (result.resultType === XPathResult.NUMBER_TYPE) {
        setScalarResult(String(result.numberValue));
      } else if (result.resultType === XPathResult.STRING_TYPE) {
        setScalarResult(result.stringValue);
      } else if (result.resultType === XPathResult.BOOLEAN_TYPE) {
        setScalarResult(result.booleanValue ? 'true' : 'false');
      } else {
        // Node set
        const found: MatchItem[] = [];
        let node: Node | null = result.iterateNext();
        let idx = 1;

        while (node) {
          let snippet = '';
          let val = node.nodeValue || '';

          if (node.nodeType === Node.ELEMENT_NODE) {
            snippet = serializer.serializeToString(node);
            val = (node as Element).textContent || '';
          } else if (node.nodeType === Node.ATTRIBUTE_NODE) {
            snippet = `${node.nodeName}="${node.nodeValue}"`;
          } else if (node.nodeType === Node.TEXT_NODE) {
            snippet = node.nodeValue || '';
          } else {
            snippet = serializer.serializeToString(node);
          }

          found.push({
            index: idx++,
            type:
              node.nodeType === Node.ELEMENT_NODE
                ? 'Element'
                : node.nodeType === Node.ATTRIBUTE_NODE
                ? 'Attribute'
                : node.nodeType === Node.TEXT_NODE
                ? 'Text Node'
                : 'Node',
            name: node.nodeName,
            value: val,
            xmlSnippet: snippet,
          });

          node = result.iterateNext();
        }

        setMatches(found);
      }
    } catch (err: any) {
      setEvalError(err.message || 'Invalid XPath expression.');
    }
  };

  useEffect(() => {
    evaluateXPath();
  }, [xmlInput, xpathQuery]);

  const handleCopyResults = () => {
    const text = scalarResult !== null ? scalarResult : matches.map((m) => m.xmlSnippet).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearWorkspace = () => {
    setXmlInput('');
    setXpathQuery('');
    setMatches([]);
    setScalarResult(null);
    setEvalError(null);
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

      {/* XPath Query Input Bar */}
      <div
        className="p-4 rounded-2xl border space-y-3"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-[var(--brand)]" />
            XPath 1.0 Expression:
          </span>
          <span className="text-[var(--muted)] font-mono">Browser Native XPathEvaluator</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={xpathQuery}
            onChange={(e) => setXpathQuery(e.target.value)}
            className="flex-1 p-2.5 rounded-xl border font-mono text-xs font-semibold"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            placeholder="//Item[@department='Apparel'] or //Price[text() > 15] or count(//Item)"
          />
          <button
            onClick={evaluateXPath}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs text-white shadow-sm flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Evaluate</span>
          </button>
        </div>

        {/* Quick Sample Queries */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[var(--muted)] font-medium">Quick Queries:</span>
          {[
            { label: 'All Items', q: '//Item' },
            { label: 'Apparel Dept', q: '//Item[@department="Apparel"]' },
            { label: 'Count Items', q: 'count(//Item)' },
            { label: 'All SKUs', q: '//Item/@sku' },
            { label: 'Item Titles', q: '//Item/Title/text()' },
            { label: 'Price > $15', q: '//Item[UnitPrice > 15]' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setXpathQuery(item.q)}
              className="px-2.5 py-1 rounded-lg border font-mono text-[11px] hover:opacity-80 transition-opacity"
              style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {evalError && (
        <div className="p-3.5 rounded-xl border flex items-center gap-2 text-xs bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{evalError}</span>
        </div>
      )}

      {/* Editor and Match Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source XML Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              XML DOCUMENT
            </span>
            <button
              onClick={() => setXmlInput(SAMPLE_XML)}
              className="text-[11px] text-[var(--brand)] font-medium hover:underline"
            >
              Reset Sample
            </button>
          </div>
          <textarea
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            rows={18}
            className="w-full flex-1 p-3.5 font-mono text-xs rounded-xl border outline-none leading-relaxed resize-y"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        {/* Evaluated Matches Panel */}
        <div
          className="p-4 rounded-2xl border shadow-sm flex flex-col"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              EVALUATED MATCHES (
              {scalarResult !== null ? '1 Computed Value' : `${matches.length} Nodes`})
            </span>
            <button
              onClick={handleCopyResults}
              disabled={matches.length === 0 && scalarResult === null}
              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--brand)] hover:underline disabled:opacity-40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Results'}</span>
            </button>
          </div>

          <div
            className="w-full flex-1 p-3 rounded-xl border overflow-y-auto font-mono text-xs space-y-2.5 max-h-[460px]"
            style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)' }}
          >
            {scalarResult !== null && (
              <div
                className="p-4 rounded-xl border bg-white dark:bg-slate-800"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="text-[11px] text-[var(--muted)] uppercase font-semibold mb-1">
                  Computed Scalar Value:
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {scalarResult}
                </div>
              </div>
            )}

            {scalarResult === null && matches.length === 0 && !evalError && (
              <div className="text-center py-12 text-[var(--muted)]">
                No matching nodes found for XPath query.
              </div>
            )}

            {matches.map((m) => (
              <div
                key={m.index}
                className="p-3 rounded-xl border bg-white dark:bg-slate-800 shadow-xs"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--brand)] text-white">
                      #{m.index}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--ink)]">{m.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-semibold">
                    {m.type}
                  </span>
                </div>
                <pre className="p-2 rounded-lg bg-slate-900 text-slate-100 text-[11px] overflow-x-auto leading-relaxed">
                  {m.xmlSnippet}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
