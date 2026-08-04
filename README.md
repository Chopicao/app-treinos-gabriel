# Treinos — plano de pré-época

Aplicação web para acompanhar um plano de treino de seis semanas: rotina diária de mobilidade, duas
sessões de ginásio, treinos de futebol e jogo. É *mobile-first*, funciona offline e instala-se como
PWA.

Os treinos são guardados **primeiro no dispositivo** e, se houver conta, sincronizados para uma área
privada na nuvem. Sem base de dados configurada, a aplicação funciona à mesma, só sem conta e sem
sincronização.

> Esta aplicação acompanha um plano fornecido pelo utilizador. Não diagnostica, não trata e não
> substitui um médico, fisioterapeuta desportivo ou treinador certificado.

---

## Índice

- [Requisitos](#requisitos)
- [Comandos](#comandos)
- [Conta e sincronização](#conta-e-sincronização)
- [Arquitetura](#arquitetura)
- [Como alterar o plano](#como-alterar-o-plano)
- [Persistência e migrações](#persistência-e-migrações)
- [Temporizadores](#temporizadores)
- [Vídeos de demonstração](#vídeos-de-demonstração)
- [Testes](#testes)
- [Build e deploy](#build-e-deploy)
- [Acessibilidade](#acessibilidade)
- [Privacidade](#privacidade)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Requisitos

- **Node.js 20 ou superior** (desenvolvido em Node 24).
- **npm 10 ou superior**.
- Um navegador com suporte a IndexedDB. Para instalar como PWA, um navegador com *service workers*.

Não é preciso base de dados, servidor, chave de API nem ficheiro `.env`.

## Comandos

```bash
npm install
```

```bash
npm run dev
```

Abre a aplicação em `http://localhost:5173`.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com *hot reload*. |
| `npm run build` | Verificação de tipos + build de produção para `dist/`. |
| `npm run preview` | Serve o `dist/` para verificar a build. |
| `npm run lint` | ESLint (inclui uma regra que proíbe links do TikTok). |
| `npm run typecheck` | TypeScript em modo estrito, sem emitir ficheiros. |
| `npm test` | Testes unitários e de componentes (Vitest + Testing Library). |
| `npm run test:e2e` | Testes ponta a ponta (Playwright). Faz build e serve automaticamente. |
| `npm run test:e2e:install` | Descarrega o Chromium usado pelo Playwright (uma vez). |
| `npm run check` | `lint` + `typecheck` + `test` + `build`. |
| `npm run search:videos` | Recolhe candidatos reais do YouTube para cada exercício. |
| `npm run verify:videos` | Reverifica os vídeos guardados (`--write` atualiza o ficheiro). |

## Conta e sincronização

Opcional e desligada por omissão. Para ligar, segue [`docs/base-de-dados.md`](docs/base-de-dados.md):
criar um projeto Supabase, correr [`docs/supabase-setup.sql`](docs/supabase-setup.sql) e definir duas
variáveis.

| Variável | Onde no painel do Supabase |
| --- | --- |
| `VITE_SUPABASE_URL` | Settings → Data API → *Project URL* |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Settings → API Keys → *Publishable key* (`sb_publishable_…`) |

O Supabase renomeou esta chave: a antiga `anon public` é agora a *Publishable key*. As duas servem —
`VITE_SUPABASE_ANON_KEY` continua a ser aceite.

Em produção são segredos do repositório, injetados no build pelo workflow. Em desenvolvimento vão
para `.env` (ver `.env.example`).

Pontos de desenho que importam:

- **O dispositivo continua a ser a fonte de verdade durante o treino.** Escreve-se sempre primeiro
  em IndexedDB; a sincronização vem depois. Sem isto, um ginásio sem rede tornava a aplicação
  inútil.
- **A segurança não depende de esconder a chave.** A chave `anon` é pública por desenho. O que
  protege os dados é o *Row Level Security*: cada conta só alcança as suas linhas.
- **Conflitos resolvem-se pela alteração mais recente**, e as eliminações propagam-se através de
  marcas de eliminação locais. As regras estão isoladas e testadas em `src/services/sync/merge.ts`.
- **O SDK só é descarregado se houver base de dados configurada.** Num build sem as variáveis, o
  código do Supabase nem entra no pacote.

## Arquitetura

React 19 + TypeScript + Vite, com React Router, Tailwind CSS 4, Zustand para estado de interface,
Dexie sobre IndexedDB para persistência, Supabase para conta e sincronização, Zod para validação e
`date-fns` para datas em PT-PT.

```
src/
  domain/          Tipos e schemas Zod. Nenhuma dependência de UI.
    types.ts       ExerciseDefinition, PlanItem, SessionLog, TimerSnapshot, …
    schemas.ts     Validação de importação/exportação e dos dados seed.
  data/            Conteúdo. Só dados, sem lógica.
    exercises/     A biblioteca, dividida por categoria.
    plan/          Semana-tipo, sessões e prescrições por fase.
    videos.json    Vídeos verificados (dados estáticos, fáceis de atualizar).
    profile.ts     Perfil inicial do atleta.
    safety.ts      Avisos, regra de progressão e referências.
  services/        Regras de negócio, sem React.
    schedule.ts    Gera as ocorrências a partir da semana-tipo e das remarcações.
    sessionBuilder.ts  Constrói o registo de uma sessão a partir do plano.
    progression.ts Histórico por exercício e sugestão informativa de progressão.
    db.ts          Base local (Dexie), marcas de eliminação e estado da sincronização.
    repository.ts  ÚNICO módulo que fala com a base de dados local.
    exportImport.ts  Exportação e importação validada.
    sync/          Conta e sincronização (tudo opcional).
      supabaseClient.ts  Cliente carregado a pedido; nulo quando não há configuração.
      remote.ts    Leitura e escrita nas tabelas da conta.
      merge.ts     Regras de junção, puras e testadas.
      syncEngine.ts  Uma passagem: ler, juntar, escrever, enviar.
  lib/             Utilitários puros: datas, formatação, temporizador, ids.
  state/           Zustand: estado da aplicação e dos temporizadores.
  hooks/           useCountdown, useSchedule, useTheme.
  components/      Componentes de UI e do modo "Realizar treino".
  routes/          Um ficheiro por ecrã.
```

Três regras estruturais que vale a pena manter:

1. **A UI nunca fala com o IndexedDB.** Tudo passa por `services/repository.ts`. Para acrescentar
   sincronização com um servidor, basta uma segunda implementação da interface `Repository` — a
   interface já é assíncrona.
2. **Os dados do treino estão separados da interface.** Nenhum componente tem constantes de plano.
3. **O registo guarda a prescrição.** Quando uma sessão é criada, a prescrição da fase é copiada
   para dentro do registo. Mudar de semana, ou até alterar o plano, nunca reescreve o histórico.

### Estados e fases

A semana começa à segunda-feira. A semana do plano é calculada a partir da data de início escolhida
no onboarding, e a fase decorre da semana:

| Semanas | Fase | Orientação |
| --- | --- | --- |
| 1–2 | `w1-2` | Duas séries na maioria dos exercícios, cargas leves, RPE 5–6, 4–5 repetições em reserva. |
| 3–4 | `w3-4` | Três séries nos principais, RPE perto de 6, 3–4 repetições em reserva. |
| 5–6 | `w5-6` | Pequeno aumento de carga **ou** variante ligeiramente mais difícil. |
| 7+ | `w7+` | Mantém as semanas 5–6 e pede avaliação antes de barra pesada, saltos e trabalho explosivo. |

Cada sessão no calendário tem um dos estados `planeado`, `em curso`, `concluído`, `parcial` ou
`ignorado`, sempre com **cor, ícone e texto** — a cor nunca é o único sinal.

## Como alterar o plano

Todo o conteúdo do plano vive em `src/data/`.

**Mudar uma prescrição** — abre `src/data/plan/gymA.ts`, `gymB.ts` ou `mobility.ts` e edita o
`byPhase` do item:

```ts
item({
  id: 'a-15',
  exerciseId: 'goblet-squat-to-box',
  loadTracked: true,
  byPhase: progressivePhases(
    { sets: 2, reps: { min: 10 }, restSeconds: { min: 90, max: 120 }, tempo: '3-1-1' }, // semanas 1–2
    { sets: 3, reps: { min: 8 },  restSeconds: { min: 90, max: 120 }, tempo: '3-1-1' }, // semanas 3–4
    { sets: 3, setsMax: 4, reps: { min: 6, max: 8 }, tempo: '3-1-1' },                  // semanas 5–6
  ),
})
```

- `sets: 0` numa fase significa "este exercício não pertence a esta fase" e o item desaparece dessa
  sessão.
- `setsMax` desenha um intervalo (`2–3 ×`) e liga o botão "Acrescentar série".
- `optional: true` marca o exercício como opcional.
- `allowedAlternativeIds` define as **únicas** trocas oferecidas durante o treino. A aplicação nunca
  substitui nada sozinha.

**Acrescentar um exercício** — cria a definição no ficheiro de categoria adequado em
`src/data/exercises/` e acrescenta o vídeo em `src/data/videos.json`. Os testes falham se um
exercício ficar sem vídeo verificado, sem *cues* suficientes ou com um id repetido.

**Mudar a semana-tipo** — `src/data/plan/index.ts`, campo `week`.

**Depois de alterar prescrições**, sobe o `PLAN_VERSION` em `src/data/plan/index.ts`. As sessões já
registadas guardam a versão com que foram criadas e continuam legíveis.

## Persistência e migrações

Base local `app-treinos` (IndexedDB, via Dexie) com cinco tabelas: `sessions`, `overrides`,
`settings`, `profile` e `timers`.

- O esquema é versionado em `src/services/db.ts`. Para evoluir, acrescenta um bloco
  `this.version(n).stores({...})` e sobe `SCHEMA_VERSION`; o Dexie trata da migração.
- Se existir uma chave de `localStorage` de uma versão anterior (`app-treinos:v0`), as sessões são
  importadas uma única vez e nada é apagado.
- **Exportar** produz um JSON com definições, perfil, sessões e remarcações.
- **Importar** valida o ficheiro inteiro com Zod **antes** de escrever. Um ficheiro inválido não
  toca nos dados existentes.
- **Repor dados** apaga tudo neste dispositivo e pede confirmação explícita.

## Temporizadores

Os temporizadores não contam com `setInterval`. Guardam `startedAt`, `targetDurationMs` e o tempo
acumulado das pausas, e o valor mostrado é sempre recalculado a partir do relógio:

```
decorrido = acumulado + (a correr ? agora − startedAt : 0)
restante  = max(0, alvo − decorrido)
```

O `setInterval` só decide **quando repintar**. Consequências práticas: mudar de separador, bloquear
o telemóvel ou recarregar a página não altera o tempo, e um temporizador que expirou enquanto a
aplicação estava em segundo plano regista o fim no instante correto — não no instante em que se
reparou. O fim é idempotente, por isso o alarme nunca toca duas vezes.

Cada transição importante é gravada na tabela `timers`, o que permite retomar exatamente onde se
ficou. Se a Wake Lock API existir, pode manter-se o ecrã ativo durante a sessão (opcional, nas
definições, com falha silenciosa quando não há suporte).

## Vídeos de demonstração

Cada exercício mostrado ao atleta tem um vídeo do YouTube pesquisado e verificado. Os links são
**dados estáticos** em `src/data/videos.json` — não há API do YouTube no cliente nem chaves.

O processo é reprodutível:

```bash
npm run search:videos
```

Recolhe candidatos reais (id, título, canal, duração, descrição) da pesquisa do YouTube para
`scripts/.cache/candidates.json`. A curadoria escolhe um candidato por exercício e
`node scripts/build-videos.mjs` escreve `src/data/videos.json`, confirmando cada vídeo no *endpoint*
oEmbed do YouTube — que só responde para vídeos públicos e disponíveis, e devolve o título e o canal
reais, que são os que ficam guardados.

```bash
npm run verify:videos
```

Reverifica tudo. Um vídeo que deixe de responder fica `pendingReview: true`, deixa de aparecer ao
atleta e passa a estar apenas em **Definições → Revisão de vídeos**.

A tabela completa da curadoria está em [`docs/youtube-video-review.md`](docs/youtube-video-review.md).

No ecrã, o vídeo abre num modal responsivo. **Nada é pedido ao YouTube até o utilizador carregar em
"Carregar vídeo"**; a incorporação usa `youtube-nocookie.com` e há sempre um "Abrir no YouTube" que
funciona mesmo que a incorporação esteja bloqueada.

## Testes

```bash
npm test
```

Cobre o motor do temporizador com relógio falso (pausa, retoma, separador em segundo plano,
conclusão, reinício, recuperação após *reload*, mudança de exercício), a geração do calendário, a
remarcação, a construção da sessão por fase, a regra de progressão, a formatação PT-PT, a validação
dos dados seed e a importação/exportação.

```bash
npm run test:e2e:install
```

```bash
npm run test:e2e
```

Percorre o fluxo crítico em 360 px e em desktop: onboarding, geração da semana-tipo, abertura do
Ginásio A com a prescrição da semana, registo por repetições lado a lado, carga, tempo com *reload* a
meio, distância, retoma de sessão interrompida, resumo e histórico, mudança de fase sem alterar o
histórico, remarcação sem deslocar as semanas futuras, importação inválida sem perda de dados e
navegação por teclado. O teste falha se aparecer um erro na consola durante o fluxo.

`tests/e2e/screenshots.spec.ts` percorre os ecrãs principais e guarda capturas em
`test-results/visual/`, para revisão visual em telemóvel e desktop.

## Build e deploy

```bash
npm run build
```

Produz `dist/`, um site estático. Serve com qualquer alojamento estático (Netlify, Vercel, Cloudflare
Pages, GitHub Pages, Nginx).

Duas notas de configuração:

- É uma *single-page app*: todos os caminhos têm de servir `index.html`.
- Para publicar num subdiretório, define a variável `VITE_BASE_PATH` no build (por exemplo
  `VITE_BASE_PATH=/app-treinos-gabriel/`). O caminho base é aplicado automaticamente ao React Router,
  ao manifesto e ao *service worker*.

### GitHub Pages

Já está configurado: `.github/workflows/deploy.yml` corre lint, verificação de tipos e testes, faz o
build com o `VITE_BASE_PATH` correto, copia o `index.html` para `404.html` (o Pages não reescreve
rotas, e sem isto abrir `/calendario` diretamente daria erro) e publica. Corre a cada `push` para
`main`.

A aplicação fica em `https://<utilizador>.github.io/<repositório>/`.

O *service worker* guarda em cache apenas os ficheiros da própria aplicação. Vídeos do YouTube nunca
são colocados offline.

## Acessibilidade

- Contraste AA, foco visível, HTML semântico e `label` em todos os campos.
- Área tátil mínima confortável nos controlos usados durante o treino.
- Navegação completa por teclado, com ligação "Saltar para o conteúdo".
- Estado sempre por cor **e** ícone **e** texto.
- `prefers-reduced-motion` respeitado.
- Unidades e datas em PT-PT (kg, m, s, min; semana a começar à segunda-feira; fuso Europe/Lisbon).

## Privacidade

Sem conta, sem backend, sem analítica, sem anúncios e sem cookies de marketing. Os dados ficam no
dispositivo e só saem se exportares o JSON. O único conteúdo externo são os vídeos do YouTube, que
apenas carregam depois de uma ação explícita.

**Nenhum dado pessoal é distribuído com a aplicação.** O perfil — nome, idade, altura, peso, posição,
pé dominante, historial de lesões, notas de mobilidade e questões a esclarecer — começa vazio e é
preenchido no onboarding, ficando apenas no armazenamento do dispositivo. Por isso os ficheiros
publicados não contêm informação de saúde sobre ninguém e a aplicação pode ser alojada num sítio
público. Há testes que garantem esta propriedade (`tests/content.test.ts`).

As notas de segurança dos exercícios são condicionais ("se houver historial de lesão nesta zona…"),
para valerem para qualquer utilizador sem descreverem uma pessoa concreta.

## Limitações conhecidas

- **Uma conta por atleta.** Não há partilha com um treinador nem vista de equipa.
- **A sincronização resolve conflitos pela alteração mais recente.** Editar a mesma sessão em dois
  telemóveis ao mesmo tempo faz perder a alteração mais antiga; não há fusão campo a campo.
- **O plano base cobre seis semanas.** A partir da semana 7 as prescrições mantêm as das semanas 5–6
  e a aplicação pede avaliação antes de progredir para barra pesada, saltos e trabalho explosivo.
- **A duração das sessões é estimada**, a partir das prescrições, e não medida.
- **Os vídeos podem sair do ar.** `npm run verify:videos` deteta isso e retira-os da vista do atleta.
- **Sem notificações.** A aplicação não lembra treinos; o temporizador só toca com a aplicação aberta.
