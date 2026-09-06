import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_STORAGE_KEY = 'pet_adoption_scroll_history_v2';

interface ScrollEntry {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Universal Scroll Restoration and History Engine
 *
 * 1. Detail-to-Listing / Back Navigation:
 *    When navigating back from a detail/profile page to a listing page (e.g. /pets/:id -> /pets),
 *    or when using browser Back/Forward (POP), restores the exact scroll position where the user left off.
 *
 * 2. Asynchronous Content Awareness:
 *    For pages that fetch data asynchronously (e.g. PetsPage, RequestsPage), watches DOM height
 *    via ResizeObserver/MutationObserver so the scroll position is accurately restored once the
 *    content items render, preventing browser clamping to 0.
 *
 * 3. New Page Navigation:
 *    When intentionally navigating to a new section (Home -> Find Pets, About, Contact, etc.),
 *    opens cleanly and naturally from the very beginning of the page (0, 0).
 *
 * 4. Filter and Search Preservation:
 *    When modifying filters or query parameters on the same page, maintains the user's scroll position.
 */
export const ScrollRestoration: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'

  const prevLocationRef = useRef<{ pathname: string; search: string; key: string } | null>(null);
  const isRestoringRef = useRef<boolean>(false);

  // Cached positions by unique history key
  const keyPositionsRef = useRef<Record<string, ScrollEntry>>((() => {
    try {
      const stored = sessionStorage.getItem(`${SCROLL_STORAGE_KEY}_keys`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })());

  // Cached positions by pathname (e.g. '/pets', '/adopter/requests')
  const pathPositionsRef = useRef<Record<string, ScrollEntry>>((() => {
    try {
      const stored = sessionStorage.getItem(`${SCROLL_STORAGE_KEY}_paths`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })());

  // Session navigation stack tracking
  const historyStackRef = useRef<string[]>([location.pathname]);

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
    return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
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
      sessionStorage.setItem(`${SCROLL_STORAGE_KEY}_paths`, JSON.stringify(pathPositionsRef.current));
    } catch {
      // Ignore storage quota limits
    }
  };

  // Passive, throttled scroll position tracker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      // Never overwrite real saved positions during active restoration or transient layout shifts
      if (isRestoringRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = getScrollY();
          const x = window.scrollX || window.pageXOffset || 0;
          const entry: ScrollEntry = { x, y, timestamp: Date.now() };

          keyPositionsRef.current[location.key] = entry;
          pathPositionsRef.current[location.pathname] = entry;
          if (location.search) {
            pathPositionsRef.current[location.pathname + location.search] = entry;
          }

          persistToSession();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const mainContainers = document.querySelectorAll('main.overflow-y-auto');
    mainContainers.forEach((el) => el.addEventListener('scroll', handleScroll, { passive: true }));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mainContainers.forEach((el) => el.removeEventListener('scroll', handleScroll));
    };
  }, [location.key, location.pathname, location.search]);

  // Main scroll restoration and navigation engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prev = prevLocationRef.current;
    const current = location;

    // Save previous page position before handling route transition
    if (prev) {
      const prevY = getScrollY();
      const prevX = window.scrollX || window.pageXOffset || 0;
      const entry: ScrollEntry = { x: prevX, y: prevY, timestamp: Date.now() };

      keyPositionsRef.current[prev.key] = entry;
      pathPositionsRef.current[prev.pathname] = entry;
      if (prev.search) {
        pathPositionsRef.current[prev.pathname + prev.search] = entry;
      }
      persistToSession();
    }

