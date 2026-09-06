import React, { useState, useEffect } from 'react';
import { resolveUserAvatar, getGoogleDefaultAvatar } from '../../utils/avatarUtils';

export interface UserAvatarProps {
  user?: {
    name?: string | null;
    fullName?: string | null;
    email?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
    profile_image_url?: string | null;
  } | null;
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  alt?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl',
  '2xl': 'w-28 h-28 text-3xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  src,
  name: propName,
  email: propEmail,
  size = 'md',
  className = '',
  alt,
}) => {
  const resolvedName = propName || user?.name || user?.fullName || '';
  const resolvedEmail = propEmail || user?.email || '';
  const initialSource = resolveUserAvatar(
    user || {
      avatar: src,
      name: resolvedName,
      email: resolvedEmail,
    }
  );

  const [currentSrc, setCurrentSrc] = useState<string>(initialSource);

  // Sync state if user or source props change
  useEffect(() => {
    const updated = resolveUserAvatar(
      user || {
        avatar: src,
        name: resolvedName,
        email: resolvedEmail,
      }
    );
    setCurrentSrc(updated);
  }, [src, user, resolvedName, resolvedEmail]);

  const handleError = () => {
    // Gracefully fallback to Google/Gmail initial avatar if external image fails
    setCurrentSrc(getGoogleDefaultAvatar(resolvedName, resolvedEmail));
  };

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <img
      src={currentSrc}
      alt={alt || resolvedName || 'User Avatar'}
      onError={handleError}
      className={`rounded-full object-cover shrink-0 select-none ${sizeClass} ${className}`}
      loading="lazy"
    />
  );
};
