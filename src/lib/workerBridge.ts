/**
 * Web Worker & Async Offloading Utility
 * Offloads heavy computations (formatting large payloads, cryptographic hashing, JSON parsing)
 * to real dedicated Web Worker threads via dynamically spawned inline blobs, with graceful
 * fallback to microtask scheduling.
 */

export interface WorkerTaskResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

/**
 * Standard pure MD5 implementation for client-side and worker-side hashing
 */
export function simpleMd5(string: string): string {
  function md5cycle(x: any, k: any) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }
  function cmn(q: any, a: any, b: any, x: any, s: any, t: any) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md51(s: string) {
    var txt = '';
    var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5blk(s: string) {
    var md5blks: any = [], i;
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  var hex_chr = '0123456789abcdef'.split('');
  function rhex(n: any) {
    var s = '', j = 0;
    for (; j < 4; j++)
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
    return s;
  }
  function hex(x: any) {
    for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
    return x.join('');
  }
  function add32(a: any, b: any) {
    return (a + b) & 0xFFFFFFFF;
  }
  return hex(md51(string));
}

/**
 * Spawns an inline Web Worker via Blob and executes a serialized function
 */
export async function executeInWorker<T, A extends any[] = any[]>(
  fn: (...args: A) => T | Promise<T>,
  args: A,
  options: { timeoutMs?: number } = {}
): Promise<WorkerTaskResult<T>> {
  const start = performance.now();
  const timeoutMs = options.timeoutMs || 30000;

  // Fallback for non-browser or environments where Worker / Blob is disabled
  if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    try {
      const data = await fn(...args);
      return { success: true, data, durationMs: Math.round(performance.now() - start) };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err), durationMs: Math.round(performance.now() - start) };
    }
  }

  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let blobUrl: string | null = null;
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }
    };

    try {
      const fnSource = fn.toString();
      const workerScript = `
        self.onmessage = async function(e) {
          try {
            var userFn = (new Function("return (" + e.data.fnSource + ")"))();
            var result = await userFn.apply(null, e.data.args);
            self.postMessage({ success: true, data: result });
          } catch (err) {
            self.postMessage({ success: false, error: (err && err.message) || String(err) });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);

      timer = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          error: `Worker execution timed out after ${timeoutMs / 1000}s`,
          durationMs: Math.round(performance.now() - start),
        });
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent) => {
        cleanup();
        resolve({
          success: Boolean(e.data.success),
          data: e.data.data,
          error: e.data.error,
          durationMs: Math.round(performance.now() - start),
        });
      };

      worker.onerror = (err: ErrorEvent) => {
        cleanup();
        resolve({
          success: false,
          error: err.message || 'Worker thread execution error',
          durationMs: Math.round(performance.now() - start),
        });
      };

      worker.postMessage({ fnSource, args });
    } catch (err: any) {
      cleanup();
      // Graceful fallback to asynchronous main-thread execution if Web Worker spawning fails (e.g., CSP)
      setTimeout(async () => {
        try {
          const data = await fn(...args);
          resolve({
            success: true,
            data,
            durationMs: Math.round(performance.now() - start),
          });
        } catch (innerErr: any) {
          resolve({
            success: false,
            error: innerErr?.message || String(innerErr),
            durationMs: Math.round(performance.now() - start),
          });
        }
      }, 0);
    }
  });
}

/**
 * Dedicated Web Worker for offloaded Cryptographic Hashing (MD5, SHA-1, SHA-256, SHA-384, SHA-512)
 * Ensures UI remains fluid at 60fps even for massive payloads (e.g. >10MB).
 */
export async function computeHashesInWorker(
  text: string,
  options: { timeoutMs?: number } = {}
): Promise<WorkerTaskResult<{ [key: string]: string }>> {
  const start = performance.now();
  const timeoutMs = options.timeoutMs || 30000;

  if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    // Fallback on main thread using Web Crypto
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const sha1Buf = await crypto.subtle.digest('SHA-1', data);
      const sha256Buf = await crypto.subtle.digest('SHA-256', data);
      const sha384Buf = await crypto.subtle.digest('SHA-384', data);
      const sha512Buf = await crypto.subtle.digest('SHA-512', data);

      const bufToHex = (buf: ArrayBuffer) =>
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

      return {
        success: true,
        data: {
          MD5: simpleMd5(text),
          'SHA-1': bufToHex(sha1Buf),
          'SHA-256': bufToHex(sha256Buf),
          'SHA-384': bufToHex(sha384Buf),
          'SHA-512': bufToHex(sha512Buf),
        },
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Hashing failed', durationMs: Math.round(performance.now() - start) };
    }
  }

  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let blobUrl: string | null = null;
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }
    };

    try {
      // Inlined worker containing complete MD5 algorithm and Web Crypto digest
      const workerScript = `
        ${simpleMd5.toString()}

        self.onmessage = async function(e) {
          try {
            var text = e.data.text;
            var md5 = simpleMd5(text);

            var encoder = new TextEncoder();
            var data = encoder.encode(text);

            var sha1Buf = await crypto.subtle.digest('SHA-1', data);
            var sha256Buf = await crypto.subtle.digest('SHA-256', data);
            var sha384Buf = await crypto.subtle.digest('SHA-384', data);
            var sha512Buf = await crypto.subtle.digest('SHA-512', data);

            function bufToHex(buf) {
              var bytes = new Uint8Array(buf);
              var hex = '';
              for (var i = 0; i < bytes.length; i++) {
                hex += bytes[i].toString(16).padStart(2, '0');
              }
              return hex;
            }

            self.postMessage({
              success: true,
              data: {
                'MD5': md5,
                'SHA-1': bufToHex(sha1Buf),
                'SHA-256': bufToHex(sha256Buf),
                'SHA-384': bufToHex(sha384Buf),
                'SHA-512': bufToHex(sha512Buf),
              }
            });
          } catch (err) {
            self.postMessage({ success: false, error: (err && err.message) || String(err) });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);

      timer = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          error: `Cryptographic hashing timed out after ${timeoutMs / 1000}s`,
          durationMs: Math.round(performance.now() - start),
        });
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent) => {
        cleanup();
        resolve({
          success: Boolean(e.data.success),
          data: e.data.data,
          error: e.data.error,
          durationMs: Math.round(performance.now() - start),
        });
      };

      worker.onerror = (err: ErrorEvent) => {
        cleanup();
        resolve({
          success: false,
          error: err.message || 'Worker hashing thread error',
          durationMs: Math.round(performance.now() - start),
        });
      };

      worker.postMessage({ text });
    } catch (err: any) {
      cleanup();
      // Fallback to async main thread
      setTimeout(async () => {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(text);
          const sha1Buf = await crypto.subtle.digest('SHA-1', data);
          const sha256Buf = await crypto.subtle.digest('SHA-256', data);
          const sha384Buf = await crypto.subtle.digest('SHA-384', data);
          const sha512Buf = await crypto.subtle.digest('SHA-512', data);

          const bufToHex = (buf: ArrayBuffer) =>
            Array.from(new Uint8Array(buf))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');

          resolve({
            success: true,
            data: {
              MD5: simpleMd5(text),
              'SHA-1': bufToHex(sha1Buf),
              'SHA-256': bufToHex(sha256Buf),
              'SHA-384': bufToHex(sha384Buf),
              'SHA-512': bufToHex(sha512Buf),
            },
            durationMs: Math.round(performance.now() - start),
          });
        } catch (innerErr: any) {
          resolve({
            success: false,
            error: innerErr?.message || String(innerErr),
            durationMs: Math.round(performance.now() - start),
          });
        }
      }, 0);
    }
  });
}

