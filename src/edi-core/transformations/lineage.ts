import { FieldMapping } from '../models/canonical';

export function createFieldMapping(
  outputField: string,
  sourceSegment: string,
  sourceElement: string,
  sourceValue: string,
  mappingRule: string,
  confidence: 'exact' | 'inferred' | 'default' = 'exact',
  loopPath?: string
): FieldMapping {
  return {
    outputField,
    sourceSegment,
    sourceElement,
    sourceValue: sourceValue !== undefined && sourceValue !== null ? String(sourceValue) : '',
    mappingRule,
    confidence,
    loopPath,
  };
}
