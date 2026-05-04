import { Button, Card, Checkbox, Form, Input, Modal, Typography } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import backgroundImage from '../assets/ui/background.avif';
import slideLogo from '../assets/ui/slide_logo.svg';
import { createLoginBackgroundStyle, loginClassNames } from './StyleComponent.js';

function Login({
  loginForm,
  forgotForm,
  isLoginLoading,
  isForgotSubmitting,
  isForgotModalOpen,
  onLogin,
  onForgotPassword,
  onOpenForgotModal,
  onCloseForgotModal,
}) {
  return (
    <div className={loginClassNames.screen} style={createLoginBackgroundStyle(backgroundImage)}>
      <Card className={loginClassNames.card} bordered={false}>
        <div className={loginClassNames.brandSection}>
          <img src={slideLogo} alt="AI Hub logo" className={loginClassNames.brandLogo} />
          <div>
            <Typography.Title level={3} className={loginClassNames.brandTitle}>
              AI Hub Login
            </Typography.Title>
            <Typography.Text className={loginClassNames.brandSubtitle}>
              Access your personalized agent workspace
            </Typography.Text>
          </div>
        </div>

        <Form form={loginForm} layout="vertical" initialValues={{ remember: true }} onFinish={onLogin}>
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

          <div className={loginClassNames.formHelperRow}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Button type="link" className={loginClassNames.forgotLink} onClick={onOpenForgotModal}>
              Forgot password?
            </Button>
          </div>

          <Button
            type="primary"
            block
            htmlType="submit"
            loading={isLoginLoading}
            icon={<LoginOutlined />}
            className={loginClassNames.loginButton}
          >
            Sign In
          </Button>
        </Form>
      </Card>

      <Modal
        title="Reset Password"
        open={isForgotModalOpen}
        onCancel={onCloseForgotModal}
        footer={null}
        destroyOnHidden
      >
        <Typography.Paragraph className={loginClassNames.forgotCopy}>
          Enter your registered email. We will send reset instructions for now as a simple placeholder flow.
        </Typography.Paragraph>

        <Form form={forgotForm} layout="vertical" onFinish={onForgotPassword}>
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

          <div className={loginClassNames.forgotActions}>
            <Button onClick={onCloseForgotModal}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isForgotSubmitting}>
              Send Reset Link
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Login;
