import { CanonicalDocument } from '../models/canonical';

export function renderCanonicalToJson(doc: CanonicalDocument, pretty = true): string {
  return JSON.stringify(doc, null, pretty ? 2 : undefined);
}
