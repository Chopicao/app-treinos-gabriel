import type {
  AppSettings,
  AthleteProfile,
  ExportBundle,
  OccurrenceOverride,
  SessionLog,
} from '@/domain/types';
import { exportBundleSchema } from '@/domain/schemas';
import { PLAN_VERSION } from '@/data/plan';
import type { Repository } from './repository';

export const EXPORT_FORMAT_VERSION = 1;

export function buildExportBundle(data: {
  settings: AppSettings;
  profile: AthleteProfile;
  sessions: SessionLog[];
  overrides: OccurrenceOverride[];
  now?: Date;
}): ExportBundle {
  return {
    kind: 'app-treinos-export',
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: (data.now ?? new Date()).toISOString(),
    planVersion: PLAN_VERSION,
    settings: data.settings,
    profile: data.profile,
    sessions: data.sessions,
    overrides: data.overrides,
  };
}

export type ImportResult =
  | { ok: true; bundle: ExportBundle; warningsPt: string[] }
  | { ok: false; errorPt: string; issuesPt: string[] };

/**
 * Validates an import file completely before anything is written.
 * Invalid JSON never reaches the database, so existing data is untouched.
 */
export function parseImportBundle(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      errorPt: 'O ficheiro não é JSON válido.',
      issuesPt: ['Confirma que escolheste um ficheiro exportado por esta aplicação.'],
    };
  }

  const result = exportBundleSchema.safeParse(parsed);
  if (!result.success) {
    const issuesPt = result.error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join('.') || 'raiz'}: ${issue.message}`);
    return {
      ok: false,
      errorPt: 'O ficheiro tem um formato inesperado e não foi importado.',
      issuesPt,
    };
  }

  const bundle = result.data as ExportBundle;
  const warningsPt: string[] = [];
  if (bundle.formatVersion > EXPORT_FORMAT_VERSION) {
    warningsPt.push(
      'O ficheiro foi criado por uma versão mais recente da aplicação. Alguns campos podem ser ignorados.',
    );
  }
  if (bundle.planVersion !== PLAN_VERSION) {
    warningsPt.push(
      `O ficheiro foi criado com o plano ${bundle.planVersion} e a aplicação usa o plano ${PLAN_VERSION}. As sessões antigas mantêm a prescrição com que foram registadas.`,
    );
  }
  return { ok: true, bundle, warningsPt };
}

/** Replaces the local data with the contents of an already-validated bundle. */
export async function applyImport(repo: Repository, bundle: ExportBundle): Promise<void> {
  await repo.replaceAll({
    settings: bundle.settings,
    profile: bundle.profile,
    sessions: bundle.sessions,
    overrides: bundle.overrides,
  });
}

export function bundleToFilename(bundle: ExportBundle): string {
  return `treinos-${bundle.exportedAt.slice(0, 10)}.json`;
}

/** Triggers a browser download. No-op outside the browser. */
export function downloadBundle(bundle: ExportBundle): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = bundleToFilename(bundle);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
