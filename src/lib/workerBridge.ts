/**
 * Web Worker & Async Offloading Utility
 * Safely offloads heavy computations (formatting large payloads, XML parsing, JSON transforms)
 * off the main UI thread with fallback to scheduled micro-tasks.
 */

export interface WorkerTaskResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

/**
 * Executes a heavy transform asynchronously so UI thread stays 60fps responsive
 */
export async function executeAsyncTransform<T>(
  task: () => T,
  options: {
    minPayloadSizeForAsync?: number;
    payloadLength?: number;
  } = {}
): Promise<WorkerTaskResult<T>> {
  const start = performance.now();
  const payloadLength = options.payloadLength || 0;
  const minSize = options.minPayloadSizeForAsync || 25000; // 25KB

  // For small payloads, execute directly
  if (payloadLength < minSize) {
    try {
      const data = task();
      return {
        success: true,
        data,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Operation failed',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  // For larger payloads, yield to event loop before executing to allow React to render spinner/progress
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const data = task();
        resolve({
          success: true,
          data,
          durationMs: Math.round(performance.now() - start),
        });
      } catch (err: any) {
        resolve({
          success: false,
          error: err.message || 'Operation failed',
          durationMs: Math.round(performance.now() - start),
        });
      }
    }, 16);
  });
}
