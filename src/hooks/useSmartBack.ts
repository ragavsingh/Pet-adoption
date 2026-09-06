import { useNavigate, useLocation } from 'react-router-dom';

export const STACK_STORAGE_KEY = 'pet_adoption_nav_stack_v2';

export interface HistoryStackItem {
  key: string;
  pathname: string;
  search: string;
  timestamp: number;
}

/**
 * Retrieves the session navigation stack from sessionStorage.
 */
export function getSessionHistoryStack(): HistoryStackItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves the session navigation stack to sessionStorage.
 */
export function saveSessionHistoryStack(stack: HistoryStackItem[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STACK_STORAGE_KEY, JSON.stringify(stack));
  } catch {
    // Ignore quota issues
  }
}

/**
 * Reusable hook for intelligent in-app Back navigation.
 *
 * Ensures multi-level journeys (Page 1 -> Page 2 -> Page 3) return step-by-step
 * (Page 3 -> Page 2 -> Page 1) without skipping intermediate pages, while providing
 * a guaranteed fallback route if the user directly opened the URL.
 */
export function useSmartBack(fallbackPath: string = '/') {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const stack = getSessionHistoryStack();
    const hasPriorSessionHistory = stack.length > 1;
    const hasBrowserHistory = typeof window !== 'undefined' && window.history.length > 1;

    if (hasPriorSessionHistory || hasBrowserHistory) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return handleBack;
}
