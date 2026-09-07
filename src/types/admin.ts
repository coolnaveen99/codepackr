export type ToolStatus = 'active' | 'hidden' | 'maintenance' | 'beta';

export interface ToolGovernanceItem {
  status: ToolStatus;
  visibility: 'public' | 'admin_only';
  noticeMessage?: string;
  customBadge?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

export type ToolGovernanceMap = Record<string, ToolGovernanceItem>;
