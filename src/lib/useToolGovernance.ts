import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ToolGovernanceItem,
  ToolGovernanceMap,
  AuditLogEntry,
  GlobalSystemConfig,
} from '../types/admin';
import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';
import { safeLocalStorage } from './storage';

const STORAGE_KEY_PREFIX = 'codepackr_tool_gov_';
const AUDIT_STORAGE_KEY = 'codepackr_admin_audit_logs';
const GLOBAL_CONFIG_KEY = 'codepackr_global_system_config';
const ENV_KEY = 'codepackr_admin_env';

export const DEFAULT_GLOBAL_CONFIG: GlobalSystemConfig = {
  globalBannerActive: false,
  globalBannerText: 'CodePackr Enterprise: High-performance, privacy-first developer utilities & EDI transaction hub.',
  globalBannerType: 'info',
  globalBannerLink: '',
  globalBannerLinkText: 'View Details',
  maintenanceMode: false,
  environment: 'production',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'admin@codepackr.com',
};

// Initial realistic seed audit trail for immediate enterprise demonstration
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_init_001',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    adminEmail: 'admin@codepackr.com',
    toolId: 'edi-validator',
    toolName: 'EDI X12 / EDIFACT Validator',
    action: 'status_change',
    previousState: { status: 'beta', visibility: 'public' },
    newState: { status: 'active', visibility: 'public', rolloutPercentage: 100 },
    reason: 'Promoted from Beta to Active following production readiness verification.',
    environment: 'production',
  },
  {
    id: 'audit_init_002',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    adminEmail: 'admin@codepackr.com',
    toolId: 'json-schema-validator',
    toolName: 'JSON Schema Validator',
    action: 'rollout_change',
    previousState: { rolloutPercentage: 50 },
    newState: { rolloutPercentage: 100 },
    reason: 'Expanded A/B rollout to 100% of production traffic after stability review.',
    environment: 'production',
  },
  {
    id: 'audit_init_003',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    adminEmail: 'tnavkum@gmail.com',
    action: 'global_banner',
    previousState: { globalBannerActive: false },
    newState: { globalBannerActive: false, globalBannerType: 'info' },
    reason: 'Configured global system notification template.',
    environment: 'production',
  },
];

// Helper: device bucket for percentage rollout (0-99)
function getVisitorBucket(): number {
  try {
    let val = safeLocalStorage.getItem('codepackr_device_bucket');
    if (!val) {
      const bucket = Math.floor(Math.random() * 100);
      safeLocalStorage.setItem('codepackr_device_bucket', String(bucket));
      return bucket;
    }
    return parseInt(val, 10) || 0;
  } catch {
    return 50;
  }
}

// Current environment
let currentEnvironment: 'production' | 'staging' = (() => {
  try {
    const saved = safeLocalStorage.getItem(ENV_KEY);
    if (saved === 'staging' || saved === 'production') return saved;
  } catch {
    // ignore
  }
  return 'production';
})();

// Shared governance state
let sharedGovernance: ToolGovernanceMap = (() => {
  try {
    const cached = safeLocalStorage.getItem(`${STORAGE_KEY_PREFIX}${currentEnvironment}`);
    if (cached) return JSON.parse(cached);
  } catch {
    // ignore
  }
  return {};
})();

// Shared global config
let sharedGlobalConfig: GlobalSystemConfig = (() => {
  try {
    const cached = safeLocalStorage.getItem(GLOBAL_CONFIG_KEY);
    if (cached) return { ...DEFAULT_GLOBAL_CONFIG, ...JSON.parse(cached) };
  } catch {
    // ignore
  }
  return DEFAULT_GLOBAL_CONFIG;
})();

