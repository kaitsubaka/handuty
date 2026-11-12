import { describe, expect, it } from 'vitest';
import { ApiError, errorMessageId, unwrap } from '../src/lib/api';
import es from '../src/locales/es.json';
import en from '../src/locales/en.json';

describe('errorMessageId', () => {
  it('maps a business rule error to its message', () => {
    const error = new ApiError([{ message: 'HANDUTY:SLOT_TAKEN', errorType: 'Lambda:Unhandled' }]);
    expect(errorMessageId(error)).toBe('error.SLOT_TAKEN');
  });

  it('maps Cognito errors by name', () => {
    expect(errorMessageId({ name: 'CodeMismatchException' })).toBe('error.WRONG_CODE');
    expect(errorMessageId({ name: 'NotAuthorizedException' })).toBe('error.WRONG_CREDENTIALS');
  });

  it('falls back to a generic message', () => {
    expect(errorMessageId(new Error('boom'))).toBe('SendError');
  });
});

describe('unwrap', () => {
  it('returns data or throws the GraphQL errors', () => {
    expect(unwrap({ data: { id: 1 } })).toEqual({ id: 1 });
    expect(() => unwrap({ data: null, errors: [{ message: 'HANDUTY:FORBIDDEN' }] })).toThrow(
      ApiError,
    );
  });
});

describe('locales', () => {
  it('have the same keys in Spanish and English', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('translate every rule code the backend can send', async () => {
    const { readFile } = await import('node:fs/promises');
    const sources = await Promise.all(
      ['amplify/functions/api/rules.ts', 'amplify/functions/api/handler.ts'].map((file) =>
        readFile(file, 'utf8'),
      ),
    );
    const codes = new Set(
      sources.flatMap((source) =>
        [
          ...source.matchAll(
            /(?:RuleError\(|ensure\([^;]*?|found\([^;]*?|HANDUTY:)'?([A-Z][A-Z_]{3,})'/gs,
          ),
        ].map((match) => match[1]),
      ),
    );
    for (const code of codes) {
      expect(es, code).toHaveProperty([`error.${code}`]);
    }
  });
});
