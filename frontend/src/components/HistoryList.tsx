import { useState, useEffect } from 'react';
import { List, Typography, Tag, Button, Empty, Card, Popconfirm, message } from 'antd';
import { DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

interface SessionItem {
  id: number;
  title: string;
  turn_count: number;
  first_asked: string;
  last_asked: string;
}

export default function HistoryList() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [records, setRecords] = useState<any[]>([]);

  const fetchSessions = () => {
    setLoading(true);
    axios
      .get('/api/qa/sessions')
      .then((res) => setSessions(res.data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchSessionDetail = (id: number) => {
    axios
      .get(`/api/qa/sessions/${id}`)
      .then((res) => {
        setRecords(res.data.records || []);
        setSelected(id);
      })
      .catch(() => message.error('加载会话详情失败'));
  };

  const deleteSession = async (id: number) => {
    try {
      await axios.delete(`/api/qa/sessions/${id}`);
      message.success('已删除');
      if (selected === id) {
        setSelected(null);
        setRecords([]);
      }
      fetchSessions();
    } catch {
      message.error('删除失败');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (selected !== null) {
    return (
      <div>
        <Button
          type="link"
          onClick={() => {
            setSelected(null);
            setRecords([]);
          }}
          style={{ marginBottom: 16, padding: 0 }}
        >
          ← 返回列表
        </Button>
        <Card title={`会话 #${selected}`}>
          {records.map((r, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div
                style={{
                  background: '#e6f4ff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <Text strong>问：</Text>
                <Text>{r.question}</Text>
              </div>
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '8px 12px',
                  borderRadius: 8,
                }}
              >
                <Text strong>答：</Text>
                <Text>{r.answer}</Text>
              </div>
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <Card title="历史记录">
      <List
        dataSource={sessions}
        loading={loading}
        locale={{ emptyText: '暂无问答历史' }}
        renderItem={(item) => (
          <List.Item
            style={{ cursor: 'pointer' }}
            actions={[
              <Popconfirm
                title="确定删除？"
                onConfirm={() => deleteSession(item.id)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <div
              style={{ flex: 1 }}
              onClick={() => fetchSessionDetail(item.id)}
            >
              <div>
                <HistoryOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                <Text strong>{item.title || `会话 #${item.id}`}</Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Tag>{item.turn_count} 轮</Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(item.last_asked).toLocaleString('zh-CN')}
                </Text>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
}
