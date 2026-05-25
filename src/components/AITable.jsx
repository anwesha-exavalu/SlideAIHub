import { useEffect, useMemo, useState } from 'react';
import { Avatar, Card, Input, List, Space, Tag, Tooltip, Typography } from 'antd';
import {
  ApiOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ClusterOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  LinkOutlined,
  MessageOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { tableClassNames } from './StyleComponent.js';
import defaultIcon from '../assets/ui/agent-icons/default.svg';

const SOURCE_TYPES = {
  FOUNDRY: 'Foundry Agent',
  CUSTOM: 'Custom Agent',
};

const SEARCHABLE_FIELDS = [
  'agentName',
  'id',
  'ownerName',
  'contactEmail',
  'contactPhone',
  'category',
  'specialization',
  'description',
  'department',
  'model',
  'status',
  'dataSources',
  'responseSla',
  'region',
  'subscription',
  'resourcegroup',
];

const STATUS_COLOR_MAP = {
  active: 'success',
  pilot: 'processing',
  monitored: 'warning',
  ready: 'blue',
};

const CATEGORY_ICON_MAP = {
  Automation: ToolOutlined,
  'Knowledge Search': LinkOutlined,
  Analytics: LineChartOutlined,
  Compliance: TeamOutlined,
  Communication: MessageOutlined,
  'Quality Assurance': SafetyCertificateOutlined,
};

const FOUNDRY_AGENTS_API_URL = (
  import.meta.env.VITE_FOUNDRY_AGENTS_API_URL ?? 'http://localhost:8000/api/agents'
).trim();
const CUSTOM_AGENTS_API_URL = (
  import.meta.env.VITE_CUSTOM_AGENTS_API_URL ?? 'http://127.0.0.1:8010/dashboard'
).trim();
const DATABRICKS_NATIVE_AGENT_NAME = 'databricks-native-agent';
const DATABRICKS_NATIVE_AGENT_URL =
  'https://agent-openai-agents-sdk-7474657028758184.aws.databricksapps.com';
const UPPERCASE_NAME_TOKENS = new Set(['idp', 'ai', 'cu']);
const DASHBOARD_CACHE_KEY = '__AIHUB_DASHBOARD_CACHE__';

function textOrNull(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text ? text : null;
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' ? value : {};
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = textOrNull(value);
    if (text) {
      return text;
    }
  }

  return null;
}

function normalizeDisplayValue(value) {
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => textOrNull(item))
      .filter(Boolean)
      .join(', ');

    return joined || null;
  }

  if (value && typeof value === 'object') {
    return null;
  }

  return textOrNull(value);
}

function normalizeVersion(versionValue) {
  const rawVersion = textOrNull(versionValue);

  if (!rawVersion) {
    return null;
  }

  return rawVersion.toLowerCase().startsWith('v') ? rawVersion : `v${rawVersion}`;
}

function normalizeStatus(statusValue) {
  const rawStatus = textOrNull(statusValue);

  if (!rawStatus) {
    return null;
  }

  return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
}

function formatUnixTimestamp(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  const epochMs = parsed > 9999999999 ? parsed : parsed * 1000;
  const date = new Date(epochMs);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function normalizeDateValue(value) {
  return formatUnixTimestamp(value) ?? textOrNull(value);
}

function parseResourceFields(resourceId) {
  const rawId = typeof resourceId === 'string' ? resourceId : '';

  if (!rawId) {
    return { subscriptionId: null, resourceGroup: null };
  }

  const subscriptionMatch = rawId.match(/\/subscriptions\/([^/]+)/i);
  const resourceGroupMatch = rawId.match(/\/resourceGroups\/([^/]+)/i);

  return {
    subscriptionId: subscriptionMatch?.[1] ?? null,
    resourceGroup: resourceGroupMatch?.[1] ?? null,
  };
}

function resolveSubscriptionFields(record) {
  const directSubscription = textOrNull(record?.subscription);
  const directResourceGroup = textOrNull(record?.resourcegroup);

  if (directSubscription || directResourceGroup) {
    return {
      subscriptionId: directSubscription,
      resourceGroup: directResourceGroup,
    };
  }

  const candidates = [];

  if (typeof record?.id === 'string') {
    candidates.push(record.id);
  }

  if (typeof record?.api_id === 'string') {
    candidates.push(record.api_id);
  }

  if (Array.isArray(record?.operations?.value)) {
    for (const operation of record.operations.value) {
      if (typeof operation?.id === 'string') {
        candidates.push(operation.id);
      }
    }
  }

  for (const candidate of candidates) {
    const parsed = parseResourceFields(candidate);
    if (parsed.subscriptionId || parsed.resourceGroup) {
      return parsed;
    }
  }

  return {
    subscriptionId: null,
    resourceGroup: null,
  };
}

function formatAgentName(nameValue) {
  const rawName = textOrNull(nameValue);

  if (!rawName) {
    return 'Unknown Agent';
  }

  const spacedName = rawName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .trim();

  return spacedName
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const tokenLower = token.toLowerCase();

      if (UPPERCASE_NAME_TOKENS.has(tokenLower)) {
        return tokenLower.toUpperCase();
      }

      if (/^\d+$/.test(token)) {
        return token;
      }

      return tokenLower.charAt(0).toUpperCase() + tokenLower.slice(1);
    })
    .join(' ');
}

