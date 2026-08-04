# Revisão de conteúdo e segurança

Este documento regista **decisões de interpretação, contradições e riscos** encontrados ao
transformar o plano fornecido pelo utilizador em dados da aplicação.

As prescrições são tratadas como **conteúdo fornecido pelo utilizador**, não como aconselhamento
clínico criado pela aplicação. Nada foi alterado em silêncio: sempre que houve ambiguidade, o dado
original foi mantido e a questão está registada aqui para aprovação.

---

## 1. Ambiguidades de prescrição e como foram representadas

### 1.1 Intervalos de séries (`2–3 ×`)

O plano escreve, em vários exercícios, intervalos como `2–3 × 8 por perna`.

- **Decisão:** o registo é criado com o **limite inferior** de séries e o cartão mostra o intervalo
  completo (`2–3 × 8 por lado`). Existe um botão "Acrescentar série" que permite subir até ao limite
  superior.
- **Porquê:** para um atleta de 17 anos, iniciante em ginásio, o predefinido não deve empurrar para o
  volume máximo. A decisão de fazer a terceira série fica explícita e do lado do atleta.
- **Afeta:** `low-step-down` (semanas 3–6), `supported-single-leg-rdl` (semanas 3–6),
  `pallof-press`, `short-lever-copenhagen-plank` (semanas 3–6).

### 1.2 `3 × 8 ou 4 × 6, apenas se a técnica justificar`

Semanas 5–6 do goblet squat até à caixa.

- **Decisão:** representado como `3–4 × 6–8`, com a nota original visível no detalhe do exercício.
- **Porquê:** não é possível representar duas combinações alternativas num único campo sem inventar
  uma regra. O texto original acompanha a prescrição.

### 1.3 Bloco de ativação com "duas voltas"

Blocos em circuito (Ginásio A, bloco 4; Ginásio B, bloco 3).

- **Decisão:** cada volta é registada como uma **série** do exercício. Um exercício prescrito a
  `1 × 10` num bloco de duas voltas aparece como `2 × 10`, e a descrição do bloco explica que uma
  série corresponde a uma volta.
- **Porquê:** evita duplicar entradas e mantém o registo por série intacto.

### 1.4 Exercícios que só existem em parte das semanas

O plano diz: semanas 1–2 `isometric heel-dig bridge`; a partir da semana 3, **se estiver sem dor e
com controlo**, `hamstring walkout`.

