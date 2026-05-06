import { useMemo } from 'react';
import { Avatar, Card, List, Space, Tag, Tooltip, Typography } from 'antd';
import {
  ApiOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  LinkOutlined,
  MessageOutlined,

  RobotOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { tableClassNames } from './StyleComponent.js';
import { agentRowsJson } from './agentRows.jsx';
import copilotIcon from '../assets/ui/copiloticon.jpg';

const STATUS_COLOR_MAP = {
  Active: 'success',
  Pilot: 'processing',
  Monitored: 'warning',
  Ready: 'blue',
};

const CATEGORY_ICON_MAP = {
  Automation: ToolOutlined,
  'Knowledge Search': LinkOutlined,
  Analytics: LineChartOutlined,
  Compliance: TeamOutlined,
  Communication: MessageOutlined,
  'Quality Assurance': SafetyCertificateOutlined,
};

const AGENT_ICON_RULES = [
  { keywords: ['search', 'knowledge', 'insight'], icon: SearchOutlined },
  { keywords: ['fraud', 'signal', 'analyst', 'analytics'], icon: LineChartOutlined },
  { keywords: ['regulation', 'compliance', 'guard'], icon: SafetyOutlined },
  { keywords: ['broker', 'communicator', 'communication'], icon: MessageOutlined },
  { keywords: ['quality', 'data', 'sentinel'], icon: DatabaseOutlined },
  { keywords: ['claim', 'policy'], icon: FileTextOutlined },
];

function resolveAgentAvatar(agentName) {
  const normalizedName = agentName.toLowerCase();

  if (normalizedName.includes('copilot')) {
    return (
      <Avatar
        size={44}
        src={<img src={copilotIcon} alt="Microsoft Copilot logo" />}
        className={`${tableClassNames.agentAvatar} ${tableClassNames.agentAvatarCopilot}`}
      />
    );
  }

  const iconRule =
    AGENT_ICON_RULES.find((rule) =>
      rule.keywords.some((keyword) => normalizedName.includes(keyword)),
    ) ?? null;
  const AgentIcon = iconRule?.icon ?? RobotOutlined;

  return <Avatar size={44} className={tableClassNames.agentAvatar} icon={<AgentIcon />} />;
}

function AITable() {
  const mappedRows = useMemo(
    () => agentRowsJson.map((row, index) => ({ ...row, key: row.key ?? String(index + 1) })),
    [],
  );

  return (
    <Card
      className={tableClassNames.card}
      bordered={false}
      title={
        <Space>
          <RobotOutlined />
          <span>Agent Directory</span>
        </Space>
      }
    >
      <List
        className={tableClassNames.agentList}
        dataSource={mappedRows}
        pagination={{ pageSize: 6, hideOnSinglePage: true }}
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
        renderItem={(record) => {
          const CategoryIcon = CATEGORY_ICON_MAP[record.category] ?? ToolOutlined;

          return (
            <List.Item>
              <Card className={tableClassNames.agentCard} bordered={false}>
                <div className={tableClassNames.agentCardHeader}>
                  <div className={tableClassNames.agentCardIdentity}>
                    {resolveAgentAvatar(record.agentName)}

                    <div className={tableClassNames.agentCardCopy}>
                      <Link
                        to={`/agent/${record.key}`}
                        className={tableClassNames.agentNameButton}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <span className={tableClassNames.agentNameText}>{record.agentName}</span>
                      </Link>

                      <Typography.Text className={tableClassNames.agentCardContact}>
                        <span>{record.ownerName}</span>
                        <span className={tableClassNames.agentCardContactDivider}>|</span>
                        <span>{record.contactEmail}</span>
                      </Typography.Text>
                    </div>
                  </div>

                  <Tooltip title="Metrics">
                    <Link
                      to={`/metrics/${record.key}`}
                      className={tableClassNames.metricsViewButton}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`View metrics for ${record.agentName}`}
                    >
                      <EyeOutlined />
                    </Link>
                  </Tooltip>
                </div>

                <div className={tableClassNames.agentCardBadges}>
                  <Tag className={tableClassNames.agentVersionTag}>
                    <ApiOutlined />
                    <span>{record.version}</span>
                  </Tag>
                  <Tag className={tableClassNames.categoryTag}>
                    <CategoryIcon className={tableClassNames.categoryIcon} />
                    <span>{record.category}</span>
                  </Tag>
                  <Tag color={STATUS_COLOR_MAP[record.status] ?? 'default'}>{record.status}</Tag>
                  <Tag className={tableClassNames.agentDateTag}>
                    <CalendarOutlined />
                    <span>{record.creationDate}</span>
                  </Tag>
                </div>

                <div className={tableClassNames.agentCardDescriptionSection}>
                  <div className={tableClassNames.agentCardDescriptionHeader}>
                    <Typography.Text className={tableClassNames.agentCardDescriptionLabel}>
                      Description
                    </Typography.Text>

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
                  </div>

                  <Typography.Text className={tableClassNames.agentCardDescription}>
                    {record.specialization}
                  </Typography.Text>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}

export default AITable;
