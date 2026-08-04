import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountPrompt } from '@/components/AccountPrompt';
import { useAccountStore } from '@/state/useAccountStore';
import { useAppStore } from '@/state/useAppStore';
import { defaultSettings } from '@/services/repository';

function renderPrompt() {
  return render(
    <MemoryRouter>
      <AccountPrompt />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAppStore.setState({ settings: defaultSettings() });
});

describe('convite a criar conta', () => {
  it('aparece a quem já usa a aplicação sem conta', () => {
    useAccountStore.setState({ status: 'signed-out' });
    renderPrompt();
    expect(screen.getByRole('link', { name: /criar conta com email/i })).toBeInTheDocument();
  });

  it('não aparece quando já há sessão iniciada', () => {
    useAccountStore.setState({ status: 'signed-in' });
    renderPrompt();
    expect(screen.queryByRole('link', { name: /criar conta/i })).not.toBeInTheDocument();
  });

  it('não aparece quando não há base de dados ligada', () => {
    // Prometer conta numa instalação sem base de dados seria enganador.
    useAccountStore.setState({ status: 'unconfigured' });
    renderPrompt();
    expect(screen.queryByRole('link', { name: /criar conta/i })).not.toBeInTheDocument();
  });

  it('não volta a aparecer depois de dispensado', () => {
    useAccountStore.setState({ status: 'signed-out' });
    useAppStore.setState({
      settings: { ...defaultSettings(), accountPromptDismissedAt: '2026-08-04T10:00:00.000Z' },
    });
    renderPrompt();
    expect(screen.queryByRole('link', { name: /criar conta/i })).not.toBeInTheDocument();
  });
});
