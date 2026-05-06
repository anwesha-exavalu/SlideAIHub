import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { agentPageClassNames } from './StyleComponent.js';

const { Content } = Layout;
const LIVE_AGENT_ID = '1';
const DASHBOARD_API_URL = 'http://localhost:3000/dashboard';

function MetricsPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const isLiveAgent = agentId === LIVE_AGENT_ID;
  const [isLoading, setIsLoading] = useState(isLiveAgent);
  const [apiError, setApiError] = useState('');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    if (!isLiveAgent) {
      return undefined;
    }

    const controller = new AbortController();

    const loadDashboardData = async () => {
      setIsLoading(true);
      setApiError('');

      try {
        const response = await fetch(DASHBOARD_API_URL, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('application/json')
          ? await response.json()
          : await response.text();

        setApiData(payload);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setApiError(error.message || 'Unable to load dashboard data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      controller.abort();
    };
  }, [isLiveAgent]);

  const formattedApiData = useMemo(() => {
    if (apiData === null || apiData === undefined) {
      return '';
    }

    return typeof apiData === 'string' ? apiData : JSON.stringify(apiData, null, 2);
  }, [apiData]);

  return (
    <Layout className={agentPageClassNames.layout}>
      <Content className={agentPageClassNames.content}>
        <Card className={agentPageClassNames.card}>
          <Typography.Title level={3} className={agentPageClassNames.title}>
            Metrics
          </Typography.Title>

          <Typography.Paragraph className={agentPageClassNames.copy}>
            {isLiveAgent
              ? 'Live dashboard metrics loaded for this agent.'
              : 'Metrics screen for this selected agent.'}
          </Typography.Paragraph>

          <Typography.Text className={agentPageClassNames.meta}>
            Selected agent ID: {agentId}
          </Typography.Text>

          {isLiveAgent && (
            <section className={agentPageClassNames.liveSection} aria-live="polite">
              {isLoading && (
                <div className={agentPageClassNames.loaderWrap}>
                  <div className={agentPageClassNames.loaderOrb} />
                  <Typography.Text className={agentPageClassNames.loaderText}>
                    Loading dashboard API data...
                  </Typography.Text>
                </div>
              )}

              {!isLoading && apiError && (
                <Typography.Text className={agentPageClassNames.errorText}>{apiError}</Typography.Text>
              )}

              {!isLoading && !apiError && formattedApiData && (
                <>
                  <Typography.Text className={agentPageClassNames.responseLabel}>
                    API Response
                  </Typography.Text>
                  <div className={agentPageClassNames.responseCard}>
                    <pre className={agentPageClassNames.responsePre}>{formattedApiData}</pre>
                  </div>
                </>
              )}
            </section>
          )}

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
