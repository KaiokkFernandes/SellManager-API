import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { checkResponse, ContractViolationError } from './responseValidation';

const schema = z.object({
  id: z.uuid(),
  name: z.string(),
  created_at: z.iso.datetime(),
});
const meta = { operationId: 'showThing', status: 200 };
const valid = {
  id: '5c301fd4-233e-4eac-bb22-994b162e70d2',
  name: 'Teclado',
  created_at: '2026-10-24T20:00:00.000Z',
};

describe('checkResponse', () => {
  it('aceita um corpo dentro do contrato', () => {
    expect(() => checkResponse(schema, valid, meta, 'strict')).not.toThrow();
  });

  it('acusa campo com tipo errado', () => {
    expect(() =>
      checkResponse(schema, { ...valid, name: 42 }, meta, 'strict'),
    ).toThrow(ContractViolationError);
  });

  it('acusa campo que o contrato não declara (ex.: senha vazada)', () => {
    expect(() =>
      checkResponse(schema, { ...valid, password: 'hash' }, meta, 'strict'),
    ).toThrow('contém campos que o contrato não declara');
  });

  it('compara a forma JSON (Date vira string ISO)', () => {
    const withDate = { ...valid, created_at: new Date(valid.created_at) };
    expect(() => checkResponse(schema, withDate, meta, 'strict')).not.toThrow();
  });

  it('em warn e off não lança', () => {
    expect(() =>
      checkResponse(schema, { nope: true }, meta, 'warn'),
    ).not.toThrow();
    expect(() =>
      checkResponse(schema, { nope: true }, meta, 'off'),
    ).not.toThrow();
  });
});
