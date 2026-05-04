import { useMemo, useState } from 'react';
import { Avatar, Card, Space, Table, Tag, Typography } from 'antd';
import {
  ApiOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  LinkOutlined,
  MailOutlined,
  PhoneOutlined,
  RobotOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
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
  Analytics: ApiOutlined,
  Compliance: TeamOutlined,
  Communication: PhoneOutlined,
  'Quality Assurance': ApiOutlined,
};

function resolveAgentAvatar(agentName) {
  const normalizedName = agentName.toLowerCase();

  if (normalizedName.includes('copilot')) {
    return (
      <Avatar
        shape="square"
        size="small"
        src={<img src={copilotIcon} alt="Microsoft Copilot logo" />}
        className={`${tableClassNames.agentAvatar} ${tableClassNames.agentAvatarCopilot}`}
      />
    );
  }

  return (
    <Avatar size="small" className={tableClassNames.agentAvatar}>
      {agentName.charAt(0).toUpperCase()}
    </Avatar>
  );
}

function AITable() {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const mappedRows = useMemo(
    () => agentRowsJson.map((row, index) => ({ ...row, key: row.key ?? String(index + 1) })),
    [],
  );

  const columns = [
    {
      title: 'Agent Name',
      dataIndex: 'agentName',
      key: 'agentName',
      render: (value, record) => (
        <Link
          to={`/agent/${record.key}`}
          className={tableClassNames.agentNameButton}
          onClick={(event) => event.stopPropagation()}
        >
          {resolveAgentAvatar(record.agentName)}
          <span className={tableClassNames.agentNameText}>{value}</span>
        </Link>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (value) => <Typography.Text>{value}</Typography.Text>,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Short Description',
      dataIndex: 'specialization',
      key: 'specialization',
    },
    {
      title: 'Owner Name',
      dataIndex: 'ownerName',
      key: 'ownerName',
    },
    {
      title: 'Created On',
      dataIndex: 'creationDate',
      key: 'creationDate',
    },
    {
      title: 'Metrics',
      key: 'metrics',
      align: 'center',
      render: (_, record) => (
        <Link
          to={`/metrics/${record.key}`}
          className={tableClassNames.metricsViewButton}
          onClick={(event) => event.stopPropagation()}
          aria-label={`View metrics for ${record.agentName}`}
        >
          <EyeOutlined />
        </Link>
      ),
    },
  ];

  const renderExpandedRow = (record) => {
    const CategoryIcon = CATEGORY_ICON_MAP[record.category] ?? ToolOutlined;
    const detailItems = [
      { label: 'Owner Name', value: record.ownerName, icon: UserOutlined },
      { label: 'Version', value: record.version, icon: ApiOutlined },
      { label: 'Creation Date', value: record.creationDate, icon: CalendarOutlined },
      { label: 'Last Updated', value: record.lastUpdated, icon: ClockCircleOutlined },
      { label: 'Department', value: record.department, icon: TeamOutlined },
      { label: 'Model', value: record.model, icon: ApiOutlined },
      { label: 'Data Sources', value: record.dataSources, icon: DatabaseOutlined },
      { label: 'Region', value: record.region, icon: EnvironmentOutlined },
      { label: 'Contact Email', value: record.contactEmail, icon: MailOutlined },
      { label: 'Contact Phone', value: record.contactPhone, icon: PhoneOutlined },
    ];

    return (
      <div className={tableClassNames.agentDetailPanel}>
        <div className={tableClassNames.agentDetailHeader}>
          <div>
            <Typography.Text className={tableClassNames.agentDetailEyebrow}>
              Agent description
            </Typography.Text>
            <Typography.Title level={5} className={tableClassNames.agentDetailTitle}>
              {record.agentName}
            </Typography.Title>
            <div className={tableClassNames.agentDetailMeta}>
              <Tag className={tableClassNames.agentDetailCategoryTag}>
                <CategoryIcon />
                <span>{record.category}</span>
              </Tag>
              <Tag color={STATUS_COLOR_MAP[record.status] ?? 'default'}>{record.status}</Tag>
            </div>
          </div>
          {/* <Link
            to={`/agent/${record.key}`}
            className={tableClassNames.agentDetailLink}
            onClick={(event) => event.stopPropagation()}
          >
            Open full page
          </Link> */}
        </div>

        <Typography.Paragraph className={tableClassNames.agentDetailCopy}>
          {record.description}
        </Typography.Paragraph>

        <div className={tableClassNames.agentDetailGrid}>
          {detailItems.map((item) => {
            const DetailIcon = item.icon;

            return (
              <div key={item.label} className={tableClassNames.agentDetailItem}>
                <Typography.Text className={tableClassNames.agentDetailItemLabel}>
                  <DetailIcon />
                  <span>{item.label}</span>
                </Typography.Text>
                <Typography.Text className={tableClassNames.agentDetailItemValue}>{item.value}</Typography.Text>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
      <Table
        className={tableClassNames.table}
        columns={columns}
        dataSource={mappedRows}
        pagination={{ pageSize: 6, hideOnSinglePage: true }}
        scroll={{ x: 1280 }}
        expandable={{
          expandedRowRender: renderExpandedRow,
          expandedRowKeys,
          expandRowByClick: false,
          showExpandColumn: true,
          onExpand: (expanded, record) => {
            setExpandedRowKeys(expanded ? [record.key] : []);
          },
        }}
        rowClassName={(record) =>
          expandedRowKeys.includes(record.key) ? tableClassNames.agentRowActive : ''
        }
      />
    </Card>
  );
}

export default AITable;
