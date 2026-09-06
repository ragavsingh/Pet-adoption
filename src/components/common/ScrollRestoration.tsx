import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_STORAGE_KEY = 'pet_adoption_scroll_positions_v1';

interface ScrollCoordinate {
  x: number;
  y: number;
}

/**
 * Global Scroll Restoration Component
 * 
 * - When navigating to a new page (PUSH or pathname change), immediately scrolls to the top (0, 0).
 * - Preserves natural browser Back / Forward (POP) behavior by restoring the exact scroll position for each history key.
 * - Handles hash navigation (#anchor) by scrolling to the matching element.
 * - Manages both window scroll and inner layout scrollable containers (such as admin portal main).
 */
export const ScrollRestoration: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'
  const prevPathnameRef = useRef<string>(location.pathname);
  const prevKeyRef = useRef<string>(location.key);

  // In-memory cache backed by sessionStorage for history key -> {x, y}
  const positionsRef = useRef<Record<string, ScrollCoordinate>>((() => {
    try {
      const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })());

  // Set browser history scrollRestoration to manual so native browser doesn't conflict with SPA renders
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Continuously record scroll position for current history key with passive animation frame
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentPos = {
            x: window.scrollX || window.pageXOffset || 0,
            y: window.scrollY || window.pageYOffset || 0,
          };
          positionsRef.current[location.key] = currentPos;
          try {
            sessionStorage.setItem(
              SCROLL_STORAGE_KEY,
              JSON.stringify(positionsRef.current)
            );
          } catch {
            // Ignore quota limits or private browsing restrictions
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key]);

  // Main scroll restoration logic on route/location change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isNewPath = location.pathname !== prevPathnameRef.current;
    const isHash = Boolean(location.hash);

    // Save previous page position before updating refs
    if (prevKeyRef.current) {
      const prevPos = {
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0,
      };
      positionsRef.current[prevKeyRef.current] = prevPos;
    }

    prevPathnameRef.current = location.pathname;
    prevKeyRef.current = location.key;

    // Case 1: In-page Hash Anchor Navigation (e.g. #faq, #story)
    if (isHash) {
      const targetId = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return () => clearTimeout(timer);
    }

    // Case 2: Browser Back / Forward Navigation (POP)
    if (navigationType === 'POP') {
      const saved = positionsRef.current[location.key];
      if (saved) {
        const timer = setTimeout(() => {
          window.scrollTo({
            top: saved.y,
            left: saved.x,
            behavior: 'instant' as ScrollBehavior,
          });

          // Also restore inner scroll containers if present (e.g. admin layout)
          const scrollables = document.querySelectorAll('main.overflow-y-auto');
          scrollables.forEach((el) => {
            el.scrollTop = saved.y;
          });
        }, 15);
        return () => clearTimeout(timer);
      }
    }

    // Case 3: New Page Navigation (PUSH) or Pathname change during REPLACE
    // Reset scroll to top (0, 0) so the next page opens cleanly from the start
    if (navigationType === 'PUSH' || isNewPath) {
      const resetScroll = () => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant' as ScrollBehavior,
        });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Reset any inner scrollable main containers
        const scrollables = document.querySelectorAll('main, .overflow-y-auto');
        scrollables.forEach((el) => {
          el.scrollTop = 0;
        });
      };

      // Execute immediately and on subsequent frame to prevent layout shifts
      resetScroll();
      const frameId = requestAnimationFrame(() => {
        resetScroll();
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [location.pathname, location.search, location.hash, location.key, navigationType]);

  return null;
};
