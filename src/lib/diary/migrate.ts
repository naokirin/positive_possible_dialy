import { parseDiaryDocument } from './parse';
import type { DiaryDocument } from './types';

export const SCHEMA_VERSION = 1 as const;

export type MigrateResult =
  | { readonly ok: true; readonly doc: DiaryDocument }
  | {
      readonly ok: false;
      readonly code: 'unsupported_schema' | 'validation_failed';
      readonly message: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrate(raw: unknown): MigrateResult {
  if (!isRecord(raw)) {
    return {
      ok: false,
      code: 'validation_failed',
      message: 'ドキュメント形式が正しくありません',
    };
  }
  const version = raw.schemaVersion;
  if (typeof version !== 'number') {
    return {
      ok: false,
      code: 'validation_failed',
      message: 'schemaVersion がありません',
    };
  }
  if (version !== SCHEMA_VERSION) {
    return {
      ok: false,
      code: 'unsupported_schema',
      message: `未対応のスキーマです（v${version}）`,
    };
  }
  const doc = parseDiaryDocument(raw);
  if (!doc) {
    return {
      ok: false,
      code: 'validation_failed',
      message: 'データの検証に失敗しました',
    };
  }
  return { ok: true, doc };
}
