import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PublicLayout } from './components/layout/PublicLayout';
import AboutPage from './pages/AboutPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import HotspotMapPage from './pages/HotspotMapPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import IncidentManagementPage from './pages/IncidentManagementPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import MyReportsPage from './pages/MyReportsPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPage from './pages/PrivacyPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ReportConfirmationPage from './pages/ReportConfirmationPage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import ResponderManagementPage from './pages/ResponderManagementPage';
import ResponderQueuePage from './pages/ResponderQueuePage';
import SosPage from './pages/SosPage';
import TrackReportPage from './pages/TrackReportPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="report" element={<ReportIncidentPage />} />
        <Route path="report/confirmation" element={<ReportConfirmationPage />} />
        <Route path="track" element={<TrackReportPage />} />
        <Route path="sos" element={<SosPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="dashboard" element={<CitizenDashboardPage />} />
          <Route path="my-reports" element={<MyReportsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="responder" element={<ResponderQueuePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AppShell />}>
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/incidents" element={<IncidentManagementPage />} />
          <Route path="admin/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="admin/responders" element={<ResponderManagementPage />} />
          <Route path="admin/alerts" element={<AlertsPage />} />
          <Route path="admin/hotspots" element={<HotspotMapPage />} />
          <Route path="admin/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
