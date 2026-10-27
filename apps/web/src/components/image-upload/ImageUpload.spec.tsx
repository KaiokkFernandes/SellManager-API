import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImageUpload } from './ImageUpload';

const png = (size = 10) =>
  new File([new Uint8Array(size)], 'foto.png', { type: 'image/png' });

describe('ImageUpload', () => {
  it('rejeita tipo inválido e arquivo maior que o limite da API, sem enviar', async () => {
    const onUpload = vi.fn();
    render(<ImageUpload currentUrl={null} onUpload={onUpload} />);
    const input = screen.getByLabelText('Imagem');
    // applyAccept: false simula o usuário escolhendo "todos os arquivos"
    const typing = userEvent.setup({ applyAccept: false });

    await typing.upload(
      input,
      new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Formato não suportado',
    );

    await typing.upload(input, png(2 * 1024 * 1024 + 1));
    expect(screen.getByRole('alert')).toHaveTextContent('no máximo 2 MB');

    expect(
      screen.queryByRole('button', { name: /Enviar imagem/ }),
    ).not.toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('mostra preview, envia com progresso e mostra fallback sem imagem', async () => {
    let report: (fraction: number) => void = () => undefined;
    let finish: () => void = () => undefined;
    const onUpload = vi.fn(
      (_file: File, onProgress: (fraction: number) => void) =>
        new Promise<void>(resolve => {
          report = onProgress;
          finish = resolve;
        }),
    );
    render(<ImageUpload currentUrl={null} onUpload={onUpload} />);
    expect(screen.getByText('Sem imagem')).toBeInTheDocument();

    await userEvent.upload(screen.getByLabelText('Imagem'), png());
    expect(
      screen.getByRole('img', { name: 'Pré-visualização da nova imagem' }),
    ).toHaveAttribute('src', expect.stringMatching(/^blob:/));

    await userEvent.click(
      screen.getByRole('button', { name: 'Enviar imagem' }),
    );
    expect(onUpload).toHaveBeenCalledWith(
      expect.any(File),
      expect.any(Function),
    );
    report(0.4);
    expect(
      await screen.findByRole('progressbar', { name: 'Enviando imagem' }),
    ).toHaveAttribute('aria-valuenow', '40');
    finish();
    await screen.findByText('Sem imagem');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('com imagem atual oferece substituir e remover', async () => {
    const onRemove = vi.fn(() => Promise.resolve());
    render(
      <ImageUpload
        currentUrl="http://api.test/files/a.png"
        onUpload={vi.fn()}
        onRemove={onRemove}
      />,
    );

    expect(
      screen.getByRole('img', { name: 'Imagem atual do produto' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Remover imagem' }),
    );
    expect(onRemove).toHaveBeenCalledOnce();

    await userEvent.upload(screen.getByLabelText('Imagem'), png());
    expect(
      screen.getByRole('button', { name: 'Substituir imagem' }),
    ).toBeInTheDocument();
  });
});
