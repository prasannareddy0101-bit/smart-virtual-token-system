import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import UserPage from './UserPage';
import OfficerDashboard from './OfficerDashboard';
import LiveTokenDisplay from './LiveTokenDisplay';

import Welcome from './Welcome';
import AuthPage from './AuthPage';
import ProfilePage from './ProfilePage';

function ProtectedRoute({ children, allowedRoles }) {
  const isOfficerRoute = allowedRoles.some((role) =>
    ['officer', 'admin'].includes(role)
  );

  const tokenKey = isOfficerRoute ? 'officerToken' : 'userToken';
  const userKey = isOfficerRoute ? 'officerUser' : 'userAccount';

  const token = localStorage.getItem(tokenKey);
  const savedUser = localStorage.getItem(userKey);

  if (!token || !savedUser) {
    return (
      <Navigate
        to={isOfficerRoute ? '/officer-login' : '/login'}
        replace
      />
    );
  }

  let user;

  try {
    user = JSON.parse(savedUser);
  } catch {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);

    return (
      <Navigate
        to={isOfficerRoute ? '/officer-login' : '/login'}
        replace
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route
          path="/login"
          element={<AuthPage mode="login" role="user" />}
        />

        <Route
          path="/register"
          element={<AuthPage mode="register" role="user" />}
        />

        <Route
          path="/officer-login"
          element={<AuthPage mode="login" role="officer" />}
        />

        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-profile"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <ProfilePage role="user" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/officer"
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/officer-profile"
          element={
            <ProtectedRoute allowedRoles={['officer', 'admin']}>
              <ProfilePage role="officer" />
            </ProtectedRoute>
          }
        />

        <Route path="/display" element={<LiveTokenDisplay />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;