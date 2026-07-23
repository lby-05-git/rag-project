import { useState } from 'react';
import { Upload, Button, message, Card, Slider, Typography, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { upload } from '../api/client';

const { Text } = Typography;
const { Dragger } = Upload;

interface Props {
  onUploadSuccess: () => void;
}

export default function ReportUploader({ onUploadSuccess }: Props) {
  const [chunkSize, setChunkSize] = useState(400);
  const [uploading, setUploading] = useState(false);

  const handleUpload: UploadProps['customRequest'] = async ({ file, onProgress }) => {
    setUploading(true);
    try {
      const res = await upload(file as File, chunkSize);
      message.success(res.message);
      onUploadSuccess();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || '上传失败';
      message.error(detail);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card title="上传研报" style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <div>
          <Text strong style={{ fontSize: 13 }}>分块大小：{chunkSize}</Text>
          <Slider
            min={200}
            max={1000}
            step={50}
            value={chunkSize}
            onChange={setChunkSize}
            marks={{ 200: '200', 500: '500', 1000: '1000' }}
          />
        </div>

        <Dragger
          customRequest={handleUpload}
          showUploadList={false}
          accept=".pdf"
          disabled={uploading}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            {uploading ? '正在上传并索引...' : '点击或拖拽 PDF 研报到此处'}
          </p>
          <p className="ant-upload-hint">仅支持 PDF 格式</p>
        </Dragger>
      </Space>
    </Card>
  );
}