/**
 * Dedicated Web Worker for offloaded JSON Formatting & Minification
 * Prevents UI freeze when parsing or stringifying massive JSON strings.
 */
export async function formatJsonInWorker(
  rawJson: string,
  indent: string | number = 2,
  minify: boolean = false,
  options: { timeoutMs?: number } = {}
): Promise<WorkerTaskResult<string>> {
  const start = performance.now();
  const timeoutMs = options.timeoutMs || 30000;

  if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    try {
      const parsed = JSON.parse(rawJson);
      const res = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent === 'tab' ? '\t' : indent);
      return { success: true, data: res, durationMs: Math.round(performance.now() - start) };
    } catch (err: any) {
      return { success: false, error: err?.message || 'JSON formatting failed', durationMs: Math.round(performance.now() - start) };
    }
  }

  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let blobUrl: string | null = null;
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }
    };

    try {
      const workerScript = `
        self.onmessage = function(e) {
          try {
            var raw = e.data.rawJson;
            var indent = e.data.indent;
            var minify = e.data.minify;
            var parsed = JSON.parse(raw);
            var result = '';
            if (minify) {
              result = JSON.stringify(parsed);
            } else {
              var indentVal = indent === 'tab' ? '\\t' : (typeof indent === 'number' ? indent : 2);
              result = JSON.stringify(parsed, null, indentVal);
            }
            self.postMessage({ success: true, data: result });
          } catch (err) {
            self.postMessage({ success: false, error: (err && err.message) || String(err) });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);

      timer = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          error: `JSON formatting timed out after ${timeoutMs / 1000}s`,
          durationMs: Math.round(performance.now() - start),
        });
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent) => {
        cleanup();
        resolve({
          success: Boolean(e.data.success),
          data: e.data.data,
          error: e.data.error,
          durationMs: Math.round(performance.now() - start),
        });
      };

      worker.onerror = (err: ErrorEvent) => {
        cleanup();
        resolve({
          success: false,
          error: err.message || 'Worker JSON thread error',
          durationMs: Math.round(performance.now() - start),
        });
      };

      worker.postMessage({ rawJson, indent, minify });
    } catch (err: any) {
      cleanup();
      // Fallback
      setTimeout(() => {
        try {
          const parsed = JSON.parse(rawJson);
          const res = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent === 'tab' ? '\t' : indent);
          resolve({ success: true, data: res, durationMs: Math.round(performance.now() - start) });
        } catch (innerErr: any) {
          resolve({ success: false, error: innerErr?.message || String(innerErr), durationMs: Math.round(performance.now() - start) });
        }
      }, 0);
    }
  });
}

/**
 * Universal transform runner that spawns a true inline Web Worker using URL.createObjectURL(new Blob([workerCode])).
 * Serializes the provided task, passes it to the worker via postMessage, executes it off the main thread,
 * and resolves the Promise with the result.
 * Terminates the worker immediately after completion, error, or timeout to prevent memory leaks.
 */
export async function executeAsyncTransform<T, A extends any[] = any[]>(
  task: (...args: A) => T | Promise<T>,
  options: {
    minPayloadSizeForAsync?: number;
    payloadLength?: number;
    args?: A;
    timeoutMs?: number;
    useWorker?: boolean;
  } = {}
): Promise<WorkerTaskResult<T>> {
  const start = performance.now();
  const timeoutMs = options.timeoutMs || 30000;
  const passedArgs = (options.args || []) as A;

  // Fallback for non-browser environments or when Worker / Blob is disabled
  if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof Blob === 'undefined') {
    try {
      const data = await task(...passedArgs);
      return {
        success: true,
        data,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let blobUrl: string | null = null;
    let timer: any = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }
    };

    try {
      const fnSource = task.toString();
      const workerCode = `
        self.onmessage = async function(e) {
          try {
            var userFn = (new Function("return (" + e.data.fnSource + ")"))();
            var result = await userFn.apply(null, e.data.args || []);
            self.postMessage({ success: true, data: result });
          } catch (err) {
            self.postMessage({ success: false, error: (err && err.message) || String(err) });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      blobUrl = URL.createObjectURL(blob);
      worker = new Worker(blobUrl);

      timer = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          error: `Task execution timed out after ${timeoutMs / 1000}s`,
          durationMs: Math.round(performance.now() - start),
        });
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent) => {
        cleanup();
        if (e.data && e.data.success) {
          resolve({
            success: true,
            data: e.data.data,
            durationMs: Math.round(performance.now() - start),
          });
        } else {
          // If execution failed in worker (e.g. closure references outside serialized function), fallback to async main thread
          setTimeout(async () => {
            try {
              const fallbackData = await task(...passedArgs);
              resolve({
                success: true,
                data: fallbackData,
                durationMs: Math.round(performance.now() - start),
              });
            } catch (fallbackErr: any) {
              resolve({
                success: false,
                error: e.data?.error || fallbackErr?.message || String(fallbackErr),
                durationMs: Math.round(performance.now() - start),
              });
            }
          }, 0);
        }
      };

      worker.onerror = (err: ErrorEvent) => {
        cleanup();
        // Fallback to asynchronous execution on main thread if worker errored
        setTimeout(async () => {
          try {
            const fallbackData = await task(...passedArgs);
            resolve({
              success: true,
              data: fallbackData,
              durationMs: Math.round(performance.now() - start),
            });
          } catch (fallbackErr: any) {
            resolve({
              success: false,
              error: err?.message || fallbackErr?.message || 'Worker execution error',
              durationMs: Math.round(performance.now() - start),
            });
          }
        }, 0);
      };

      worker.postMessage({ fnSource, args: passedArgs });
    } catch (err: any) {
      cleanup();
      setTimeout(async () => {
        try {
          const fallbackData = await task(...passedArgs);
          resolve({
            success: true,
            data: fallbackData,
            durationMs: Math.round(performance.now() - start),
          });
        } catch (fallbackErr: any) {
          resolve({
            success: false,
            error: err?.message || fallbackErr?.message || String(fallbackErr),
            durationMs: Math.round(performance.now() - start),
          });
        }
      }, 0);
    }
  });
}
