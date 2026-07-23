import { Card, Slider, Typography, Tag, Space, Divider } from 'antd';
import {
  ScissorOutlined,
  FilterOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  chunkSize: number;
  threshold: number;
  onChunkSizeChange: (v: number) => void;
  onThresholdChange: (v: number) => void;
}

export default function ParameterPanel({
  chunkSize,
  threshold,
  onChunkSizeChange,
  onThresholdChange,
}: Props) {
  return (
    <Card
      size="small"
      style={{
        borderRadius: 8,
        border: '1px solid #e8e8e8',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={4}>
        <Text strong style={{ fontSize: 13, marginBottom: 4 }}>
          <ScissorOutlined style={{ marginRight: 6 }} />
          分块大小
        </Text>
        <div style={{ padding: '0 4px' }}>
          <Slider
            min={200}
            max={1000}
            step={50}
            value={chunkSize}
            onChange={onChunkSizeChange}
            tooltip={{ open: false }}
            marks={{ 200: '200', 500: '500', 1000: '1000' }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            小块·精准
          </Text>
          <Tag
            color="blue"
            style={{ fontSize: 12, fontWeight: 600, borderRadius: 4 }}
          >
            {chunkSize}
          </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            大块·完整
          </Text>
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <Text strong style={{ fontSize: 13, marginBottom: 4 }}>
          <FilterOutlined style={{ marginRight: 6 }} />
          相似度阈值
        </Text>
        <div style={{ padding: '0 4px' }}>
          <Slider
            min={0.1}
            max={1.0}
            step={0.05}
            value={threshold}
            onChange={onThresholdChange}
            tooltip={{ open: false }}
            marks={{ 0.1: '0.1', 0.5: '0.5', 1.0: '1.0' }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            宽松·多召回
          </Text>
          <Tag
            color="green"
            style={{ fontSize: 12, fontWeight: 600, borderRadius: 4 }}
          >
            {threshold.toFixed(2)}
          </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            严格·高精度
          </Text>
        </div>
      </Space>
    </Card>
  );
}
