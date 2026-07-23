import { Collapse, Tag, Typography } from 'antd';
import type { SourceItem } from '../api/client';

const { Text } = Typography;

interface Props {
  sources: SourceItem[];
}

export default function SourceCitation({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  const items = sources.map((s, i) => ({
    key: String(i),
    label: (
      <span>
        <Tag color="blue" style={{ marginRight: 8 }}>
          来源 {i + 1}
        </Tag>
        <Text style={{ fontSize: 13 }}>{s.source}</Text>
        <Tag style={{ marginLeft: 8 }}>第 {s.page} 页</Tag>
        <Tag color="green">{(s.score * 100).toFixed(0)}%</Tag>
      </span>
    ),
    children: (
      <Text style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
        {s.content}
      </Text>
    ),
  }));

  return (
    <Collapse
      ghost
      size="small"
      items={items}
      style={{ marginTop: 8 }}
    />
  );
}
