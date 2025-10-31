/**
 * Client-Side System Information Utility
 * Captures browser and device information that can be sent to the server
 * 
 * Note: This runs in the browser and captures client-side information.
 * It does NOT have access to the actual computer hostname for security reasons.
 */

export interface ClientSystemInfo {
  platform: string;
  timezone: string;
  language: string;
  screenResolution: string;
}

/**
 * Capture client-side system information from the browser
 * This function should be called from client components before initiating a scan
 */
export function getClientSystemInfo(): ClientSystemInfo {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      platform: 'Unknown',
      timezone: 'Unknown',
      language: 'Unknown',
      screenResolution: 'Unknown',
    };
  }

  try {
    // Get platform information
    // Note: navigator.platform is deprecated but still widely supported
    // Alternative: navigator.userAgentData?.platform (only in newer browsers)
    const platform = navigator.platform || 
                    (navigator as any).userAgentData?.platform || 
                    'Unknown Platform';

    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

    // Get language
    const language = navigator.language || navigator.languages?.[0] || 'Unknown';

    // Get screen resolution
    const screenResolution = `${window.screen.width}x${window.screen.height}`;

    return {
      platform,
      timezone,
      language,
      screenResolution,
    };
  } catch (error) {
    console.error('Failed to capture client system info:', error);
    return {
      platform: 'Unknown',
      timezone: 'Unknown',
      language: 'Unknown',
      screenResolution: 'Unknown',
    };
  }
}

/**
 * Get a human-readable description of the client system
 */
export function getClientSystemDescription(): string {
  const info = getClientSystemInfo();
  return `${info.platform} | ${info.screenResolution} | ${info.timezone} | ${info.language}`;
}
