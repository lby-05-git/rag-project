import { useState } from 'react';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: 'qa', icon: <HomeOutlined />, label: '智能问答' },
  { key: 'reports', icon: <FileTextOutlined />, label: '研报管理' },
  { key: 'history', icon: <HistoryOutlined />, label: '历史记录' },
];

function App() {
  const [currentPage, setCurrentPage] = useState('qa');

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
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
        </Sider>
        <Layout>
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              fontSize: 18,
              fontWeight: 500,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            {currentPage === 'qa' && '智能问答'}
            {currentPage === 'reports' && '研报管理'}
            {currentPage === 'history' && '历史记录'}
          </Header>
          <Content style={{ margin: 24 }}>
            {currentPage === 'qa' && <div>问答页面（待实现）</div>}
            {currentPage === 'reports' && <div>研报管理（待实现）</div>}
            {currentPage === 'history' && <div>历史记录（待实现）</div>}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
