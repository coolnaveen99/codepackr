import React, { useState, useEffect } from 'react';
import { Sparkles, FileCode2, ArrowLeftRight, Search, ShieldCheck, Code, ArrowRight } from 'lucide-react';
import { ToolDef } from '../../types';
import { XsltTransformerView } from './XsltTransformerView';
import { XmlToXsdGeneratorView } from './XmlToXsdGeneratorView';
import { XsdToXmlGeneratorView } from './XsdToXmlGeneratorView';
import { XPathEvaluatorView } from './XPathEvaluatorView';
import { XmlEscapeView } from './XmlEscapeView';

interface XmlToolsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const XmlToolsView: React.FC<XmlToolsViewProps> = ({
  tool,
  onBackToHome,
  onSelectRelated,
  initialInput = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>(tool.id || 'xslt-transformer');

  useEffect(() => {
    if (tool.id) {
      setActiveTab(tool.id);
    }
  }, [tool.id]);

  const tabs = [
    { id: 'xslt-transformer', label: 'XSLT Transformer', icon: Sparkles },
    { id: 'xml-to-xsd', label: 'XML to XSD Generator', icon: FileCode2 },
    { id: 'xsd-to-xml', label: 'XSD to XML Generator', icon: ArrowLeftRight },
    { id: 'xpath-evaluator', label: 'XPath Evaluator', icon: Search },
    { id: 'xml-escape-tool', label: 'XML Entity & CDATA', icon: Code },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tool navigation switcher */}
      <div className="flex items-center gap-2 border-b overflow-x-auto no-scrollbar pb-2" style={{ borderColor: 'var(--line)' }}>
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--brand)' : 'var(--surface)',
                color: isActive ? '#ffffff' : 'var(--muted)',
                border: isActive ? '1px solid var(--brand)' : '1px solid var(--line)',
              }}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active XML/XSD/XSLT Sub-tool */}
      {activeTab === 'xslt-transformer' && (
        <XsltTransformerView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
      )}
      {activeTab === 'xml-to-xsd' && (
        <XmlToXsdGeneratorView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
      )}
      {activeTab === 'xsd-to-xml' && (
        <XsdToXmlGeneratorView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
      )}
      {activeTab === 'xpath-evaluator' && (
        <XPathEvaluatorView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
      )}
      {activeTab === 'xml-escape-tool' && (
        <XmlEscapeView tool={tool} onBackToHome={onBackToHome} onSelectRelated={onSelectRelated} />
      )}
    </div>
  );
};