function getOwnerName(ownerValue, ownerName) {
  if (typeof ownerValue === 'string') {
    return textOrNull(ownerValue);
  }

  if (ownerValue && typeof ownerValue === 'object') {
    return textOrNull(ownerValue.name) ?? normalizeDisplayValue(ownerName);
  }

  return normalizeDisplayValue(ownerName);
}

function getOwnerEmail(ownerValue, contactEmail) {
  if (ownerValue && typeof ownerValue === 'object') {
    return textOrNull(ownerValue.email) ?? normalizeDisplayValue(contactEmail);
  }

  return normalizeDisplayValue(contactEmail);
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error ?? 'Unknown error');
}

function resolveIconUrl(iconCandidate) {
  const rawIcon = textOrNull(iconCandidate);

  if (!rawIcon) {
    return null;
  }

  if (/^https?:\/\//i.test(rawIcon) || rawIcon.startsWith('/')) {
    return rawIcon;
  }

  return null;
}

function extractCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.agents)) {
    return payload.agents;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.value)) {
    return payload.value;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    ('agent_name' in payload || 'api_id' in payload || 'gateway_path' in payload)
  ) {
    return [payload];
  }

  return [];
}

function isCustomAgentVisible(agent) {
  const rawIsAgent = agent?.is_agent;

  if (rawIsAgent === false) {
    return false;
  }

  if (typeof rawIsAgent === 'string' && rawIsAgent.trim().toLowerCase() === 'false') {
    return false;
  }

  return true;
}

function mapFoundryAgent(agent, index) {
  const latest = objectOrEmpty(agent?.versions?.latest);
  const metadata = objectOrEmpty(latest.metadata);
  const definition = objectOrEmpty(latest.definition);
  const foundryId = pickFirstText(agent.id, agent.name, `foundry-agent-${index + 1}`);
  const { subscriptionId, resourceGroup } = resolveSubscriptionFields(agent);

  return {
    id: foundryId,
    routeId: encodeURIComponent(foundryId),
    sourceType: SOURCE_TYPES.FOUNDRY,
    agentName: formatAgentName(pickFirstText(agent.name, agent.id, foundryId)),
    version: normalizeVersion(latest.version ?? agent.version),
    category: normalizeDisplayValue(agent.category),
    specialization: normalizeDisplayValue(agent.specialization),
    ownerName: getOwnerName(agent.owner, agent.ownerName),
    creationDate: normalizeDateValue(
      latest.created_at ?? agent.creationDate ?? agent.createdAt ?? agent.createdOn,
    ),
    lastUpdated: normalizeDateValue(
      metadata.modified_at ?? agent.lastUpdated ?? agent.updatedAt ?? agent.updatedOn,
    ),
    department: normalizeDisplayValue(agent.department),
    status: normalizeStatus(latest.status ?? agent.status),
    model: normalizeDisplayValue(definition.model ?? agent.model),
    dataSources: normalizeDisplayValue(agent.dataSources),
    responseSla: normalizeDisplayValue(agent.responseSla),
    region: normalizeDisplayValue(agent.region),
    contactEmail: getOwnerEmail(agent.owner, agent.contactEmail),
    contactPhone: normalizeDisplayValue(agent.contactPhone),
    description:
      normalizeDisplayValue(latest.description) ??
      normalizeDisplayValue(metadata.description) ??
      normalizeDisplayValue(agent.description),
    subscription: textOrNull(agent.subscription) ?? textOrNull(subscriptionId),
    resourcegroup: textOrNull(agent.resourcegroup) ?? textOrNull(resourceGroup),
    endpoint: normalizeDisplayValue(agent.endpoint),
    iconUrl: resolveIconUrl(metadata.logo) ?? resolveIconUrl(agent.iconUrl),
    metrics: agent.metrics ?? latest.metrics ?? null,
  };
}

