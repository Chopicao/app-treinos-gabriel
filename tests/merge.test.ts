import { describe, expect, it } from 'vitest';
import { mergeCollection, mergeSingleton, type RemoteRecord } from '@/services/sync/merge';

interface Record {
  id: string;
  updatedAt: string;
  value: string;
}

const idOf = (record: Record) => record.id;
const timestampOf = (record: Record) => record.updatedAt;

function local(id: string, updatedAt: string, value = 'local'): Record {
  return { id, updatedAt, value };
}

function remote(
  id: string,
  updatedAt: string,
  value = 'remoto',
  serverUpdatedAt = updatedAt,
): RemoteRecord<Record> {
  return { id, serverUpdatedAt, deletedAt: null, data: { id, updatedAt, value } };
}

function deletedRemotely(id: string, serverUpdatedAt: string): RemoteRecord<Record> {
  return { id, serverUpdatedAt, deletedAt: serverUpdatedAt, data: null };
}

const empty = { localDeletions: [], watermark: null };

describe('junção de coleções', () => {
  it('traz registos que só existem no servidor', () => {
    const result = mergeCollection({
      ...empty,
      local: [],
      idOf,
      timestampOf,
      remote: [remote('a', '2026-08-01T10:00:00.000Z')],
    });
    expect(result.toApplyLocally.map((r) => r.id)).toEqual(['a']);
    expect(result.toPush).toEqual([]);
  });

  it('envia registos que só existem neste dispositivo', () => {
    const result = mergeCollection({
      ...empty,
      local: [local('a', '2026-08-01T10:00:00.000Z')],
      idOf,
      timestampOf,
      remote: [],
    });
    expect(result.toPush.map((r) => r.id)).toEqual(['a']);
    expect(result.toApplyLocally).toEqual([]);
  });

  it('vence a escrita mais recente', () => {
    const olderLocal = mergeCollection({
      ...empty,
      local: [local('a', '2026-08-01T10:00:00.000Z')],
      idOf,
      timestampOf,
      remote: [remote('a', '2026-08-02T10:00:00.000Z')],
    });
    expect(olderLocal.toApplyLocally.map((r) => r.value)).toEqual(['remoto']);
    expect(olderLocal.toPush).toEqual([]);

    const newerLocal = mergeCollection({
      ...empty,
      local: [local('a', '2026-08-03T10:00:00.000Z')],
      idOf,
      timestampOf,
      remote: [remote('a', '2026-08-02T10:00:00.000Z')],
    });
    expect(newerLocal.toPush.map((r) => r.value)).toEqual(['local']);
    expect(newerLocal.toApplyLocally).toEqual([]);
  });

  it('não mexe em nada quando os dois lados estão iguais', () => {
    const result = mergeCollection({
      ...empty,
      local: [local('a', '2026-08-02T10:00:00.000Z')],
      idOf,
      timestampOf,
      remote: [remote('a', '2026-08-02T10:00:00.000Z')],
    });
    expect(result.toApplyLocally).toEqual([]);
    expect(result.toPush).toEqual([]);
  });

  it('apaga localmente o que foi apagado no servidor', () => {
    const result = mergeCollection({
      ...empty,
      local: [local('a', '2026-08-01T10:00:00.000Z')],
      idOf,
      timestampOf,
      remote: [deletedRemotely('a', '2026-08-02T10:00:00.000Z')],
    });
    expect(result.toDeleteLocally).toEqual(['a']);
    expect(result.toPush).toEqual([]);
  });

  it('propaga uma eliminação feita neste dispositivo', () => {
    const result = mergeCollection({
      local: [],
      idOf,
      timestampOf,
      localDeletions: [{ id: 'a', deletedAt: '2026-08-03T10:00:00.000Z' }],
      remote: [remote('a', '2026-08-01T10:00:00.000Z')],
      watermark: null,
    });
    expect(result.toPushDeletions.map((d) => d.id)).toEqual(['a']);
    expect(result.toApplyLocally).toEqual([]);
  });

  it('uma alteração no servidor posterior à eliminação local ressuscita o registo', () => {
    const result = mergeCollection({
      local: [],
      idOf,
      timestampOf,
      localDeletions: [{ id: 'a', deletedAt: '2026-08-01T10:00:00.000Z' }],
      remote: [remote('a', '2026-08-05T10:00:00.000Z')],
      watermark: null,
    });
    expect(result.toApplyLocally.map((r) => r.id)).toEqual(['a']);
    expect(result.toPushDeletions).toEqual([]);
    expect(result.settledDeletions).toEqual(['a']);
  });

  it('uma eliminação já refletida no servidor deixa de estar pendente', () => {
    const result = mergeCollection({
      local: [],
      idOf,
      timestampOf,
      localDeletions: [{ id: 'a', deletedAt: '2026-08-01T10:00:00.000Z' }],
      remote: [deletedRemotely('a', '2026-08-02T10:00:00.000Z')],
      watermark: null,
    });
    expect(result.settledDeletions).toEqual(['a']);
    expect(result.toPushDeletions).toEqual([]);
  });

  it('a marca de leitura avança para o maior carimbo do servidor', () => {
    const result = mergeCollection({
      ...empty,
      local: [],
      idOf,
      timestampOf,
      remote: [
        remote('a', '2026-08-01T10:00:00.000Z', 'remoto', '2026-08-01T11:00:00.000Z'),
        remote('b', '2026-08-02T10:00:00.000Z', 'remoto', '2026-08-02T11:00:00.000Z'),
      ],
    });
    expect(result.nextWatermark).toBe('2026-08-02T11:00:00.000Z');
  });

  it('sem novidades no servidor, a marca de leitura fica onde estava', () => {
    const result = mergeCollection({
      local: [],
      idOf,
      timestampOf,
      localDeletions: [],
      remote: [],
      watermark: '2026-08-02T11:00:00.000Z',
    });
    expect(result.nextWatermark).toBe('2026-08-02T11:00:00.000Z');
  });

  it('usa a chave certa em coleções cujo identificador não se chama id', () => {
    interface Override {
      key: string;
      updatedAt: string;
    }
    const result = mergeCollection<Override>({
      local: [{ key: 'gym-a@2026-08-04', updatedAt: '2026-08-04T10:00:00.000Z' }],
      idOf: (record) => record.key,
      timestampOf: (record) => record.updatedAt,
      localDeletions: [],
      remote: [],
      watermark: null,
    });
    expect(result.toPush.map((r) => r.key)).toEqual(['gym-a@2026-08-04']);
  });

  it('primeira sincronização de um dispositivo com dados envia tudo', () => {
    const result = mergeCollection({
      ...empty,
      local: [local('a', '2026-08-01T10:00:00.000Z'), local('b', '2026-08-02T10:00:00.000Z')],
      idOf,
      timestampOf,
      remote: [],
    });
    expect(result.toPush).toHaveLength(2);
    expect(result.toDeleteLocally).toEqual([]);
  });
});

