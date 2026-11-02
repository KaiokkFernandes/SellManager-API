import type { ImageMimeType } from '@sellmanager/shared';

export interface IFileToStore {
  content: Buffer;
  /** Tipo confirmado pelo conteúdo do arquivo. */
  contentType: ImageMimeType;
}

export interface IStorageProvider {
  /** Guarda o arquivo e devolve a URL pública, que é o que vai para o banco. */
  save(file: IFileToStore): Promise<string>;
  /**
   * Remove o arquivo da URL. Nunca falha: o registro já foi atualizado, e um
   * arquivo órfão é melhor do que devolver erro depois de salvar.
   */
  delete(url: string): Promise<void>;
}
