// Copia arquivos que o tsc não emite (templates .hbs) de src/ para dist/.
import { cpSync, globSync } from 'node:fs';

for (const file of globSync('src/**/*.hbs')) {
  cpSync(file, file.replace(/^src/, 'dist'));
}
