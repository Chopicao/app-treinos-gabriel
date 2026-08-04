/**
 * Regras de junção entre o que está neste dispositivo e o que está na conta.
 *
 * Estão isoladas aqui, sem rede nem base de dados, porque são a parte onde é
 * fácil perder dados sem dar por isso — e assim podem ser testadas a sério.
 *
 * Regra: **vence a escrita mais recente**, comparada pelo `updatedAt` que a
 * aplicação carimba sempre que o atleta altera alguma coisa. Uma eliminação
 * vence quando é mais recente do que a última alteração do registo.
 */

/**
 * Nem todos os registos guardam a data no mesmo campo (as remarcações usam
 * `createdAt`), por isso o identificador e o carimbo são lidos por função em vez
 * de exigirem uma forma fixa.
 */
export interface RemoteRecord<T> {
  id: string;
  /** Carimbo do servidor. Só serve como marca de leitura, não para decidir. */
  serverUpdatedAt: string;
  deletedAt: string | null;
  data: T | null;
}

export interface LocalDeletion {
  id: string;
  deletedAt: string;
}

export interface MergeResult<T> {
  /** Registos remotos a escrever localmente, tal e qual. */
  toApplyLocally: T[];
  /** Identificadores a apagar localmente. */
  toDeleteLocally: string[];
  /** Registos locais a enviar para o servidor. */
  toPush: T[];
  /** Eliminações locais a propagar. */
  toPushDeletions: LocalDeletion[];
  /** Marcas de eliminação locais já refletidas no servidor, que podem sair. */
  settledDeletions: string[];
  /** Nova marca de leitura: o maior carimbo do servidor observado. */
  nextWatermark: string | null;
}

const isAfter = (a: string, b: string) => a > b;

export function mergeCollection<T>(input: {
  local: T[];
  /** Como obter o identificador de um registo (`id` nas sessões, `key` nas remarcações). */
  idOf: (record: T) => string;
  /** Quando o registo foi alterado pela última vez. É por aqui que se decide quem ganha. */
  timestampOf: (record: T) => string;
  localDeletions: LocalDeletion[];
  remote: Array<RemoteRecord<T>>;
  /** Marca de leitura anterior; `null` na primeira sincronização. */
  watermark: string | null;
}): MergeResult<T> {
  const { local, idOf, timestampOf, localDeletions, remote, watermark } = input;

  const localById = new Map(local.map((record) => [idOf(record), record]));
  const deletionById = new Map(localDeletions.map((deletion) => [deletion.id, deletion]));
  const seenRemotely = new Set<string>();

  const toApplyLocally: T[] = [];
  const toDeleteLocally: string[] = [];
  const toPush: T[] = [];
  const settledDeletions: string[] = [];
  let nextWatermark = watermark;

  for (const record of remote) {
    seenRemotely.add(record.id);
    if (!nextWatermark || isAfter(record.serverUpdatedAt, nextWatermark)) {
      nextWatermark = record.serverUpdatedAt;
    }

    const localRecord = localById.get(record.id);
    const localDeletion = deletionById.get(record.id);

    // O servidor diz que foi apagado.
    if (record.deletedAt) {
      if (localRecord) toDeleteLocally.push(record.id);
      if (localDeletion) settledDeletions.push(record.id);
      continue;
    }

    // Foi apagado aqui depois da última alteração conhecida: a eliminação ganha.
    if (
      localDeletion &&
      record.data &&
      isAfter(localDeletion.deletedAt, timestampOf(record.data))
    ) {
      continue; // fica por propagar; entra em `toPushDeletions` mais abaixo
    }

    // Ressuscitado no servidor depois de o termos apagado: a escrita ganha.
    if (localDeletion) settledDeletions.push(record.id);

    if (!record.data) continue;

    if (!localRecord) {
      toApplyLocally.push(record.data);
      continue;
    }

    if (isAfter(timestampOf(record.data), timestampOf(localRecord))) {
      toApplyLocally.push(record.data);
    } else if (isAfter(timestampOf(localRecord), timestampOf(record.data))) {
      toPush.push(localRecord);
    }
    // Iguais: nada a fazer.
  }

  // Registos locais que o servidor ainda não conhece.
  for (const record of local) {
    const id = idOf(record);
    if (seenRemotely.has(id)) continue;
    if (deletionById.has(id)) continue;
    toPush.push(record);
  }

  const settled = new Set(settledDeletions);
  const toPushDeletions = localDeletions.filter((deletion) => !settled.has(deletion.id));

  return {
    toApplyLocally,
    toDeleteLocally,
    toPush,
    toPushDeletions,
    settledDeletions,
    nextWatermark,
  };
}

export interface Timestamped {
  updatedAt: string;
}

/** Documentos únicos (perfil, definições): vence simplesmente o mais recente. */
export function mergeSingleton<T extends Timestamped>(
  local: T | undefined,
  remote: T | undefined,
): { apply: T | null; push: T | null } {
  if (!remote) return { apply: null, push: local ?? null };
  if (!local) return { apply: remote, push: null };
  if (isAfter(remote.updatedAt, local.updatedAt)) return { apply: remote, push: null };
  if (isAfter(local.updatedAt, remote.updatedAt)) return { apply: null, push: local };
  return { apply: null, push: null };
}
