export interface UserToken {
  id: string;
  /** SHA-256 do token enviado por e-mail; o valor em claro não é armazenado. */
  token_hash: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}
