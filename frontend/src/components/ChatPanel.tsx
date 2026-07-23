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
  Avatar,
  Space,
  Empty,
  Tooltip,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { query as apiQuery } from '../api/client';
import type { SourceItem } from '../api/client';
import ParameterPanel from './ParameterPanel';
import SourceCitation from './SourceCitation';

const { Text } = Typography;
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
  const inputRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Auto focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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
    <Row gutter={16} style={{ height: 'calc(100vh - 156px)' }}>
      {/* 左侧参数面板 */}
      <Col xs={24} sm={24} md={8} lg={6} xl={5}>
        <div style={{ position: 'sticky', top: 0 }}>
          <ParameterPanel
            chunkSize={chunkSize}
            threshold={threshold}
            onChunkSizeChange={setChunkSize}
            onThresholdChange={setThreshold}
          />
          <Card size="small" style={{ marginTop: 8 }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 小提示
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                Enter 发送 · Shift+Enter 换行
                <br />
                参数变更后下次查询生效
              </Text>
            </Space>
          </Card>
        </div>
      </Col>

      {/* 右侧对话区 */}
      <Col xs={24} sm={24} md={16} lg={18} xl={19}>
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {/* 消息列表 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 16px 8px',
            }}
          >
            {messages.length === 0 && !loading && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size={8}>
                    <RobotOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
                    <Text type="secondary">上传研报后，输入问题开始智能问答</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      试试问："宁德时代2025年营收预测是多少？"
                    </Text>
                  </Space>
                }
                style={{ marginTop: 80 }}
              />
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className="message-enter"
                style={{
                  display: 'flex',
                  marginBottom: 20,
                  gap: 12,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {/* 头像 */}
                <Avatar
                  size={36}
                  icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                    color: msg.role === 'user' ? '#fff' : '#1677ff',
                    flexShrink: 0,
                    border: msg.role === 'assistant' ? '1px solid #e8e8e8' : 'none',
                  }}
                />

                {/* 气泡 */}
                <div style={{ maxWidth: '75%' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      background:
                        msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                      color: msg.role === 'user' ? '#fff' : '#000',
                      borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                      borderTopLeftRadius: msg.role === 'assistant' ? 4 : 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: msg.role === 'user' ? '#fff' : '#000',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.7,
                      }}
                    >
                      {msg.content}
                    </Text>
                    {msg.sources && msg.sources.length > 0 && (
                      <SourceCitation sources={msg.sources} />
                    )}
                  </div>

                  {/* 来源标记 */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 4, paddingLeft: 4 }}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 11 }}
                      >
                        基于 {msg.sources.length} 份来源
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 思考中指示器 */}
            {loading && (
              <div
                className="message-enter"
                style={{
                  display: 'flex',
                  marginBottom: 20,
                  gap: 12,
                }}
              >
                <Avatar
                  size={36}
                  icon={<RobotOutlined />}
                  style={{
                    backgroundColor: '#f5f5f5',
                    color: '#1677ff',
                    flexShrink: 0,
                    border: '1px solid #e8e8e8',
                  }}
                />
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: '#f5f5f5',
                    borderTopLeftRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Spin size="small" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 输入区 */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #f0f0f0',
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <TextArea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入问题，Enter 发送..."
                rows={2}
                disabled={loading}
                style={{ borderRadius: 8, fontSize: 14, resize: 'none' }}
              />
              <Tooltip title="发送">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={loading}
                  style={{
                    height: 52,
                    width: 52,
                    borderRadius: 8,
                  }}
                />
              </Tooltip>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
