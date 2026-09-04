export type ToolCategory = 
  | 'formatters'
  | 'encoders'
  | 'validators'
  | 'converters'
  | 'edi'
  | 'xml'
  | 'calculators'
  | 'utilities'
  | 'text';

export type CategoryFilter = ToolCategory | 'all' | 'bookmarks';

export interface ToolDef {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  keywords: string[];
  icon: string;
  popular?: boolean;
  isNew?: boolean;
  tags?: string[];
}
