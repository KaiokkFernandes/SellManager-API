/**
 * ÚNICO ponto de acesso ao token de sessão. Nenhum outro arquivo toca em
 * localStorage para isso. Hoje o token vive em memória + localStorage; para
 * migrar para cookie httpOnly (a API gerencia o cookie e o JS nunca vê o token)
 * basta trocar a implementação deste módulo mantendo a interface.
 */
export interface TokenStorage {
  get: () => string | null;
  set: (token: string) => void;
  clear: () => void;
  /** Avisa mudanças feitas por outra aba. Devolve a função que cancela. */
  subscribe: (listener: (token: string | null) => void) => () => void;
}

const TOKEN_KEY = 'sellmanager:token';

export function createTokenStorage(
  storage: Storage | undefined = safeLocalStorage(),
): TokenStorage {
  // cópia em memória: é a fonte lida a cada requisição; o storage só persiste
  let memory: string | null = read(storage);

  return {
    get: () => memory,
    set(token) {
      memory = token;
      write(storage, token);
    },
    clear() {
      memory = null;
      write(storage, null);
    },
    subscribe(listener) {
      const onStorage = (event: StorageEvent) => {
        if (event.storageArea !== storage || event.key !== TOKEN_KEY) return;
        memory = event.newValue;
        listener(memory);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    },
  };
}

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined; // modo privado/bloqueado: a sessão vale só até recarregar
  }
}

function read(storage: Storage | undefined): string | null {
  try {
    return storage?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, token: string | null): void {
  try {
    if (token === null) storage?.removeItem(TOKEN_KEY);
    else storage?.setItem(TOKEN_KEY, token);
  } catch {
    /* sem persistência: a cópia em memória continua valendo */
  }
}

export const tokenStorage: TokenStorage = createTokenStorage();
