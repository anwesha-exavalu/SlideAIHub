import {
  ApartmentOutlined,
  LogoutOutlined,
  SafetyOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Layout, Typography } from 'antd';
import AITable from './AITable.jsx';
import slideLogo from '../assets/ui/slide_logo.svg';
import { layoutClassNames } from './StyleComponent.js';
 
const { Header, Content } = Layout;
 
const getProfileValue = (value) => value || 'Not set';
 
function DashboardLayout({ userProfile, onLogout }) {
  const headerDetails = [
    { label: 'User Name', value: getProfileValue(userProfile.username), icon: UserOutlined },
    { label: 'Dept Name', value: getProfileValue(userProfile.department), icon: ApartmentOutlined },
    { label: 'Role', value: getProfileValue(userProfile.role), icon: SafetyOutlined },
  ];
 
  return (
    <Layout className={layoutClassNames.layout}>
      <Header className={layoutClassNames.header}>
        <div className={layoutClassNames.brandMini}>
          <div className={layoutClassNames.brandMark}>
            <StarFilled className={layoutClassNames.brandMarkIcon} />
          </div>
 
          <div className={layoutClassNames.brandCopy}>
            <Typography.Title level={3} className={layoutClassNames.headerTitle}>
              AI Hub
            </Typography.Title>
            <Typography.Text className={layoutClassNames.headerSubtitle}>Agent command center</Typography.Text>
          </div>
        </div>
 
        <div className={layoutClassNames.headerRight}>
          <div className={layoutClassNames.headerProfile}>
            {headerDetails.map((detail) => {
              const DetailIcon = detail.icon;
 
              return (
                <div key={detail.label} className={layoutClassNames.headerProfileItem}>
                  <span className={layoutClassNames.headerProfileIcon}>
                    <DetailIcon />
                  </span>
                  <div className={layoutClassNames.headerProfileText}>
                    <Typography.Text className={layoutClassNames.headerProfileLabel}>{detail.label}</Typography.Text>
                    <Typography.Text className={layoutClassNames.headerProfileValue} strong>
                      {detail.value}
                    </Typography.Text>
                  </div>
                </div>
              );
            })}
          </div>
 
          <div className={layoutClassNames.headerUtility}>
            <Button
              icon={<LogoutOutlined />}
              onClick={onLogout}
              className={layoutClassNames.headerLogoutButton}
            >
              Logout
            </Button>
 
            <img src={slideLogo} alt="Slide logo" className={layoutClassNames.headerWordmark} />
          </div>
        </div>
      </Header>
 
      <Content className={layoutClassNames.content}>
        <AITable />
      </Content>
    </Layout>
  );
}
 
export default DashboardLayout;