function mapCustomAgent(agent, index) {
  const customId = pickFirstText(
    agent?.agent_id,
    agent?.api_id,
    agent?.agent_name,
    agent?.gateway_path,
    `custom-agent-${index + 1}`,
  );
  const { subscriptionId, resourceGroup } = resolveSubscriptionFields(agent);

  return {
    id: customId,
    routeId: encodeURIComponent(customId),
    sourceType: SOURCE_TYPES.CUSTOM,
    agentName: formatAgentName(pickFirstText(agent?.agent_name, agent?.api_id, customId)),
    version: normalizeVersion(agent?.version),
    category: normalizeDisplayValue(agent?.agent_type),
    specialization: normalizeDisplayValue(agent?.specialization),
    ownerName: getOwnerName(agent?.owner, agent?.ownerName),
    creationDate: normalizeDateValue(agent?.creationDate ?? agent?.created_at ?? agent?.createdAt),
    lastUpdated: normalizeDateValue(agent?.lastUpdated ?? agent?.updated_at ?? agent?.updatedAt),
    department: normalizeDisplayValue(agent?.department),
    status: normalizeStatus(agent?.status),
    model: normalizeDisplayValue(agent?.model),
    gateway_path: normalizeDateValue(agent?.gateway_path),
    dataSources: normalizeDisplayValue(agent?.dataSources),
    responseSla: normalizeDisplayValue(agent?.responseSla),
    region: normalizeDisplayValue(agent?.region),
    contactEmail: getOwnerEmail(agent?.owner, agent?.contactEmail),
    contactPhone: normalizeDisplayValue(agent?.contactPhone),
    description: normalizeDisplayValue(agent?.description),
    subscription: textOrNull(agent?.subscription) ?? textOrNull(subscriptionId),
    resourcegroup: textOrNull(agent?.resourcegroup) ?? textOrNull(resourceGroup),
    endpoint: normalizeDisplayValue(agent?.service_url ?? agent?.endpoint),
    iconUrl: resolveIconUrl(agent?.iconUrl),
    metrics: agent?.metrics ?? null,
  };
}

function mapAgentsBySource(payload, sourceType) {
  const rawAgents = extractCollection(payload);

  if (sourceType === SOURCE_TYPES.FOUNDRY) {
    return rawAgents.map((agent, index) => mapFoundryAgent(agent, index));
  }

  return rawAgents.filter(isCustomAgentVisible).map((agent, index) => mapCustomAgent(agent, index));
}

function sortRowsByName(rows) {
  return rows
    .slice()
    .sort((left, right) => String(left.agentName ?? '').localeCompare(String(right.agentName ?? '')));
}

function withWidgetKeys(rows, prefix) {
  return rows.map((row, index) => {
    const stableId = pickFirstText(row.id, `${prefix}-agent-${index + 1}`);

    return {
      ...row,
      key: `${prefix}-${index + 1}-${stableId}`,
      metricRouteId: encodeURIComponent(stableId),
      routeId: row.routeId ?? encodeURIComponent(stableId),
    };
  });
}

function readRuntimeCache() {
  if (typeof window === 'undefined') {
    return null;
  }

  const cache = window[DASHBOARD_CACHE_KEY];

  if (!cache || typeof cache !== 'object') {
    return null;
  }

  if (!Array.isArray(cache.foundryRows) || !Array.isArray(cache.customRows)) {
    return null;
  }

  return {
    foundryRows: cache.foundryRows,
    customRows: cache.customRows,
    endpointWarnings: Array.isArray(cache.endpointWarnings) ? cache.endpointWarnings : [],
  };
}

function writeRuntimeCache(cache) {
  if (typeof window === 'undefined') {
    return;
  }

  window[DASHBOARD_CACHE_KEY] = cache;
}

const runtimeCache = readRuntimeCache();
let cachedAgentsBySource = runtimeCache
  ? {
      foundryRows: runtimeCache.foundryRows,
      customRows: runtimeCache.customRows,
    }
  : null;
