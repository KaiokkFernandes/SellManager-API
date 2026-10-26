import { beforeEach, describe, expect, it } from 'vitest';
import { createTokenStorage } from './tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => localStorage.clear());

  it('guarda, lê e limpa o token', () => {
    const storage = createTokenStorage(localStorage);
    expect(storage.get()).toBeNull();
    storage.set('abc');
    expect(storage.get()).toBe('abc');
    expect(localStorage.getItem('sellmanager:token')).toBe('abc');
    storage.clear();
    expect(storage.get()).toBeNull();
    expect(localStorage.getItem('sellmanager:token')).toBeNull();
  });

  it('recupera o token persistido ao iniciar (reload)', () => {
    createTokenStorage(localStorage).set('persistido');
    expect(createTokenStorage(localStorage).get()).toBe('persistido');
  });

  it('funciona só em memória quando não há storage', () => {
    const storage = createTokenStorage(undefined);
    storage.set('x');
    expect(storage.get()).toBe('x');
  });

  it('propaga mudanças feitas em outra aba', () => {
    const storage = createTokenStorage(localStorage);
    storage.set('abc');
    const seen: (string | null)[] = [];
    const unsubscribe = storage.subscribe(token => seen.push(token));

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'sellmanager:token',
        newValue: null,
        storageArea: localStorage,
      }),
    );
    unsubscribe();

    expect(seen).toEqual([null]);
    expect(storage.get()).toBeNull();
  });
});
