import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronRight,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Shield,
  Search,
  BookOpen,
  Home,
  Phone,
  Sparkles,
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

  // Lock body scroll on mobile when the mobile navigation panel is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Standard dropdown behavior: close on outside click, Escape key, or page scrolling
  useEffect(() => {
    if (!notifDropdownOpen && !userDropdownOpen && !mobileMenuOpen) return;

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
      // If the scroll/wheel/touch interaction happened INSIDE the dropdown, keep it open!
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
        setMobileMenuOpen(false);
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
  }, [notifDropdownOpen, userDropdownOpen, mobileMenuOpen]);

  const navLinks = [
    { name: 'Find Pets', path: '/pets', icon: Search, desc: 'Explore dogs, cats & companions' },
    { name: 'How It Works', path: '/how-it-works', icon: BookOpen, desc: '14-day foster bonding trial' },
    { name: 'About', path: '/about', icon: Sparkles, desc: 'Our mission & welfare pledge' },
    { name: 'For Providers', path: '/for-providers', icon: Home, desc: 'List rescues & manage requests' },
    { name: 'Contact', path: '/contact', icon: Phone, desc: 'Support & community team' },
  ];

  const getDashboardLink = () => {
    if (role === 'provider') return '/provider/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/adopter/dashboard';
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'py-1.5 md:py-2.5 bg-surface/95 backdrop-blur-md shadow-soft border-b border-brand-200/80'
            : 'py-3 md:py-4 bg-surface-soft/90 backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left Side: Mobile 3-Lines Hamburger (Mobile only) + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl bg-surface border border-brand-200 flex items-center justify-center text-brand-800 hover:bg-brand-100/70 transition-colors shadow-xs shrink-0 cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5 text-brand-800" />
          </button>

          {/* Brand Logo */}
          <Logo size="md" />
        </div>

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
              {/* Favorites Heart (Scoped to user, visible on sm+ screens) */}
              <Link
                to={role === 'provider' ? '/provider/favorites' : '/adopter/favorites'}
                className="hidden sm:flex relative w-10 h-10 rounded-full bg-surface border border-brand-200 items-center justify-center text-brand-800 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
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
            <>
              {/* Mobile Right Action: Compact Log In button (Mobile only, < md) */}
              <Link
                to="/login"
                className="md:hidden inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-brand-800 bg-surface/90 border border-brand-200 hover:border-brand-400 hover:bg-brand-100/70 transition-all shadow-xs shrink-0"
              >
                Log In
              </Link>

              {/* Desktop Auth Buttons (md: and larger, 100% preserved) */}
              <div className="hidden md:flex items-center gap-2">
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
            </>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Slide-Out Full-Height Navigation Drawer (Rendered via React Portal onto document.body to bypass parent header backdrop-filter containing block) */}
    {mobileMenuOpen &&
      typeof document !== 'undefined' &&
      createPortal(
        <div className="md:hidden fixed inset-0 z-[9999] flex" role="dialog" aria-modal="true">
          {/* Backdrop overlay covering the full screen */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Full-Height Drawer from Left with Platform Branding */}
          <div className="relative z-10 w-[84vw] sm:w-96 max-w-[380px] h-[100dvh] max-h-screen bg-[#FAF8F5] text-brand-950 border-r border-brand-200/90 shadow-2xl flex flex-col animate-slide-right select-none overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-brand-200/70 flex items-center justify-between bg-surface/90 backdrop-blur-xs shrink-0">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 group"
              >
                <div className="w-11 h-11 rounded-2xl bg-surface border border-brand-200 flex items-center justify-center p-2 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <img src="/logo-icon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-display text-base font-extrabold text-brand-950 tracking-tight block">
                    PET ADOPTION
                  </span>
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-brand-600 block -mt-0.5">
                    Foster-to-Own Platform
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-2xl bg-surface border border-brand-200 flex items-center justify-center text-brand-700 hover:text-brand-950 hover:bg-brand-100/70 transition-colors shadow-xs cursor-pointer active:scale-95"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header status pill */}
            <div className="px-4 py-2.5 bg-brand-100/50 border-b border-brand-200/60 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-brand-800 text-[11px]">
                  Verified Foster Network
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-brand-700 bg-surface px-2.5 py-0.5 rounded-full border border-brand-200 shadow-xs">
                100% Ethical
              </span>
            </div>

            {/* Navigation Links List */}
            <div className="flex-1 px-3.5 py-4 space-y-2 overflow-y-auto overscroll-contain">
              <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-brand-500 mb-1.5">
                Explore Navigation
              </p>
              {navLinks.map((link) => {
                const IconComp = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-brand-700 border-brand-700 text-white shadow-soft font-bold'
                          : 'bg-surface border-brand-200/70 text-brand-900 hover:bg-brand-50 hover:border-brand-300 shadow-xs'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'bg-brand-100/70 border border-brand-200/60 text-brand-800'
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className={`block text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-brand-950'}`}>
                              {link.name}
                            </span>
                            {link.desc && (
                              <span className={`block text-[11px] leading-tight mt-0.5 truncate ${isActive ? 'text-brand-100' : 'text-brand-500'}`}>
                                {link.desc}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ml-2 ${isActive ? 'text-white/80' : 'text-brand-400'}`} />
                      </>
                    )}
                  </NavLink>
                );
              })}

              {/* User Account or Auth Actions inside Drawer */}
              {isAuthenticated && user ? (
                <div className="pt-4 mt-4 border-t border-brand-200/70 space-y-2">
                  <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-brand-500 mb-1">
                    My Account ({role.toUpperCase()})
                  </p>

                  <Link
                    to={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 shadow-soft transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <span>Go to Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </Link>

                  <Link
                    to={role === 'provider' ? '/provider/favorites' : '/adopter/favorites'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-brand-200/70 text-xs font-bold text-brand-800 hover:bg-brand-50 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span>Saved Favorites</span>
                    </div>
                    {favoriteCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        {favoriteCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to={role === 'provider' ? '/provider/notifications' : role === 'admin' ? '/admin/requests' : '/adopter/notifications'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-brand-200/70 text-xs font-bold text-brand-800 hover:bg-brand-50 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-100/70 border border-brand-200/60 flex items-center justify-center text-brand-700">
                        <Bell className="w-4 h-4" />
                      </div>
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-brand-200 text-brand-900 border border-brand-300">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  {role === 'admin' ? (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-100/60 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span>Admin Overview</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </Link>
                  ) : (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-brand-200/70 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
                          <Shield className="w-4 h-4" />
                        </div>
                        <span>Admin Portal</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-brand-400" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="pt-4 mt-4 border-t border-brand-200/70 space-y-2.5">
                  <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-brand-500 mb-1">
                    Get Started or Sign In
                  </p>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-xs font-bold bg-brand-700 hover:bg-brand-800 text-white shadow-soft transition-all active:scale-[0.99]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Get Started</span>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-xs font-bold text-brand-950 bg-surface border-2 border-brand-200 hover:bg-brand-50 hover:border-brand-300 shadow-xs transition-colors active:scale-[0.99]"
                  >
                    <UserIcon className="w-4 h-4 text-brand-700" />
                    <span>Log In</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-brand-200/70 bg-surface/90 shrink-0">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar user={user} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-brand-950 truncate">{user.name}</p>
                      <p className="text-[10px] text-brand-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center text-[10px] text-brand-muted space-y-1">
                  <p className="font-semibold text-brand-700">🐾 Zero Breeder Policy • Ethical Foster-to-Own</p>
                  <p className="text-brand-400">© 2026 Pet Adoption Platform</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
