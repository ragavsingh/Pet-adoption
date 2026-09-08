import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Heart,
  FileText,
  User as UserIcon,
  Dog,
  PlusCircle,
  Inbox,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { role, isAuthenticated } = useAuth();
  const { favoriteCount } = useFavorites();

  // Hide on authentication screens so login forms and keyboards are never obstructed
  const isAuthPage = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
  ].some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));

  if (isAuthPage) return null;

  // Logically hide bottom navigation bar for guests/logged-out visitors on mobile
  if (!isAuthenticated) return null;

  // Provider Navigation items on mobile
  if (role === 'provider') {
    const providerItems = [
      { name: 'Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
      { name: 'Pets', path: '/provider/pets', icon: Dog },
      { name: 'Add Pet', path: '/provider/pets/new', icon: PlusCircle },
      { name: 'Requests', path: '/provider/requests', icon: Inbox },
      { name: 'Profile', path: '/provider/profile', icon: UserCheck },
    ];

    return (
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-brand-200 py-2 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-soft-lg select-none"
      >
        {providerItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/provider/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive ? 'text-brand-800 font-bold' : 'text-brand-muted hover:text-brand-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    );
  }

  // Adopter & Public Navigation items on mobile
  const homePath = isAuthenticated && role === 'adopter' ? '/adopter/dashboard' : '/';
  const requestsPath = isAuthenticated ? '/adopter/requests' : '/login';
  const favoritesPath = isAuthenticated ? '/adopter/favorites' : '/login';
  const profilePath = isAuthenticated ? '/adopter/profile' : '/login';

  const adopterItems = [
    {
      name: 'Home',
      path: homePath,
      icon: LayoutDashboard,
      isActive:
        location.pathname === '/adopter/dashboard' ||
        location.pathname === '/adopter' ||
        (!isAuthenticated && location.pathname === '/'),
    },
    {
      name: 'Discover',
      path: '/pets',
      icon: Compass,
      isActive: location.pathname === '/pets' || location.pathname.startsWith('/pets/'),
    },
    {
      name: 'Favorites',
      path: favoritesPath,
      icon: Heart,
      count: favoriteCount,
      isActive: location.pathname.startsWith('/adopter/favorites'),
    },
    {
      name: 'Requests',
      path: requestsPath,
      icon: FileText,
      isActive: location.pathname.startsWith('/adopter/requests'),
    },
    {
      name: 'Profile',
      path: profilePath,
      icon: UserIcon,
      isActive:
        location.pathname.startsWith('/adopter/profile') ||
        location.pathname.startsWith('/adopter/settings'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-brand-200 py-2 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-soft-lg select-none"
    >
      {adopterItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.isActive;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
              isActive ? 'text-brand-800 font-bold' : 'text-brand-muted hover:text-brand-800'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold shadow-xs">
                  {item.count}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
