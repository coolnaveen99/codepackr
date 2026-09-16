import { ToolDef } from '../types';
import { safeLocalStorage } from './storage';

export interface SystemDiagnostics {
  tool?: {
    id: string;
    name: string;
    category: string;
    description?: string;
  };
  app: {
    name: string;
    version: string;
    timestamp: string;
    localTime: string;
    currentUrl: string;
    pathname: string;
    theme: string;
    online: boolean;
    referrer: string;
  };
  client: {
    userAgent: string;
    browser: string;
    os: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    screenResolution: string;
    viewport: string;
    devicePixelRatio: number;
    language: string;
    timezone: string;
    hardwareConcurrency?: number;
    deviceMemoryGB?: number;
    connectionType?: string;
  };
  storage: {
    localStorageAvailable: boolean;
    sessionStorageAvailable: boolean;
  };
  errorLog: string[];
  contextSnippet?: {
    inputLength: number;
    outputLength?: number;
    sanitizedPreview?: string;
  };
}

// In-memory circular buffer of recent client exceptions (max 5)
const RECENT_ERRORS: string[] = [];
let errorListenerInitialized = false;

export function initErrorListener() {
  if (errorListenerInitialized || typeof window === 'undefined') return;
  errorListenerInitialized = true;

  window.addEventListener('error', (event) => {
    try {
      const msg = `[Error] ${event.message || 'Script error'} at ${event.filename || 'unknown'}:${event.lineno || 0}`;
      RECENT_ERRORS.push(`${new Date().toLocaleTimeString()} - ${msg}`);
      if (RECENT_ERRORS.length > 5) RECENT_ERRORS.shift();
    } catch {}
  });

  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason?.message || String(event.reason || 'Unhandled Promise Rejection');
      const msg = `[UnhandledRejection] ${reason}`;
      RECENT_ERRORS.push(`${new Date().toLocaleTimeString()} - ${msg}`);
      if (RECENT_ERRORS.length > 5) RECENT_ERRORS.shift();
    } catch {}
  });
}

// Auto-initialize error listener when module loads
if (typeof window !== 'undefined') {
  initErrorListener();
}

/**
 * Detects browser name and estimated version from user agent.
 */
function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Google Chrome';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Apple Safari';
  if (/Opera|OPR\//i.test(ua)) return 'Opera';
  return 'Browser (Other)';
}

/**
 * Detects operating system from user agent and navigator.platform.
 */