    // Update history stack
    if (navigationType === 'PUSH') {
      historyStackRef.current.push(current.pathname);
    } else if (navigationType === 'POP' && historyStackRef.current.length > 1) {
      historyStackRef.current.pop();
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
    // Maintain current scroll position so user's filter interactions don't bounce to top
    if (prev && prev.pathname === current.pathname && prev.search !== current.search) {
      return;
    }

    // Case 3: Re-clicking the currently active nav link (e.g. on /pets and click Find Pets in navbar)
    // User wants to return to the top of the current page
    if (prev && prev.pathname === current.pathname && prev.search === current.search && navigationType === 'PUSH') {
      resetScrollToTop();
      return;
    }

    // Case 4: Returning from a Detail/Profile page back to its Listing page
    // (e.g., /pets/:id -> /pets, /adopter/requests/:id -> /adopter/requests, /provider/pets/:id -> /provider/pets)
    const isChildToParent = Boolean(
      prev &&
      prev.pathname !== current.pathname &&
      prev.pathname.startsWith(current.pathname === '/' ? '///' : `${current.pathname}/`)
    );

    // Case 5: Browser Back or Forward Button (POP navigation)
    const isPop = navigationType === 'POP';

    // Determine target restoration position
    let targetPos: ScrollEntry | null = null;

    if (isPop) {
      // 1. By history key for exact historical position
      targetPos = keyPositionsRef.current[current.key] ||
                  pathPositionsRef.current[current.pathname + current.search] ||
                  pathPositionsRef.current[current.pathname] || null;
    } else if (isChildToParent) {
      // 2. By path + search or path when returning from a detail page
      targetPos = pathPositionsRef.current[current.pathname + current.search] ||
                  pathPositionsRef.current[current.pathname] || null;
    }

    // If we have a valid saved scroll position > 0, restore it asynchronously
    if (targetPos && targetPos.y > 0) {
      performAsyncScrollRestoration(targetPos.y, targetPos.x);
    } else {
      // Otherwise, this is a clean, intentional navigation to a new page -> start from top (0, 0)
      resetScrollToTop();
    }
  }, [location.pathname, location.search, location.hash, location.key, navigationType]);

  const performAsyncScrollRestoration = (targetY: number, targetX: number = 0) => {
    isRestoringRef.current = true;

    const attemptScroll = (): boolean => {
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const clientHeight = window.innerHeight;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);

      // Check if page height has expanded enough to satisfy target scroll position
      if (scrollHeight >= targetY + 80 || maxScroll >= targetY) {
        setScrollY(targetY, targetX);
        return true;
      }

      // If page is still loading async cards, scroll as far as possible for now
      if (maxScroll > 0) {
        setScrollY(Math.min(targetY, maxScroll), targetX);
      }
      return false;
    };

    // If document is already tall enough (e.g. cached), scroll immediately
    if (attemptScroll()) {
      requestAnimationFrame(() => {
        setScrollY(targetY, targetX);
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 50);
      });
      return;
    }

    // If document is not tall enough yet (e.g. PetsPage is fetching listings from Supabase),
    // set up observers to retry the moment async cards are rendered into the DOM
    let cleanupTimer: any = null;
    let observer: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const finish = () => {
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      if (cleanupTimer) clearTimeout(cleanupTimer);
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    };

    const handleDomUpdate = () => {
      if (attemptScroll()) {
        finish();
      }
    };

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(handleDomUpdate);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleDomUpdate);
      resizeObserver.observe(document.body);
    }

    // Polling interval check every 50ms as fallback
    const intervalId = setInterval(() => {
      if (attemptScroll()) {
        clearInterval(intervalId);
        finish();
      }
    }, 50);

    // Safety timeout: stop observing after 2 seconds
    cleanupTimer = setTimeout(() => {
      clearInterval(intervalId);
      attemptScroll();
      finish();
    }, 2000);
  };

  const resetScrollToTop = () => {
    isRestoringRef.current = true;
    setScrollY(0, 0);

    // Run on successive animation frames to ensure layout doesn't bounce
    requestAnimationFrame(() => {
      setScrollY(0, 0);
      requestAnimationFrame(() => {
        setScrollY(0, 0);
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 50);
      });
    });
  };

  return null;
};