- **Decisão:** a ponte isométrica tem prescrição só nas semanas 1–2; o hamstring walkout só a partir
  da semana 3. A ponte isométrica está registada como **alternativa autorizada** do walkout, para o
  atleta poder voltar atrás sem sair do plano, e a condição ("apenas se estiver sem dor e com
  controlo") aparece nas notas do exercício.
- **Nota de segurança:** a aplicação **não** avalia sozinha se há dor ou controlo suficiente. A troca
  é sempre manual.

---

## 2. Duração da rotina diária de mobilidade

O plano descreve a rotina como sendo de "cerca de 20 minutos" e instrui: se, depois de cronometrar,
exceder claramente 20–25 minutos, manter todos os exercícios na biblioteca e assinalar alguns como
opcionais, sem comprimir a técnica.

**Foi cronometrado com um modelo explícito** (`estimateSessionSeconds`, testado em
`tests/sessionBuilder.test.ts`): tempo prescrito nas retenções, 3,5 s por repetição, 15 s de
transição entre exercícios e o descanso prescrito entre séries.

| Versão | Estimativa |
| --- | --- |
| Rotina completa, 18 exercícios | ≈ 28 min |
| Rotina sem os exercícios marcados como opcionais | ≈ 24 min |

- **Decisão:** três exercícios foram marcados como **opcionais**, mantendo-se todos na sessão e na
  biblioteca: `adductor foam roll`, `ankle CARs` e `toe yoga`.
- **Porquê:** são os que mais se sobrepõem a outros da própria rotina (o rolo dos adutores repete-se
  no aquecimento do ginásio; o knee-to-wall já cobre a mobilidade do tornozelo; o exercício do pé
  curto já trabalha o controlo do pé). Nenhuma técnica foi acelerada e nenhum exercício foi removido.
- **Por aprovar:** confirmar se esta é a escolha preferida de exercícios opcionais.

---

## 3. Preocupações de segurança registadas

O plano de origem foi escrito para um atleta com historial de lesão nos posteriores da coxa, uma
entorse do tornozelo e uma lesão da frente da perna por esclarecer. **Esses dados não são
distribuídos com a aplicação** (ver secção 7); o que fica no código são as consequências para o
conteúdo do treino, escritas de forma condicional.

### 3.1 Lesão da frente da perna por esclarecer

O plano pede explicitamente que não se assuma a estrutura exata.

- **Consequência no conteúdo:** o `tibialis raise` (frente da perna) leva nota para começar com pouca
  amplitude e volume e parar perante qualquer dor; o `couch stretch` — alongamento intenso da frente
  da coxa — ficou marcado como **fase posterior** e não entra em nenhuma sessão ativa; o rolo no
  quadricípite tem nota para evitar a zona enquanto não estiver avaliada.
- **Ação recomendada:** esclarecer com fisioterapeuta qual foi a estrutura antes de progredir carga
  nessa zona. Fica registado no campo "Questões a esclarecer" do perfil, que é preenchido na
  aplicação e mostrado no ecrã "Sobre o plano".

### 3.2 Posteriores da coxa

- O Nordic completo, o Nordic assistido e o curl deslizante excêntrico estão na biblioteca como
  **fase posterior** e **não são programados** em nenhuma sessão ativa — em particular não a dois
  dias do jogo, como o plano pede.
- A progressão dos posteriores segue a ordem do plano: ponte isométrica → hamstring walkout.
- Todos os exercícios de mobilização dos posteriores levam a nota de que sensações elétricas, ardor
  ou picada são sinal para parar.

### 3.3 Tornozelo

- `knee-to-wall`, `ankle CARs` e o trabalho de gémeos levam nota para parar perante dor no tornozelo,
  sobretudo num que já tenha tido entorse.
- O trabalho de equilíbrio começa no chão; o BOSU só aparece como nota de progressão posterior e sem
  carga externa, como o plano indica.

### 3.4 Ausências deliberadas

Não existe, em lado nenhum da aplicação:

- cálculo de 1RM ou de percentagens de máximo;
- séries até à falha;
- recomendação automática de carga;
- alteração automática de carga a partir de uma sugestão;
- linguagem que pressione a treinar com dor;
- gamificação agressiva (sequências, medalhas, recordes pessoais).

A regra de progressão exibida é apenas informativa e exige duas sessões consecutivas com todas as
repetições completas, boa técnica e sem dor.

### 3.5 Escalas de esforço e desconforto

As escalas de 0–10 no fim da sessão têm sempre junto a nota de que servem para acompanhar tendências
e **não são um diagnóstico**. Registar dor num exercício mostra o aviso de segurança e nunca sugere
"compensar" com mais volume.

---

## 4. Material disponível

O plano indica que **não há halteres nem trenó comercial**.

- Nenhum exercício ativo usa halteres. As pressões e remadas usam polia, landmine ou peso corporal.
- Os exercícios de biblioteca que normalmente se fazem com halteres foram escritos para kettlebell
  ou polia.
- O sprint resistido com pneu existe na biblioteca como **fase posterior** e não é programado.

---

## 5. Notas condicionais do plano que a aplicação apresenta, mas não aplica sozinha

| Situação | O que a aplicação faz |
| --- | --- |
| Quarta-feira muito intensa | O interruptor "Assinalar fadiga acumulada" mostra a recomendação predefinida do plano: reduzir uma série dos exercícios de pernas. Não altera nada automaticamente. |
| Posteriores pesados na sexta | Nota visível em "Sobre o plano" e nas notas do Ginásio B: a primeira adaptação prevista é retirar o hamstring walkout e reduzir o peso morto para duas séries. |
| Depois da semana 6 | O plano mantém a prescrição das semanas 5–6 e o painel "Hoje" mostra o aviso para pedir avaliação antes de barra pesada, saltos e trabalho explosivo. |

---

## 6. Nenhum dado pessoal é distribuído com a aplicação

O perfil do atleta — nome, idade, altura, peso, posição, pé dominante, historial de lesões, notas de
mobilidade, questões a esclarecer e supervisão — **começa vazio** em `src/data/profile.ts` e é
preenchido no onboarding. Fica guardado apenas no armazenamento do dispositivo, tal como os registos
de treino.

Consequência prática: os ficheiros publicados não contêm informação de saúde sobre ninguém, e a
aplicação pode ser alojada num sítio público sem expor nada. O que fica no código são orientações de
treino escritas de forma condicional ("se houver historial de lesão nesta zona…"), que valem para
qualquer utilizador.

O que continua a existir em `src/data/`:

- o plano (exercícios, séries, repetições, descansos, notas técnicas);
- as regras de segurança e a lista de sinais para parar;
- os objetivos e o material que o plano assume;
- os vídeos verificados.

## 7. Fontes

As referências listadas no ecrã "Sobre o plano" são leitura de contexto sobre os temas do plano.
**Não** se afirma que validam individualmente cada série, repetição ou exercício aqui prescrito, e
correlação não é apresentada como garantia de prevenção. Não é reproduzido texto protegido das
fontes.

Os links das fontes estão separados dos vídeos de demonstração, que vivem em
[`docs/youtube-video-review.md`](./youtube-video-review.md).
