import './lib/amplify';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';
import { locale, messages } from './lib/locale';
import { SessionProvider } from './context/Session';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IntlProvider locale={locale} messages={messages}>
      <BrowserRouter>
        <SessionProvider>
          <App />
        </SessionProvider>
      </BrowserRouter>
    </IntlProvider>
  </StrictMode>,
);
