/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase. Vazio ⇒ a aplicação funciona só neste dispositivo. */
  readonly VITE_SUPABASE_URL?: string;
  /**
   * Chave pública do Supabase, no nome novo (`sb_publishable_…`).
   * É pública por desenho: o que protege os dados é o Row Level Security.
   */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** O mesmo, no nome antigo. Aceite para não obrigar a mexer em nada. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
