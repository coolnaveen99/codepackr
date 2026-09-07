import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ToolGovernanceItem, ToolGovernanceMap } from '../types/admin';
import { ToolDef } from '../types';

const STORAGE_KEY = 'codepackr_tool_governance';

export function useToolGovernance() {
  const [governance, setGovernance] = useState<ToolGovernanceMap>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed to parse cached governance', e);
      }
    }
    return {};
  });

  const [loading, setLoading] = useState(true);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'system_config', 'tools_status');
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as ToolGovernanceMap;
            setGovernance(data);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
              // ignore
            }
          }
          setLoading(false);
        },
        (error) => {
          console.warn('[Codepackr Governance] Firestore offline or permission denied:', error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[Codepackr Governance] Setup error:', err);
      setLoading(false);
    }
  }, []);

  const getToolStatus = (toolId: string): ToolGovernanceItem => {
    return (
      governance[toolId] || {
        status: 'active',
        visibility: 'public',
      }
    );
  };

  const isToolVisible = (toolId: string, isAdmin = false): boolean => {
    const item = getToolStatus(toolId);
    if (isAdmin) return true;
    if (item.status === 'hidden') return false;
    if (item.visibility === 'admin_only') return false;
    return true;
  };

  const getEffectiveTools = (tools: ToolDef[], isAdmin = false): ToolDef[] => {
    return tools.filter((tool) => isToolVisible(tool.id, isAdmin));
  };

  const saveToolStatus = async (
    toolId: string,
    updates: Partial<ToolGovernanceItem>,
    adminEmail = 'admin@codepackr.com'
  ): Promise<void> => {
    if (!db) throw new Error('Firestore is not initialized');

    const updatedMap: ToolGovernanceMap = {
      ...governance,
      [toolId]: {
        ...getToolStatus(toolId),
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: adminEmail,
      },
    };

    const docRef = doc(db, 'system_config', 'tools_status');
    await setDoc(docRef, updatedMap, { merge: true });
    setGovernance(updatedMap);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMap));
  };

  return {
    governance,
    loading,
    getToolStatus,
    isToolVisible,
    getEffectiveTools,
    saveToolStatus,
  };
}
