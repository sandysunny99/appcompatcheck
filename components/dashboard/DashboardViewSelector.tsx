'use client';

/**
 * Dashboard View Selector
 * 
 * Allows users to toggle between:
 * - Classic Dashboard View (light, traditional)
 * - Falcon-Style Dashboard (dark, security-focused)
 */

import { useState, useEffect } from 'react';
import { EnhancedDashboard } from './EnhancedDashboard';
import { FalconStyleDashboard } from './FalconStyleDashboard';
import { Button } from '@/components/ui/button';
import { Shield, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardViewSelectorProps {
  userId: number;
  userEmail: string;
  organizationId?: number;
}

export function DashboardViewSelector({ 
  userId, 
  userEmail, 
  organizationId 
}: DashboardViewSelectorProps) {
  const [view, setView] = useState<'classic' | 'falcon'>('falcon');
  
  // Load saved preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('dashboardView') as 'classic' | 'falcon' | null;
    if (savedView) {
      setView(savedView);
    }
  }, []);

  // Save preference to localStorage
  const handleViewChange = (newView: 'classic' | 'falcon') => {
    setView(newView);
    localStorage.setItem('dashboardView', newView);
  };

  return (
    <div className="relative">
      {/* View Toggle - Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2 p-2 rounded-lg bg-slate-900 border border-slate-700 shadow-2xl">
        <Button
          onClick={() => handleViewChange('falcon')}
          variant={view === 'falcon' ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            "gap-2 transition-all",
            view === 'falcon' 
              ? "bg-cyan-500 hover:bg-cyan-600 text-white" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Shield className="w-4 h-4" />
          Falcon
        </Button>
        <Button
          onClick={() => handleViewChange('classic')}
          variant={view === 'classic' ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            "gap-2 transition-all",
            view === 'classic' 
              ? "bg-blue-500 hover:bg-blue-600 text-white" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Classic
        </Button>
      </div>

      {/* Render Selected Dashboard */}
      {view === 'falcon' ? (
        <FalconStyleDashboard
          userId={userId}
          userEmail={userEmail}
          organizationId={organizationId}
          theme="dark"
        />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <EnhancedDashboard
            userId={userId}
            userEmail={userEmail}
            organizationId={organizationId}
          />
        </div>
      )}
    </div>
  );
}
