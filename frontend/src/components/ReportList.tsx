import { useState, useEffect } from 'react';
import { Table, Tag, Typography, Card, Button, Popconfirm, message } from 'antd';
import { FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import { listDocuments, deleteDocument } from '../api/client';
import type { DocumentItem } from '../api/client';

const { Text } = Typography;

interface Props {
  refreshKey: number;
  onRefresh: () => void;
}

export default function ReportList({ refreshKey, onRefresh }: Props) {
  const [data, setData] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listDocuments()
      .then((res) => setData(res.documents))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleDelete = async (filename: string) => {
    try {
      await deleteDocument(filename);
      message.success(`已删除 ${filename}`);
      onRefresh();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || '删除失败';
      message.error(detail);
    }
  };

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
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: DocumentItem) => (
        <Popconfirm
          title="确定删除这份研报？"
          description="删除后该研报的向量数据将不再可用"
          onConfirm={() => handleDelete(record.filename)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
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
