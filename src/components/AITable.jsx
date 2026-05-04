import { useMemo, useState } from 'react';
import { Avatar, Card, Space, Table, Tag, Typography } from 'antd';
import {
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { tableClassNames } from './StyleComponent.js';
import { agentRowsJson } from './agentRows.jsx';

const CATEGORY_META_MAP = {
  Automation: {
    color: 'geekblue',
    icon: ToolOutlined,
  },
  Analytics: {
    color: 'cyan',
    icon: BarChartOutlined,
  },
  'Knowledge Search': {
    color: 'purple',
    icon: SearchOutlined,
  },
  Compliance: {
    color: 'magenta',
    icon: SafetyCertificateOutlined,
  },
  Communication: {
    color: 'gold',
    icon: MessageOutlined,
  },
  'Quality Assurance': {
    color: 'green',
    icon: CheckCircleOutlined,
  },
};

const DEFAULT_CATEGORY_META = {
  color: 'default',
  icon: AppstoreOutlined,
};

const STATUS_COLOR_MAP = {
  Active: 'success',
  Pilot: 'processing',
  Monitored: 'warning',
  Ready: 'blue',
};

function AgentCategoryTag({ category }) {
  const categoryMeta = CATEGORY_META_MAP[category] ?? DEFAULT_CATEGORY_META;
  const CategoryIcon = categoryMeta.icon;

  return (
    <Tag color={categoryMeta.color} className={tableClassNames.categoryTag}>
      <span className={tableClassNames.categoryIcon}>
        <CategoryIcon />
      </span>
      <span>{category}</span>
    </Tag>
  );
}

function AITable() {
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const mappedRows = useMemo(
    () => agentRowsJson.map((row, index) => ({ ...row, key: row.key ?? String(index + 1) })),
    [],
  );
  const expandedRowKey = expandedRowKeys[0];

  const toggleExpandedRow = (rowKey) => {
    setExpandedRowKeys((currentKeys) => (currentKeys[0] === rowKey ? [] : [rowKey]));
  };

  const columns = [
    {
      title: 'Agent Name',
      dataIndex: 'agentName',
      key: 'agentName',
      render: (value, record) => (
        <button
          type="button"
          className={tableClassNames.agentNameButton}
          onClick={(event) => {
            event.stopPropagation();
            toggleExpandedRow(record.key);
          }}
          aria-expanded={expandedRowKey === record.key}
        >
          <Avatar size="small" icon={<ApiOutlined />} className={tableClassNames.agentAvatar} />
          <span className={tableClassNames.agentNameText}>{value}</span>
        </button>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (value) => <AgentCategoryTag category={value} />,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Specialization',
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
  ];

  const renderExpandedRow = (record) => {
    const detailItems = [
      { label: 'Owner Name', value: record.ownerName, icon: UserOutlined },
      { label: 'Version', value: record.version, icon: ApiOutlined },
      { label: 'Creation Date', value: record.creationDate, icon: CalendarOutlined },
      { label: 'Last Updated', value: record.lastUpdated, icon: ClockCircleOutlined },
      { label: 'Department', value: record.department, icon: TeamOutlined },
      { label: 'Model', value: record.model, icon: ApiOutlined },
      { label: 'Data Sources', value: record.dataSources, icon: DatabaseOutlined },
      { label: 'Response SLA', value: record.responseSla, icon: CheckCircleOutlined },
      { label: 'Region', value: record.region, icon: EnvironmentOutlined },
    ];

    return (
      <div className={tableClassNames.agentDetailPanel}>
        <div className={tableClassNames.agentDetailHeader}>
          <div>
            <Typography.Text className={tableClassNames.agentDetailEyebrow}>
              Agent snapshot
            </Typography.Text>
            <Typography.Title level={5} className={tableClassNames.agentDetailTitle}>
              {record.agentName}
            </Typography.Title>
            <div className={tableClassNames.agentDetailMeta}>
              <AgentCategoryTag category={record.category} />
              <Tag color={STATUS_COLOR_MAP[record.status] ?? 'default'}>{record.status}</Tag>
            </div>
          </div>

          <Link
            to={`/agent/${record.key}`}
            className={tableClassNames.agentDetailLink}
            onClick={(event) => event.stopPropagation()}
          >
            Open full page
          </Link>
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
                <Typography.Text className={tableClassNames.agentDetailItemValue}>
                  {item.value}
                </Typography.Text>
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
        scroll={{ x: 1180 }}
        expandable={{
          expandedRowRender: renderExpandedRow,
          expandedRowKeys,
          showExpandColumn: false,
        }}
        rowClassName={(record) => (record.key === expandedRowKey ? tableClassNames.agentRowActive : '')}
        onRow={(record) => ({
          onClick: () => toggleExpandedRow(record.key),
        })}
      />
    </Card>
  );
}

export default AITable;
