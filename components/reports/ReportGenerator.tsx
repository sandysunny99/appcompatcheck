'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileText, Clock, Server } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ReportGeneratorProps {
  userId: number;
  organizationId: number;
}

export function ReportGenerator({ userId, organizationId }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState('comprehensive');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          filters: {
            userId,
            organizationId,
          },
          includeDetails,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setGeneratedReport(data);

      toast({
        title: 'Report Generated',
        description: `${data.file.filename} has been created successfully.`,
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = () => {
    if (!generatedReport) return;

    const dataStr = JSON.stringify(generatedReport.report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generatedReport.file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate New Report</CardTitle>
        <CardDescription>
          Create a comprehensive compatibility analysis report with timestamp and hostname
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                <SelectItem value="security">Security Focused</SelectItem>
                <SelectItem value="compatibility">Compatibility Check</SelectItem>
                <SelectItem value="performance">Performance Metrics</SelectItem>
                <SelectItem value="summary">Executive Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="include-details"
              checked={includeDetails}
              onChange={(e) => setIncludeDetails(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="include-details" className="text-sm font-normal">
              Include detailed scan data and issue breakdowns
            </Label>
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateReport} 
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>

        {/* Generated Report Info */}
        {generatedReport && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Report Generated Successfully</h3>
              <Button 
                onClick={handleDownloadReport}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Filename:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {generatedReport.file.filename}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Generated:</span>
                <span>{new Date(generatedReport.report.metadata.generatedAt).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Hostname:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {generatedReport.report.metadata.hostname}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Report ID:</span>
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {generatedReport.report.metadata.reportId}
                </code>
              </div>
            </div>

            {/* Report Summary */}
            <div className="pt-3 border-t">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Scans:</span>
                  <span className="ml-2 font-medium">{generatedReport.report.summary.totalScans}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Issues:</span>
                  <span className="ml-2 font-medium">{generatedReport.report.summary.totalIssues}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Critical:</span>
                  <span className="ml-2 font-medium text-red-600">{generatedReport.report.summary.criticalIssues}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="ml-2 font-medium text-green-600">{generatedReport.report.summary.scanSuccessRate}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
