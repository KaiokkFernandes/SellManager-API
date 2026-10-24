import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

interface ITemplateVariable {
  [key: string]: string | number;
}

interface IMailTemplate {
  file: string;
  variables: ITemplateVariable;
}

export class handlebarsMailTemplate {
  public async parse({ file, variables }: IMailTemplate): Promise<string> {
    const templateContent = await fs.promises.readFile(path.resolve(file), {
      encoding: 'utf-8',
    });
    const parseTemplate = Handlebars.compile(templateContent);

    return parseTemplate(variables);
  }
}
