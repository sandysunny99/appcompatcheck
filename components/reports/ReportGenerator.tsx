'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Settings, 
  Filter,
  FileSpreadsheet,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ReportGenerator, ReportOptions, generateReportFilename } from '@/lib/reports/report-generator';

interface ReportGeneratorProps {
  scanId: number;
  sessionId: string;
  fileName: string;
  disabled?: boolean;
}

interface GenerationStatus {
  isGenerating: boolean;
  progress: number;
  status: string;
  error?: string;
}

export function ReportGeneratorComponent({ scanId, sessionId, fileName, disabled }: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    isGenerating: false,
    progress: 0,
    status: 'Ready to generate',
  });

  const [options, setOptions] = useState<ReportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    includeRecommendations: true,
    branding: {
      companyName: 'AppCompatCheck',
      reportTitle: 'Compatibility Analysis Report',
    },
  });

  const [filters, setFilters] = useState({
    severity: [] as string[],
    status: [] as string[],
    category: [] as string[],
  });

  const handleGenerateReport = async () => {
    try {
      setGenerationStatus({
        isGenerating: true,
        progress: 10,
        status: 'Fetching scan data...',
      });

      // Fetch the complete scan data
      const response = await fetch(`/api/reports/data/${scanId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch scan data');
      }

      setGenerationStatus(prev => ({
        ...prev,
        progress: 30,
        status: 'Processing report data...',
      }));

      const reportData = await response.json();

      setGenerationStatus(prev => ({
        ...prev,
        progress: 50,
        status: 'Generating report...',
      }));

      // Apply filters if any are selected
      const reportOptions: ReportOptions = {
        ...options,
        filterBy: {
          severity: filters.severity.length > 0 ? filters.severity : undefined,
          status: filters.status.length > 0 ? filters.status : undefined,
          category: filters.category.length > 0 ? filters.category : undefined,
        },
      };

      // Generate the report
      const generator = new ReportGenerator(reportData, reportOptions);
      const blob = await generator.generate();

      setGenerationStatus(prev => ({
        ...prev,
        progress: 90,
        status: 'Creating download...',
      }));

      // Create download link
      const url = URL.createObjectURL(blob);
      const filename = generateReportFilename(sessionId, options.format);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setGenerationStatus({
        isGenerating: false,
        progress: 100,
        status: 'Report generated successfully!',
      });

      // Log the report generation
      await fetch('/api/reports/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          format: options.format,
          options: reportOptions,
        }),
      });

      setTimeout(() => {
        setIsOpen(false);
        setGenerationStatus({
          isGenerating: false,
          progress: 0,
          status: 'Ready to generate',
        });
      }, 2000);

    } catch (error) {
      console.error('Report generation failed:', error);
      setGenerationStatus({
        isGenerating: false,
        progress: 0,
        status: 'Ready to generate',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const handleFormatChange = (format: string) => {
    setOptions(prev => ({ ...prev, format: format as 'pdf' | 'excel' | 'csv' }));
  };

  const handleOptionChange = (key: keyof ReportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterChange = (type: keyof typeof filters, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [type]: checked 
        ? [...prev[type], value]
        : prev[type].filter(item => item !== value),
    }));
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4" />;
      case 'csv': return <FileImage className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf': return 'Professional PDF report with charts and formatting';
      case 'excel': return 'Detailed Excel workbook with multiple sheets';
      case 'csv': return 'Simple CSV file for data analysis';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive report for scan: {fileName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Report Format</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['pdf', 'excel', 'csv'] as const).map((format) => (
                <Card 
                  key={format}
                  className={`cursor-pointer transition-all ${
                    options.format === format 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleFormatChange(format)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {getFormatIcon(format)}
                      <span className="font-medium">{format.toUpperCase()}</span>
                      <p className="text-xs text-gray-600">
                        {getFormatDescription(format)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Content Options</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSummary"
                  checked={options.includeSummary}
                  onCheckedChange={(checked) => handleOptionChange('includeSummary', checked)}
                />
                <Label htmlFor="includeSummary">Executive Summary</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={options.includeDetails}
                  onCheckedChange={(checked) => handleOptionChange('includeDetails', checked)}
                />
                <Label htmlFor="includeDetails">Detailed Results</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRecommendations"
                  checked={options.includeRecommendations}
                  onCheckedChange={(checked) => handleOptionChange('includeRecommendations', checked)}
                />
                <Label htmlFor="includeRecommendations">Recommendations</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => handleOptionChange('includeCharts', checked)}
                  disabled={options.format === 'csv'}
                />
                <Label htmlFor="includeCharts">Charts & Graphs</Label>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters (Optional)
            </Label>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Severity Filter */}
              <div>
                <Label className="text-sm font-medium">Severity</Label>
                <div className="space-y-2 mt-2">
                  {['critical', 'high', 'medium', 'low'].map((severity) => (
                    <div key={severity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`severity-${severity}`}
                        checked={filters.severity.includes(severity)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('severity', severity, !!checked)
                        }
                      />
                      <Label htmlFor={`severity-${severity}`} className="text-sm">
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2 mt-2">
                  {['fail', 'warning', 'pass', 'info'].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status.includes(status)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('status', status, !!checked)
                        }
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <div className="space-y-2 mt-2">
                  {['security_tool', 'framework', 'library', 'configuration'].map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category}`}
                        checked={filters.category.includes(category)}
                        onCheckedChange={(checked) => 
                          handleFilterChange('category', category, !!checked)
                        }
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm">
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Branding Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Branding (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={options.branding?.companyName || ''}
                  onChange={(e) => handleOptionChange('branding', {
                    ...options.branding,
                    companyName: e.target.value,
                  })}
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <Label htmlFor="reportTitle">Report Title</Label>
                <Input
                  id="reportTitle"
                  value={options.branding?.reportTitle || ''}
                  onChange={(e) => handleOptionChange('branding', {
                    ...options.branding,
                    reportTitle: e.target.value,
                  })}
                  placeholder="Custom Report Title"
                />
              </div>
            </div>
          </div>

          {/* Generation Status */}
          {(generationStatus.isGenerating || generationStatus.error) && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Generation Status</span>
                    {generationStatus.isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : generationStatus.error ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  
                  {generationStatus.isGenerating && (
                    <Progress value={generationStatus.progress} className="w-full" />
                  )}
                  
                  <p className={`text-sm ${
                    generationStatus.error ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {generationStatus.error || generationStatus.status}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={generationStatus.isGenerating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={generationStatus.isGenerating}
          >
            {generationStatus.isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}