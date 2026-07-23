import { useState } from 'react';
import ReportUploader from '../components/ReportUploader';
import ReportList from '../components/ReportList';

interface Props {
  onUploadSuccess?: () => void;
}

export default function ReportsPage({ onUploadSuccess }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    onUploadSuccess?.();
  };

  return (
    <div>
      <ReportUploader onUploadSuccess={handleRefresh} />
      <ReportList refreshKey={refreshKey} onRefresh={handleRefresh} />
    </div>
  );
}
