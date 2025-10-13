import type { ReactElement } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { AboutGdsPage } from './pages/AboutGdsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServiceFormRoute } from './pages/services/ServiceFormRoute';
import { ServiceQuestionPage } from './pages/services/ServiceQuestionPage';
import { ServiceSummaryPage } from './pages/services/ServiceSummaryPage';
import { ServiceDefinitionsProvider } from './state/ServiceDefinitionsContext';

const withProviders = (element: ReactElement) => (
  <ServiceDefinitionsProvider>{element}</ServiceDefinitionsProvider>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: withProviders(<RootLayout />),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about-gds', element: <AboutGdsPage /> },
      {
        path: 'services/:serviceSlug',
        element: <ServiceFormRoute />,
        children: [
          { index: true, element: <Navigate to="questions/0" replace /> },
          { path: 'questions/:questionIndex', element: <ServiceQuestionPage /> },
          { path: 'summary', element: <ServiceSummaryPage /> }
        ]
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);
