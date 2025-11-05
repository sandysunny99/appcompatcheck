'use client';

import { useEffect } from 'react';

/**
 * useHydrationFix Hook
 * 
 * Cleans up attributes injected by browser extensions that cause hydration mismatches.
 * Common culprits: Bitdefender TrafficLight, Dark Reader, Grammarly, etc.
 * 
 * This is a workaround for a known issue where browser extensions modify the DOM
 * before React's hydration completes, causing hydration warnings.
 * 
 * @see https://react.dev/link/hydration-mismatch
 * @see HYDRATION_MISMATCH_FIX.md
 */
export function useHydrationFix() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // List of known extension-injected attributes
    const extensionAttributes = [
      'bis_skin_checked',           // Bitdefender TrafficLight
      'avast_checked',               // Avast
      'data-darkreader-mode',        // Dark Reader
      'data-darkreader-scheme',      // Dark Reader
      'data-grammarly-shadow-root',  // Grammarly
      'data-lastpass-icon-root',     // LastPass
      'data-1p-ignore',              // 1Password
      'data-dashlane-rid',           // Dashlane
    ];

    /**
     * Remove extension attributes from all elements
     */
    const cleanupExtensionAttributes = () => {
      extensionAttributes.forEach(attr => {
        try {
          document.querySelectorAll(`[${attr}]`).forEach(element => {
            element.removeAttribute(attr);
          });
        } catch (error) {
          // Silently fail if querySelector is not supported or throws
          console.debug(`Failed to remove attribute ${attr}:`, error);
        }
      });
    };

    // Initial cleanup after hydration
    cleanupExtensionAttributes();

    // Set up MutationObserver to catch dynamically added attributes
    const observer = new MutationObserver((mutations) => {
      let needsCleanup = false;

      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const attributeName = mutation.attributeName;
          if (attributeName && extensionAttributes.includes(attributeName)) {
            needsCleanup = true;
            break;
          }
        }
      }

      if (needsCleanup) {
        cleanupExtensionAttributes();
      }
    });

    // Observe the entire document for attribute changes
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: extensionAttributes,
    });

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);
}

/**
 * Higher-order component to wrap components with hydration fix
 * 
 * Usage:
 * ```tsx
 * export default withHydrationFix(MyComponent);
 * ```
 */
export function withHydrationFix<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function HydrationFixWrapper(props: P) {
    useHydrationFix();
    return <Component {...props} />;
  };
}
