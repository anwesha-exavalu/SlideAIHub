import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Layout, Typography } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { agentPageClassNames } from './StyleComponent.js';

const { Content } = Layout;

function decodeRouteParam(value) {
  if (!value) {
    return '';
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function AgentPlaceholderPage() {
  const { agentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const decodedAgentId = useMemo(() => decodeRouteParam(agentId), [agentId]);
  const stateAgentName = typeof location.state?.agentName === 'string' ? location.state.agentName : '';
  const stateEndpoint =
    typeof location.state?.endpoint === 'string' ? location.state.endpoint.trim() : '';

  const [agentName, setAgentName] = useState(stateAgentName || 'Agent Details Page');
  const [endpointUrl, setEndpointUrl] = useState(stateEndpoint);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    setApiData(null);
    setApiError('');
    setIsLoading(true);
    setAgentName(stateAgentName || 'Agent Details Page');
    setEndpointUrl(stateEndpoint);
  }, [decodedAgentId, stateAgentName, stateEndpoint]);

  useEffect(() => {
    if (!endpointUrl) {
      setIsLoading(false);
      setApiError('Endpoint URL is not configured for this agent.');
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadAgentEndpointData = async () => {
      setIsLoading(true);
      setApiError('');

      try {
        const response = await fetch(endpointUrl, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        const payload = contentType.includes('application/json')
          ? await response.json()
          : await response.text();

        if (isActive) {
          setApiData(payload);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isActive) {
          setApiError(error.message || 'Unable to load endpoint data.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadAgentEndpointData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [endpointUrl]);

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
            {agentName}
          </Typography.Title>

          <Typography.Paragraph className={agentPageClassNames.copy}>
            Live data loaded from the selected agent endpoint.
          </Typography.Paragraph>

          <Typography.Text className={agentPageClassNames.meta}>
            Selected agent ID: {decodedAgentId || agentId}
          </Typography.Text>

          <section className={agentPageClassNames.liveSection} aria-live="polite">
            {isLoading && (
              <div className={agentPageClassNames.loaderWrap}>
                <div className={agentPageClassNames.loaderOrb} />
                <Typography.Text className={agentPageClassNames.loaderText}>
                  Loading agent endpoint data...
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
