import { EdiFormatAdapter } from './types';
import { x12Adapter } from './x12Adapter';
import { edifactAdapter } from './edifactAdapter';
import { DetectionHints, FormatDetection } from '../models/detection';
import { detectDelimitersAndMime } from '../parsing/delimiters';

class AdapterRegistry {
  private adapters: Map<string, EdiFormatAdapter> = new Map();

  constructor() {
    this.register(x12Adapter);
    this.register(edifactAdapter);
  }

  register(adapter: EdiFormatAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.adapters.set(adapter.family, adapter);
  }

  get(idOrFamily: string): EdiFormatAdapter | undefined {
    return this.adapters.get(idOrFamily.toLowerCase());
  }

  resolve(idOrFamily: string): EdiFormatAdapter | undefined {
    return this.get(idOrFamily);
  }

  getAll(): EdiFormatAdapter[] {
    // Unique adapters
    const seen = new Set<string>();
    const list: EdiFormatAdapter[] = [];
    this.adapters.forEach((adapter) => {
      if (!seen.has(adapter.id)) {
        seen.add(adapter.id);
        list.push(adapter);
      }
    });
    return list;
  }

  detect(input: string, hints?: DetectionHints): { adapter?: EdiFormatAdapter; detection: FormatDetection } {
    // Deterministic priority order: X12, EDIFACT, etc.
    const x12Res = x12Adapter.detect(input, hints);
    if (x12Res.detected) {
      return { adapter: x12Adapter, detection: x12Res.detection };
    }

    const edifactRes = edifactAdapter.detect(input, hints);
    if (edifactRes.detected) {
      return { adapter: edifactAdapter, detection: edifactRes.detection };
    }

    // Default fallback detection
    const fallback = detectDelimitersAndMime(input);
    return {
      adapter: undefined,
      detection: fallback,
    };
  }
}

export const adapterRegistry = new AdapterRegistry();

export function registerAdapter(adapter: EdiFormatAdapter): void {
  adapterRegistry.register(adapter);
}

export function getAdapter(idOrFamily: string): EdiFormatAdapter | undefined {
  return adapterRegistry.get(idOrFamily);
}

export function detectWithRegistry(
  input: string,
  hints?: DetectionHints
): { adapter?: EdiFormatAdapter; detection: FormatDetection } {
  return adapterRegistry.detect(input, hints);
}
