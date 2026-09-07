import React from 'react';
import {
  JsonIcon,
  XmlIcon,
  CodeIcon,
  SqlIcon,
  DatabaseIcon,
  Base64Icon,
  JwtIcon,
  HashIcon,
  SecurityIcon,
  CheckIcon,
  ConvertIcon,
  TerminalIcon,
  RegexIcon,
  UrlIcon,
  UuidIcon,
  TimestampIcon,
  ColorIcon,
  HtmlIcon,
  CssIcon,
  JavascriptIcon,
  TypescriptIcon,
  ApiIcon,
  SearchIcon,
  EdiWorkflowIcon,
  EdiTransactionIcon,
  EdiAckIcon,
  EdiInspectorIcon,
  CalculatorIcon,
  TrendingUpIcon,
  CurrencyIcon,
} from '../components/CodePackrIcons';

export const getIcon = (iconName: string, size = 18, className = ''): React.ReactNode => {
  const props = { size, className };

  switch (iconName.toLowerCase()) {
    case 'json':
      return <JsonIcon {...props} />;
    case 'xml':
      return <XmlIcon {...props} />;
    case 'code':
      return <CodeIcon {...props} />;
    case 'sql':
    case 'database':
      return <SqlIcon {...props} />;
    case 'base64':
      return <Base64Icon {...props} />;
    case 'jwt':
    case 'lock':
      return <JwtIcon {...props} />;
    case 'hash':
      return <HashIcon {...props} />;
    case 'shield':
    case 'security':
      return <SecurityIcon {...props} />;
    case 'check':
    case 'validator':
      return <CheckIcon {...props} />;
    case 'convert':
    case 'transform':
      return <ConvertIcon {...props} />;
    case 'terminal':
      return <TerminalIcon {...props} />;
    case 'regex':
      return <RegexIcon {...props} />;
    case 'url':
    case 'link':
      return <UrlIcon {...props} />;
    case 'uuid':
    case 'fingerprint':
      return <UuidIcon {...props} />;
    case 'clock':
    case 'timestamp':
      return <TimestampIcon {...props} />;
    case 'color':
    case 'palette':
      return <ColorIcon {...props} />;
    case 'html':
      return <HtmlIcon {...props} />;
    case 'css':
      return <CssIcon {...props} />;
    case 'javascript':
    case 'js':
      return <JavascriptIcon {...props} />;
    case 'typescript':
    case 'ts':
      return <TypescriptIcon {...props} />;
    case 'api':
      return <ApiIcon {...props} />;
    case 'search':
      return <SearchIcon {...props} />;

    // Dedicated EDI & Financial Icons
    case 'workflow':
    case 'edi':
    case 'ediflow':
      return <EdiWorkflowIcon {...props} />;
    case 'editransaction':
    case 'filetext':
    case 'filecode':
      return <EdiTransactionIcon {...props} />;
    case 'ediack':
    case 'clipboardcheck':
      return <EdiAckIcon {...props} />;
    case 'ediinspect':
    case 'inspect':
      return <EdiInspectorIcon {...props} />;
    case 'calculator':
    case 'calc':
      return <CalculatorIcon {...props} />;
    case 'trendingup':
    case 'chart':
    case 'sip':
    case 'investment':
      return <TrendingUpIcon {...props} />;
    case 'currency':
    case 'dollar':
    case 'loan':
    case 'emi':
      return <CurrencyIcon {...props} />;

    default:
      return <CodeIcon {...props} />;
  }
};
