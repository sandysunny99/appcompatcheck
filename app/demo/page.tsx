import { ScanResultsDemo } from '@/components/reports/ScanResultsDemo';

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Demo Mode</h2>
        <p className="text-sm text-blue-700">
          This is a demonstration of the scan results page with sample data. 
          In production, this data would come from actual code scans stored in your database.
        </p>
      </div>
      <ScanResultsDemo />
    </div>
  );
}
