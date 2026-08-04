# Ligar a base de dados e as contas

Sem base de dados, a aplicação funciona à mesma: os treinos ficam guardados no dispositivo. Este
guia liga a parte que falta — **conta com email** e **os treinos guardados na nuvem**, para não se
perderem se o telemóvel se estragar e para poderem ser abertos noutro telemóvel.

São três passos. Demora cerca de dez minutos e não é preciso saber programar.

---

## O que é preciso decidir antes

**Onde ficam os dados.** Escolhe uma região na Europa (Frankfurt, Londres ou Paris). São dados de
treino e de saúde de um menor: não há razão para os mandar para outro continente.

**Quem consegue ler.** Cada conta só lê e escreve as suas próprias linhas. Isso não depende de
guardar segredos na aplicação — é imposto pela própria base de dados, através de *Row Level
Security*, que o passo 2 configura.

---

## Passo 1 — Criar o projeto

1. Vai a <https://supabase.com> e cria conta (é gratuito).
2. **New project**:
   - **Name**: `treinos`
   - **Database Password**: gera uma e guarda-a no teu gestor de palavras-passe. É a palavra-passe
     de administração da base de dados — não é a palavra-passe com que o atleta entra na aplicação.
   - **Region**: uma da Europa.
3. Espera um minuto até o projeto ficar pronto.

## Passo 2 — Criar as tabelas

1. No menu lateral, abre **SQL Editor** → **New query**.
2. Copia o conteúdo de [`supabase-setup.sql`](./supabase-setup.sql) e cola lá.
3. Carrega em **Run**.

No fim aparece uma tabela de verificação com quatro linhas — `sessions`, `overrides`, `profiles` e
`settings` — todas com `rls_ligado = true` e 4 políticas cada. Se for isso que vês, está feito.

### Confirmação de email

Em **Authentication → Providers → Email**, confirma que **Confirm email** está ligado. Assim mais
ninguém consegue criar conta com o email do atleta.

> No plano gratuito, o serviço de email do Supabase tem um limite baixo de mensagens por hora.
> Para uso pessoal chega bem. Se um dia der erro a enviar, é isso.

### Para onde o email leva de volta — não saltar este passo

Por omissão, o Supabase só aceita devolver o utilizador a `http://localhost:3000`. Sem isto, a
ligação do email de confirmação **abre uma página que não existe** e parece que a conta não
funciona.

Em **Authentication → URL Configuration**:

| Campo | Valor |
| --- | --- |
| **Site URL** | `https://chopicao.github.io/app-treinos-gabriel/` |
| **Redirect URLs** | acrescentar `https://chopicao.github.io/app-treinos-gabriel/**` |

Se também usares a aplicação em desenvolvimento, acrescenta `http://localhost:5173/**` às
*Redirect URLs*.

Os `**` no fim são propositados: autorizam qualquer caminho dentro da aplicação.

## Passo 3 — Ligar a aplicação ao projeto

Precisas de **dois valores**. O caminho mais rápido é o botão verde **Connect**, no topo do painel:
mostra logo os dois, prontos a copiar. Em alternativa:

| Valor | Onde | Parecido com |
| --- | --- | --- |
| **Project URL** | Settings → **Data API** | `https://abcdefgh.supabase.co` |
| **Publishable key** | Settings → **API Keys** | `sb_publishable_7i2XRx...` |

> **Atenção ao nome.** O Supabase renomeou estas chaves: a antiga `anon public` chama-se agora
> **Publishable key**. As duas servem — a aplicação aceita qualquer uma. Se ainda vires o nome
> antigo, está no separador *Legacy anon, service_role API keys*.
>
> **Nunca uses uma _Secret key_** (`sb_secret_…`, ou a antiga `service_role`). Essas ignoram o Row
> Level Security: quem abrisse a página teria acesso a tudo.

