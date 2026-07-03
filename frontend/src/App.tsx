import { Navigate, Route, Routes } from 'react-router-dom';
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
import LibrariesPage from './pages/LibrariesPage';
import LibraryEditorPage from './pages/LibraryEditorPage';
import PracticePage from './pages/PracticePage';
import StatsPage from './pages/StatsPage';
import AccountPage from './pages/AccountPage';
import BillingSuccessPage from './pages/BillingSuccessPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<DemoLayout />}>
        <Route index element={<DemoLibrariesPage />} />
        <Route path="libraries/:id" element={<DemoLibraryEditorPage />} />
        <Route path="practice/:id" element={<DemoPracticePage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/libraries" element={<LibrariesPage />} />
          <Route path="/libraries/:id" element={<LibraryEditorPage />} />
          <Route path="/practice/:id" element={<PracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
