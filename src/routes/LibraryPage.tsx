import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Video, VideoOff } from 'lucide-react';
import type { ExerciseDefinition } from '@/domain/types';
import {
  CATEGORY_LABELS_PT,
  EXERCISES,
  METRIC_LABELS_PT,
  TAG_LABELS_PT,
  hasVerifiedVideo,
} from '@/data/exercises';
import { useAppStore } from '@/state/useAppStore';
import { SelectInput, TextInput } from '@/components/ui/Field';
import { Badge } from '@/components/ui/StatusBadge';
import { EmptyState, PageHeader } from '@/components/ui/Misc';

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('pt-PT')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function LibraryPage() {
  const showLaterPhase = useAppStore((state) => state.settings.showLaterPhaseInLibrary);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [tag, setTag] = useState('all');

  const equipmentOptions = useMemo(
    () => [...new Set(EXERCISES.flatMap((exercise) => exercise.equipment))].sort(),
    [],
  );

  const results = useMemo(() => {
    const needle = normalize(query.trim());
    return EXERCISES.filter((exercise) => {
      if (!showLaterPhase && exercise.tags.includes('later-phase') && tag === 'all') return false;
      if (category !== 'all' && exercise.category !== category) return false;
      if (equipment !== 'all' && !exercise.equipment.includes(equipment)) return false;
      if (tag !== 'all' && !exercise.tags.includes(tag as ExerciseDefinition['tags'][number]))
        return false;
      if (!needle) return true;
      return (
        normalize(exercise.namePt).includes(needle) || normalize(exercise.nameEn).includes(needle)
      );
    });
  }, [query, category, equipment, tag, showLaterPhase]);

  const grouped = useMemo(() => {
    const active = results.filter((exercise) => exercise.tags.includes('base'));
    const alternatives = results.filter(
      (exercise) => exercise.tags.includes('alternative') && !exercise.tags.includes('base'),
    );
    const later = results.filter((exercise) => exercise.tags.includes('later-phase'));
    return { active, alternatives, later };
  }, [results]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exercícios"
        subtitle={`${EXERCISES.length} exercícios. Os ativos do plano estão separados das alternativas e das progressões de fase posterior.`}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput
          label="Pesquisar"
          placeholder="Nome em português ou inglês"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          wrapperClassName="sm:col-span-2"
        />
        <SelectInput
          label="Categoria"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">Todas</option>
          {Object.entries(CATEGORY_LABELS_PT).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>
        <SelectInput
          label="Material"
          value={equipment}
          onChange={(event) => setEquipment(event.target.value)}
        >
          <option value="all">Todo</option>
          {equipmentOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectInput>
        <SelectInput label="Fase" value={tag} onChange={(event) => setTag(event.target.value)}>
          <option value="all">Todas</option>
          {Object.entries(TAG_LABELS_PT).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>
      </div>

      <p className="text-muted flex items-center gap-2 text-sm" role="status">
        <Search aria-hidden="true" className="size-4" />
        {results.length} resultado{results.length === 1 ? '' : 's'}
      </p>

      {results.length === 0 ? (
        <EmptyState
          title="Nenhum exercício corresponde à pesquisa"
          description="Tenta outro termo, limpa os filtros ou procura pelo nome em inglês."
        />
      ) : (
        <div className="space-y-6">
          <Group title="Ativos no plano" exercises={grouped.active} />
          <Group title="Alternativas autorizadas" exercises={grouped.alternatives} />
          <Group
            title="Progressões de fase posterior"
            description="Não programadas neste bloco de seis semanas. Pedir avaliação antes de as introduzir."
            exercises={grouped.later}
          />
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  description,
  exercises,
}: {
  title: string;
  description?: string;
  exercises: ExerciseDefinition[];
}) {
  if (exercises.length === 0) return null;
  return (
    <section aria-labelledby={`grupo-${title}`}>
      <h2 id={`grupo-${title}`} className="text-lg">
        {title}
      </h2>
      {description ? <p className="text-muted mt-1 mb-2 text-sm">{description}</p> : null}
      <ul className="mt-2 space-y-2">
        {exercises.map((exercise) => (
          <li key={exercise.id}>
            <Link
              to={`/exercicios/${exercise.id}`}
              className="surface-raised border-app hover:surface-sunken block rounded-xl border p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{exercise.namePt}</span>
                {hasVerifiedVideo(exercise) ? (
                  <Video aria-label="Com vídeo verificado" className="text-accent size-4" />
                ) : (
                  <VideoOff aria-label="Sem vídeo verificado" className="text-muted size-4" />
                )}
              </div>
              <p className="text-muted text-sm">{exercise.nameEn}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{CATEGORY_LABELS_PT[exercise.category]}</Badge>
                <Badge>{METRIC_LABELS_PT[exercise.metric]}</Badge>
                {exercise.unilateral ? <Badge>Por lado</Badge> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
