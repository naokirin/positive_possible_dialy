import { migrate } from './migrate';
import { parseDiaryDocument } from './parse';
import type { DiaryDocument } from './types';

export function serializeDocument(doc: DiaryDocument): string {
  return JSON.stringify(doc);
}

export type DeserializeResult =
  | { readonly ok: true; readonly importedCount: number; readonly doc: DiaryDocument }
  | {
      readonly ok: false;
      readonly code: 'invalid_json' | 'unsupported_schema' | 'validation_failed';
      readonly message: string;
    };

export function deserializeDocument(raw: string): DeserializeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      code: 'invalid_json',
      message: 'JSON として読み込めませんでした',
    };
  }
  const migrated = migrate(parsed);
  if (!migrated.ok) {
    return {
      ok: false,
      code: migrated.code,
      message: migrated.message,
    };
  }
  return {
    ok: true,
    importedCount: migrated.doc.achievements.length,
    doc: migrated.doc,
  };
}

export function hydrateFromStorage(raw: string | null): DiaryDocument | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const migrated = migrate(parsed);
  if (!migrated.ok) return null;
  return parseDiaryDocument(migrated.doc) ?? migrated.doc;
}