describe('junção de documentos únicos', () => {
  it('traz o do servidor quando é mais recente', () => {
    const result = mergeSingleton(
      { updatedAt: '2026-08-01T10:00:00.000Z' },
      { updatedAt: '2026-08-02T10:00:00.000Z' },
    );
    expect(result.apply?.updatedAt).toBe('2026-08-02T10:00:00.000Z');
    expect(result.push).toBeNull();
  });

  it('envia o local quando é mais recente', () => {
    const result = mergeSingleton(
      { updatedAt: '2026-08-03T10:00:00.000Z' },
      { updatedAt: '2026-08-02T10:00:00.000Z' },
    );
    expect(result.push?.updatedAt).toBe('2026-08-03T10:00:00.000Z');
    expect(result.apply).toBeNull();
  });

  it('envia o local quando o servidor ainda não tem nada', () => {
    const result = mergeSingleton({ updatedAt: '2026-08-03T10:00:00.000Z' }, undefined);
    expect(result.push?.updatedAt).toBe('2026-08-03T10:00:00.000Z');
  });

  it('não faz nada quando estão iguais', () => {
    const same = { updatedAt: '2026-08-03T10:00:00.000Z' };
    const result = mergeSingleton(same, { ...same });
    expect(result.apply).toBeNull();
    expect(result.push).toBeNull();
  });
});
