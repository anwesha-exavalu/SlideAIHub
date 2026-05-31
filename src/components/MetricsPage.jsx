import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Input,
  InputNumber,
  Layout,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { metricsPageClassNames } from './StyleComponent.js';

const { Content } = Layout;

const TOKENS_BY_AGENT_API_URL = (
  import.meta.env.VITE_FOUNDRY_TOKENS_BY_AGENT_API_URL ??
  'http://localhost:8000/api/foundry-logs/raw/tokens-by-agent'
).trim();
const CU_USAGE_METRICS_API_URL = (
  import.meta.env.VITE_FOUNDRY_CU_USAGE_METRICS_API_URL ??
  'http://localhost:8000/api/foundry-logs/raw/cu-usage-metrics'
).trim();
const FOUNDRY_AGENTS_API_URL = (
  import.meta.env.VITE_FOUNDRY_AGENTS_API_URL ?? 'http://localhost:8000/api/agents'
).trim();
const CU_BUSINESS_METRICS_AGENT_ID = 'cu-openapi-agent-v3:5';
const DASHBOARD_CACHE_KEY = '__AIHUB_DASHBOARD_CACHE__';
const DEFAULT_METRIC_SET = [
  'dependencies/custom/gen_ai.usage.input_tokens_sum',
  'dependencies/custom/gen_ai.usage.output_tokens_sum',
  'dependencies/custom/gen_ai.usage.cached_tokens_sum',
];
const DEFAULT_SOURCE = 'log_analytics';
const DEFAULT_SPLIT_BY = 'gen_ai.agent.id';
const MAX_HOURS = 8760;
const TIME_WINDOW_OPTIONS = [
  { label: 'Last 1 hour', value: 1 },
  { label: 'Last 6 hours', value: 6 },
  { label: 'Last 12 hours', value: 12 },
  { label: 'Last 24 hours', value: 24 },
  { label: 'Last 48 hours', value: 48 },
  { label: 'Last 72 hours', value: 72 },
  { label: 'Last 7 days', value: 168 },
  { label: 'Last 14 days', value: 336 },
  { label: 'Last 30 days', value: 720 },
  { label: 'Last 60 days', value: 1440 },
  { label: 'Last 90 days', value: 2160 },
  { label: 'Last 180 days', value: 4320 },
  { label: 'Last 365 days (max)', value: MAX_HOURS },
];
const INTERVAL_OPTIONS = [
  { label: '5 minutes (PT5M)', value: 'PT5M' },
  { label: '15 minutes (PT15M)', value: 'PT15M' },
  { label: '30 minutes (PT30M)', value: 'PT30M' },
  { label: '1 hour (PT1H)', value: 'PT1H' },
  { label: '6 hours (PT6H)', value: 'PT6H' },
  { label: '1 day (P1D)', value: 'P1D' },
];
const TIMESTAMP_MODE_OPTIONS = [
  { label: 'Bucketed', value: 'bucketed' },
  { label: 'Exact', value: 'exact' },
];
const METRIC_OPTIONS = [
  {
    label: 'Input Tokens',
    value: 'dependencies/custom/gen_ai.usage.input_tokens_sum',
  },
  {
    label: 'Output Tokens',
    value: 'dependencies/custom/gen_ai.usage.output_tokens_sum',
  },
  {
    label: 'Cached Tokens',
    value: 'dependencies/custom/gen_ai.usage.cached_tokens_sum',
  },
];
const MAX_CHART_ROWS = 60;

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