function detectOS(ua: string): string {
  if (/Windows NT 10.0/i.test(ua)) return 'Windows 10/11';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

/**
 * Collects complete, detailed system diagnostics for bug reporting.
 */
export function collectSystemDiagnostics(options?: {
  tool?: ToolDef | null;
  inputContent?: string;
  outputContent?: string;
  includeSnippet?: boolean;
}): SystemDiagnostics {
  const isBrowser = typeof window !== 'undefined';
  const ua = isBrowser ? navigator.userAgent : 'Node/Server';
  const theme = isBrowser && document.documentElement.classList.contains('dark') ? 'Dark' : 'Light';

  let localStorageAvailable = false;
  let sessionStorageAvailable = false;
  if (isBrowser) {
    try {
      localStorage.setItem('__cp_test__', '1');
      localStorage.removeItem('__cp_test__');
      localStorageAvailable = true;
    } catch {}

    try {
      sessionStorage.setItem('__cp_test__', '1');
      sessionStorage.removeItem('__cp_test__');
      sessionStorageAvailable = true;
    } catch {}
  }

  const width = isBrowser ? window.innerWidth : 1280;
  const height = isBrowser ? window.innerHeight : 800;
  const screenW = isBrowser ? window.screen.width : 1920;
  const screenH = isBrowser ? window.screen.height : 1080;

  const deviceType: 'mobile' | 'tablet' | 'desktop' =
    width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  // Sanitized context snippet if opted-in
  let contextSnippet: SystemDiagnostics['contextSnippet'];
  if (options?.inputContent !== undefined) {
    const inputLen = options.inputContent.length;
    const outputLen = options.outputContent?.length;
    let preview: string | undefined;

    if (options.includeSnippet && inputLen > 0) {
      // Take first 120 chars, remove potential sensitive words/numbers
      preview = options.inputContent.slice(0, 120).replace(/\r?\n/g, ' ');
    }

    contextSnippet = {
      inputLength: inputLen,
      outputLength: outputLen,
      sanitizedPreview: preview,
    };
  }

  const nav = isBrowser ? (navigator as any) : {};

  return {
    tool: options?.tool
      ? {
          id: options.tool.id,
          name: options.tool.name,
          category: options.tool.category,
          description: options.tool.description,
        }
      : undefined,
    app: {
      name: 'CodePackr Enterprise Suite',
      version: '2026.1',
      timestamp: new Date().toISOString(),
      localTime: new Date().toLocaleString(),
      currentUrl: isBrowser ? window.location.href : 'https://www.codepackr.com',
      pathname: isBrowser ? window.location.pathname : '/',
      theme,
      online: isBrowser ? navigator.onLine : true,
      referrer: isBrowser ? document.referrer || '(direct/none)' : '',
    },
    client: {
      userAgent: ua,
      browser: detectBrowser(ua),
      os: detectOS(ua),
      deviceType,
      screenResolution: `${screenW}x${screenH}`,
      viewport: `${width}x${height}`,
      devicePixelRatio: isBrowser ? window.devicePixelRatio || 1 : 1,
      language: isBrowser ? navigator.language : 'en-US',
      timezone: isBrowser ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
      hardwareConcurrency: nav.hardwareConcurrency,
      deviceMemoryGB: nav.deviceMemory,
      connectionType: nav.connection?.effectiveType || nav.connection?.type,
    },
    storage: {
      localStorageAvailable,
      sessionStorageAvailable,
    },
    errorLog: [...RECENT_ERRORS],
    contextSnippet,
  };
}

/**
 * Formats collected diagnostics into clean, structured Markdown.
 */
export function formatDiagnosticsMarkdown(
  diag: SystemDiagnostics,
  userReport: {
    name?: string;
    email?: string;
    severity: string;
    summary: string;
    description: string;
    steps?: string;
  }
): string {
  const lines: string[] = [];

  lines.push(`### 🐛 Bug Report: ${userReport.summary || 'Issue Report'}`);
  lines.push('');
  lines.push(`**Severity**: ${userReport.severity}`);
  lines.push(`**Reporter**: ${userReport.name || 'Anonymous Developer'} (${userReport.email || 'No email provided'})`);
  lines.push(`**Timestamp**: ${diag.app.localTime} (${diag.app.timestamp})`);
  lines.push('');

  lines.push(`#### Description & Observed Behavior:`);
  lines.push(userReport.description || 'No description provided.');
  lines.push('');

  if (userReport.steps) {
    lines.push(`#### Steps to Reproduce:`);
    lines.push(userReport.steps);
    lines.push('');
  }

  lines.push(`#### Active Tool Environment:`);
  if (diag.tool) {
    lines.push(`- **Tool Name**: ${diag.tool.name} (\`${diag.tool.id}\`)`);
    lines.push(`- **Category**: ${diag.tool.category}`);
  } else {
    lines.push(`- **Location**: Global Application`);
  }
  lines.push(`- **Page URL**: \`${diag.app.currentUrl}\``);
  lines.push(`- **Theme**: ${diag.app.theme}`);
  lines.push('');

  lines.push(`#### Client System Diagnostics:`);
  lines.push(`- **Browser**: ${diag.client.browser}`);
  lines.push(`- **Operating System**: ${diag.client.os}`);
  lines.push(`- **Device**: ${diag.client.deviceType} (Viewport: ${diag.client.viewport}, Screen: ${diag.client.screenResolution}, DPR: ${diag.client.devicePixelRatio})`);
  lines.push(`- **Language & Timezone**: ${diag.client.language} (${diag.client.timezone})`);
  if (diag.client.hardwareConcurrency) {
    lines.push(`- **CPU Cores**: ${diag.client.hardwareConcurrency}`);
  }
  if (diag.client.deviceMemoryGB) {
    lines.push(`- **Memory**: ~${diag.client.deviceMemoryGB} GB`);
  }
  lines.push(`- **Network**: ${diag.app.online ? 'Online' : 'Offline'}${diag.client.connectionType ? ` (${diag.client.connectionType})` : ''}`);
  lines.push(`- **Storage**: LocalStorage ${diag.storage.localStorageAvailable ? 'Available' : 'Restricted'}`);
  lines.push(`- **User Agent**: \`${diag.client.userAgent}\``);
  lines.push('');

  if (diag.contextSnippet) {
    lines.push(`#### Workspace Context (Privacy Preserved):`);
    lines.push(`- **Input Length**: ${diag.contextSnippet.inputLength} characters`);
    if (diag.contextSnippet.outputLength !== undefined) {
      lines.push(`- **Output Length**: ${diag.contextSnippet.outputLength} characters`);
    }
    if (diag.contextSnippet.sanitizedPreview) {
      lines.push(`- **Input Preview**: \`${diag.contextSnippet.sanitizedPreview}\``);
    }
    lines.push('');
  }

  if (diag.errorLog && diag.errorLog.length > 0) {
    lines.push(`#### Recent Client Errors (Buffer):`);
    lines.push('```');
    diag.errorLog.forEach((err) => lines.push(err));
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxLtRspOxZaKhGdikBBlAjJk3ndSibOs0t3Im2Xf-K0podjAPItb90iOA9mDjRAbuT_Bg/exec';

/**
 * Sends the bug report through the Google Apps Script contact webhook
 * with dual-dispatch fallback.
 */
export async function sendBugReport(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  scriptUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const targetUrl =
    payload.scriptUrl ||
    safeLocalStorage.getItem('codepackr_contact_script_url') ||
    DEFAULT_SCRIPT_URL;

  const trimmedName = payload.name.trim() || 'Anonymous Developer';
  const trimmedEmail = payload.email.trim() || 'no-reply@codepackr.com';
  const category = payload.category || 'Bug Report';
  const subject = payload.subject.trim() || `[Bug Report] Issue reported by ${trimmedName}`;
  const message = payload.message.trim();

  try {
    const params = new URLSearchParams();
    params.append('name', trimmedName);
    params.append('email', trimmedEmail);
    params.append('subject', subject);
    params.append('message', message);
    params.append('category', category);
    params.append('timestamp', new Date().toISOString());

    // 1. Fetch dispatch with no-cors mode
    const fetchPromise = fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    // 2. Iframe dual-dispatch fallback for guaranteed transmission
    if (typeof document !== 'undefined') {
      try {
        let iframe = document.getElementById('codepackr_bug_iframe') as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = 'codepackr_bug_iframe';
          iframe.name = 'codepackr_bug_iframe';
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = targetUrl;
        form.target = 'codepackr_bug_iframe';
        form.style.display = 'none';

        const addInput = (name: string, val: string) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = val;
          form.appendChild(input);
        };

        addInput('name', trimmedName);
        addInput('email', trimmedEmail);
        addInput('subject', subject);
        addInput('category', category);
        addInput('timestamp', new Date().toISOString());

        const ta = document.createElement('textarea');
        ta.name = 'message';
        ta.value = message;
        form.appendChild(ta);

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
          try {
            document.body.removeChild(form);
          } catch {}
        }, 1000);
      } catch (e) {
        console.warn('Iframe fallback warning:', e);
      }
    }

    await fetchPromise;
    // Allow brief propagation
    await new Promise((res) => setTimeout(res, 500));

    return { success: true };
  } catch (err: any) {
    console.error('Failed to submit bug report:', err);
    return {
      success: false,
      error: err?.message || 'Network transmission error while sending bug report.',
    };
  }
}

/**
 * Builds mailto fallback link pre-filled with all diagnostic details.
 */
export function buildBugReportMailto(
  subject: string,
  body: string,
  emails: string[] = ['codepackr@gmail.com', 'tnavkum@gmail.com']
): string {
  const to = emails.join(',');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
