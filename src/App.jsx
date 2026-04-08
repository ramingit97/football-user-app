import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import enUS from 'antd/locale/en_US';
import { ThemeProvider, useTheme } from './shared/context/ThemeContext';
import ThemeSwitcher from './shared/components/ThemeSwitcher';
import { useTranslation } from 'react-i18next';

// Landing
import LandingPage from './modules/landing/LandingPage';

// Leaderboard
import LeaderboardPage from './modules/leaderboard/LeaderboardPage';

// Stadiums
import StadiumsPage from './modules/stadiums/StadiumsPage';

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
import ForgotPasswordPage from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './modules/auth/pages/ResetPasswordPage';

const ThemeSwitcherConditional = () => {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return <ThemeSwitcher />;
};

const AppContent = () => {
  const { themeConfig } = useTheme();
  const { i18n } = useTranslation();
  const antdLocale = i18n.language === 'az' ? enUS : ruRU;

  return (
    <ConfigProvider theme={themeConfig} locale={antdLocale}>
      <BrowserRouter>
        <ThemeSwitcherConditional />
        <Routes>
          {/* Landing + Auth routes - without layout */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
            <AppLayout>
              <TeamsDiscoveryPage />
            </AppLayout>
          } />
          <Route path="/teams/:id" element={
            <AppLayout>
              <TeamDetailPage />
            </AppLayout>
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

          {/* Leaderboard */}
          <Route path="/leaderboard" element={
            <AppLayout>
              <LeaderboardPage />
            </AppLayout>
          } />

          {/* Stadiums */}
          <Route path="/stadiums" element={
            <AppLayout>
              <StadiumsPage />
            </AppLayout>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
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