function textOrEmpty(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
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

  return [];
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeIsoInput(value) {
  const rawValue = textOrEmpty(value);

  if (!rawValue) {
    return null;
  }

  const parsedDate = new Date(rawValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function formatAgentIdForLabel(agentIdValue) {
  const rawId = textOrEmpty(agentIdValue);

  if (!rawId) {
    return '';
  }

  const baseName = rawId.split(':')[0] ?? rawId;
  const humanName = baseName
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

  return `${humanName} (${rawId})`;
}

function pickAgentIdCandidates(entry) {
  const candidates = [
    entry?.id,
    entry?.agent_id,
    entry?.agentId,
    entry?.versions?.latest?.id,
    entry?.latest?.id,
    entry?.latest_version?.id,
    entry?.latestVersion?.id,
  ]
    .map((value) => textOrEmpty(value))
    .filter(Boolean);

  const baseId = textOrEmpty(entry?.id);
  const versionValue = textOrEmpty(entry?.version);

  if (baseId && versionValue && !baseId.includes(':')) {
    candidates.push(`${baseId}:${versionValue}`);
  }

  return candidates;
}

function parseVersionSuffix(agentIdValue) {
  const rawId = textOrEmpty(agentIdValue);
  const match = rawId.match(/:(\d+)$/);

  if (!match) {
    return Number.NEGATIVE_INFINITY;
  }

  return Number(match[1]);
}

function resolveVersionedAgentId(agentIdValue, options) {
  const requestedId = textOrEmpty(agentIdValue);

  if (!requestedId) {
    return '';
  }

  const normalizedOptions = Array.from(new Set((options ?? []).map((value) => textOrEmpty(value)).filter(Boolean)));

  if (normalizedOptions.includes(requestedId)) {
    return requestedId;
  }

  if (requestedId.includes(':')) {
    return requestedId;
  }

  const prefixMatches = normalizedOptions
    .filter((value) => value.startsWith(`${requestedId}:`))
    .sort((left, right) => parseVersionSuffix(right) - parseVersionSuffix(left));

  if (prefixMatches.length > 0) {
    return prefixMatches[0];
  }

  return requestedId;
}

function formatTimestamp(value) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return String(value ?? 'Unknown');
  }

  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractRowsFromPayload(payload) {
  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.result)) {
    return payload.result;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function normalizeMetricRows(payload) {
  return extractRowsFromPayload(payload).map((row, index) => {
    const timestamp =
      textOrEmpty(row?.timestamp) ||
      textOrEmpty(row?.ts) ||
      textOrEmpty(row?.TimeGenerated) ||
      textOrEmpty(row?.time_bin) ||
      textOrEmpty(row?.time) ||
      `row-${index + 1}`;
    const inputTokens = numberOrZero(
      row?.input_tokens ?? row?.inputTokens ?? row?.['dependencies/custom/gen_ai.usage.input_tokens_sum'],
    );
    const outputTokens = numberOrZero(
      row?.output_tokens ?? row?.outputTokens ?? row?.['dependencies/custom/gen_ai.usage.output_tokens_sum'],
    );
    const cachedTokens = numberOrZero(
      row?.cached_tokens ?? row?.cachedTokens ?? row?.['dependencies/custom/gen_ai.usage.cached_tokens_sum'],
    );

    return {
      key: `metric-row-${index}-${timestamp}`,
      timestamp,
      agentId: textOrEmpty(row?.agent_id ?? row?.agentId),
      agentName: textOrEmpty(row?.agent_name ?? row?.agentName),
      model: textOrEmpty(row?.model),
      inputTokens,
      outputTokens,
      cachedTokens,
      totalTokens: inputTokens + outputTokens + cachedTokens,
    };
  });
}

function parseJsonObject(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function extractBusinessRowsFromPayload(payload) {
  if (Array.isArray(payload?.usage_rows)) {
    return payload.usage_rows;
  }

  if (Array.isArray(payload?.usageRows)) {
    return payload.usageRows;
  }

  return extractRowsFromPayload(payload);
}

function normalizeBusinessMetricRow(row, index) {
  const usage = row?.usage && typeof row.usage === 'object' ? row.usage : {};
  const tokenMap = usage?.tokens && typeof usage.tokens === 'object' ? usage.tokens : {};
  const normalizedTokens = Object.entries(tokenMap)
    .map(([key, value]) => ({
      label: key,
      value: numberOrZero(value),
    }))
    .filter((entry) => entry.value > 0);

  return {
    key: `business-metric-row-${index}`,
    timestamp:
      textOrEmpty(row?.timestamp) ||
      textOrEmpty(row?.ts) ||
      textOrEmpty(row?.TimeGenerated) ||
      textOrEmpty(row?.time_bin) ||
      textOrEmpty(row?.time),
    toolName: textOrEmpty(row?.tool_name ?? row?.toolName),
    correlationId: textOrEmpty(row?.correlation_id ?? row?.correlationId),
    filename: textOrEmpty(row?.filename),
    extractionLatencySec: numberOrZero(row?.extraction_latency_sec ?? row?.extractionLatencySec),
    totalLatencySec: numberOrZero(row?.total_latency_sec ?? row?.totalLatencySec),
    traceparent: textOrEmpty(row?.traceparent),
    documentPagesStandard: numberOrZero(
      usage?.documentPagesStandard ?? row?.documentPagesStandard ?? row?.document_pages_standard,
    ),
    contextualizationTokens: numberOrZero(
      usage?.contextualizationTokens ?? row?.contextualizationTokens ?? row?.contextualization_tokens,
    ),
    tokenBreakdown: normalizedTokens,
    tokenTotal: normalizedTokens.reduce((sum, token) => sum + token.value, 0),
  };
}

function extractBusinessMetricFromToolResult(row, index) {
  const toolResultEnvelope = parseJsonObject(row?.tool_result ?? row?.toolResult);
  const responsePayload = parseJsonObject(toolResultEnvelope?.response) ?? toolResultEnvelope;

  if (!responsePayload || typeof responsePayload !== 'object') {
    return null;
  }

  const observability =
    responsePayload?.observability_metrics && typeof responsePayload.observability_metrics === 'object'
      ? responsePayload.observability_metrics
      : {};
  const contentResponse =
    responsePayload?.content_understanding_response &&
    typeof responsePayload.content_understanding_response === 'object'
      ? responsePayload.content_understanding_response
      : {};
  const usage = contentResponse?.usage && typeof contentResponse.usage === 'object' ? contentResponse.usage : {};

  return normalizeBusinessMetricRow(
    {
      ...row,
      correlation_id: row?.correlation_id ?? observability?.correlation_id,
      filename: row?.filename ?? observability?.filename,
      extraction_latency_sec: row?.extraction_latency_sec ?? observability?.extraction_latency_sec,
      total_latency_sec: row?.total_latency_sec ?? observability?.total_latency_sec,
      traceparent: row?.traceparent ?? observability?.traceparent,
      usage,
    },
    index,
  );
}

function normalizeBusinessMetricsRows(payload) {
  return extractBusinessRowsFromPayload(payload)
    .map((row, index) => {
      const directRow = normalizeBusinessMetricRow(row, index);
      const hasDirectUsage =
        directRow.documentPagesStandard > 0 || directRow.contextualizationTokens > 0 || directRow.tokenTotal > 0;

      if (hasDirectUsage) {
        return directRow;
      }

      const fallbackFromToolResult = extractBusinessMetricFromToolResult(row, index);
      return fallbackFromToolResult ?? directRow;
    })
    .filter(
      (row) =>
        Boolean(row.timestamp) ||
        Boolean(row.filename) ||
        row.extractionLatencySec > 0 ||
        row.totalLatencySec > 0 ||
        row.documentPagesStandard > 0 ||
        row.contextualizationTokens > 0 ||
        row.tokenTotal > 0,
    );
}

function buildMetricsQueryParams(nextFilters, queryAgentId) {
  const params = new URLSearchParams();
  params.set('source', nextFilters.source || DEFAULT_SOURCE);
  params.append('splitBy', nextFilters.splitBy || DEFAULT_SPLIT_BY);
  params.append('split_by', nextFilters.splitBy || DEFAULT_SPLIT_BY);

  (nextFilters.metricSet?.length ? nextFilters.metricSet : DEFAULT_METRIC_SET).forEach((metric) => {
    const metricName = textOrEmpty(metric);
    if (!metricName) {
      return;
    }

    params.append('metricSet', metricName);
    params.append('metric_set', metricName);
  });

  params.set('agent_id', queryAgentId);
  params.set('filterAgentId', queryAgentId);
  params.set('interval', nextFilters.interval);
  params.set('timestamp_mode', nextFilters.timestampMode);
  params.set('timestampMode', nextFilters.timestampMode);

  if (nextFilters.timestampMode === 'exact') {
    params.set('max_rows', String(nextFilters.maxRows));
    params.set('maxRows', String(nextFilters.maxRows));
  }

  const normalizedStart = normalizeIsoInput(nextFilters.startTime);
  const normalizedEnd = normalizeIsoInput(nextFilters.endTime);

  if (normalizedStart && normalizedEnd) {
    params.set('start_time', normalizedStart);
    params.set('end_time', normalizedEnd);
  } else {
    const boundedHours = Math.max(1, Math.min(MAX_HOURS, Number(nextFilters.hours || 24)));
    params.set('hours', String(boundedHours));
  }

  return params;
}

function extractAgentIdsFromDashboardCache() {
  if (typeof window === 'undefined') {
    return [];
  }

  const cache = window[DASHBOARD_CACHE_KEY];

  if (!cache || typeof cache !== 'object' || !Array.isArray(cache.foundryRows)) {
    return [];
  }

  return Array.from(
    new Set(
      cache.foundryRows
        .map((row) => textOrEmpty(row?.id))
        .filter(Boolean),
    ),
  );
}

function extractAgentIdsFromPayload(payload) {
  const ids = extractCollection(payload).flatMap((entry) => pickAgentIdCandidates(entry));
  return Array.from(new Set(ids.filter(Boolean)));
}

function createPolylinePoints(values, maxValue, width, height, padding) {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const denominator = values.length - 1;

  return values
    .map((value, index) => {
      const x = denominator <= 0 ? width / 2 : padding + (index / denominator) * innerWidth;
      const y = padding + innerHeight * (1 - value / maxValue);
      return `${x},${y}`;
    })
    .join(' ');
}

function TokenTrendChart({ rows, startLabel, endLabel }) {
  const width = 980;
  const height = 300;
  const padding = 32;
  const hasRows = rows.length > 0;
  const inputSeries = rows.map((row) => row.inputTokens);
  const outputSeries = rows.map((row) => row.outputTokens);
  const cachedSeries = rows.map((row) => row.cachedTokens);
  const maxValue = hasRows ? Math.max(1, ...inputSeries, ...outputSeries, ...cachedSeries) : 1;
  const gridLines = [0.25, 0.5, 0.75, 1];
  const pointInput = hasRows ? createPolylinePoints(inputSeries, maxValue, width, height, padding) : '';
  const pointOutput = hasRows ? createPolylinePoints(outputSeries, maxValue, width, height, padding) : '';
  const pointCached = hasRows ? createPolylinePoints(cachedSeries, maxValue, width, height, padding) : '';
  const yAxisBottom = height - padding;
  const xAxisRight = width - padding;

  return (
    <div className={metricsPageClassNames.chartSection}>
      <div className={metricsPageClassNames.chartLegend}>
        <Tag className={metricsPageClassNames.legendInput}>Input Tokens</Tag>
        <Tag className={metricsPageClassNames.legendOutput}>Output Tokens</Tag>
        <Tag className={metricsPageClassNames.legendCached}>Cached Tokens</Tag>
      </div>

      <div className={metricsPageClassNames.chartCanvasWrap}>
        <svg viewBox={`0 0 ${width} ${height}`} className={metricsPageClassNames.chartCanvas} role="img">
          {gridLines.map((line) => {
            const y = padding + (height - padding * 2) * line;

            return (
              <line
                key={`grid-${line}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className={metricsPageClassNames.chartGridLine}
              />
            );
          })}

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={yAxisBottom}
            className={metricsPageClassNames.chartAxis}
          />
          <line
            x1={padding}
            y1={yAxisBottom}
            x2={xAxisRight}
            y2={yAxisBottom}
            className={metricsPageClassNames.chartAxis}
          />

          {hasRows && <polyline points={pointInput} className={metricsPageClassNames.chartLineInput} />}
          {hasRows && <polyline points={pointOutput} className={metricsPageClassNames.chartLineOutput} />}
          {hasRows && <polyline points={pointCached} className={metricsPageClassNames.chartLineCached} />}
        </svg>
      </div>

      <div className={metricsPageClassNames.chartFooter}>
        <Typography.Text>{startLabel || 'Start'}</Typography.Text>
        <Typography.Text>{endLabel || 'End'}</Typography.Text>
      </div>
    </div>
  );
}

function MetricsPage() {
  const { agentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const decodedRouteAgentId = useMemo(() => decodeRouteParam(agentId), [agentId]);
  const stateAgentName = textOrEmpty(location.state?.agentName);
  const selectedAgentId = textOrEmpty(location.state?.sourceAgentId) || decodedRouteAgentId;
  const rawStateAgentIds = location.state?.availableAgentIds;
  const stateAgentIds = useMemo(
    () =>
      Array.isArray(rawStateAgentIds)
        ? rawStateAgentIds.map((id) => textOrEmpty(id)).filter(Boolean)
        : [],
    [rawStateAgentIds],
  );
  const cachedAgentIds = useMemo(() => extractAgentIdsFromDashboardCache(), []);
  const initialAgentIds = useMemo(
    () => Array.from(new Set([...stateAgentIds, ...cachedAgentIds, selectedAgentId].filter(Boolean))),
    [cachedAgentIds, selectedAgentId, stateAgentIds],
  );
  const initialResolvedAgentId = useMemo(
    () => resolveVersionedAgentId(selectedAgentId, initialAgentIds),
    [initialAgentIds, selectedAgentId],
  );
  const [availableAgentIds, setAvailableAgentIds] = useState(initialAgentIds);
  const [hasAgentIdRefreshCompleted, setHasAgentIdRefreshCompleted] = useState(false);
  const [filters, setFilters] = useState(() => ({
    source: DEFAULT_SOURCE,
    metricSet: DEFAULT_METRIC_SET,
    splitBy: DEFAULT_SPLIT_BY,
    hours: 24,
    startTime: '',
    endTime: '',
    interval: 'PT1H',
    agentId: initialResolvedAgentId || '',
    timestampMode: 'exact',
    maxRows: 2000,
  }));
  const [metricsRows, setMetricsRows] = useState([]);
  const [businessMetricsRows, setBusinessMetricsRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [queryMetadata, setQueryMetadata] = useState(null);

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

  const metricsSummary = useMemo(() => {
    const totals = metricsRows.reduce(
      (accumulator, row) => ({
        inputTokens: accumulator.inputTokens + row.inputTokens,
        outputTokens: accumulator.outputTokens + row.outputTokens,
        cachedTokens: accumulator.cachedTokens + row.cachedTokens,
      }),
      { inputTokens: 0, outputTokens: 0, cachedTokens: 0 },
    );

    return {
      ...totals,
      totalTokens: totals.inputTokens + totals.outputTokens + totals.cachedTokens,
    };
  }, [metricsRows]);

  const chartRows = useMemo(() => metricsRows.slice(-MAX_CHART_ROWS), [metricsRows]);
  const businessMetricsTimelineRows = useMemo(
    () =>
      [...businessMetricsRows].sort((left, right) => {
        const leftTs = new Date(left.timestamp).getTime();
        const rightTs = new Date(right.timestamp).getTime();

        if (!Number.isFinite(leftTs) && !Number.isFinite(rightTs)) {
          return 0;
        }

        if (!Number.isFinite(leftTs)) {
          return 1;
        }

        if (!Number.isFinite(rightTs)) {
          return -1;
        }

        return rightTs - leftTs;
      }),
    [businessMetricsRows],
  );
  const shouldShowBusinessMetrics =
    textOrEmpty(filters.agentId) === CU_BUSINESS_METRICS_AGENT_ID ||
    textOrEmpty(queryMetadata?.queriedAgentId) === CU_BUSINESS_METRICS_AGENT_ID;
  const hasCustomRange = Boolean(normalizeIsoInput(filters.startTime) && normalizeIsoInput(filters.endTime));
  const chartRangeLabels = useMemo(() => {
    if (chartRows.length > 0) {
      return {
        start: formatTimestamp(chartRows[0].timestamp),
        end: formatTimestamp(chartRows[chartRows.length - 1].timestamp),
      };
    }

    if (hasCustomRange) {
      return {
        start: formatTimestamp(filters.startTime),
        end: formatTimestamp(filters.endTime),
      };
    }

    const now = new Date();
    const start = new Date(now.getTime() - Number(filters.hours || 24) * 60 * 60 * 1000);

    return {
      start: formatTimestamp(start.toISOString()),
      end: formatTimestamp(now.toISOString()),
    };
  }, [chartRows, filters.endTime, filters.hours, filters.startTime, hasCustomRange]);
  const rowColumns = useMemo(
    () => [
      {
        title: 'Timestamp',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: 220,
        render: (value) => formatTimestamp(value),
      },
      {
        title: 'Model',
        dataIndex: 'model',
        key: 'model',
        width: 180,
        ellipsis: true,
        render: (value) => value || 'Unknown',
      },
      {
        title: 'Input Tokens',
        dataIndex: 'inputTokens',
        key: 'inputTokens',
        align: 'right',
        render: (value) => formatNumber(value),
      },
      {
        title: 'Output Tokens',
        dataIndex: 'outputTokens',
        key: 'outputTokens',
        align: 'right',
        render: (value) => formatNumber(value),
      },
      {
        title: 'Cached Tokens',
        dataIndex: 'cachedTokens',
        key: 'cachedTokens',
        align: 'right',
        render: (value) => formatNumber(value),
      },
      {
        title: 'Total Tokens',
        dataIndex: 'totalTokens',
        key: 'totalTokens',
        align: 'right',
        render: (value) => formatNumber(value),
      },
    ],
    [],
  );

  const runMetricsQuery = useCallback(async (nextFilters) => {
    const queryAgentId = resolveVersionedAgentId(nextFilters.agentId, availableAgentIds);

    if (!queryAgentId) {
      setErrorMessage('Please select an agent ID before loading metrics.');
      setMetricsRows([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const params = buildMetricsQueryParams(nextFilters, queryAgentId);

      const response = await fetch(`${TOKENS_BY_AGENT_API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : { rows: [], rawResponse: await response.text() };
      const nextRows = normalizeMetricRows(payload);

      setMetricsRows(nextRows);
      setFilters((previous) =>
        previous.agentId === nextFilters.agentId && nextFilters.agentId !== queryAgentId
          ? { ...previous, agentId: queryAgentId }
          : previous,
      );
      setQueryMetadata({
        loadedAt: new Date().toISOString(),
        responseRowCount: nextRows.length,
        source: nextFilters.source,
        interval: nextFilters.interval,
        timestampMode: nextFilters.timestampMode,
        queriedAgentId: queryAgentId,
      });

      if (queryAgentId === CU_BUSINESS_METRICS_AGENT_ID) {
        try {
          const businessResponse = await fetch(`${CU_USAGE_METRICS_API_URL}?${params.toString()}`);

          if (!businessResponse.ok) {
            throw new Error(`Request failed with status ${businessResponse.status}`);
          }

          const businessContentType = businessResponse.headers.get('content-type') ?? '';
          const businessPayload = businessContentType.includes('application/json')
            ? await businessResponse.json()
            : { rows: [] };
          setBusinessMetricsRows(normalizeBusinessMetricsRows(businessPayload));
        } catch {
          setBusinessMetricsRows([]);
        }
      } else {
        setBusinessMetricsRows([]);
      }
    } catch (error) {
      setMetricsRows([]);
      setBusinessMetricsRows([]);
      setQueryMetadata(null);
      setErrorMessage(error?.message || 'Unable to load metrics data.');
    } finally {
      setIsLoading(false);
    }
  }, [availableAgentIds]);

  useEffect(() => {
    if (hasAgentIdRefreshCompleted) {
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();

    const loadAgentIds = async () => {
      try {
        const response = await fetch(FOUNDRY_AGENTS_API_URL, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();

        if (!isActive) {
          return;
        }

        const fetchedAgentIds = extractAgentIdsFromPayload(payload);
        const mergedAgentIds = Array.from(new Set([...availableAgentIds, ...fetchedAgentIds].filter(Boolean)));
        setAvailableAgentIds(mergedAgentIds);
        setFilters((previous) => {
          const resolvedAgentId = resolveVersionedAgentId(previous.agentId || selectedAgentId, mergedAgentIds);

          if (!resolvedAgentId || resolvedAgentId === previous.agentId) {
            return previous;
          }

          return {
            ...previous,
            agentId: resolvedAgentId,
          };
        });
      } catch {
        // Ignore fetch failures and keep existing in-memory IDs from dashboard cache.
      } finally {
        if (isActive) {
          setHasAgentIdRefreshCompleted(true);
        }
      }
    };

    loadAgentIds();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [availableAgentIds, hasAgentIdRefreshCompleted, selectedAgentId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runMetricsQuery(filters);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [filters.agentId, runMetricsQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyFilters = () => {
    runMetricsQuery({
      ...filters,
      metricSet: filters.metricSet?.length ? filters.metricSet : DEFAULT_METRIC_SET,
    });
  };

  const metricCards = [
    {
      key: 'input',
      title: 'Input Tokens',
      value: metricsSummary.inputTokens,
      className: metricsPageClassNames.statInput,
      prefix: <DatabaseOutlined />,
    },
    {
      key: 'output',
      title: 'Output Tokens',
      value: metricsSummary.outputTokens,
      className: metricsPageClassNames.statOutput,
      prefix: <LineChartOutlined />,
    },
    {
      key: 'cached',
      title: 'Cached Tokens',
      value: metricsSummary.cachedTokens,
      className: metricsPageClassNames.statCached,
      prefix: <BarChartOutlined />,
    },
    {
      key: 'total',
      title: 'Total Tokens',
      value: metricsSummary.totalTokens,
      className: metricsPageClassNames.statTotal,
      prefix: <BarChartOutlined />,
    },
  ];

  return (
    <Layout className={metricsPageClassNames.layout}>
      <Content className={metricsPageClassNames.content}>
        <Card className={metricsPageClassNames.card}>
          <div className={metricsPageClassNames.header}>
            <div>
              <Typography.Title level={3} className={metricsPageClassNames.title}>
                Agent Metrics
              </Typography.Title>
              <Typography.Paragraph className={metricsPageClassNames.copy}>
                {stateAgentName ? `Metrics for ${stateAgentName}` : 'Metrics for selected agent'}
              </Typography.Paragraph>
              <Typography.Text className={metricsPageClassNames.meta}>
                Selected agent ID: {filters.agentId || 'Not selected'}
              </Typography.Text>
            </div>

            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleApplyFilters}
                loading={isLoading}
                className={metricsPageClassNames.refreshButton}
              >
                Reload
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </Space>
          </div>

          {summaryItems.length > 0 && (
            <div className={metricsPageClassNames.snapshot}>
              {summaryItems.map((item) => (
                <Tag key={item.label} className={metricsPageClassNames.snapshotTag}>
                  {item.label}: {item.value}
                </Tag>
              ))}
            </div>
          )}

          <Card className={metricsPageClassNames.filterCard} bordered={false}>
            <Row gutter={[16, 12]}>
             

              <Col xs={24} md={8}>
                <Typography.Text className={metricsPageClassNames.fieldLabel}>Time Window</Typography.Text>
                <Select
                  value={filters.hours}
                  placeholder="Select time window"
                  options={TIME_WINDOW_OPTIONS}
                  onChange={(value) => setFilters((prev) => ({ ...prev, hours: Number(value || 24) }))}
                />
              </Col>

              <Col xs={24} md={8}>
                <Typography.Text className={metricsPageClassNames.fieldLabel}>
                  Start Time (ISO-8601)
                </Typography.Text>
                <Input
                  value={filters.startTime}
                  placeholder="2026-05-26T09:40:58.561747Z"
                  onChange={(event) => setFilters((prev) => ({ ...prev, startTime: event.target.value }))}
                />
              </Col>

              <Col xs={24} md={8}>
                <Typography.Text className={metricsPageClassNames.fieldLabel}>
                  End Time (ISO-8601)
                </Typography.Text>
                <Input
                  value={filters.endTime}
                  placeholder="2026-05-27T09:40:58.561747Z"
                  onChange={(event) => setFilters((prev) => ({ ...prev, endTime: event.target.value }))}
                />
              </Col>

              <Col xs={24} md={8}>
                <Typography.Text className={metricsPageClassNames.fieldLabel}>Bucket Interval</Typography.Text>
                <Select
                  value={filters.interval}
                  placeholder="PT1H"
                  options={INTERVAL_OPTIONS}
                  onChange={(value) => setFilters((prev) => ({ ...prev, interval: value }))}
                />
              </Col>

             

              <Col xs={24} md={8}>
                <Typography.Text className={metricsPageClassNames.fieldLabel}>Timestamp Mode</Typography.Text>
                <Select
                  value={filters.timestampMode}
                  placeholder="Exact"
                  options={TIMESTAMP_MODE_OPTIONS}
                  onChange={(value) => setFilters((prev) => ({ ...prev, timestampMode: value }))}
                />
              </Col>

              {/* <Col xs={24} md={8}>
                <Typography.Text className={metricsPageClassNames.fieldLabel}>Max Rows</Typography.Text>
                <InputNumber
                  min={1}
                  max={10000}
                  value={filters.maxRows}
                  disabled={filters.timestampMode !== 'exact'}
                  className={metricsPageClassNames.fullWidthInput}
                  onChange={(value) => setFilters((prev) => ({ ...prev, maxRows: Number(value || 2000) }))}
                />
              </Col>

              <Col xs={24} md={16}>
                <Typography.Text className={metricsPageClassNames.fieldLabel}>Split By</Typography.Text>
                <Input
                  value={filters.splitBy}
                  placeholder="gen_ai.agent.id"
                  onChange={(event) => setFilters((prev) => ({ ...prev, splitBy: event.target.value }))}
                />
              </Col> */}
            </Row>

            <Typography.Text className={metricsPageClassNames.filterHint}>
              Time window range: minimum 1 hour, maximum 8760 hours. If both start and end time are provided,
              they override the time window.
            </Typography.Text>

            <div className={metricsPageClassNames.filterActions}>
              <Button type="primary" onClick={handleApplyFilters} loading={isLoading}>
                Apply Filters
              </Button>
            </div>
          </Card>

          {errorMessage && (
            <Alert
              type="error"
              showIcon
              message="Unable to load metrics"
              description={errorMessage}
              className={metricsPageClassNames.errorAlert}
            />
          )}

          <Row gutter={[14, 14]} className={metricsPageClassNames.statGrid}>
            {metricCards.map((metric) => (
              <Col xs={24} sm={12} xl={6} key={metric.key}>
                <Card className={`${metricsPageClassNames.statCard} ${metric.className}`} bordered={false}>
                  <Statistic title={metric.title} value={metric.value} prefix={metric.prefix} formatter={formatNumber} />
                </Card>
              </Col>
            ))}
          </Row>

          {shouldShowBusinessMetrics && (
            <Card className={metricsPageClassNames.businessWidgetCard} title="Business Metrics">
              {businessMetricsTimelineRows.length > 0 ? (
                <div className={metricsPageClassNames.businessMetricList}>
                  <Collapse
                    accordion
                    className={metricsPageClassNames.businessMetricAccordion}
                    items={businessMetricsTimelineRows.map((businessMetric, index) => ({
                      key: businessMetric.key ?? `snapshot-${index + 1}`,
                      label: (
                        <div className={metricsPageClassNames.businessMetricEntryMeta}>
                          <Tag className={metricsPageClassNames.snapshotTag}>Snapshot {index + 1}</Tag>
                          <Typography.Text>
                            <ClockCircleOutlined /> {formatTimestamp(businessMetric.timestamp)}
                          </Typography.Text>
                          {businessMetric.correlationId && (
                            <Typography.Text>Correlation ID: {businessMetric.correlationId}</Typography.Text>
                          )}
                        </div>
                      ),
                      children: (
                        <div className={metricsPageClassNames.businessMetricPanelBody}>
                          <Row gutter={[14, 14]}>
                            <Col xs={24} lg={8}>
                              <Card className={metricsPageClassNames.businessMetricCard} bordered={false}>
                                <Typography.Text className={metricsPageClassNames.businessMetricTitle}>
                                  <ClockCircleOutlined /> Latency Snapshot
                                </Typography.Text>
                                <Space
                                  direction="vertical"
                                  size={4}
                                  className={metricsPageClassNames.businessMetricBody}
                                >
                                  <Typography.Text>
                                    <FileTextOutlined /> {businessMetric.filename || 'Unknown file'}
                                  </Typography.Text>
                                  <Typography.Text>
                                    <ThunderboltOutlined /> Extraction: {businessMetric.extractionLatencySec.toFixed(2)}s
                                  </Typography.Text>
                                  <Typography.Text>
                                    <ThunderboltOutlined /> Total: {businessMetric.totalLatencySec.toFixed(2)}s
                                  </Typography.Text>
                                  {businessMetric.traceparent && (
                                    <Typography.Text>Trace: {businessMetric.traceparent}</Typography.Text>
                                  )}
                                </Space>
                              </Card>
                            </Col>

                            <Col xs={24} lg={8}>
                              <Card className={metricsPageClassNames.businessMetricCard} bordered={false}>
                                <Typography.Text className={metricsPageClassNames.businessMetricTitle}>
                                  <BarChartOutlined /> Usage Overview
                                </Typography.Text>
                                <Space
                                  direction="vertical"
                                  size={4}
                                  className={metricsPageClassNames.businessMetricBody}
                                >
                                  <Typography.Text>
                                    Pages (Standard): {formatNumber(businessMetric.documentPagesStandard)}
                                  </Typography.Text>
                                  <Typography.Text>
                                    Contextualization Tokens: {formatNumber(businessMetric.contextualizationTokens)}
                                  </Typography.Text>
                                  <Typography.Text>
                                    Tool: {businessMetric.toolName || 'Unknown tool'}
                                  </Typography.Text>
                                </Space>
                              </Card>
                            </Col>

                            <Col xs={24} lg={8}>
                              <Card className={metricsPageClassNames.businessMetricCard} bordered={false}>
                                <Typography.Text className={metricsPageClassNames.businessMetricTitle}>
                                  <RobotOutlined /> Token Breakdown
                                </Typography.Text>
                                <Space
                                  direction="vertical"
                                  size={4}
                                  className={metricsPageClassNames.businessMetricBody}
                                >
                                  {businessMetric.tokenBreakdown.length > 0 ? (
                                    businessMetric.tokenBreakdown.map((tokenRow) => (
                                      <Typography.Text key={tokenRow.label}>
                                        {tokenRow.label}: {formatNumber(tokenRow.value)}
                                      </Typography.Text>
                                    ))
                                  ) : (
                                    <Typography.Text>No token values found.</Typography.Text>
                                  )}
                                  <Typography.Text>
                                    Total: {formatNumber(businessMetric.tokenTotal)}
                                  </Typography.Text>
                                </Space>
                              </Card>
                            </Col>
                          </Row>
                        </div>
                      ),
                    }))}
                  />
                </div>
              ) : (
                <div className={metricsPageClassNames.tableLoadingState}>
                  <Typography.Text>No business metric rows returned for this filter combination.</Typography.Text>
                </div>
              )}
            </Card>
          )}

          <Card
            className={metricsPageClassNames.chartCard}
            title="Token Trend"
            extra={
              queryMetadata ? (
                <Typography.Text className={metricsPageClassNames.queryMeta}>
                  {queryMetadata.responseRowCount} rows | {queryMetadata.interval} | {queryMetadata.timestampMode}
                  {' | '}
                  {queryMetadata.queriedAgentId}
                </Typography.Text>
              ) : null
            }
          >
            <TokenTrendChart
              rows={chartRows}
              startLabel={chartRangeLabels.start}
              endLabel={chartRangeLabels.end}
            />
          </Card>

          <Card className={metricsPageClassNames.tableCard} title="Raw Metrics Rows">
            {isLoading ? (
              <div className={metricsPageClassNames.tableLoadingState}>
                <Typography.Text>Loading metrics data...</Typography.Text>
              </div>
            ) : metricsRows.length === 0 ? (
              <div className={metricsPageClassNames.tableLoadingState}>
                <Typography.Text>No rows returned for this filter combination.</Typography.Text>
              </div>
            ) : (
              <Table
                rowKey="key"
                columns={rowColumns}
                dataSource={metricsRows}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                size="middle"
                scroll={{ x: 960 }}
              />
            )}
          </Card>
        </Card>
      </Content>
    </Layout>
  );
}

export default MetricsPage;
