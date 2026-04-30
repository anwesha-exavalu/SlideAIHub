import { useMemo, useState } from 'react';
import {
  App as AntdApp,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfigProvider,
  Form,
  Input,
  Layout,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ApiOutlined,
  LockOutlined,
  LoginOutlined,
  LogoutOutlined,
  MailOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import backgroundImage from './assets/ui/background.avif';
import slideLogo from './assets/ui/slide_logo.svg';
import './App.css';

const { Header, Content } = Layout;

const MOCK_AGENT_ROWS = [
  {
    key: '1',
    agentName: 'Claim Sense Assistant',
    category: 'Automation',
    specialization: 'Claims intake triage and document routing',
  },
  {
    key: '2',
    agentName: 'Policy Insight Copilot',
    category: 'Knowledge Search',
    specialization: 'Policy clause lookup and contextual summarization',
  },
  {
    key: '3',
    agentName: 'Fraud Signal Analyst',
    category: 'Analytics',
    specialization: 'Anomaly spotting from historical claims patterns',
  },
  {
    key: '4',
    agentName: 'Regulation Guard',
    category: 'Compliance',
    specialization: 'Jurisdiction checks and rule adherence hints',
  },
  {
    key: '5',
    agentName: 'Broker Communicator',
    category: 'Communication',
    specialization: 'Client-ready draft emails and follow-up prompts',
  },
  {
    key: '6',
    agentName: 'Data Quality Sentinel',
    category: 'Quality Assurance',
    specialization: 'Missing-field detection and consistency checks',
  },
];

const CATEGORY_COLOR_MAP = {
  Automation: 'geekblue',
  Analytics: 'cyan',
  'Knowledge Search': 'purple',
  Compliance: 'magenta',
  Communication: 'gold',
  'Quality Assurance': 'green',
};

function App() {
  const [messageApi, messageContext] = message.useMessage();
  const [loginForm] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.localStorage.getItem('aihub-username') ?? '';
  });

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

  const agentColumns = useMemo(
    () => [
      {
        title: 'Agent Name',
        dataIndex: 'agentName',
        key: 'agentName',
        render: (value) => (
          <Space>
            <Avatar size="small" icon={<ApiOutlined />} className="agent-avatar" />
            <span>{value}</span>
          </Space>
        ),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        render: (value) => <Tag color={CATEGORY_COLOR_MAP[value] ?? 'default'}>{value}</Tag>,
      },
      {
        title: 'Specialization',
        dataIndex: 'specialization',
        key: 'specialization',
      },
    ],
    [],
  );

  const loginBackgroundStyle = {
    backgroundImage: `linear-gradient(130deg, rgba(72, 52, 153, 0.78), rgba(31, 41, 55, 0.65)), url(${backgroundImage})`,
  };

  const handleLogin = async (values) => {
    const safeUsername = values.username.trim();

    if (!safeUsername) {
      return;
    }

    setIsLoginLoading(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('aihub-username', safeUsername);
    }

    setUsername(safeUsername);
    setIsLoginLoading(false);
    messageApi.success(`Welcome to AI Hub, ${safeUsername}`);
    loginForm.resetFields(['password']);
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
      window.localStorage.removeItem('aihub-username');
    }

    setUsername('');
    loginForm.resetFields();
    messageApi.info('Logged out successfully');
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    forgotForm.resetFields();
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <AntdApp>
        {messageContext}

        {username ? (
          <Layout className="dashboard-layout">
            <Header className="dashboard-header">
              <div className="brand-mini">
                <img src={slideLogo} alt="AI Hub logo" className="mini-logo" />
                <div>
                  <Typography.Title level={5} className="header-title">
                    AI Hub
                  </Typography.Title>
                  <Typography.Text className="header-subtitle">Agent command center</Typography.Text>
                </div>
              </div>

              <Space size="large">
                <Badge color="#22C55E" text="Local authentication" />
                <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                  Logout
                </Button>
              </Space>
            </Header>

            <Content className="dashboard-content">
              <section className="welcome-card">
                <Space size="middle" align="center">
                  <Avatar size={54} icon={<UserOutlined />} className="user-avatar" />
                  <div>
                    <Typography.Text className="welcome-caption">Logged in user</Typography.Text>
                    <Typography.Title level={3} className="welcome-name">
                      {username}
                    </Typography.Title>
                  </div>
                </Space>
              </section>

              <Card
                className="table-card"
                bordered={false}
                title={
                  <Space>
                    <RobotOutlined />
                    <span>Agent Directory</span>
                  </Space>
                }
                extra={<Tag color="blue">API integration later</Tag>}
              >
                <Table
                  className="agent-table"
                  columns={agentColumns}
                  dataSource={MOCK_AGENT_ROWS}
                  pagination={{ pageSize: 6, hideOnSinglePage: true }}
                  scroll={{ x: 760 }}
                />
              </Card>
            </Content>
          </Layout>
        ) : (
          <div className="login-screen" style={loginBackgroundStyle}>
            <Card className="login-card" bordered={false}>
              <div className="brand-section">
                <img src={slideLogo} alt="AI Hub logo" className="brand-logo" />
                <div>
                  <Typography.Title level={3} className="brand-title">
                    AI Hub Login
                  </Typography.Title>
                  <Typography.Text className="brand-subtitle">
                    Access your personalized agent workspace
                  </Typography.Text>
                </div>
              </div>

              <Form
                form={loginForm}
                layout="vertical"
                initialValues={{ remember: true }}
                onFinish={handleLogin}
              >
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[
                    { required: true, message: 'Please enter your username' },
                    { whitespace: true, message: 'Username cannot be empty' },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Enter username" autoComplete="username" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <div className="form-helper-row">
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>Remember me</Checkbox>
                  </Form.Item>

                  <Button type="link" className="forgot-link" onClick={() => setIsForgotModalOpen(true)}>
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="primary"
                  block
                  htmlType="submit"
                  loading={isLoginLoading}
                  icon={<LoginOutlined />}
                  className="login-button"
                >
                  Sign In
                </Button>
              </Form>
            </Card>

            <Modal
              title="Reset Password"
              open={isForgotModalOpen}
              onCancel={closeForgotModal}
              footer={null}
              destroyOnHidden
            >
              <Typography.Paragraph className="forgot-copy">
                Enter your registered email. We will send reset instructions for now as a simple placeholder flow.
              </Typography.Paragraph>

              <Form form={forgotForm} layout="vertical" onFinish={handleForgotPassword}>
                <Form.Item
                  label="Registered Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter email address' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="name@company.com" autoComplete="email" />
                </Form.Item>

                <div className="forgot-actions">
                  <Button onClick={closeForgotModal}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={isForgotSubmitting}>
                    Send Reset Link
                  </Button>
                </div>
              </Form>
            </Modal>
          </div>
        )}
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
