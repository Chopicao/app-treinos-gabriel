import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { repository } from '@/services/repository';
import {
  getSupabase,
  isCloudConfigured,
  translateAuthError,
} from '@/services/sync/supabaseClient';
import { createRemoteGateway } from '@/services/sync/remote';
import { DifferentAccountError, resetForAccount, runSync } from '@/services/sync/syncEngine';
import { setLocalChangeHandler } from '@/state/syncBus';
import { useAppStore } from '@/state/useAppStore';

export type AccountStatus =
  /** Sem base de dados configurada: a aplicação funciona só neste dispositivo. */
  | 'unconfigured'
  | 'loading'
  | 'signed-out'
  | 'signed-in';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface AuthResult {
  ok: boolean;
  messagePt?: string;
}

interface AccountState {
  status: AccountStatus;
  email: string | null;
  userId: string | null;
  /** `true` enquanto o email de confirmação ainda não foi seguido. */
  awaitingConfirmation: boolean;

  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  lastErrorPt: string | null;
  /** Conta cujos dados chegaram a um dispositivo que já tinha dados de outra. */
  accountConflict: boolean;

  init(): Promise<void>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<AuthResult>;
  syncNow(): Promise<void>;
  /** Substitui os dados locais pelos da conta com que se entrou agora. */
  resolveAccountConflict(): Promise<void>;
  dismissError(): void;
}

const SYNC_DEBOUNCE_MS = 2500;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let inFlight: Promise<void> | null = null;
let listenersAttached = false;

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  status: isCloudConfigured ? 'loading' : 'unconfigured',
  email: null,
  userId: null,
  awaitingConfirmation: false,
  syncStatus: 'idle',
  lastSyncedAt: null,
  lastErrorPt: null,
  accountConflict: false,

  async init() {
    const supabase = await getSupabase();
    if (!supabase) {
      set({ status: 'unconfigured' });
      return;
    }

    const meta = await repository.getSyncMeta();
    set({ lastSyncedAt: meta.lastSyncedAt, lastErrorPt: meta.lastErrorPt });

    const applySession = (session: Session | null) => {
      if (!session?.user) {
        set({ status: 'signed-out', email: null, userId: null });
        return;
      }
      set({
        status: 'signed-in',
        email: session.user.email ?? null,
        userId: session.user.id,
        awaitingConfirmation: false,
      });
    };

    const { data } = await supabase.auth.getSession();
    applySession(data.session);

    supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
      if (session?.user) void get().syncNow();
    });

    if (!listenersAttached) {
      listenersAttached = true;

      // Qualquer alteração local agenda uma sincronização, sem bloquear a UI.
      setLocalChangeHandler(() => {
        if (get().status !== 'signed-in') return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => void get().syncNow(), SYNC_DEBOUNCE_MS);
      });

      // Voltar a ter rede ou voltar à aplicação são bons momentos para tentar.
      window.addEventListener('online', () => void get().syncNow());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void get().syncNow();
      });
    }

    if (get().status === 'signed-in') await get().syncNow();
  },

  async signUp(email, password) {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, messagePt: 'A base de dados não está configurada.' };

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    if (error) return { ok: false, messagePt: translateAuthError(error.message) };

    // Com confirmação de email ligada, ainda não há sessão nesta altura.
    if (!data.session) {
      set({ awaitingConfirmation: true });
      return {
        ok: true,
        messagePt:
          'Conta criada. Enviámos um email de confirmação — abre a ligação e volta aqui para entrar.',
      };
    }
    return { ok: true, messagePt: 'Conta criada.' };
  },

  async signIn(email, password) {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, messagePt: 'A base de dados não está configurada.' };

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, messagePt: translateAuthError(error.message) };
    return { ok: true };
  },

  async signOut() {
    const supabase = await getSupabase();
    if (!supabase) return;
    // Última tentativa de enviar o que ainda não foi, antes de sair.
    if (get().status === 'signed-in') await get().syncNow();
    await supabase.auth.signOut();
    set({ status: 'signed-out', email: null, userId: null, accountConflict: false });
  },

  async sendPasswordReset(email) {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, messagePt: 'A base de dados não está configurada.' };

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + import.meta.env.BASE_URL,
    });
    if (error) return { ok: false, messagePt: translateAuthError(error.message) };
    return {
      ok: true,
      messagePt: 'Se existir uma conta com esse email, recebes lá uma ligação para definir uma nova palavra-passe.',
    };
  },

  async syncNow() {
    const supabase = await getSupabase();
    const { userId, status } = get();
    if (!supabase || status !== 'signed-in' || !userId) return;

    if (isOffline()) {
      set({ syncStatus: 'offline' });
      return;
    }
    // Uma passagem de cada vez; quem chega a meio espera por esta.
    if (inFlight) return inFlight;

    set({ syncStatus: 'syncing' });
    inFlight = (async () => {
      try {
        const gateway = createRemoteGateway(supabase, userId);
        const outcome = await runSync({ repo: repository, gateway, userId });
        if (outcome.pulled > 0) await useAppStore.getState().reload();
        set({
          syncStatus: 'idle',
          lastSyncedAt: outcome.at,
          lastErrorPt: null,
          accountConflict: false,
        });
      } catch (error) {
        if (error instanceof DifferentAccountError) {
          set({ syncStatus: 'error', accountConflict: true, lastErrorPt: null });
          return;
        }
        const messagePt =
          error instanceof Error ? translateAuthError(error.message) : 'Falha ao sincronizar.';
        set({ syncStatus: 'error', lastErrorPt: messagePt });
        const meta = await repository.getSyncMeta();
        await repository.saveSyncMeta({ ...meta, lastErrorPt: messagePt });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  },

  async resolveAccountConflict() {
    const { userId } = get();
    if (!userId) return;
    await resetForAccount(repository, userId);
    await useAppStore.getState().reload();
    set({ accountConflict: false });
    await get().syncNow();
  },

  dismissError() {
    set({ lastErrorPt: null, syncStatus: 'idle' });
  },
}));

export { isCloudConfigured };
