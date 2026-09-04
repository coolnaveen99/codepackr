import React from 'react';
import {
  Braces,
  Code,
  Palette,
  Database,
  FileCode,
  FileSpreadsheet,
  Binary,
  Link,
  Shield,
  Key,
  QrCode,
  Split,
  Search,
  CheckCircle,
  FileDiff,
  FileText,
  FileCheck,
  RefreshCw,
  Sliders,
  Calculator,
  Percent,
  Receipt,
  CreditCard,
  Hash,
  Lock,
  Type,
  Clock,
  Globe,
  Shuffle,
  AlignLeft,
  Minimize2,
  Terminal,
  HelpCircle,
  Table,
  Workflow,
  Layers,
  Send,
  Repeat,
  CaseSensitive,
  ArrowLeftRight,
  Sparkles,
  DollarSign,
  Fingerprint,
  Pipette,
  CalendarClock,
  Tag,
  SearchCode,
  CheckCircle2,
  SlidersHorizontal,
  Maximize2,
  Eye,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  FileCode2,
} from 'lucide-react';

export const getIcon = (name: string, className = 'w-5 h-5') => {
  switch (name) {
    case 'Braces':
      return <Braces className={className} />;
    case 'Code':
      return <Code className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'FileCode':
      return <FileCode className={className} />;
    case 'FileCode2':
      return <FileCode2 className={className} />;
    case 'FileSpreadsheet':
      return <FileSpreadsheet className={className} />;
    case 'Binary':
      return <Binary className={className} />;
    case 'Link':
      return <Link className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Key':
      return <Key className={className} />;
    case 'QrCode':
      return <QrCode className={className} />;
    case 'Split':
      return <Split className={className} />;
    case 'Search':
      return <Search className={className} />;
    case 'SearchCode':
      return <SearchCode className={className} />;
    case 'CheckCircle':
      return <CheckCircle className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'FileDiff':
      return <FileDiff className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'FileCheck':
      return <FileCheck className={className} />;
    case 'FileCheck2':
      return <FileCheck2 className={className} />;
    case 'RefreshCw':
      return <RefreshCw className={className} />;
    case 'Sliders':
      return <Sliders className={className} />;
    case 'SlidersHorizontal':
      return <SlidersHorizontal className={className} />;
    case 'Calculator':
      return <Calculator className={className} />;
    case 'Percent':
      return <Percent className={className} />;
    case 'Receipt':
      return <Receipt className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Hash':
      return <Hash className={className} />;
    case 'Lock':
      return <Lock className={className} />;
    case 'Type':
      return <Type className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Shuffle':
      return <Shuffle className={className} />;
    case 'AlignLeft':
      return <AlignLeft className={className} />;
    case 'Minimize2':
      return <Minimize2 className={className} />;
    case 'Table':
      return <Table className={className} />;
    case 'Workflow':
      return <Workflow className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Send':
      return <Send className={className} />;
    case 'Repeat':
      return <Repeat className={className} />;
    case 'CaseSensitive':
      return <CaseSensitive className={className} />;
    case 'ArrowLeftRight':
      return <ArrowLeftRight className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'DollarSign':
      return <DollarSign className={className} />;
    case 'Fingerprint':
      return <Fingerprint className={className} />;
    case 'Pipette':
      return <Pipette className={className} />;
    case 'CalendarClock':
      return <CalendarClock className={className} />;
    case 'Tag':
      return <Tag className={className} />;
    case 'Maximize2':
      return <Maximize2 className={className} />;
    case 'Eye':
      return <Eye className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    default:
      return <Terminal className={className} />;
  }
};
