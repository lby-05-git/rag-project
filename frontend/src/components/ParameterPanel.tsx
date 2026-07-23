import { Card, Slider, Typography, Space } from 'antd';

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
      title="检索参数"
      size="small"
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <div>
          <Text strong style={{ fontSize: 13 }}>
            分块大小 (chunk_size)
          </Text>
          <div style={{ padding: '0 4px' }}>
            <Slider
              min={200}
              max={1000}
              step={50}
              value={chunkSize}
              onChange={onChunkSizeChange}
              marks={{ 200: '200', 500: '500', 1000: '1000' }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            当前值：{chunkSize}
          </Text>
        </div>

        <div>
          <Text strong style={{ fontSize: 13 }}>
            相似度阈值
          </Text>
          <div style={{ padding: '0 4px' }}>
            <Slider
              min={0.1}
              max={1.0}
              step={0.05}
              value={threshold}
              onChange={onThresholdChange}
              marks={{ 0.1: '0.1', 0.5: '0.5', 1.0: '1.0' }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            当前值：{threshold.toFixed(2)}
          </Text>
        </div>
      </Space>
    </Card>
  );
}
