export type ToolCategory = 
  | 'image'
  | 'formatters'
  | 'encoders'
  | 'validators'
  | 'converters'
  | 'edi'
  | 'xml'
  | 'financial-calculators'
  | 'utilities'
  | 'text';

export type CategoryFilter = ToolCategory | 'all' | 'bookmarks';

export interface ToolDef {
  id: string;
  name: string;
  category: ToolCategory;
  secondaryCategories?: ToolCategory[];
  description: string;
  keywords: string[];
  icon: string;
  popular?: boolean;
  isNew?: boolean;
  tags?: string[];
}
