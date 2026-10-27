export interface IStorageProvider {
  /** Move um arquivo recebido (pasta temporária) para o armazenamento definitivo. */
  saveFile(file: string): Promise<string>;
  /** Remove o arquivo; não falha se ele já não existir. */
  deleteFile(file: string): Promise<void>;
  /** Descarta um upload ainda na pasta temporária (ex.: o recurso não existe). */
  discardFile(file: string): Promise<void>;
}