let cachedEndpointWarnings = runtimeCache?.endpointWarnings ?? [];
let agentRowsRequestPromise = null;

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function requestFoundryAgents() {
  const payload = await fetchJson(FOUNDRY_AGENTS_API_URL);
  return withWidgetKeys(sortRowsByName(mapAgentsBySource(payload, SOURCE_TYPES.FOUNDRY)), 'foundry');
}

async function requestCustomAgents() {
  const payload = await fetchJson(CUSTOM_AGENTS_API_URL);
  return withWidgetKeys(sortRowsByName(mapAgentsBySource(payload, SOURCE_TYPES.CUSTOM)), 'custom');
}

async function requestAgentsBySource() {
  const [foundryResult, customResult] = await Promise.allSettled([
    requestFoundryAgents(),
    requestCustomAgents(),
  ]);

  const endpointWarnings = [];

  const foundryRows =
    foundryResult.status === 'fulfilled'
      ? foundryResult.value
      : (() => {
          endpointWarnings.push(`Foundry API error: ${getErrorMessage(foundryResult.reason)}`);
          return [];
        })();

  const customRows =
    customResult.status === 'fulfilled'
      ? customResult.value
      : (() => {
          endpointWarnings.push(`Custom API error: ${getErrorMessage(customResult.reason)}`);
          return [];
        })();

  if (foundryRows.length === 0 && customRows.length === 0) {
    throw new Error(endpointWarnings.join(' | ') || 'Unable to load agent data.');
  }

  return { foundryRows, customRows, endpointWarnings };
}

function loadAgentsOnce() {
  if (cachedAgentsBySource) {
    return Promise.resolve({
      ...cachedAgentsBySource,
      endpointWarnings: cachedEndpointWarnings,
    });
  }

  if (!agentRowsRequestPromise) {
    agentRowsRequestPromise = requestAgentsBySource()
      .then((result) => {
        cachedAgentsBySource = {
          foundryRows: result.foundryRows,
          customRows: result.customRows,
        };
        cachedEndpointWarnings = result.endpointWarnings;

        writeRuntimeCache({
          foundryRows: result.foundryRows,
          customRows: result.customRows,
          endpointWarnings: result.endpointWarnings,
        });

        return result;
      })
      .finally(() => {
        agentRowsRequestPromise = null;
      });
  }

  return agentRowsRequestPromise;
}

function resolveAgentAvatar(agentName, iconUrl) {
  const imageSource = iconUrl || defaultIcon;

  return (
    <Avatar
      size={80}
      src={<img src={imageSource} alt={`${agentName} icon`} />}
      className={tableClassNames.agentAvatar}
    />
  );
}

function matchesSearch(record, normalizedSearch) {
  if (!normalizedSearch) {
    return true;
  }

  return SEARCHABLE_FIELDS.some((field) =>
    String(record[field] ?? '').toLowerCase().includes(normalizedSearch),
  );
}

