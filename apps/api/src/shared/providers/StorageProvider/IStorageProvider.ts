export interface IStorageProvider {
  /** Move um arquivo recebido (pasta temporária) para o armazenamento definitivo. */
  saveFile(file: string): Promise<string>;
  /** Remove o arquivo; não falha se ele já não existir. */
  deleteFile(file: string): Promise<void>;
}
