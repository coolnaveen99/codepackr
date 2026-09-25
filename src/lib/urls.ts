import { ToolDef } from '../types';
import { TOOLS } from '../data/tools';

export const SLUG_TO_TOOL_ID: Record<string, string> = {
  'json-formatter': 'json-formatter',
};

export type AppPage = 'home' | 'contact' | 'privacy' | 'about' | 'admin' | 'notFound';

export function getToolPath(tool: ToolDef | string): string {
  const toolId = typeof tool === 'string' ? tool : tool.id;
  return `/${toolId}`;
}

export function getToolDirectUrl(tool: ToolDef | string): string {
  return `https://www.codepackr.com${getToolPath(tool)}`;
}

export const CATEGORY_SLUG_MAP: Record<string, string> = {};
export const FINANCIAL_REDIRECT_SLUGS = new Set<string>();
export const TOOL_ID_TO_CANONICAL_SLUG: Record<string, string> = {};

export function resolveCurrentRoute(): {
  page: AppPage;
  tool: ToolDef | null;
  category?: string;
  externalRedirect?: string;
} {
  if (typeof window === 'undefined') {
    return { page: 'home', tool: null };
  }
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const searchParams = new URLSearchParams(window.location.search);
  const rawSlug = pathname.replace(/\.html$/, '');
  if (pathname === 'about.html' || pathname === 'about' || searchParams.get('page') === 'about') {
    return { page: 'about', tool: null };
  }
  if (pathname === 'privacy.html' || pathname === 'privacy' || searchParams.get('page') === 'privacy') {
    return { page: 'privacy', tool: null };
  }
  if (pathname === 'contact.html' || pathname === 'contact' || searchParams.get('page') === 'contact') {
    return { page: 'contact', tool: null };
  }
  if (pathname === 'terms.html' || pathname === 'terms') {
    return { page: 'privacy', tool: null, category: 'terms' };
  }
  if (pathname === 'admin.html' || pathname === 'admin') {
    return { page: 'admin', tool: null };
  }
  if (!pathname || pathname === 'index.html' || pathname === 'index') {
    return { page: 'home', tool: null };
  }
  const foundTool = TOOLS.find((t) => t.id === rawSlug || t.id === (searchParams.get('tool') || ''));
  if (foundTool) {
    return { page: 'home', tool: foundTool };
  }
  return { page: 'notFound', tool: null };
}
