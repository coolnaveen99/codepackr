export type ToolStatus = 'active' | 'hidden' | 'maintenance' | 'beta';

export interface ToolGovernanceItem {
  status: ToolStatus;
  visibility: 'public' | 'admin_only';
  rolloutPercentage?: number; // 0 to 100 for phased rollout / A/B testing
  noticeMessage?: string;
  customBadge?: string;
  lastUpdated?: string;
  updatedBy?: string;
  healthStatus?: 'healthy' | 'degraded' | 'down';
  monthlyHits?: number;
}

export type ToolGovernanceMap = Record<string, ToolGovernanceItem>;

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  toolId?: string;
  toolName?: string;
  action:
    | 'status_change'
    | 'visibility_change'
    | 'notice_change'
    | 'rollout_change'
    | 'bulk_update'
    | 'global_banner'
    | 'system_config';
  previousState?: any;
  newState?: any;
  reason?: string;
  environment?: 'production' | 'staging';
}

export interface GlobalSystemConfig {
  globalBannerActive: boolean;
  globalBannerText: string;
  globalBannerType: 'info' | 'warning' | 'critical';
  globalBannerLink?: string;
  globalBannerLinkText?: string;
  maintenanceMode?: boolean;
  environment: 'production' | 'staging';
  lastUpdated?: string;
  updatedBy?: string;
}
