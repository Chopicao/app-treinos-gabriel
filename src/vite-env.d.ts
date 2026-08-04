/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** URL do projeto Supabase. Vazio ⇒ a aplicação funciona só neste dispositivo. */
  readonly VITE_SUPABASE_URL?: string;
  /**
   * Chave `anon` do Supabase. É pública por desenho: o que protege os dados é o
   * Row Level Security, não o segredo desta chave.
   */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
