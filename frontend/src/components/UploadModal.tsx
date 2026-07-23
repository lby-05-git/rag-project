import { useState, useEffect } from 'react';
import { Modal, Upload, Slider, Typography, message, Badge } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { upload, listDocuments } from '../api/client';

const { Text } = Typography;
const { Dragger } = Upload;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ open, onClose, onSuccess }: Props) {
  const [chunkSize, setChunkSize] = useState(400);
  const [uploading, setUploading] = useState(false);

  const handleUpload: UploadProps['customRequest'] = async ({ file }) => {
    setUploading(true);
    try {
      const res = await upload(file as File, chunkSize);
      message.success(res.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || '上传失败';
      message.error(detail);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title="上传研报"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnClose
    >
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ fontSize: 13 }}>
          分块大小：{chunkSize}
        </Text>
        <Slider
          min={200}
          max={1000}
          step={50}
          value={chunkSize}
          onChange={setChunkSize}
          marks={{ 200: '200', 500: '500', 1000: '1000' }}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          较小的分块适合精准检索，较大的分块保留更多上下文
        </Text>
      </div>

      <Dragger
        customRequest={handleUpload}
        showUploadList={false}
        accept=".pdf"
        disabled={uploading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {uploading ? '正在上传并索引...' : '点击或拖拽 PDF 研报到此处'}
        </p>
        <p className="ant-upload-hint">仅支持 PDF 格式</p>
      </Dragger>
    </Modal>
  );
}
