declare namespace Express {
  export interface Request {
    /** Preenchido pelo ensureAuthenticated com o usuário carregado do banco. */
    user: {
      id: string;
      role: import('@sellmanager/shared').Role;
    };
  }
}
