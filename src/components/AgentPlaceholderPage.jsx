import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { agentPageClassNames } from './StyleComponent.js';

const { Content } = Layout;

function AgentPlaceholderPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();

  return (
    <Layout className={agentPageClassNames.layout}>
      <Content className={agentPageClassNames.content}>
        <Card className={agentPageClassNames.card}>
          <Typography.Title level={3} className={agentPageClassNames.title}>
            Agent Details Page
          </Typography.Title>

          <Typography.Paragraph className={agentPageClassNames.copy}>
            This is a placeholder page. Agent-level functionality will be added in the next phase.
          </Typography.Paragraph>

          <Typography.Text className={agentPageClassNames.meta}>
            Selected agent ID: {agentId}
          </Typography.Text>

          <div className={agentPageClassNames.actions}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}

export default AgentPlaceholderPage;
