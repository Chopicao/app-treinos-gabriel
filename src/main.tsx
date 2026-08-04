import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

/**
 * Instalação offline.
 *
 * `immediate` regista logo no arranque e, como o modo é `autoUpdate`, uma versão
 * nova é aplicada e a página recarrega sozinha. Isto é deliberado: sem ele, um
 * telemóvel com a aplicação instalada fica preso na versão em cache — já
 * aconteceu. Recarregar é seguro porque a sessão de treino é gravada no
 * dispositivo a cada alteração e retomada no ponto exato.
 */
registerSW({ immediate: true });

// Permite servir a aplicação a partir de um subdiretório (ex.: GitHub Pages).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
