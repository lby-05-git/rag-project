import { useState, useRef, useEffect } from 'react';
import {
  Input,
  Button,
  Spin,
  Typography,
  message,
  Card,
  Row,
  Col,
} from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { query as apiQuery } from '../api/client';
import type { SourceItem } from '../api/client';
import ParameterPanel from './ParameterPanel';
import SourceCitation from './SourceCitation';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceItem[];
}

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatPanel({ messages, setMessages }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chunkSize, setChunkSize] = useState(400);
  const [threshold, setThreshold] = useState(0.5);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await apiQuery({
        question: q,
        chunk_size: chunkSize,
        similarity_threshold: threshold,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          sources: res.sources,
        },
      ]);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || err?.message || '请求失败';
      message.error(detail);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `错误：${detail}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={16} style={{ height: 'calc(100vh - 140px)' }}>
      {/* 左侧参数面板 */}
      <Col span={5}>
        <ParameterPanel
          chunkSize={chunkSize}
          threshold={threshold}
          onChunkSizeChange={setChunkSize}
          onThresholdChange={setThreshold}
        />
        <Card size="small" title="当前系统">
          <Text style={{ fontSize: 13 }}>
            分块大小：{chunkSize}
            <br />
            相似度阈值：{threshold.toFixed(2)}
          </Text>
        </Card>
      </Col>

      {/* 右侧对话区 */}
      <Col span={19}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 消息列表 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 8px',
              marginBottom: 12,
            }}
          >
            {messages.length === 0 && !loading && (
              <div
                style={{
                  textAlign: 'center',
                  marginTop: 120,
                  color: '#999',
                }}
              >
                <RobotOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Paragraph type="secondary" style={{ marginTop: 16 }}>
                  上传研报后，在这里提问即可开始智能问答
                </Paragraph>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  marginBottom: 16,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background:
                      msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#000',
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    {msg.role === 'user' ? (
                      <UserOutlined style={{ marginRight: 6 }} />
                    ) : (
                      <RobotOutlined style={{ marginRight: 6 }} />
                    )}
                    <Text
                      strong
                      style={{
                        fontSize: 12,
                        color: msg.role === 'user' ? '#fff' : '#666',
                      }}
                    >
                      {msg.role === 'user' ? '你' : 'AI'}
                    </Text>
                  </div>
                  <Text
                    style={{
                      fontSize: 14,
                      color: msg.role === 'user' ? '#fff' : '#000',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </Text>
                  {msg.sources && msg.sources.length > 0 && (
                    <SourceCitation sources={msg.sources} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', marginBottom: 16 }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#f5f5f5',
                  }}
                >
                  <Spin size="small" style={{ marginRight: 8 }} />
                  <Text type="secondary">思考中...</Text>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 输入区 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="输入你的问题，按 Enter 发送，Shift+Enter 换行"
              rows={2}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              style={{ height: 52 }}
            >
              发送
            </Button>
          </div>
        </div>
      </Col>
    </Row>
  );
}
