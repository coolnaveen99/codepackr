import { useState, useEffect, useRef, useCallback } from 'react';
import { safeLocalStorage } from './storage';

const WORKSPACE_PREFIX = 'codepackr_ws_';
const TRANSFER_KEY = 'codepackr_smart_paste_payload';

/**
 * Stores payload passed from Smart Paste to be picked up by the target tool
 */
export function setSmartPastePayload(toolId: string, payload: string, category?: string) {
  try {
    safeLocalStorage.setItem(
      TRANSFER_KEY,
      JSON.stringify({ toolId, payload, category, timestamp: Date.now() })
    );
  } catch {
    // ignore
  }
}

/**
 * Checks and retrieves any pending Smart Paste payload for a tool
 */
export function popSmartPastePayload(toolId?: string): string | null {
  try {
    const raw = safeLocalStorage.getItem(TRANSFER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Discard payloads older than 5 minutes
    if (Date.now() - (data.timestamp || 0) > 300000) {
      safeLocalStorage.removeItem(TRANSFER_KEY);
      return null;
    }
    
    // Check if target toolId matches
    const matches =
      !toolId ||
      data.toolId === toolId ||
      data.category === toolId ||
      (toolId === 'edi' && data.toolId?.startsWith('edi-')) ||
      (toolId === 'edi-formatter' && (data.toolId === 'edi-x12-formatter' || data.toolId === 'edi-formatter')) ||
      (toolId === 'edi-to-json' && (data.toolId === 'edi-json-converter' || data.toolId === 'edi-to-json')) ||
      (toolId === 'base64' && data.toolId?.includes('base64')) ||
      (toolId === 'url-encode' && data.toolId?.includes('url'));

    if (matches) {
      safeLocalStorage.removeItem(TRANSFER_KEY);
      return data.payload || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Peek pending payload without discarding immediately
 */
export function peekSmartPastePayload(toolId?: string): string | null {
  try {
    const raw = safeLocalStorage.getItem(TRANSFER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - (data.timestamp || 0) > 300000) return null;
    if (!toolId || data.toolId === toolId || data.category === toolId || !data.toolId) {
      return data.payload || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Local-first auto-saving workspace hook
 */
export function useWorkspace(toolId: string, defaultContent: string = '') {
  const storageKey = `${WORKSPACE_PREFIX}${toolId}`;

  // Initialize with priority: 1) Pending Smart Paste transfer, 2) Cached workspace, 3) Default
  const [content, setContent] = useState<string>(() => {
    const pendingTransfer = popSmartPastePayload(toolId);
    if (pendingTransfer !== null) {
      safeLocalStorage.setItem(storageKey, pendingTransfer);
      return pendingTransfer;
    }
    const cached = safeLocalStorage.getItem(storageKey);
    if (cached !== null) {
      return cached;
    }
    return defaultContent;
  });

  const [isSavedLocally, setIsSavedLocally] = useState<boolean>(() => {
    return safeLocalStorage.getItem(storageKey) !== null;
  });

  const debounceTimerRef = useRef<any>(null);

  // Debounced auto-save to local storage
  const updateContent = useCallback(
    (newVal: string) => {
      setContent(newVal);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        try {
          safeLocalStorage.setItem(storageKey, newVal);
          setIsSavedLocally(true);
        } catch {
          // ignore
        }
      }, 350);
    },
    [storageKey]
  );

  // Securely clear tool workspace
  const clearWorkspace = useCallback(
    (fallback: string = '') => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      try {
        safeLocalStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      setContent(fallback);
      setIsSavedLocally(false);
    },
    [storageKey]
  );

  // Reset to default sample
  const resetToSample = useCallback(
    (sample: string) => {
      updateContent(sample);
    },
    [updateContent]
  );

  useEffect(() => {
    const pendingTransfer = popSmartPastePayload(toolId);
    if (pendingTransfer !== null) {
      safeLocalStorage.setItem(storageKey, pendingTransfer);
      setContent(pendingTransfer);
      setIsSavedLocally(true);
    } else if (defaultContent && !safeLocalStorage.getItem(storageKey)) {
      setContent(defaultContent);
    }
  }, [toolId, storageKey, defaultContent]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    content,
    setContent: updateContent,
    clearWorkspace,
    resetToSample,
    isSavedLocally,
  };
}
