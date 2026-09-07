import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import {
  HistoryStackItem,
  getSessionHistoryStack,
  saveSessionHistoryStack,
} from '../../hooks/useSmartBack';
const SCROLL_STORAGE_KEY = 'pet_adoption_scroll_history_v4';

interface ScrollEntry {
  x: number;
  y: number;
  timestamp: number;
}

export const ScrollRestoration: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'

  const prevLocationRef = useRef<{ pathname: string; search: string; key: string } | null>(null);
  const isRestoringRef = useRef<boolean>(false);
  const userInteractedRef = useRef<boolean>(false);
  const targetRestorationYRef = useRef<number>(0);
  const activeKeyRef = useRef<string>(location.key);

  // Cached positions by unique history key (location.key)
  const keyPositionsRef = useRef<Record<string, ScrollEntry>>((() => {
    try {
      const stored = sessionStorage.getItem(`${SCROLL_STORAGE_KEY}_keys`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })());

  // Cached positions by history index (window.history.state.idx) for multi-level navigation
  const idxPositionsRef = useRef<Record<number, ScrollEntry>>((() => {
    try {
      const stored = sessionStorage.getItem(`${SCROLL_STORAGE_KEY}_idx`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })());

  // Cached positions by pathname + search (fallback when key is new or unavailable)
  const pathPositionsRef = useRef<Record<string, ScrollEntry>>((() => {
    try {
      const stored = sessionStorage.getItem(`${SCROLL_STORAGE_KEY}_paths`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })());

  // Session navigation stack tracking
  const historyStackRef = useRef<HistoryStackItem[]>(getSessionHistoryStack());

  // Mutable ref of the latest known scroll position to eliminate throttled lag
  const latestScrollPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Set browser history scrollRestoration to manual so native browser doesn't conflict with async SPA renders
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

  const getScrollY = (): number => {
    const mainContainer = document.querySelector('main.overflow-y-auto');
    if (mainContainer && mainContainer.scrollTop > 0) {
      return mainContainer.scrollTop;
    }
    return (
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  };

  const getScrollX = (): number => {
    return window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
  };

  const setScrollY = (y: number, x: number = 0) => {
    window.scrollTo({ top: y, left: x, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = y;
    document.body.scrollTop = y;

    const mainContainers = document.querySelectorAll('main.overflow-y-auto, [data-scroll-container]');
    mainContainers.forEach((el) => {
      el.scrollTop = y;
    });
  };

  const persistToSession = () => {
    try {
      sessionStorage.setItem(`${SCROLL_STORAGE_KEY}_keys`, JSON.stringify(keyPositionsRef.current));
      sessionStorage.setItem(`${SCROLL_STORAGE_KEY}_idx`, JSON.stringify(idxPositionsRef.current));
      sessionStorage.setItem(`${SCROLL_STORAGE_KEY}_paths`, JSON.stringify(pathPositionsRef.current));
    } catch {
      // Ignore storage quota limits
    }
  };

  /**
   * Synchronously records the current scroll position for the active page.
   * Called immediately on link clicks, touch events, and before navigation transitions.
   */
  const recordCurrentPosition = (targetKey?: string, targetPath?: string, targetSearch?: string) => {
    if (isRestoringRef.current && !userInteractedRef.current) return;

    const y = getScrollY();
    const x = getScrollX();
    const currentY = y > 0 ? y : latestScrollPosRef.current.y;
    const currentX = x > 0 ? x : latestScrollPosRef.current.x;

    if (currentY <= 0) return;

    const k = targetKey || activeKeyRef.current || location.key;
    const p = targetPath || location.pathname;
    const s = targetSearch !== undefined ? targetSearch : location.search;

    const entry: ScrollEntry = { x: currentX, y: currentY, timestamp: Date.now() };

    if (k) keyPositionsRef.current[k] = entry;
    if (p) pathPositionsRef.current[p] = entry;
    if (s && p) pathPositionsRef.current[p + s] = entry;

    // Only update idxPositionsRef when snapshotting the current active page, never retroactively
    if (!targetKey) {
      const historyIdx = window.history.state?.idx;
      if (typeof historyIdx === 'number') {
        idxPositionsRef.current[historyIdx] = entry;
      }
    }

    persistToSession();
  };

  // Passive, real-time scroll tracker while actively viewing the page
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      const y = getScrollY();
      const x = getScrollX();

      if (y > 0) {
        latestScrollPosRef.current = { x, y };
      }

      // Do not overwrite real saved positions during active programmatic restoration
      if (isRestoringRef.current && !userInteractedRef.current) return;

      // If user has not physically touched or scrolled the page,
      // prevent transient layout shifts or 0-resets from overwriting the target position
      if (!userInteractedRef.current && targetRestorationYRef.current > 0) {
        if (Math.abs(y - targetRestorationYRef.current) > 40) {
          return;
        }
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (isRestoringRef.current && !userInteractedRef.current) {
            ticking = false;
            return;
          }

          if (!userInteractedRef.current && targetRestorationYRef.current > 0) {
            const checkY = getScrollY();
            if (Math.abs(checkY - targetRestorationYRef.current) > 40) {
              ticking = false;
              return;
            }
          }

          const currentY = getScrollY();
          const currentX = getScrollX();
          const entry: ScrollEntry = { x: currentX, y: currentY, timestamp: Date.now() };

          if (currentY > 0 || !keyPositionsRef.current[location.key]) {
            keyPositionsRef.current[location.key] = entry;
          }
          if (currentY > 0 || !pathPositionsRef.current[location.pathname]) {
            pathPositionsRef.current[location.pathname] = entry;
          }
          if (location.search && (currentY > 0 || !pathPositionsRef.current[location.pathname + location.search])) {
            pathPositionsRef.current[location.pathname + location.search] = entry;
          }

          const historyIdx = window.history.state?.idx;
          if (typeof historyIdx === 'number' && (currentY > 0 || !idxPositionsRef.current[historyIdx])) {
            idxPositionsRef.current[historyIdx] = entry;
          }

          persistToSession();
          ticking = false;
        });
        ticking = true;
      }
    };

    // User touch/manual interaction detection: releases restoration lock when user physically touches/drags
    const handleUserInteraction = () => {
      userInteractedRef.current = true;
      isRestoringRef.current = false;
    };

    // Global tap/click capture on links: guarantees scroll position is captured before route change
    const handleGlobalLinkTap = (e: MouseEvent | TouchEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        'a, button, [role="link"], [role="button"], [data-nav], [data-pet-card]'
      );
      if (target) {
        recordCurrentPosition();
      }
    };

    const handlePopState = () => {
      recordCurrentPosition();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserInteraction, { passive: true });
    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('mousedown', handleUserInteraction, { passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('popstate', handlePopState);

    document.addEventListener('click', handleGlobalLinkTap, { capture: true });
    document.addEventListener('touchstart', handleGlobalLinkTap, { capture: true, passive: true });

    window.addEventListener('beforeunload', () => recordCurrentPosition());
    window.addEventListener('pagehide', () => recordCurrentPosition());

    const mainContainers = document.querySelectorAll('main.overflow-y-auto');
    mainContainers.forEach((el) => el.addEventListener('scroll', handleScroll, { passive: true }));

    return () => {
      // Snapshot final position before route unmounts
      recordCurrentPosition();

      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('touchmove', handleUserInteraction);
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('popstate', handlePopState);

      document.removeEventListener('click', handleGlobalLinkTap, { capture: true });
      document.removeEventListener('touchstart', handleGlobalLinkTap, { capture: true });

      mainContainers.forEach((el) => el.removeEventListener('scroll', handleScroll));
    };
  }, [location.key, location.pathname, location.search]);

  // Main navigation stack and restoration engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prev = prevLocationRef.current;
    const current = location;

    // Reset user interaction flag on route change
    userInteractedRef.current = false;

    // Track Navigation Stack
    const currentItem: HistoryStackItem = {
      key: current.key,
      pathname: current.pathname,
      search: current.search,
      timestamp: Date.now(),
    };

    if (navigationType === 'PUSH') {
      historyStackRef.current.push(currentItem);
      saveSessionHistoryStack(historyStackRef.current);
    } else if (navigationType === 'POP') {
      const existingIdx = historyStackRef.current.findIndex((item) => item.key === current.key);
      if (existingIdx !== -1) {
        historyStackRef.current = historyStackRef.current.slice(0, existingIdx + 1);
      } else {
        historyStackRef.current.push(currentItem);
      }
      saveSessionHistoryStack(historyStackRef.current);
    } else if (navigationType === 'REPLACE') {
      if (historyStackRef.current.length > 0) {
        historyStackRef.current[historyStackRef.current.length - 1] = currentItem;
      } else {
        historyStackRef.current.push(currentItem);
      }
      saveSessionHistoryStack(historyStackRef.current);
    }

    prevLocationRef.current = {
      pathname: current.pathname,
      search: current.search,
      key: current.key,
    };

    // Case 1: In-Page Hash Anchor Navigation (e.g. #faq, #story)
    if (current.hash) {
      const targetId = current.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    // Case 2: In-place filter/search change on the SAME pathname (e.g. /pets?species=Dog)
    // Maintain current scroll position so user's filter interactions don't jump to top
    if (prev && prev.pathname === current.pathname && prev.search !== current.search) {
      return;
    }

    // Case 3: Re-clicking the currently active nav link (e.g. on /pets and click Find Pets in navbar)
    // User wants to return to the top of the current page
    if (prev && prev.pathname === current.pathname && prev.search === current.search && navigationType === 'PUSH') {
      resetScrollToTop();
      return;
    }

    // Case 4: Navigation Back (POP)
    const isPop = navigationType === 'POP';

    // Determine target restoration position
    let targetPos: ScrollEntry | null = null;

    if (isPop) {
      const historyIdx = window.history.state?.idx;
      const idxEntry = typeof historyIdx === 'number' ? idxPositionsRef.current[historyIdx] : null;
      const keyEntry = current.key ? keyPositionsRef.current[current.key] : null;
      const queryEntry = pathPositionsRef.current[current.pathname + current.search];
      const pathEntry = pathPositionsRef.current[current.pathname];

      // Prioritize entry with valid positive scroll position
      targetPos =
        (idxEntry && idxEntry.y > 0 ? idxEntry : null) ||
        (keyEntry && keyEntry.y > 0 ? keyEntry : null) ||
        (queryEntry && queryEntry.y > 0 ? queryEntry : null) ||
        (pathEntry && pathEntry.y > 0 ? pathEntry : null) ||
        idxEntry ||
        keyEntry ||
        queryEntry ||
        pathEntry ||
        null;
    }

    // If we have a valid saved scroll position > 0 during Back navigation, restore it
    if (isPop && targetPos && targetPos.y > 0) {
      performAsyncScrollRestoration(targetPos.y, targetPos.x);
    } else {
      // Otherwise, this is an intentional new page navigation (PUSH/REPLACE) -> start naturally at the top (0, 0)
      resetScrollToTop();
    }
  }, [location.pathname, location.search, location.hash, location.key, navigationType]);

  const performAsyncScrollRestoration = (targetY: number, targetX: number = 0) => {
    isRestoringRef.current = true;
    userInteractedRef.current = false;
    targetRestorationYRef.current = targetY;

    const attemptScroll = (): boolean => {
      // If user started interacting with touch or wheel, abort programmatic restoration
      if (userInteractedRef.current) return true;

      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);

      // Mobile dynamic toolbar & address bar collapse tolerance:
      // On mobile phones, the browser address bar collapses/expands by 50-70px.
      // If maxScroll has expanded to within 60px of targetY, we can fulfill the target scroll position.
      if (maxScroll >= targetY - 60) {
        setScrollY(targetY, targetX);
        const actualY = getScrollY();
        const isNearTarget = Math.abs(actualY - targetY) <= 40 || actualY >= targetY - 50;
        const isNearBottom = targetY >= maxScroll - 70 && actualY >= maxScroll - 50;
        if (isNearTarget || isNearBottom) {
          return true;
        }
      }

      // If page is still loading async cards/images, scroll as far as possible down
      if (maxScroll > 0) {
        setScrollY(Math.min(targetY, maxScroll), targetX);
      }
      return false;
    };

    // Phase 1: Immediate attempt
    if (attemptScroll()) {
      // Verify and lock on next animation frame
      requestAnimationFrame(() => {
        if (!userInteractedRef.current) {
          setScrollY(targetY, targetX);
        }
        setTimeout(() => {
          if (!userInteractedRef.current) {
            setScrollY(targetY, targetX);
          }
          setTimeout(() => {
            if (!userInteractedRef.current) {
              isRestoringRef.current = false;
              targetRestorationYRef.current = 0;
            }
          }, 150);
        }, 100);
      });
      return;
    }

    // Phase 2: Asynchronous DOM expansion observer (for async Supabase listings, images loading)
    let cleanupTimer: any = null;
    let observer: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let pollInterval: any = null;
    let lastHeight = 0;
    let stableTicks = 0;

    const finish = () => {
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      if (cleanupTimer) clearTimeout(cleanupTimer);
      if (pollInterval) clearInterval(pollInterval);

      setTimeout(() => {
        if (!userInteractedRef.current) {
          isRestoringRef.current = false;
          targetRestorationYRef.current = 0;
        }
      }, 150);
    };

    const handleDomUpdate = () => {
      if (attemptScroll()) {
        finish();
      }
    };

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(handleDomUpdate);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    }

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleDomUpdate);
      resizeObserver.observe(document.documentElement);
      resizeObserver.observe(document.body);
    }

    // High frequency polling fallback (every 25ms)
    pollInterval = setInterval(() => {
      if (attemptScroll()) {
        finish();
        return;
      }

      const currentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      if (currentHeight === lastHeight && currentHeight > 0) {
        stableTicks++;
        // If document height has been completely stable for 350ms (14 ticks * 25ms) and readyState is complete
        if (stableTicks >= 14 && (typeof document !== 'undefined' && document.readyState === 'complete')) {
          const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
          const currentMaxScroll = Math.max(0, currentHeight - clientHeight);
          setScrollY(Math.min(targetY, currentMaxScroll), targetX);
          finish();
        }
      } else {
        lastHeight = currentHeight;
        stableTicks = 0;
      }
    }, 25);

    // Safety timeout: finalize after 2.5 seconds
    cleanupTimer = setTimeout(() => {
      attemptScroll();
      finish();
    }, 2500);
  };

  const resetScrollToTop = () => {
    isRestoringRef.current = true;
    userInteractedRef.current = false;
    targetRestorationYRef.current = 0;
    setScrollY(0, 0);

    requestAnimationFrame(() => {
      setScrollY(0, 0);
      requestAnimationFrame(() => {
        setScrollY(0, 0);
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 80);
      });
    });
  };
  return null;
};
