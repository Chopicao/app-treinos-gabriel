/** Textarea multi-linha → lista, sem linhas vazias. */
export function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Valor a mostrar quando um campo do perfil ainda não foi preenchido. */
export const NOT_SET_PT = 'Por preencher';

export function orNotSet(value: string | number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') return NOT_SET_PT;
  return `${value}${suffix}`;
}
