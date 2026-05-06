import { useMemo, useState } from 'react';
import { Avatar, Card, Input, List, Rate, Space, Tag, Tooltip, Typography } from 'antd';
import {
  ApiOutlined,
  CalendarOutlined,
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
import { agentRowsJson } from './agentRows.jsx';
import analyticsIcon from '../assets/ui/agent-icons/analytics.svg';
import communicationIcon from '../assets/ui/agent-icons/communication.svg';
import complianceIcon from '../assets/ui/agent-icons/compliance.svg';
import defaultIcon from '../assets/ui/agent-icons/default.svg';
import documentIcon from '../assets/ui/agent-icons/software-agent.png';
import qualityIcon from '../assets/ui/agent-icons/robot.png';
import searchIcon from '../assets/ui/agent-icons/search.svg';

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

const AGENT_IMAGE_RULES = [
  { keywords: ['search', 'knowledge', 'insight'], src: searchIcon },
  { keywords: ['fraud', 'signal', 'analyst', 'analytics'], src: analyticsIcon },
  { keywords: ['regulation', 'compliance', 'guard'], src: complianceIcon },
  { keywords: ['broker', 'communicator', 'communication'], src: communicationIcon },
  { keywords: ['quality', 'data', 'sentinel'], src: qualityIcon },
  { keywords: ['claim', 'policy', 'document', 'idp'], src: documentIcon },
];

const AGENT_RATING_MAP = {
  '1': 4.8,
  '2': 4.7,
  '3': 4.5,
  '4': 4.6,
  '5': 4.4,
  '6': 4.7,
};

function resolveAgentAvatar(agentName) {
  const normalizedName = agentName.toLowerCase();
  const imageRule =
    AGENT_IMAGE_RULES.find((rule) =>
      rule.keywords.some((keyword) => normalizedName.includes(keyword)),
    ) ?? null;
  const agentImage = imageRule?.src ?? defaultIcon;

  return (
    <Avatar
      size={38}
      src={<img src={agentImage} alt={`${agentName} icon`} />}
      className={tableClassNames.agentAvatar}
    />
  );
}

function AITable() {
  const [searchTerm, setSearchTerm] = useState('');
  const mappedRows = useMemo(
    () => agentRowsJson.map((row, index) => ({ ...row, key: row.key ?? String(index + 1) })),
    [],
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearch) {
      return mappedRows;
    }

    return mappedRows.filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? '').toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [mappedRows, normalizedSearch]);

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
      <List
        className={tableClassNames.agentList}
        dataSource={filteredRows}
        pagination={{ pageSize: 6, hideOnSinglePage: true }}
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
        renderItem={(record) => {
          const CategoryIcon = CATEGORY_ICON_MAP[record.category] ?? ToolOutlined;
          const rating = AGENT_RATING_MAP[record.key] ?? 4.5;

          return (
            <List.Item>
              <Card className={tableClassNames.agentCard} bordered={false}>
                <div className={tableClassNames.agentCardHeader}>
                  <div className={tableClassNames.agentCardIdentity}>
                    {resolveAgentAvatar(record.agentName)}

                    <div className={tableClassNames.agentCardCopy}>
                      <div className={tableClassNames.agentCardTitleRow}>
                        <Link
                          to={`/agent/${record.key}`}
                          className={tableClassNames.agentNameButton}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <span className={tableClassNames.agentNameText}>{record.agentName}</span>
                        </Link>

                        <Tag className={tableClassNames.agentVersionInlineTag}>
                          <ApiOutlined />
                          <span>{record.version}</span>
                        </Tag>
                      </div>

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
                  <div className={tableClassNames.agentRatingPill}>
                    <Rate
                      disabled
                      allowHalf
                      value={rating}
                      className={tableClassNames.agentRatingStars}
                    />
                    <Typography.Text className={tableClassNames.agentRatingValue}>
                      {rating.toFixed(1)}
                    </Typography.Text>
                  </div>

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
                    <div className={tableClassNames.agentCardDescriptionHeadingWrap}>
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
                      <Tag className={tableClassNames.agentDepartmentTag}>
                     
                        <span>Dept: {record.department}</span>
                      </Tag>
                     
                    </div>
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
