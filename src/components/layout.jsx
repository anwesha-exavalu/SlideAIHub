import { Button, Layout, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import AITable from './AITable.jsx';
import slideLogo from '../assets/ui/slide_logo.svg';
import { layoutClassNames } from './StyleComponent.js';

const { Header, Content } = Layout;

const getProfileValue = (value) => value || 'Not set';

function DashboardLayout({ userProfile, onLogout }) {
  const headerDetails = [
    { label: 'User Name', value: getProfileValue(userProfile.username) },
    { label: 'Dept Name', value: "AI Engineering" },
    { label: 'Role', value: "Admin" },
  ];

  return (
    <Layout className={layoutClassNames.layout}>
      <Header className={layoutClassNames.header}>
        <div className={layoutClassNames.brandMini}>
          <div>
            <Typography.Title level={5} className={layoutClassNames.headerTitle}>
              AI Hub
            </Typography.Title>
            <Typography.Text className={layoutClassNames.headerSubtitle}>Agent command center</Typography.Text>
          </div>
        </div>

        <div className={layoutClassNames.headerRight}>
          <div className={layoutClassNames.headerActions}>
            <div className={layoutClassNames.headerProfile}>
              {headerDetails.map((detail) => (
                <div key={detail.label} className={layoutClassNames.headerProfileItem}>
                  <Typography.Text className={layoutClassNames.headerProfileLabel}>{detail.label}</Typography.Text>
                  <Typography.Text className={layoutClassNames.headerProfileValue} strong>
                    {detail.value}
                  </Typography.Text>
                </div>
              ))}
            </div>

            <Button icon={<LogoutOutlined />} onClick={onLogout}>
              Logout
            </Button>
          </div>

          <img src={slideLogo} alt="AI Hub logo" className={layoutClassNames.headerLogo} />
        </div>
      </Header>

      <Content className={layoutClassNames.content}>
        <AITable />
      </Content>
    </Layout>
  );
}

export default DashboardLayout;