function AITable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundryRows, setFoundryRows] = useState(() => cachedAgentsBySource?.foundryRows ?? []);
  const [customRows, setCustomRows] = useState(() => cachedAgentsBySource?.customRows ?? []);
  const [isLoading, setIsLoading] = useState(() => !cachedAgentsBySource);
  const [loadError, setLoadError] = useState('');
  const [endpointWarnings, setEndpointWarnings] = useState(() => cachedEndpointWarnings);

  useEffect(() => {
    let isActive = true;

    if (cachedAgentsBySource) {
      setIsLoading(false);
      setEndpointWarnings(cachedEndpointWarnings);
      return undefined;
    }

    setIsLoading(true);
    setLoadError('');
    setEndpointWarnings([]);

    loadAgentsOnce()
      .then((result) => {
        if (!isActive) {
          return;
        }

        setFoundryRows(result.foundryRows);
        setCustomRows(result.customRows);
        setEndpointWarnings(result.endpointWarnings);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setLoadError(error?.message || 'Unable to load agent data.');
        setFoundryRows([]);
        setCustomRows([]);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredFoundryRows = useMemo(
    () => foundryRows.filter((record) => matchesSearch(record, normalizedSearch)),
    [foundryRows, normalizedSearch],
  );
  const filteredCustomRows = useMemo(
    () => customRows.filter((record) => matchesSearch(record, normalizedSearch)),
    [customRows, normalizedSearch],
  );

  const totalAgentCount = foundryRows.length + customRows.length;

  const renderAgentItem = (record) => {
    const CategoryIcon = CATEGORY_ICON_MAP[record.category] ?? ToolOutlined;
    const identifierLabel = record.sourceType === SOURCE_TYPES.CUSTOM ? 'agentId' : 'id';
    const identifierValue = textOrNull(record.id);
    const identifierText = identifierValue ? `${identifierLabel}: ${identifierValue}` : null;
    const normalizedAgentName = String(record.agentName ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    const shouldOpenDatabricksNativeAgent =
      record.sourceType === SOURCE_TYPES.CUSTOM &&
      normalizedAgentName === DATABRICKS_NATIVE_AGENT_NAME;
    const profileItems = [record.ownerName, identifierText, record.contactEmail, record.contactPhone].filter(
      Boolean,
    );
    const descriptionText = record.specialization ?? record.description;

    return (
      <List.Item>
        <Card className={tableClassNames.agentCard} bordered={false}>
          <div className={tableClassNames.agentCardHeader}>
            <div className={tableClassNames.agentCardIdentity}>
              {resolveAgentAvatar(record.agentName, record.iconUrl)}

              <div className={tableClassNames.agentCardCopy}>
                <div className={tableClassNames.agentCardTitleRow}>
                  {shouldOpenDatabricksNativeAgent ? (
                    <a
                      href={DATABRICKS_NATIVE_AGENT_URL}
                      target="_blank"
                      rel="noreferrer"
                      className={tableClassNames.agentNameButton}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className={tableClassNames.agentNameText}>{record.agentName}</span>
                    </a>
                  ) : (
                    <Link
                      to={`/agent/${record.routeId ?? record.key}`}
                      state={{
                        agentName: record.agentName,
                        endpoint: record.endpoint,
                        sourceAgentId: record.id ?? record.key,
                      }}
                      className={tableClassNames.agentNameButton}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className={tableClassNames.agentNameText}>{record.agentName}</span>
                    </Link>
                  )}

                  {record.version && (
                    <Tag className={tableClassNames.agentVersionInlineTag}>
                      <ApiOutlined />
                      <span>{record.version}</span>
                    </Tag>
                  )}
                </div>

                {profileItems.length > 0 && (
                  <Typography.Text className={tableClassNames.agentCardContact}>
                    {profileItems.map((item, index) => (
                      <span key={`${record.key}-${index}`}>
                        {index > 0 && <span className={tableClassNames.agentCardContactDivider}>|</span>}
                        <span>{item}</span>
                      </span>
                    ))}
                  </Typography.Text>
                )}
              </div>
            </div>

            <Tooltip title="Metrics">
              <Link
                to={`/metrics/${record.metricRouteId ?? record.key}`}
                state={{
                  agentName: record.agentName,
                  sourceType: record.sourceType,
                  sourceAgentId: record.id ?? record.key,
                  metrics: record.metrics,
                  status: record.status,
                  model: record.model,
                  version: record.version,
                }}
                className={tableClassNames.metricsViewButton}
                onClick={(event) => event.stopPropagation()}
                aria-label={`View metrics for ${record.agentName}`}
              >
                <EyeOutlined />
              </Link>
            </Tooltip>
          </div>

          <div className={tableClassNames.agentCardBadges}>
            {record.category && (
              <Tag className={tableClassNames.categoryTag}>
                <CategoryIcon className={tableClassNames.categoryIcon} />
                <span>{record.category}</span>
              </Tag>
            )}
            {record.status && (
              <Tag color={STATUS_COLOR_MAP[record.status.toLowerCase()] ?? 'default'}>{record.status}</Tag>
            )}
            {record.model && <Tag>{record.model}</Tag>}
            {record.gateway_path && <Tag>{record.gateway_path}</Tag>}
            {record.responseSla && <Tag>SLA: {record.responseSla}</Tag>}
            {record.region && <Tag>{record.region}</Tag>}
            {record.creationDate && (
              <Tag className={tableClassNames.agentDateTag}>
                <CalendarOutlined />
                <span>{record.creationDate}</span>
              </Tag>
            )}
            {record.lastUpdated && (
              <Tag className={tableClassNames.agentDateTag}>
                <CalendarOutlined />
                <span>Last Updated: {record.lastUpdated}</span>
              </Tag>
            )}
          </div>

          <div className={tableClassNames.agentCardDescriptionSection}>
            {record.subscription && (
              <Tag className={`${tableClassNames.agentDepartmentTag} agent-department-tag-long`}>
                <span>Subscription: {record.subscription}</span>
              </Tag>
            )}
            {record.resourcegroup && (
              <Tag className={`${tableClassNames.agentDepartmentTag} agent-department-tag-long`}>
                <span>Resource Group: {record.resourcegroup}</span>
              </Tag>
            )}
            {record.department && (
              <Tag className={tableClassNames.agentDepartmentTag}>
                <span>Dept: {record.department}</span>
              </Tag>
            )}
            {record.dataSources && (
              <Tag className={tableClassNames.agentDepartmentTag}>
                <span>Data: {record.dataSources}</span>
              </Tag>
            )}

            {descriptionText && (
              <>
                <div className={tableClassNames.agentCardDescriptionHeader}>
                  <div className={tableClassNames.agentCardDescriptionHeadingWrap}>
                    <Typography.Text className={tableClassNames.agentCardDescriptionLabel}>
                      Description
                    </Typography.Text>
                    {record.description && (
                      <Tooltip title={record.description} placement="bottomRight">
                        <button
                          type="button"
                          className={tableClassNames.agentInfoButton}
                          aria-label={`View brief description for ${record.agentName}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <InfoCircleOutlined />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <Typography.Text className={tableClassNames.agentCardDescription}>
                  {descriptionText}
                </Typography.Text>
              </>
            )}
          </div>
        </Card>
      </List.Item>
    );
  };

  const renderAgentWidget = ({ title, count, rows, icon }) => (
    <Card className={tableClassNames.widgetCard} bordered={false}>
      <div className={tableClassNames.widgetHeader}>
        <div className={tableClassNames.widgetTitleWrap}>
          <Space align="center">
            {icon}
            <Typography.Title level={4} className={tableClassNames.widgetTitle}>
              {title}
            </Typography.Title>
          </Space>
        </div>

        <Space size={8} wrap>
          <Tag color="blue" className={tableClassNames.widgetMeta}>
            {count} Agents
          </Tag>
        </Space>
      </div>

      {rows.length === 0 ? (
        <Typography.Text className={tableClassNames.widgetEmpty}>
          No agents available for this source.
        </Typography.Text>
      ) : (
        <List
          className={tableClassNames.agentList}
          dataSource={rows}
          pagination={{ pageSize: 6, hideOnSinglePage: true }}
          grid={{ gutter: 14, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 3 }}
          renderItem={renderAgentItem}
        />
      )}
    </Card>
  );

  return (
    <Card
      className={tableClassNames.card}
      bordered={false}
      title={
        <Space>
          <RobotOutlined />
          <span>Agent Directory</span>
          <Tag color="processing">{totalAgentCount} Total</Tag>
        </Space>
      }
      extra={
        <Input
          allowClear
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className={tableClassNames.searchInput}
          prefix={<SearchOutlined className={tableClassNames.searchInputIcon} />}
          placeholder="Search by name, owner, email, category, department..."
          aria-label="Search agent cards"
        />
      }
    >
      {isLoading && (
        <div className={tableClassNames.loaderContainer}>
          <div className={tableClassNames.loaderWrap}>
            <div className={tableClassNames.loaderOrb} />
            <Typography.Text className={tableClassNames.loaderText}>
              Loading agent data...
            </Typography.Text>
          </div>
        </div>
      )}

      {!isLoading && loadError && (
        <Typography.Text className={tableClassNames.loaderErrorText}>{loadError}</Typography.Text>
      )}

      {!isLoading && !loadError && endpointWarnings.length > 0 && (
        <Typography.Text className={tableClassNames.loaderErrorText}>
          {endpointWarnings.join(' | ')}
        </Typography.Text>
      )}

      {!isLoading && !loadError && (
        <div className={tableClassNames.widgetGrid}>
          {renderAgentWidget({
            title: 'Foundry Agents',
            count: foundryRows.length,
            rows: filteredFoundryRows,
            icon: <ClusterOutlined />,
          })}

          {renderAgentWidget({
            title: 'Custom Agents',
            count: customRows.length,
            rows: filteredCustomRows,
            icon: <AppstoreOutlined />,
          })}
        </div>
      )}
    </Card>
  );
}

export default AITable;