A chave publicável é **pública por desenho** e acaba dentro do JavaScript da página. Não é ela que
protege os dados — é o *Row Level Security* do passo 2. O próprio painel diz isso: *"This key is
safe to use in a browser if you have enabled Row Level Security"*.

### Em produção (GitHub Pages)

Pelo site do GitHub, em **Settings → Secrets and variables → Actions → New repository secret**, cria
dois segredos:

| Name | Secret |
| --- | --- |
| `VITE_SUPABASE_URL` | o Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | a Publishable key |

Ou pela linha de comandos, que pede o valor a seguir a cada comando:

```bash
gh secret set VITE_SUPABASE_URL --repo Chopicao/app-treinos-gabriel
```

```bash
gh secret set VITE_SUPABASE_PUBLISHABLE_KEY --repo Chopicao/app-treinos-gabriel
```

Depois lança uma publicação nova, para o build passar a incluir a ligação:

```bash
gh workflow run deploy.yml --repo Chopicao/app-treinos-gabriel
```

### Em desenvolvimento

Copia `.env.example` para `.env` e preenche os dois valores. O `.env` está ignorado pelo Git.

---

## Confirmar que ficou a funcionar

1. Abre a aplicação e vai a **Definições**. O cartão "Conta" deve deixar de dizer que não há base de
   dados ligada e passar a oferecer **Criar conta ou entrar**.
2. Cria conta com o email do atleta e confirma pelo email que chega.
3. Entra. O cartão passa a mostrar o email e **Sincronizado**.
4. Regista uma série num treino. Ao fim de poucos segundos o estado volta a **Sincronizado**.
5. No painel do Supabase, em **Table Editor → sessions**, deve estar lá uma linha.
6. Abre a aplicação noutro telemóvel ou numa janela anónima, entra com a mesma conta, e o treino
   deve aparecer.

---

## Como funciona a sincronização

A aplicação continua a escrever **primeiro no dispositivo**. É isso que faz com que funcione num
ginásio sem rede: o treino é registado na mesma e sobe depois.

- Sincroniza ao entrar, sempre que há alterações (com uns segundos de espera para não sincronizar a
  cada tecla), quando volta a haver rede e quando se volta à aplicação.
- Em caso de conflito entre dois dispositivos, **vence a alteração mais recente**, comparada pela
  data em que o atleta a fez.
- Apagar num dispositivo propaga-se aos outros. Sem isto, o registo apagado voltava na sincronização
  seguinte.
- Se a sincronização falhar, **nada se perde**: fica tudo guardado no dispositivo e a aplicação
  tenta outra vez sozinha. O cartão "Conta" mostra o estado.
- Entrar com uma conta diferente da que tem dados neste dispositivo **não mistura nada**: a
  aplicação pára e pergunta o que fazer.

As regras de junção estão isoladas em `src/services/sync/merge.ts`, sem rede nem base de dados, e
são cobertas por testes — é a parte onde é fácil perder dados sem dar por isso.

## O que **não** vai para a nuvem

- Os temporizadores de uma sessão em curso: são estado momentâneo daquele dispositivo.
- O plano, os exercícios e os vídeos: são iguais para todos e vivem no código.

## Custos e limites

O plano gratuito do Supabase chega folgadamente para um atleta. A ter em conta:

- Projetos gratuitos **suspendem ao fim de uma semana sem qualquer utilização** e voltam sozinhos ao
  primeiro acesso seguinte (pode demorar alguns segundos). Com treinos várias vezes por semana, não
  acontece.
- O limite de emails por hora do plano gratuito é baixo, mas só é usado ao criar conta e ao
  recuperar a palavra-passe.

## Apagar tudo

- **Um treino**: no histórico, abrir a sessão e eliminar.
- **Este dispositivo**: Definições → *Repor dados*.
- **A conta inteira**: no painel do Supabase, **Authentication → Users**, apagar o utilizador. Como
  as tabelas têm `on delete cascade`, todas as linhas dessa conta desaparecem com ele.
