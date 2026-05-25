import { useMemo } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Tag, Typography } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { agentPageClassNames } from './StyleComponent.js';

const { Content } = Layout;

function MetricsPage() {
  const { agentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateAgentName = typeof location.state?.agentName === 'string' ? location.state.agentName : '';
  const selectedAgentId =
    typeof location.state?.sourceAgentId === 'string' || typeof location.state?.sourceAgentId === 'number'
      ? String(location.state.sourceAgentId)
      : agentId;

  const summaryItems = useMemo(() => {
    const items = [];

    if (location.state?.sourceType) {
      items.push({ label: 'Source', value: String(location.state.sourceType) });
    }

    if (location.state?.version) {
      items.push({ label: 'Version', value: String(location.state.version) });
    }

    if (location.state?.status) {
      items.push({ label: 'Status', value: String(location.state.status) });
    }

    if (location.state?.model) {
      items.push({ label: 'Model', value: String(location.state.model) });
    }

    return items;
  }, [location.state]);

  const metricsPayload = useMemo(() => {
    if (!location.state?.metrics) {
      return '';
    }

    return JSON.stringify(location.state.metrics, null, 2);
  }, [location.state]);

  return (
    <Layout className={agentPageClassNames.layout}>
      <Content className={agentPageClassNames.content}>
        <Card className={agentPageClassNames.card}>
          <Typography.Title level={3} className={agentPageClassNames.title}>
            Metrics
          </Typography.Title>

          <Typography.Paragraph className={agentPageClassNames.copy}>
            {stateAgentName ? `Metrics view for ${stateAgentName}.` : 'Metrics view for selected agent.'}
          </Typography.Paragraph>

          <Typography.Text className={agentPageClassNames.meta}>
            Selected agent ID: {selectedAgentId}
          </Typography.Text>

          {summaryItems.length > 0 && (
            <section className={agentPageClassNames.liveSection} aria-live="polite">
              <Typography.Text className={agentPageClassNames.responseLabel}>Agent Snapshot</Typography.Text>
              <div className={agentPageClassNames.responseCard}>
                {summaryItems.map((item) => (
                  <Tag key={item.label} style={{ marginBottom: 8 }}>
                    {item.label}: {item.value}
                  </Tag>
                ))}
              </div>
            </section>
          )}

          <section className={agentPageClassNames.liveSection} aria-live="polite">
            {metricsPayload ? (
              <>
                <Typography.Text className={agentPageClassNames.responseLabel}>Metrics Payload</Typography.Text>
                <div className={agentPageClassNames.responseCard}>
                  <pre className={agentPageClassNames.responsePre}>{metricsPayload}</pre>
                </div>
              </>
            ) : (
              <Typography.Text className={agentPageClassNames.copy}>
                Metrics are not available for this agent in the current API response.
              </Typography.Text>
            )}
          </section>

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

export default MetricsPage;
