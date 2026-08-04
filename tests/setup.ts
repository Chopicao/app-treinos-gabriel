import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// jsdom não implementa matchMedia, usado pelo tema.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom não implementa scrollTo.
window.scrollTo = (() => {}) as typeof window.scrollTo;
