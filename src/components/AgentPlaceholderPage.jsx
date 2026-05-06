import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { agentPageClassNames } from './StyleComponent.js';

const { Content } = Layout;
const LIVE_AGENT_ID = '1';
const MORTGAGE_API_URL = 'http://localhost:3000/mortgage';

function AgentPlaceholderPage() {
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

    const loadMortgageData = async () => {
      setIsLoading(true);
      setApiError('');

      try {
        const response = await fetch(MORTGAGE_API_URL, { signal: controller.signal });

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
          setApiError(error.message || 'Unable to load mortgage data.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadMortgageData();

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
            {isLiveAgent ? 'Intelligent Document Processing' : 'Agent Details Page'}
          </Typography.Title>

          <Typography.Paragraph className={agentPageClassNames.copy}>
            {isLiveAgent
              ? 'Live data loaded from the mortgage service for this agent.'
              : 'This is a placeholder page. Agent-level functionality will be added in the next phase.'}
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
                    Loading mortgage API data...
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

export default AgentPlaceholderPage;
