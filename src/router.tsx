import type { ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { AboutGdsPage } from './pages/AboutGdsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StepOnePage } from './pages/form/StepOnePage';
import { StepTwoPage } from './pages/form/StepTwoPage';
import { ReviewPage } from './pages/form/ReviewPage';
import { FormLayout } from './layouts/FormLayout';
import { FormProvider } from './state/FormContext';

const withProviders = (element: ReactElement) => (
  <FormProvider>{element}</FormProvider>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: withProviders(<RootLayout />),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about-gds', element: <AboutGdsPage /> },
      {
        path: 'apply',
        element: <FormLayout />,
        children: [
          { index: true, element: <StepOnePage /> },
          { path: 'service', element: <StepTwoPage /> },
          { path: 'check', element: <ReviewPage /> }
        ]
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);
