import { useState } from 'react';
import ReportUploader from '../components/ReportUploader';
import ReportList from '../components/ReportList';

export default function ReportsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <ReportUploader onUploadSuccess={() => setRefreshKey((k) => k + 1)} />
      <ReportList refreshKey={refreshKey} />
    </div>
  );
}
