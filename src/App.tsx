import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAppStore } from '@/state/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { TodayPage } from '@/routes/TodayPage';

// "Hoje" é o ecrã de entrada e vem no primeiro pacote. Os restantes são carregados
// quando fazem falta, para o primeiro arranque no telemóvel ser mais leve.
const OnboardingPage = lazy(() =>
  import('@/routes/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const CalendarPage = lazy(() =>
  import('@/routes/CalendarPage').then((m) => ({ default: m.CalendarPage })),
);
const SessionDetailPage = lazy(() =>
  import('@/routes/SessionDetailPage').then((m) => ({ default: m.SessionDetailPage })),
);
const RunnerPage = lazy(() =>
  import('@/routes/RunnerPage').then((m) => ({ default: m.RunnerPage })),
);
const HistoryPage = lazy(() =>
  import('@/routes/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const SessionSummaryPage = lazy(() =>
  import('@/routes/SessionSummaryPage').then((m) => ({ default: m.SessionSummaryPage })),
);
const LibraryPage = lazy(() =>
  import('@/routes/LibraryPage').then((m) => ({ default: m.LibraryPage })),
);
const ExerciseDetailPage = lazy(() =>
  import('@/routes/ExerciseDetailPage').then((m) => ({ default: m.ExerciseDetailPage })),
);
const SettingsPage = lazy(() =>
  import('@/routes/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AboutPlanPage = lazy(() =>
  import('@/routes/AboutPlanPage').then((m) => ({ default: m.AboutPlanPage })),
);
const VideoReviewPage = lazy(() =>
  import('@/routes/VideoReviewPage').then((m) => ({ default: m.VideoReviewPage })),
);
const NotFoundPage = lazy(() =>
  import('@/routes/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const status = useAppStore((state) => state.status);
  const errorPt = useAppStore((state) => state.errorPt);
  const theme = useAppStore((state) => state.settings.theme);
  const onboardingCompletedAt = useAppStore((state) => state.settings.onboardingCompletedAt);
  const init = useAppStore((state) => state.init);
  const location = useLocation();

  useTheme(theme);

  useEffect(() => {
    void init();
  }, [init]);

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <p className="text-muted" role="status">
          A carregar os teus dados…
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-prose text-center">
          <h1 className="text-xl">Não foi possível abrir a aplicação</h1>
          <p className="text-muted mt-2 text-sm">{errorPt}</p>
        </div>
      </div>
    );
  }

  const needsOnboarding = !onboardingCompletedAt && location.pathname !== '/onboarding';
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <ScrollToTop />
      <AppLayout>
        <Suspense
          fallback={
            <p className="text-muted p-6 text-center" role="status">
              A carregar…
            </p>
          }
        >
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={<TodayPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/sessao/:occurrenceKey" element={<SessionDetailPage />} />
            <Route path="/sessao/:occurrenceKey/treinar" element={<RunnerPage />} />
            <Route path="/historico" element={<HistoryPage />} />
            <Route path="/historico/:sessionId" element={<SessionSummaryPage />} />
            <Route path="/exercicios" element={<LibraryPage />} />
            <Route path="/exercicios/:exerciseId" element={<ExerciseDetailPage />} />
            <Route path="/definicoes" element={<SettingsPage />} />
            <Route path="/definicoes/videos" element={<VideoReviewPage />} />
            <Route path="/sobre" element={<AboutPlanPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </>
  );
}
