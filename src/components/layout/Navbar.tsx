import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { getNotificationConfig } from '../../utils/notificationConfig';
import {
  Heart,
  Bell,
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Shield,
  Search,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const { user, role, logout, isAuthenticated } = useAuth();
  const { favoriteCount } = useFavorites();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Standard dropdown behavior: close on outside click, Escape key, or page scrolling
  useEffect(() => {
    if (!notifDropdownOpen && !userDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (notifDropdownOpen && notifRef.current && !notifRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
      if (userDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    };

    // Close immediately when user starts scrolling the page (mouse wheel, touch drag, trackpad, or window scroll)
    const handleScrollOrMove = (event: Event) => {
      const target = event.target as Node | null;
      // If the scroll/wheel/touch interaction happened INSIDE the dropdown (e.g. scrolling the notifications list), keep it open!
      if (notifDropdownOpen && notifRef.current && target && notifRef.current.contains(target)) {
        return;
      }
      if (userDropdownOpen && userDropdownRef.current && target && userDropdownRef.current.contains(target)) {
        return;
      }

      // Otherwise, the page itself is being scrolled -> close immediately!
      if (notifDropdownOpen) setNotifDropdownOpen(false);
      if (userDropdownOpen) setUserDropdownOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrMove, { capture: true, passive: true });
    window.addEventListener('wheel', handleScrollOrMove, { passive: true });
    window.addEventListener('touchmove', handleScrollOrMove, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrMove, { capture: true });
      window.removeEventListener('wheel', handleScrollOrMove);
      window.removeEventListener('touchmove', handleScrollOrMove);
    };
  }, [notifDropdownOpen, userDropdownOpen]);

  const navLinks = [
    { name: 'Find Pets', path: '/pets' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'For Providers', path: '/for-providers' },
    { name: 'Contact', path: '/contact' },
  ];

  const getDashboardLink = () => {
    if (role === 'provider') return '/provider/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/adopter/dashboard';
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'py-2.5 bg-surface/90 backdrop-blur-md shadow-soft border-b border-brand-200/70'
          : 'py-4 bg-surface-soft/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-brand-950 bg-brand-200/60 font-bold'
                    : 'text-brand-800 hover:text-brand-950 hover:bg-brand-100/50'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Favorites Heart (Scoped to user) */}
              <Link
                to={role === 'provider' ? '/provider/favorites' : '/adopter/favorites'}
                className="relative w-10 h-10 rounded-full bg-surface border border-brand-200 flex items-center justify-center text-brand-800 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                aria-label={`Saved favorites (${favoriteCount})`}
              >
                <Heart className="w-5 h-5" />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm animate-fade-in">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              {/* Notifications Bell with Dropdown (Scoped to user) */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative w-10 h-10 rounded-full bg-surface border border-brand-200 flex items-center justify-center text-brand-800 hover:text-brand-950 transition-colors shadow-sm"
                  aria-label={`Notifications (${unreadCount} unread)`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-700 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface rounded-3xl shadow-soft-lg border border-brand-200 p-4 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-brand-100 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-brand-900">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-brand-100 text-brand-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-900 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-brand-50 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-brand-muted">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const visual = getNotificationConfig(n.type);
                          const IconComponent = visual.icon;
                          const targetRoute =
                            role === 'admin'
                              ? n.relatedEntityId
                                ? `/admin/requests?id=${n.relatedEntityId}`
                                : '/admin/requests'
                              : n.link || visual.getDefaultRoute(n.relatedEntityId, role);

                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (targetRoute) navigate(targetRoute);
                                setNotifDropdownOpen(false);
                              }}
                              className={`p-3 rounded-2xl cursor-pointer transition-colors flex items-start gap-3 my-1 ${
                                !n.read ? 'bg-brand-50/80 hover:bg-brand-100/70' : 'hover:bg-zinc-50'
                              }`}
                            >
                              {n.petImage ? (
                                <img
                                  src={n.petImage}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-brand-200"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full ${visual.iconBgClass} flex items-center justify-center shrink-0 ${visual.iconColorClass}`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-brand-900 leading-snug truncate">{n.title}</p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${visual.badgeClass} shrink-0`}>
                                    {visual.badgeLabel}
                                  </span>
                                </div>
                                <p className="text-xs text-brand-muted mt-0.5 leading-relaxed line-clamp-2">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-brand-400 mt-1 block">
                                  {n.timestamp}
                                </span>
                              </div>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="pt-3 border-t border-brand-100 text-center">
                      <Link
                        to={role === 'provider' ? '/provider/notifications' : role === 'admin' ? '/admin/requests' : '/adopter/notifications'}
                        onClick={() => setNotifDropdownOpen(false)}
                        className="text-xs font-bold text-brand-700 hover:text-brand-900"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill */}
              <div ref={userDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotifDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-surface border border-brand-200 hover:border-brand-400 transition-colors shadow-sm"
                >
                  <UserAvatar
                    user={user}
                    size="sm"
                    className="border border-brand-200"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-brand-900 max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-brand-500" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-surface rounded-3xl shadow-soft-lg border border-brand-200 p-2 z-50 animate-fade-in text-xs">
                    <div className="px-3 py-2.5 border-b border-brand-100 mb-1">
                      <p className="font-bold text-brand-950">{user.name}</p>
                      <p className="text-brand-muted truncate text-[11px]">{user.email}</p>
                      <span className="inline-block mt-1 uppercase text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                        {role}
                      </span>
                    </div>

                    <Link
                      to={getDashboardLink()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-brand-50 text-brand-800 font-semibold transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-600" />
                      <span>Dashboard</span>
                    </Link>

                    {role === 'adopter' && (
                      <>
                        <Link
                          to="/adopter/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-brand-50 text-brand-800 font-semibold transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-brand-600" />
                          <span>Adopter Profile</span>
                        </Link>
                        <Link
                          to="/adopter/requests"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-brand-50 text-brand-800 font-semibold transition-colors"
                        >
                          <Heart className="w-4 h-4 text-brand-600" />
                          <span>My Requests</span>
                        </Link>
                      </>
                    )}

                    {role === 'provider' && (
                      <>
                        <Link
                          to="/provider/pets/new"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-brand-50 text-brand-800 font-semibold transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-brand-600" />
                          <span>Add New Pet</span>
                        </Link>
                        <Link
                          to="/provider/pets"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-brand-50 text-brand-800 font-semibold transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand-600" />
                          <span>Manage Listings</span>
                        </Link>
                      </>
                    )}

                    {role === 'admin' ? (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-brand-50 text-brand-800 font-semibold transition-colors"
                      >
                        <Shield className="w-4 h-4 text-brand-600" />
                        <span>Admin Overview</span>
                      </Link>
                    ) : (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-brand-50 text-brand-700 font-semibold transition-colors"
                      >
                        <Shield className="w-4 h-4 text-brand-500" />
                        <span>Admin Portal</span>
                      </Link>
                    )}

                    <div className="pt-1 border-t border-brand-100 mt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-rose-700 hover:bg-rose-50 font-semibold transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-bold text-brand-800 hover:text-brand-950">
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm" className="font-bold shadow-soft">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full bg-surface border border-brand-200 flex items-center justify-center text-brand-800 hover:bg-brand-50"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-brand-200 px-4 pt-3 pb-6 shadow-soft-lg animate-slide-down">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-100 text-brand-950 font-bold'
                      : 'text-brand-800 hover:bg-brand-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

            <hr className="my-2 border-brand-100" />

            {isAuthenticated && user ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-brand-700 text-white font-bold text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to {role.toUpperCase()} Dashboard</span>
                </Link>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to={role === 'provider' ? '/provider/favorites' : '/adopter/favorites'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-900 font-semibold text-xs border border-brand-200"
                  >
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Favorites ({favoriteCount})</span>
                  </Link>

                  <Link
                    to={role === 'provider' ? '/provider/notifications' : role === 'admin' ? '/admin/requests' : '/adopter/notifications'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-900 font-semibold text-xs border border-brand-200"
                  >
                    <Bell className="w-4 h-4 text-brand-700" />
                    <span>Alerts ({unreadCount})</span>
                  </Link>
                </div>

                <div className="pt-1 flex flex-col gap-1.5">
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl text-brand-700 bg-brand-50 hover:bg-brand-100 font-semibold text-xs border border-brand-200 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-brand-600" />
                    <span>Admin Security Gateway & Console</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold text-xs transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button variant="outline" size="md" className="w-full font-bold">
                    Log In
                  </Button>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1"
                >
                  <Button variant="primary" size="md" className="w-full font-bold">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
