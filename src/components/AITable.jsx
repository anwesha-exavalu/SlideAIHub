import { useMemo } from 'react';
import { Avatar, Card, Space, Table, Tag } from 'antd';
import { ApiOutlined, RobotOutlined } from '@ant-design/icons';
import { tableClassNames } from './StyleComponent.js';
import { agentRowsJson } from './agentRows.jsx';

const CATEGORY_COLOR_MAP = {
  Automation: 'geekblue',
  Analytics: 'cyan',
  'Knowledge Search': 'purple',
  Compliance: 'magenta',
  Communication: 'gold',
  'Quality Assurance': 'green',
};

function AITable() {
  const columns = useMemo(
    () => [
      {
        title: 'Agent Name',
        dataIndex: 'agentName',
        key: 'agentName',
        render: (value) => (
          <Space>
            <Avatar size="small" icon={<ApiOutlined />} className={tableClassNames.agentAvatar} />
            <span>{value}</span>
          </Space>
        ),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        render: (value) => <Tag color={CATEGORY_COLOR_MAP[value] ?? 'default'}>{value}</Tag>,
      },
      {
        title: 'Specialization',
        dataIndex: 'specialization',
        key: 'specialization',
      },
    ],
    [],
  );

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
      extra={<Tag color="blue">API integration later</Tag>}
    >
      <Table
        className={tableClassNames.table}
        columns={columns}
        dataSource={mappedRows}
        pagination={{ pageSize: 6, hideOnSinglePage: true }}
        scroll={{ x: 760 }}
      />
    </Card>
  );
}

export default AITable;
