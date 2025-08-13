'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Play,
  Pause,
  Square,
  RefreshCw
} from 'lucide-react';
import { useScanUpdates } from '@/lib/websocket/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface ScanProgressProps {
  scanId: number;
  initialStatus?: {
    status: string;
    progress: number;
    startedAt: string;
    sessionId: string;
  };
  onStatusChange?: (status: string) => void;
}

export function ScanProgress({ scanId, initialStatus, onStatusChange }: ScanProgressProps) {
  const { scanStatus, scanResults, connected } = useScanUpdates(scanId);
  const [localStatus, setLocalStatus] = useState(initialStatus);

  // Update local status when WebSocket provides updates
  useEffect(() => {
    if (scanStatus) {
      const newStatus = {
        status: scanStatus.status,
        progress: scanStatus.progress,
        startedAt: localStatus?.startedAt || new Date().toISOString(),
        sessionId: localStatus?.sessionId || `scan_${scanId}`,
      };
      setLocalStatus(newStatus);
      onStatusChange?.(scanStatus.status);
    }
  }, [scanStatus, scanId, localStatus?.startedAt, localStatus?.sessionId, onStatusChange]);

  const currentStatus = scanStatus || localStatus;
  const progress = currentStatus?.progress || 0;
  const status = currentStatus?.status || 'pending';

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
      case 'processing':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getProgressColor = (status: string, progress: number) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'failed' || status === 'error') return 'bg-red-500';
    if (status === 'paused') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatDuration = (startedAt?: string) => {
    if (!startedAt) return 'Not started';
    return formatDistanceToNow(new Date(startedAt), { addSuffix: false });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Scan Progress</span>
            <Badge variant="outline" className={getStatusColor(status)}>
              {getStatusIcon(status)}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2"
            // Custom color based on status
            style={{
              '--progress-foreground': getProgressColor(status, progress)
            } as React.CSSProperties}
          />
        </div>

        {/* Scan Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Scan ID:</span>
            <span className="ml-2 font-mono">#{scanId}</span>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2">{formatDuration(localStatus?.startedAt)}</span>
          </div>
        </div>

        {/* Results Summary (if available) */}
        {scanResults && (
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium text-sm">Results Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Results:</span>
                <span className="ml-2 font-semibold">{scanResults.totalResults}</span>
              </div>
              <div>
                <span className="text-gray-600">New Results:</span>
                <span className="ml-2 font-semibold text-green-600">+{scanResults.newResults}</span>
              </div>
            </div>
            {scanResults.riskScore !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">Risk Score:</span>
                <Badge 
                  variant={scanResults.riskScore > 7 ? 'destructive' : 
                          scanResults.riskScore > 4 ? 'default' : 'secondary'}
                >
                  {scanResults.riskScore.toFixed(1)}/10
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {scanStatus?.message && (
          <div className="border-t pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Status Update</p>
                <p className="text-sm text-gray-600">{scanStatus.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-4 flex gap-2">
          {status === 'running' && (
            <Button variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          {status === 'paused' && (
            <Button variant="outline" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
          
          {(status === 'running' || status === 'paused') && (
            <Button variant="outline" size="sm">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
          
          {status === 'failed' && (
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {/* Connection Status Warning */}
        {!connected && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Real-time updates unavailable
                </p>
                <p className="text-sm text-yellow-700">
                  Status updates may be delayed. Check your connection.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for use in tables or lists
export function ScanProgressCompact({ scanId, status, progress }: { 
  scanId: number; 
  status: string; 
  progress: number; 
}) {
  const { scanStatus, connected } = useScanUpdates(scanId);
  
  const currentStatus = scanStatus?.status || status;
  const currentProgress = scanStatus?.progress || progress;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'running':
      case 'processing':
        return 'text-blue-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      case 'paused':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor(currentStatus)}`}>
            {currentStatus}
          </span>
          <span className="text-xs text-gray-500">
            {currentProgress.toFixed(0)}%
          </span>
        </div>
        <Progress value={currentProgress} className="h-1 mt-1" />
      </div>
    </div>
  );
}