import { useState, useEffect } from 'react';
import {
  ConfigProvider,
  Layout,
  Menu,
  Typography,
  Button,
  Badge,
  Space,
} from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  HistoryOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import ChatPanel from './components/ChatPanel';
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

function App() {
  const [currentPage, setCurrentPage] = useState('qa');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listDocuments()
      .then((res) => setDocCount(res.documents.length))
      .catch(() => {});
  }, [refreshKey]);

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#1677ff' },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={200} theme="light">
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            研报智能问答
          </div>
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={({ key }) => setCurrentPage(key)}
          />
          {/* 侧边栏底部：已上传文档信息 */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 0,
              right: 0,
              padding: '0 16px',
            }}
          >
            <Button
              type="dashed"
              block
              icon={<UploadOutlined />}
              onClick={() => setUploadOpen(true)}
              style={{ marginBottom: 8 }}
            >
              上传研报
            </Button>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
              已上传 {docCount} 份研报
            </Text>
          </div>
        </Sider>
        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Text strong style={{ fontSize: 18 }}>
              企业研报智能问答系统
            </Text>
            <Space>
              <Badge count={docCount} size="small" offset={[-5, 0]}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadOpen(true)}
                >
                  上传研报
                </Button>
              </Badge>
            </Space>
          </Header>
          <Content style={{ margin: 24 }}>
            {currentPage === 'qa' && <ChatPanel />}
            {currentPage === 'reports' && (
              <ReportsPage onUploadSuccess={() => setRefreshKey((k) => k + 1)} />
            )}
            {currentPage === 'history' && <HistoryPage />}
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
