import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente da base de dados na nuvem.
 *
 * A configuração é **opcional**. Sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
 * a aplicação continua a funcionar exatamente como antes, só neste dispositivo —
 * é isso que permite publicar e usar a aplicação antes de haver conta.
 */
/**
 * O painel do Supabase mostra vários endereços e é fácil copiar o do endpoint
 * REST (`.../rest/v1/`) em vez da raiz do projeto. O cliente precisa da raiz,
 * por isso normalizamos aqui em vez de deixar falhar com um erro obscuro.
 */
function normalizeProjectUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/(rest|auth|storage|realtime)\/v\d+\/?$/, '').replace(/\/+$/, '');
}

const url = normalizeProjectUrl(import.meta.env.VITE_SUPABASE_URL);

/**
 * O Supabase renomeou esta chave: era `anon public`, passou a `Publishable key`
 * (`sb_publishable_…`). São equivalentes e as duas servem, por isso aceitamos
 * qualquer um dos nomes de variável e ficamos indiferentes ao nome do momento.
 */
const anonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isCloudConfigured = Boolean(url && anonKey);

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * O SDK é carregado a pedido: numa instalação sem base de dados configurada não
 * chega sequer a ser descarregado.
 */
export async function getSupabase(): Promise<SupabaseClient | null> {
  if (!url || !anonKey) return null;
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url, anonKey, {
      auth: {
        // A sessão fica guardada para não ser preciso entrar a cada treino.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'app-treinos-auth',
      },
    }),
  );
  return clientPromise;
}

export const __test = { normalizeProjectUrl };

/** Mensagens do Supabase em inglês → português, para o que o atleta vê. */
export function translateAuthError(message: string): string {
  const map: Array<[RegExp, string]> = [
    [/invalid login credentials/i, 'Email ou palavra-passe incorretos.'],
    [/email not confirmed/i, 'Ainda não confirmaste o email. Vê a tua caixa de entrada.'],
    [/user already registered/i, 'Já existe uma conta com este email. Tenta entrar.'],
    [/password should be at least/i, 'A palavra-passe tem de ter pelo menos 8 caracteres.'],
    [/unable to validate email address/i, 'O email não parece válido.'],
    [/for security purposes.*(\d+) seconds/i, 'Demasiadas tentativas seguidas. Espera um pouco.'],
    [/email rate limit exceeded/i, 'Foram enviados demasiados emails. Tenta daqui a alguns minutos.'],
    [/failed to fetch|network/i, 'Sem ligação ao servidor. Verifica a Internet.'],
  ];
  for (const [pattern, translated] of map) {
    if (pattern.test(message)) return translated;
  }
  return message;
}
