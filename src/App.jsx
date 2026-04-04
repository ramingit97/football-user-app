import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import { ThemeProvider, useTheme } from './shared/context/ThemeContext';
import ThemeSwitcher from './shared/components/ThemeSwitcher';
import { useTranslation } from 'react-i18next';

// Landing
import LandingPage from './modules/landing/LandingPage';

// Auth Module
import RegistrationPage from './modules/auth/pages/RegistrationPage';

// Profile Module
import ProfilePage from './modules/profile/pages/ProfilePage';
import PublicProfilePage from './modules/profile/pages/PublicProfilePage';

// Game Module
import GameListPage from './modules/game/pages/GameListPage';
import CreateGamePage from './modules/game/pages/CreateGamePage';
import GameDetailPage from './modules/game/pages/GameDetailPage';

// Players Module
import PlayersPage from './modules/players/pages/PlayersPage';

import TeamsDiscoveryPage from './modules/teams/pages/TeamsDiscoveryPage';
import TeamDetailPage from './modules/teams/pages/TeamDetailPage';
import NotificationsPage from './modules/notifications/pages/NotificationsPage';
import ProtectedRoute from './shared/components/ProtectedRoute';

// Shared
import AppLayout from './shared/components/AppLayout';
import LoginPage from './modules/auth/pages/LoginPage';

const AppContent = () => {
  const { themeConfig } = useTheme();
  const { i18n } = useTranslation();
  const antdLocale = i18n.language === 'az' ? enUS : ruRU;

  return (
    <ConfigProvider theme={themeConfig} locale={antdLocale}>
      <BrowserRouter>
        <Routes>
          {/* Landing + Auth routes - without layout */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />

          {/* Game routes - with layout */}
          <Route path="/games" element={
            <AppLayout>
              <GameListPage />
            </AppLayout>
          } />

          <Route path="/games/create" element={
            <AppLayout>
              <CreateGamePage />
            </AppLayout>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teams" element={
            <ProtectedRoute>
              <AppLayout>
                <TeamsDiscoveryPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/teams/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <TeamDetailPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <AppLayout>
                <NotificationsPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/games" replace />} />

          <Route path="/games/:id" element={
            <AppLayout>
              <GameDetailPage />
            </AppLayout>
          } />

          {/* Public Player Profile */}
          <Route path="/player/:id" element={
            <AppLayout>
              <PublicProfilePage />
            </AppLayout>
          } />

          {/* Players List */}
          <Route path="/players" element={
            <AppLayout>
              <PlayersPage />
            </AppLayout>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ThemeSwitcher />
      </BrowserRouter>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
