import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { SessionOccurrence } from '@/domain/types';
import { selectScheduleContext, useAppStore } from '@/state/useAppStore';
import { findOccurrence, occurrencesInRange } from '@/services/schedule';
import type { DateKey } from '@/lib/dates';

function useScheduleContext() {
  return useAppStore(
    useShallow((state) => ({
      planStartDate: state.settings.planStartDate,
      overrides: state.overrides,
      logs: state.sessions,
    })),
  );
}

export function useOccurrences(from: DateKey, to: DateKey): SessionOccurrence[] {
  const context = useScheduleContext();
  return useMemo(() => occurrencesInRange(from, to, context), [from, to, context]);
}

export function useOccurrence(key: string | undefined): SessionOccurrence | undefined {
  const context = useScheduleContext();
  return useMemo(() => (key ? findOccurrence(key, context) : undefined), [key, context]);
}

export function useScheduleContextValue() {
  const context = useScheduleContext();
  return context;
}

export { selectScheduleContext };
