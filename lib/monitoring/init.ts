import { SystemMonitor } from './system-monitor';
import { DatabaseMaintenanceScheduler } from '@/lib/performance/database-optimization';

// Initialize monitoring system
export async function initializeMonitoring(): Promise<void> {
  console.log('Initializing monitoring system...');
  
  try {
    // Start system monitoring
    const monitor = SystemMonitor.getInstance();
    monitor.startMonitoring(30); // 30 second intervals
    
    // Start database maintenance scheduler
    DatabaseMaintenanceScheduler.startScheduledMaintenance(24); // 24 hours
    
    console.log('Monitoring system initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize monitoring system:', error);
    throw error;
  }
}

// Cleanup monitoring system
export async function cleanupMonitoring(): Promise<void> {
  console.log('Cleaning up monitoring system...');
  
  try {
    // Stop system monitoring
    const monitor = SystemMonitor.getInstance();
    monitor.stopMonitoring();
    
    // Stop database maintenance scheduler
    DatabaseMaintenanceScheduler.stopScheduledMaintenance();
    
    console.log('Monitoring system cleaned up successfully');
    
  } catch (error) {
    console.error('Failed to cleanup monitoring system:', error);
  }
}

// Initialize on module load in production
if (process.env.NODE_ENV === 'production') {
  initializeMonitoring().catch(console.error);
  
  // Cleanup on process exit
  process.on('SIGINT', async () => {
    await cleanupMonitoring();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await cleanupMonitoring();
    process.exit(0);
  });
}