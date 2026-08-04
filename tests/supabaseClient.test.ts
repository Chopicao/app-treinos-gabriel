import { describe, expect, it } from 'vitest';
import { __test, translateAuthError } from '@/services/sync/supabaseClient';

const { normalizeProjectUrl } = __test;

describe('endereço do projeto', () => {
  it('aceita a raiz do projeto tal como está', () => {
    expect(normalizeProjectUrl('https://abc.supabase.co')).toBe('https://abc.supabase.co');
  });

  it('corta o endpoint REST, que é o que o painel mostra por baixo das tabelas', () => {
    expect(normalizeProjectUrl('https://abc.supabase.co/rest/v1/')).toBe('https://abc.supabase.co');
    expect(normalizeProjectUrl('https://abc.supabase.co/rest/v1')).toBe('https://abc.supabase.co');
  });

  it('corta também os outros endpoints do painel', () => {
    expect(normalizeProjectUrl('https://abc.supabase.co/auth/v1/')).toBe('https://abc.supabase.co');
    expect(normalizeProjectUrl('https://abc.supabase.co/storage/v1/')).toBe(
      'https://abc.supabase.co',
    );
  });

  it('tira barras e espaços a mais', () => {
    expect(normalizeProjectUrl('  https://abc.supabase.co///  ')).toBe('https://abc.supabase.co');
  });

  it('trata a ausência de configuração como ausência de configuração', () => {
    expect(normalizeProjectUrl(undefined)).toBeUndefined();
    expect(normalizeProjectUrl('   ')).toBeUndefined();
  });
});

describe('mensagens de erro em português', () => {
  it('traduz as falhas de acesso mais comuns', () => {
    expect(translateAuthError('Invalid login credentials')).toContain('incorretos');
    expect(translateAuthError('Email not confirmed')).toContain('confirmaste');
    expect(translateAuthError('User already registered')).toContain('Já existe');
    expect(translateAuthError('Failed to fetch')).toContain('ligação');
  });

  it('deixa passar o que não sabe traduzir, em vez de esconder o erro', () => {
    expect(translateAuthError('Algo muito específico')).toBe('Algo muito específico');
  });
});
