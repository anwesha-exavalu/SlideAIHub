import { useMemo, useState } from 'react';
import { Avatar, Button, Card, Space, Table, Tag, Typography } from 'antd';
import {
  EyeOutlined,
  RobotOutlined,
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

  return <Avatar size="small" className={tableClassNames.agentAvatar}>{agentName.charAt(0).toUpperCase()}</Avatar>;
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
          </div>
          <Tag color={STATUS_COLOR_MAP[record.status] ?? 'default'}>{record.status}</Tag>
        </div>

        <Typography.Paragraph className={tableClassNames.agentDetailCopy}>
          {record.description}
        </Typography.Paragraph>
        <div className={tableClassNames.agentDetailMeta}>
          <Typography.Text className={tableClassNames.agentDetailMetaText}>
            Owner: {record.ownerName}
          </Typography.Text>
          <Typography.Text className={tableClassNames.agentDetailMetaText}>
            Created On: {record.creationDate}
          </Typography.Text>
          <Typography.Text className={tableClassNames.agentDetailMetaText}>
            Version: {record.version}
          </Typography.Text>
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
      extra={
        <Button type="primary" className={tableClassNames.registerButton}>
          Register
        </Button>
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
