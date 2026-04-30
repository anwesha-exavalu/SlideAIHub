import { Avatar, Badge, Button, Layout, Space, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import AITable from './AITable.jsx';
import slideLogo from '../assets/ui/slide_logo.svg';
import { layoutClassNames } from './StyleComponent.js';

const { Header, Content } = Layout;

function DashboardLayout({ username, onLogout }) {
  return (
    <Layout className={layoutClassNames.layout}>
      <Header className={layoutClassNames.header}>
        <div className={layoutClassNames.brandMini}>
          <img src={slideLogo} alt="AI Hub logo" className={layoutClassNames.miniLogo} />
          <div>
            <Typography.Title level={5} className={layoutClassNames.headerTitle}>
              AI Hub
            </Typography.Title>
            <Typography.Text className={layoutClassNames.headerSubtitle}>Agent command center</Typography.Text>
          </div>
        </div>

        <Space size="large">
          <Badge color="#22C55E" text="Local authentication" />
          <Button icon={<LogoutOutlined />} onClick={onLogout}>
            Logout
          </Button>
        </Space>
      </Header>

      <Content className={layoutClassNames.content}>
        <section className={layoutClassNames.welcomeCard}>
          <Space size="middle" align="center">
            <Avatar size={54} icon={<UserOutlined />} className={layoutClassNames.userAvatar} />
            <div>
              <Typography.Text className={layoutClassNames.welcomeCaption}>Logged in user</Typography.Text>
              <Typography.Title level={3} className={layoutClassNames.welcomeName}>
                {username}
              </Typography.Title>
            </div>
          </Space>
        </section>

        <AITable />
      </Content>
    </Layout>
  );
}

export default DashboardLayout;
