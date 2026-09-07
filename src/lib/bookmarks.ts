import { useState, useEffect, useCallback } from 'react';
import { getToolDirectUrl } from './urls';
import { safeLocalStorage } from './storage';

const STORAGE_KEY = 'codepackr_bookmarks';
const EVENT_NAME = 'codepackr-bookmarks-changed';

export function getBookmarks(): string[] {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isBookmarked(toolId: string): boolean {
  const current = getBookmarks();
  return current.includes(toolId);
}

export function toggleBookmark(toolId: string): boolean {
  try {
    const current = getBookmarks();
    let updated: string[];
    let isNowBookmarked = false;

    if (current.includes(toolId)) {
      updated = current.filter((id) => id !== toolId);
      isNowBookmarked = false;
    } else {
      updated = [...current, toolId];
      isNowBookmarked = true;
    }

    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { toolId, isBookmarked: isNowBookmarked, bookmarks: updated } }));
    return isNowBookmarked;
  } catch (e) {
    console.error('Failed to toggle bookmark', e);
    return false;
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>(() => getBookmarks());

  useEffect(() => {
    const handleUpdate = () => {
      setBookmarks(getBookmarks());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const checkIsBookmarked = useCallback((id: string) => bookmarks.includes(id), [bookmarks]);

  const toggle = useCallback((id: string) => {
    const res = toggleBookmark(id);
    setBookmarks(getBookmarks());
    return res;
  }, []);

  return {
    bookmarks,
    isBookmarked: checkIsBookmarked,
    toggleBookmark: toggle,
    count: bookmarks.length,
  };
}

export async function shareToolUrl(toolId: string, toolName: string, toolDesc: string): Promise<boolean> {
  const url = getToolDirectUrl(toolId);
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${toolName} - Codepackr`,
        text: toolDesc || `Use ${toolName} on Codepackr - free, private in-browser developer tool.`,
        url,
      });
      return true;
    } catch (e: any) {
      // User dismissed share dialog or browser aborted
      if (e.name === 'AbortError') return false;
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // Legacy fallback
    const temp = document.createElement('input');
    temp.value = url;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    return true;
  }
}
