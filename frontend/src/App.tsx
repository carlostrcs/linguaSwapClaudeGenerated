import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import DemoLayout from './components/DemoLayout';
import AuthLayout from './components/AuthLayout';
import DemoLibrariesPage from './pages/DemoLibrariesPage';
import DemoLibraryEditorPage from './pages/DemoLibraryEditorPage';
import DemoPracticePage from './pages/DemoPracticePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LibrariesPage from './pages/LibrariesPage';
import FeaturedPage from './pages/FeaturedPage';
import LibraryEditorPage from './pages/LibraryEditorPage';
import PracticePage from './pages/PracticePage';
import StatsPage from './pages/StatsPage';
import AccountPage from './pages/AccountPage';
import BillingSuccessPage from './pages/BillingSuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import { DEFAULT_LOCALE, LOCALE_IDS } from './i18n/locales';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* One indexable homepage per locale. These are prerendered in their own language and also
          boot the SPA, so a logged-in visitor still gets the logged-in landing rather than a
          static logged-out snapshot. `I18nProvider` reads the locale from the path prefix, so
          `/es` renders in Spanish without a flash. English stays at `/` with no `/en` twin. */}
      {LOCALE_IDS.filter((id) => id !== DEFAULT_LOCALE).map((id) => (
        <Route key={id} path={`/${id}`} element={<LandingPage />} />
      ))}
      <Route path="/demo" element={<DemoLayout />}>
        <Route index element={<DemoLibrariesPage />} />
        <Route path="libraries/:id" element={<DemoLibraryEditorPage />} />
        <Route path="practice/:id" element={<DemoPracticePage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Public: the emailed confirmation + reset links are usually opened while logged out. */}
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Unknown URLs render a real 404 page rather than redirecting to `/` — see NotFoundPage. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/libraries" element={<LibrariesPage />} />
          <Route path="/featured" element={<FeaturedPage />} />
          <Route path="/libraries/:id" element={<LibraryEditorPage />} />
          <Route path="/practice/:id" element={<PracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