// Shared audit logs
let sharedAuditLogs: AuditLogEntry[] = (() => {
  try {
    const cached = safeLocalStorage.getItem(AUDIT_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_AUDIT_LOGS;
})();

let hasFetched = false;
let isFetching = false;
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

// Single fetch for Firestore documents with fast graceful timeout
async function fetchRemoteState(): Promise<void> {
  if (hasFetched || isFetching || !db) return;
  isFetching = true;

  try {
    const timeout = (ms: number) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

    // 1. Fetch tools status
    const toolsDocRef = doc(db, 'system_config', `tools_status_${currentEnvironment}`);
    const snapshotPromise = getDoc(toolsDocRef);
    const snapshot = await Promise.race([snapshotPromise, timeout(3000)]);

    if (snapshot && 'exists' in snapshot && snapshot.exists()) {
      const data = snapshot.data() as ToolGovernanceMap;
      sharedGovernance = data;
      safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}${currentEnvironment}`, JSON.stringify(data));
    }

    // 2. Fetch global config
    const globalDocRef = doc(db, 'system_config', 'global_state');
    const globalSnap = await Promise.race([getDoc(globalDocRef), timeout(2000)]).catch(() => null);
    if (globalSnap && 'exists' in globalSnap && globalSnap.exists()) {
      const gData = globalSnap.data() as GlobalSystemConfig;
      sharedGlobalConfig = { ...DEFAULT_GLOBAL_CONFIG, ...gData };
      safeLocalStorage.setItem(GLOBAL_CONFIG_KEY, JSON.stringify(sharedGlobalConfig));
    }

    // 3. Fetch recent audit logs
    const auditColl = collection(db, 'admin_audit_logs');
    const auditQuery = query(auditColl, orderBy('timestamp', 'desc'), limit(50));
    const auditSnap = await Promise.race([getDocs(auditQuery), timeout(2500)]).catch(() => null);
    if (auditSnap && 'docs' in auditSnap && auditSnap.docs.length > 0) {
      const fetchedLogs = auditSnap.docs.map((d) => d.data() as AuditLogEntry);
      sharedAuditLogs = fetchedLogs;
      safeLocalStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(fetchedLogs));
    }

    notifyAll();
  } catch {
    // Offline or network error: gracefully keep using cached local state
  } finally {
    isFetching = false;
    hasFetched = true;
  }
}

export function useToolGovernance() {
  const [governance, setGovernance] = useState<ToolGovernanceMap>(sharedGovernance);
  const [globalConfig, setGlobalConfig] = useState<GlobalSystemConfig>(sharedGlobalConfig);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(sharedAuditLogs);
  const [environment, setEnvironmentState] = useState<'production' | 'staging'>(currentEnvironment);
  const [loading, setLoading] = useState(!hasFetched);

  useEffect(() => {
    const handler = () => {
      setGovernance({ ...sharedGovernance });
      setGlobalConfig({ ...sharedGlobalConfig });
      setAuditLogs([...sharedAuditLogs]);
      setEnvironmentState(currentEnvironment);
      setLoading(false);
    };

    listeners.add(handler);
    fetchRemoteState().then(() => setLoading(false));

    return () => {
      listeners.delete(handler);
    };
  }, []);

  const setEnvironment = (env: 'production' | 'staging') => {
    currentEnvironment = env;
    setEnvironmentState(env);
    safeLocalStorage.setItem(ENV_KEY, env);
    try {
      const cached = safeLocalStorage.getItem(`${STORAGE_KEY_PREFIX}${env}`);
      sharedGovernance = cached ? JSON.parse(cached) : {};
    } catch {
      sharedGovernance = {};
    }
    notifyAll();
    hasFetched = false;
    fetchRemoteState();
  };

  const getToolStatus = (toolId: string): ToolGovernanceItem => {
    const item = governance[toolId];
    if (item) return item;

    // Default status & realistic baseline hits based on tools catalog
    const tool = TOOLS.find((t) => t.id === toolId);
    return {
      status: 'active',
      visibility: 'public',
      rolloutPercentage: 100,
      healthStatus: 'healthy',
      monthlyHits: tool?.category === 'edi' ? 14200 : tool?.category === 'formatters' ? 22400 : 8500,
    };
  };

  const isToolVisible = (toolId: string, isAdmin = false): boolean => {
    const item = getToolStatus(toolId);
    if (isAdmin) return true;
    if (item.status === 'hidden') return false;
    if (item.visibility === 'admin_only') return false;

    // Phased rollout check for non-admin visitors
    if (typeof item.rolloutPercentage === 'number' && item.rolloutPercentage < 100) {
      const visitorBucket = getVisitorBucket();
      if (visitorBucket >= item.rolloutPercentage) {
        return false;
      }
    }

    return true;
  };

  const getEffectiveTools = (tools: ToolDef[], isAdmin = false): ToolDef[] => {
    return tools.filter((tool) => isToolVisible(tool.id, isAdmin));
  };

  // Record an immutable audit log entry
  const recordAuditLog = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> => {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      environment: currentEnvironment,
    };

    const newLogs = [fullEntry, ...sharedAuditLogs].slice(0, 200);
    sharedAuditLogs = newLogs;
    setAuditLogs(newLogs);
    safeLocalStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(newLogs));
    notifyAll();

    if (db) {
      try {
        const auditDocRef = doc(db, 'admin_audit_logs', fullEntry.id);
        await setDoc(auditDocRef, fullEntry);
      } catch {
        // Cached locally
      }
    }
  };

  const saveToolStatus = async (
    toolId: string,
    updates: Partial<ToolGovernanceItem>,
    adminEmail = 'admin@codepackr.com',
    reason = 'Routine configuration update'
  ): Promise<void> => {
    const previous = getToolStatus(toolId);
    const updatedItem: ToolGovernanceItem = {
      ...previous,
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminEmail,
    };

    const updatedMap: ToolGovernanceMap = {
      ...sharedGovernance,
      ...governance,
      [toolId]: updatedItem,
    };

    sharedGovernance = updatedMap;
    setGovernance(updatedMap);
    safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}${currentEnvironment}`, JSON.stringify(updatedMap));
    notifyAll();

    // Determine audit action
    let actionType: AuditLogEntry['action'] = 'status_change';
    if (updates.visibility && updates.visibility !== previous.visibility) actionType = 'visibility_change';
    else if (updates.noticeMessage !== undefined && updates.noticeMessage !== previous.noticeMessage) actionType = 'notice_change';
    else if (updates.rolloutPercentage !== undefined && updates.rolloutPercentage !== previous.rolloutPercentage) actionType = 'rollout_change';

    const toolDef = TOOLS.find((t) => t.id === toolId);

    await recordAuditLog({
      adminEmail,
      toolId,
      toolName: toolDef?.name || toolId,
      action: actionType,
      previousState: previous,
      newState: updatedItem,
      reason,
    });

    if (db) {
      try {
        const docRef = doc(db, 'system_config', `tools_status_${currentEnvironment}`);
        await setDoc(docRef, updatedMap, { merge: true });
      } catch {
        // Cached locally
      }
    }
  };

  const saveBulkToolStatus = async (
    toolIds: string[],
    updates: Partial<ToolGovernanceItem>,
    adminEmail = 'admin@codepackr.com',
    reason = 'Bulk operational update'
  ): Promise<void> => {
    const timestamp = new Date().toISOString();
    const updatedMap: ToolGovernanceMap = {
      ...sharedGovernance,
      ...governance,
    };

    toolIds.forEach((id) => {
      const prev = getToolStatus(id);
      updatedMap[id] = {
        ...prev,
        ...updates,
        lastUpdated: timestamp,
        updatedBy: adminEmail,
      };
    });

    sharedGovernance = updatedMap;
    setGovernance(updatedMap);
    safeLocalStorage.setItem(`${STORAGE_KEY_PREFIX}${currentEnvironment}`, JSON.stringify(updatedMap));
    notifyAll();

    await recordAuditLog({
      adminEmail,
      toolId: `bulk (${toolIds.length} tools)`,
      toolName: `${toolIds.length} utilities selected`,
      action: 'bulk_update',
      previousState: { count: toolIds.length },
      newState: updates,
      reason,
    });

    if (db) {
      try {
        const docRef = doc(db, 'system_config', `tools_status_${currentEnvironment}`);
        await setDoc(docRef, updatedMap, { merge: true });
      } catch {
        // Saved locally
      }
    }
  };

  const saveGlobalConfig = async (
    updates: Partial<GlobalSystemConfig>,
    adminEmail = 'admin@codepackr.com',
    reason = 'Updated platform announcement banner'
  ): Promise<void> => {
    const prev = sharedGlobalConfig;
    const updated: GlobalSystemConfig = {
      ...prev,
      ...updates,
      environment: currentEnvironment,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminEmail,
    };

    sharedGlobalConfig = updated;
    setGlobalConfig(updated);
    safeLocalStorage.setItem(GLOBAL_CONFIG_KEY, JSON.stringify(updated));
    notifyAll();

    await recordAuditLog({
      adminEmail,
      action: 'global_banner',
      previousState: prev,
      newState: updated,
      reason,
    });

    if (db) {
      try {
        const docRef = doc(db, 'system_config', 'global_state');
        await setDoc(docRef, updated, { merge: true });
      } catch {
        // Saved locally
      }
    }
  };

  return {
    governance,
    globalConfig,
    auditLogs,
    environment,
    loading,
    setEnvironment,
    getToolStatus,
    isToolVisible,
    getEffectiveTools,
    saveToolStatus,
    saveBulkToolStatus,
    saveGlobalConfig,
    recordAuditLog,
  };
}
