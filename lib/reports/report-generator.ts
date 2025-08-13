import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportData {
  scanSession: {
    id: number;
    sessionId: string;
    fileName: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    totalChecks: number;
    completedChecks: number;
    riskScore?: number;
  };
  results: {
    id: number;
    ruleId: number;
    ruleName: string;
    ruleDescription: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pass' | 'fail' | 'warning' | 'info';
    message: string;
    confidence: number;
    affectedItems?: string[];
    recommendations?: string[];
    createdAt: string;
  }[];
  summary: {
    totalResults: number;
    resultsByStatus: Record<string, number>;
    resultsBySeverity: Record<string, number>;
    resultsByCategory: Record<string, number>;
    riskDistribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  organization?: {
    name: string;
    domain?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ReportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeDetails?: boolean;
  includeRecommendations?: boolean;
  filterBy?: {
    severity?: string[];
    status?: string[];
    category?: string[];
  };
  customFields?: string[];
  branding?: {
    logo?: string;
    companyName?: string;
    reportTitle?: string;
  };
}

export class ReportGenerator {
  private data: ReportData;
  private options: ReportOptions;

  constructor(data: ReportData, options: ReportOptions) {
    this.data = data;
    this.options = options;
  }

  async generate(): Promise<Blob> {
    switch (this.options.format) {
      case 'pdf':
        return this.generatePDF();
      case 'excel':
        return this.generateExcel();
      case 'csv':
        return this.generateCSV();
      default:
        throw new Error(`Unsupported format: ${this.options.format}`);
    }
  }

  private async generatePDF(): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Add header/branding
    yPosition = this.addPDFHeader(doc, yPosition);

    // Add executive summary
    if (this.options.includeSummary !== false) {
      yPosition = this.addPDFSummary(doc, yPosition);
    }

    // Add scan details
    yPosition = this.addPDFScanDetails(doc, yPosition);

    // Add results table
    if (this.options.includeDetails !== false) {
      yPosition = this.addPDFResultsTable(doc, yPosition);
    }

    // Add recommendations
    if (this.options.includeRecommendations) {
      yPosition = this.addPDFRecommendations(doc, yPosition);
    }

    // Add footer
    this.addPDFFooter(doc);

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  private addPDFHeader(doc: jsPDF, yPosition: number): number {
    const pageWidth = doc.internal.pageSize.width;
    
    // Title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    const title = this.options.branding?.reportTitle || 'AppCompatCheck Report';
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Subtitle
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    const subtitle = `Compatibility Analysis Report - ${this.data.scanSession.fileName}`;
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Date and organization
    doc.setFontSize(10);
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated: ${reportDate}`, 20, yPosition);
    
    if (this.data.organization) {
      doc.text(`Organization: ${this.data.organization.name}`, pageWidth - 20, yPosition, { align: 'right' });
    }
    
    yPosition += 20;

    // Horizontal line
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    return yPosition;
  }

  private addPDFSummary(doc: jsPDF, yPosition: number): number {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const summaryData = [
      ['Total Results', this.data.summary.totalResults.toString()],
      ['Risk Score', this.data.scanSession.riskScore?.toFixed(1) || 'N/A'],
      ['Scan Status', this.data.scanSession.status],
      ['Critical Issues', this.data.summary.riskDistribution.critical.toString()],
      ['High Priority Issues', this.data.summary.riskDistribution.high.toString()],
      ['Medium Priority Issues', this.data.summary.riskDistribution.medium.toString()],
      ['Low Priority Issues', this.data.summary.riskDistribution.low.toString()],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 },
    });

    return (doc as any).lastAutoTable.finalY + 20;
  }

  private addPDFScanDetails(doc: jsPDF, yPosition: number): number {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Scan Details', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const scanData = [
      ['Scan ID', this.data.scanSession.sessionId],
      ['File Name', this.data.scanSession.fileName],
      ['Started', new Date(this.data.scanSession.createdAt).toLocaleString()],
      ['Completed', this.data.scanSession.completedAt 
        ? new Date(this.data.scanSession.completedAt).toLocaleString() 
        : 'In Progress'],
      ['Total Checks', this.data.scanSession.totalChecks.toString()],
      ['Completed Checks', this.data.scanSession.completedChecks.toString()],
      ['Analyst', `${this.data.user.firstName} ${this.data.user.lastName}`],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Property', 'Value']],
      body: scanData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 },
    });

    return (doc as any).lastAutoTable.finalY + 20;
  }

  private addPDFResultsTable(doc: jsPDF, yPosition: number): number {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Detailed Results', 20, yPosition);
    yPosition += 15;

    // Filter results if needed
    let results = this.data.results;
    if (this.options.filterBy) {
      results = this.applyFilters(results);
    }

    const tableData = results.map(result => [
      result.ruleName,
      result.category,
      result.severity.toUpperCase(),
      result.status.toUpperCase(),
      result.confidence + '%',
      result.message.length > 50 ? result.message.substring(0, 50) + '...' : result.message,
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Rule', 'Category', 'Severity', 'Status', 'Confidence', 'Message']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 50 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          // Color code severity
          const severity = data.cell.text[0].toLowerCase();
          switch (severity) {
            case 'critical':
              data.cell.styles.fillColor = [220, 53, 69];
              data.cell.styles.textColor = [255, 255, 255];
              break;
            case 'high':
              data.cell.styles.fillColor = [255, 193, 7];
              break;
            case 'medium':
              data.cell.styles.fillColor = [255, 235, 59];
              break;
            case 'low':
              data.cell.styles.fillColor = [76, 175, 80];
              data.cell.styles.textColor = [255, 255, 255];
              break;
          }
        }
      },
    });

    return (doc as any).lastAutoTable.finalY + 20;
  }

  private addPDFRecommendations(doc: jsPDF, yPosition: number): number {
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Recommendations', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Collect all unique recommendations
    const recommendations = new Set<string>();
    this.data.results.forEach(result => {
      if (result.recommendations) {
        result.recommendations.forEach(rec => recommendations.add(rec));
      }
    });

    // Add general recommendations based on severity distribution
    const criticalCount = this.data.summary.riskDistribution.critical;
    const highCount = this.data.summary.riskDistribution.high;

    if (criticalCount > 0) {
      recommendations.add('Immediate action required: Address all critical severity issues before deployment.');
    }
    if (highCount > 5) {
      recommendations.add('High priority: Review and remediate high severity findings to reduce security risk.');
    }
    if (this.data.scanSession.riskScore && this.data.scanSession.riskScore > 7) {
      recommendations.add('Consider implementing additional security controls to reduce overall risk score.');
    }

    const recArray = Array.from(recommendations);
    recArray.forEach((rec, index) => {
      doc.text(`${index + 1}. ${rec}`, 25, yPosition);
      yPosition += 8;
      
      // Check for page break
      if (yPosition > doc.internal.pageSize.height - 30) {
        doc.addPage();
        yPosition = 30;
      }
    });

    return yPosition + 10;
  }

  private addPDFFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Generated by AppCompatCheck', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Report generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  private async generateExcel(): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    if (this.options.includeSummary !== false) {
      this.addExcelSummarySheet(workbook);
    }

    // Scan Details Sheet
    this.addExcelScanDetailsSheet(workbook);

    // Results Sheet
    if (this.options.includeDetails !== false) {
      this.addExcelResultsSheet(workbook);
    }

    // Recommendations Sheet
    if (this.options.includeRecommendations) {
      this.addExcelRecommendationsSheet(workbook);
    }

    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  private addExcelSummarySheet(workbook: XLSX.WorkBook): void {
    const summaryData = [
      ['AppCompatCheck Report Summary'],
      [''],
      ['Scan Information'],
      ['Scan ID', this.data.scanSession.sessionId],
      ['File Name', this.data.scanSession.fileName],
      ['Status', this.data.scanSession.status],
      ['Risk Score', this.data.scanSession.riskScore?.toFixed(1) || 'N/A'],
      [''],
      ['Results Summary'],
      ['Total Results', this.data.summary.totalResults],
      ['Critical Issues', this.data.summary.riskDistribution.critical],
      ['High Priority Issues', this.data.summary.riskDistribution.high],
      ['Medium Priority Issues', this.data.summary.riskDistribution.medium],
      ['Low Priority Issues', this.data.summary.riskDistribution.low],
      [''],
      ['Results by Status'],
      ...Object.entries(this.data.summary.resultsByStatus).map(([status, count]) => [status, count]),
      [''],
      ['Results by Category'],
      ...Object.entries(this.data.summary.resultsByCategory).map(([category, count]) => [category, count]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 25 },
      { width: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
  }

  private addExcelScanDetailsSheet(workbook: XLSX.WorkBook): void {
    const scanDetails = [
      ['Scan Details'],
      [''],
      ['Property', 'Value'],
      ['Scan ID', this.data.scanSession.sessionId],
      ['Session ID', this.data.scanSession.id.toString()],
      ['File Name', this.data.scanSession.fileName],
      ['Status', this.data.scanSession.status],
      ['Created At', new Date(this.data.scanSession.createdAt).toLocaleString()],
      ['Completed At', this.data.scanSession.completedAt 
        ? new Date(this.data.scanSession.completedAt).toLocaleString() 
        : 'In Progress'],
      ['Total Checks', this.data.scanSession.totalChecks],
      ['Completed Checks', this.data.scanSession.completedChecks],
      ['Risk Score', this.data.scanSession.riskScore?.toFixed(1) || 'N/A'],
      [''],
      ['Analyst Information'],
      ['Name', `${this.data.user.firstName} ${this.data.user.lastName}`],
      ['Email', this.data.user.email],
    ];

    if (this.data.organization) {
      scanDetails.push(
        [''],
        ['Organization Information'],
        ['Organization', this.data.organization.name],
        ['Domain', this.data.organization.domain || 'N/A']
      );
    }

    const worksheet = XLSX.utils.aoa_to_sheet(scanDetails);
    
    worksheet['!cols'] = [
      { width: 20 },
      { width: 40 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scan Details');
  }

  private addExcelResultsSheet(workbook: XLSX.WorkBook): void {
    let results = this.data.results;
    if (this.options.filterBy) {
      results = this.applyFilters(results);
    }

    const headers = [
      'ID',
      'Rule Name',
      'Rule Description',
      'Category',
      'Severity',
      'Status',
      'Message',
      'Confidence',
      'Created At',
    ];

    if (this.options.includeRecommendations) {
      headers.push('Recommendations');
    }

    const data = [headers];
    
    results.forEach(result => {
      const row = [
        result.id,
        result.ruleName,
        result.ruleDescription,
        result.category,
        result.severity.toUpperCase(),
        result.status.toUpperCase(),
        result.message,
        `${result.confidence}%`,
        new Date(result.createdAt).toLocaleString(),
      ];

      if (this.options.includeRecommendations) {
        row.push(result.recommendations?.join('; ') || '');
      }

      data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 8 },   // ID
      { width: 25 },  // Rule Name
      { width: 40 },  // Rule Description
      { width: 15 },  // Category
      { width: 10 },  // Severity
      { width: 10 },  // Status
      { width: 50 },  // Message
      { width: 12 },  // Confidence
      { width: 20 },  // Created At
    ];

    if (this.options.includeRecommendations) {
      worksheet['!cols']!.push({ width: 50 }); // Recommendations
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
  }

  private addExcelRecommendationsSheet(workbook: XLSX.WorkBook): void {
    const recommendations = new Set<string>();
    this.data.results.forEach(result => {
      if (result.recommendations) {
        result.recommendations.forEach(rec => recommendations.add(rec));
      }
    });

    // Add general recommendations
    const criticalCount = this.data.summary.riskDistribution.critical;
    const highCount = this.data.summary.riskDistribution.high;

    if (criticalCount > 0) {
      recommendations.add('Immediate action required: Address all critical severity issues before deployment.');
    }
    if (highCount > 5) {
      recommendations.add('High priority: Review and remediate high severity findings to reduce security risk.');
    }

    const data = [
      ['Recommendations'],
      [''],
      ['Priority', 'Recommendation'],
    ];

    const recArray = Array.from(recommendations);
    recArray.forEach((rec, index) => {
      const priority = rec.includes('Immediate action') ? 'CRITICAL' :
                     rec.includes('High priority') ? 'HIGH' : 'MEDIUM';
      data.push([priority, rec]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    worksheet['!cols'] = [
      { width: 12 },  // Priority
      { width: 80 },  // Recommendation
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recommendations');
  }

  private async generateCSV(): Promise<Blob> {
    let results = this.data.results;
    if (this.options.filterBy) {
      results = this.applyFilters(results);
    }

    const headers = [
      'ID',
      'Rule Name', 
      'Rule Description',
      'Category',
      'Severity',
      'Status',
      'Message',
      'Confidence',
      'Created At',
    ];

    if (this.options.includeRecommendations) {
      headers.push('Recommendations');
    }

    const csvContent = [headers.join(',')];

    results.forEach(result => {
      const row = [
        result.id,
        `"${result.ruleName}"`,
        `"${result.ruleDescription}"`,
        result.category,
        result.severity.toUpperCase(),
        result.status.toUpperCase(),
        `"${result.message.replace(/"/g, '""')}"`,
        `${result.confidence}%`,
        new Date(result.createdAt).toLocaleString(),
      ];

      if (this.options.includeRecommendations) {
        row.push(`"${result.recommendations?.join('; ') || ''}"`);
      }

      csvContent.push(row.join(','));
    });

    return new Blob([csvContent.join('\n')], { type: 'text/csv' });
  }

  private applyFilters(results: ReportData['results']): ReportData['results'] {
    let filtered = results;

    if (this.options.filterBy?.severity) {
      filtered = filtered.filter(r => this.options.filterBy!.severity!.includes(r.severity));
    }

    if (this.options.filterBy?.status) {
      filtered = filtered.filter(r => this.options.filterBy!.status!.includes(r.status));
    }

    if (this.options.filterBy?.category) {
      filtered = filtered.filter(r => this.options.filterBy!.category!.includes(r.category));
    }

    return filtered;
  }
}

// Utility function to generate report filename
export function generateReportFilename(
  scanSessionId: string, 
  format: string, 
  timestamp: Date = new Date()
): string {
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `appcompat-report-${scanSessionId}-${dateStr}-${timeStr}.${format}`;
}