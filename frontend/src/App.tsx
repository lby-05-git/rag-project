import { useState, useEffect } from 'react';
import {
  ConfigProvider,
  Layout,
  Menu,
  Typography,
  Button,
  Badge,
  Space,
  theme,
  Tooltip,
} from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  UploadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import ChatPanel from './components/ChatPanel';
import type { Message } from './components/ChatPanel';
import ReportsPage from './pages/ReportsPage';
import HistoryPage from './pages/HistoryPage';
import UploadModal from './components/UploadModal';
import { listDocuments } from './api/client';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: 'qa', icon: <HomeOutlined />, label: '智能问答' },
  { key: 'reports', icon: <FileTextOutlined />, label: '研报管理' },
  { key: 'history', icon: <HistoryOutlined />, label: '历史记录' },
];

const PAGE_TITLES: Record<string, string> = {
  qa: '智能问答',
  reports: '研报管理',
  history: '历史记录',
};

function App() {
  const [currentPage, setCurrentPage] = useState('qa');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    listDocuments()
      .then((res) => setDocCount(res.documents.length))
      .catch(() => {});
  }, [refreshKey]);

  const renderPage = () => {
    switch (currentPage) {
      case 'qa':
        return <ChatPanel messages={messages} setMessages={setMessages} />;
      case 'reports':
        return (
          <ReportsPage onUploadSuccess={() => setRefreshKey((k) => k + 1)} />
        );
      case 'history':
        return <HistoryPage />;
      default:
        return null;
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* 侧边栏 */}
        <Sider
          width={220}
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            borderRight: '1px solid #f0f0f0',
            position: 'relative',
          }}
        >
          <div className="sidebar-logo">
            <Text strong style={{ fontSize: collapsed ? 14 : 16 }}>
              {collapsed ? '📊' : '📊 研报智能问答'}
            </Text>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={({ key }) => setCurrentPage(key)}
            style={{ borderInlineEnd: 'none' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 0,
              right: 0,
              padding: collapsed ? '0 8px' : '0 16px',
            }}
          >
            {!collapsed && (
              <>
                <Button
                  type="dashed"
                  block
                  icon={<UploadOutlined />}
                  onClick={() => setUploadOpen(true)}
                  style={{ marginBottom: 6, borderRadius: 6 }}
                >
                  上传研报
                </Button>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  已上传 {docCount} 份研报
                </Text>
              </>
            )}
          </div>
        </Sider>

        {/* 主区域 */}
        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
              height: 56,
              lineHeight: '56px',
            }}
          >
            <Space>
              <Text strong style={{ fontSize: 17 }}>
                {PAGE_TITLES[currentPage]}
              </Text>
              {currentPage === 'qa' && messages.length > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {messages.filter((m) => m.role === 'assistant').length} 次回答
                </Text>
              )}
            </Space>
            <Space size={12}>
              {currentPage === 'qa' && messages.length > 0 && (
                <Tooltip title="清空对话">
                  <Button
                    type="text"
                    icon={<ClearOutlined />}
                    onClick={() => setMessages([])}
                    size="small"
                  />
                </Tooltip>
              )}
              <Badge count={docCount} size="small" offset={[-5, 0]}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadOpen(true)}
                  size="middle"
                  style={{ borderRadius: 6 }}
                >
                  上传研报
                </Button>
              </Badge>
            </Space>
          </Header>

          <Content
            style={{
              margin: 0,
              padding: 20,
              background: '#f5f5f5',
              minHeight: 280,
              overflow: 'auto',
            }}
          >
            <div
              key={currentPage}
              className="page-enter-active"
              style={{ height: '100%' }}
            >
              {renderPage()}
            </div>
          </Content>
        </Layout>
      </Layout>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </ConfigProvider>
  );
}

export default App;
