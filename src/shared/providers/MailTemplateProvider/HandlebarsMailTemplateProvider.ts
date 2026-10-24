import fs from 'node:fs';
import Handlebars from 'handlebars';
import {
  IMailTemplateProvider,
  IParseMailTemplateDTO,
} from './IMailTemplateProvider';

export class HandlebarsMailTemplateProvider implements IMailTemplateProvider {
  public async parse({
    file,
    variables,
  }: IParseMailTemplateDTO): Promise<string> {
    const templateContent = await fs.promises.readFile(file, 'utf-8');
    return Handlebars.compile(templateContent)(variables);
  }
}
