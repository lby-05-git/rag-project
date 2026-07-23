import { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { listDocuments } from '../api/client';
import type { DocumentItem } from '../api/client';

const { Text } = Typography;

interface Props {
  refreshKey: number;
}

export default function ReportList({ refreshKey }: Props) {
  const [data, setData] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listDocuments()
      .then((res) => setData(res.documents))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (name: string) => (
        <span>
          <FileTextOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          {name}
        </span>
      ),
    },
    {
      title: '文本块数',
      dataIndex: 'chunks',
      key: 'chunks',
      width: 120,
      render: (v: number) => <Tag>{v} 块</Tag>,
    },
    {
      title: '上传时间',
      dataIndex: 'uploaded_at',
      key: 'uploaded_at',
      width: 200,
      render: (t: string) => new Date(t).toLocaleString('zh-CN'),
    },
  ];

  return (
    <Card title="已上传研报">
      <Table
        dataSource={data}
        columns={columns}
        rowKey="filename"
        loading={loading}
        pagination={false}
        locale={{ emptyText: '暂无研报，请上传 PDF' }}
      />
    </Card>
  );
}
