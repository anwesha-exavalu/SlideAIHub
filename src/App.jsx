import { useMemo, useState } from 'react';
import { App as AntdApp, ConfigProvider, Form, message } from 'antd';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AgentPlaceholderPage from './components/AgentPlaceholderPage.jsx';
import Login from './components/login.jsx';
import MetricsPage from './components/MetricsPage.jsx';
import DashboardLayout from './components/layout.jsx';

const USER_STORAGE_KEY = 'aihub-user';
const LEGACY_USERNAME_KEY = 'aihub-username';
const EMPTY_USER_PROFILE = {
  username: '',
  department: '',
  role: '',
};

function readStoredUserProfile() {
  if (typeof window === 'undefined') {
    return EMPTY_USER_PROFILE;
  }

  const storedProfile = window.localStorage.getItem(USER_STORAGE_KEY);

  if (storedProfile) {
    try {
      const parsedProfile = JSON.parse(storedProfile);

      return {
        username: parsedProfile.username?.trim?.() ?? '',
        department: parsedProfile.department?.trim?.() ?? '',
        role: parsedProfile.role?.trim?.() ?? '',
      };
    } catch {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  const legacyUsername = window.localStorage.getItem(LEGACY_USERNAME_KEY) ?? '';

  return {
    ...EMPTY_USER_PROFILE,
    username: legacyUsername.trim(),
  };
}

function AppRoutes() {
  const [messageApi, messageContext] = message.useMessage();
  const [loginForm] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(readStoredUserProfile);

  const navigate = useNavigate();
  const isAuthenticated = Boolean(userProfile.username);

  const handleLogin = async (values) => {
    const nextUserProfile = {
      username: values.username.trim(),
      department: values.department.trim(),
      role: values.role.trim(),
    };

    if (!nextUserProfile.username) {
      return;
    }

    setIsLoginLoading(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUserProfile));
      window.localStorage.setItem(LEGACY_USERNAME_KEY, nextUserProfile.username);
    }

    setUserProfile(nextUserProfile);
    setIsLoginLoading(false);
    messageApi.success(`Welcome to AI Hub, ${nextUserProfile.username}`);
    loginForm.resetFields(['password']);
    navigate('/dashboard', { replace: true });
  };

  const handleForgotPassword = async (values) => {
    setIsForgotSubmitting(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 650);
    });

    setIsForgotSubmitting(false);
    setIsForgotModalOpen(false);
    forgotForm.resetFields();
    messageApi.success(`Reset instructions sent to ${values.email}`);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_USERNAME_KEY);
    }

    setUserProfile(EMPTY_USER_PROFILE);
    loginForm.resetFields();
    messageApi.info('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    forgotForm.resetFields();
  };

  const loginScreen = (
    <Login
      loginForm={loginForm}
      forgotForm={forgotForm}
      isLoginLoading={isLoginLoading}
      isForgotSubmitting={isForgotSubmitting}
      isForgotModalOpen={isForgotModalOpen}
      onLogin={handleLogin}
      onForgotPassword={handleForgotPassword}
      onOpenForgotModal={() => setIsForgotModalOpen(true)}
      onCloseForgotModal={closeForgotModal}
    />
  );

  return (
    <>
      {messageContext}

      <Routes>
        <Route path="/" element={loginScreen} />
        <Route path="/login" element={loginScreen} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardLayout userProfile={userProfile} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/agent/:agentId"
          element={isAuthenticated ? <AgentPlaceholderPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/metrics/:agentId"
          element={isAuthenticated ? <MetricsPage /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  const themeConfig = useMemo(
    () => ({
      token: {
        colorPrimary: '#6648DC',
        colorInfo: '#6648DC',
        colorText: '#1F2937',
        colorTextSecondary: '#6B7280',
        colorBgLayout: '#F3F4F6',
        borderRadius: 12,
        fontFamily: "'Poppins', 'Trebuchet MS', sans-serif",
      },
      components: {
        Button: {
          controlHeight: 42,
          fontWeight: 600,
        },
        Input: {
          controlHeight: 42,
        },
        Table: {
          headerBg: '#F3F4F6',
        },
      },
    }),
    [],
  );

  return (
    <ConfigProvider theme={themeConfig}>
      <AntdApp>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
