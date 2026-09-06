import React from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { DemoRoleBar } from '../common/DemoRoleBar';
import {
  LayoutDashboard,
  Dog,
  PlusCircle,
  Inbox,
  Award,
  UserCheck,
  Settings,
} from 'lucide-react';

export const ProviderLayout: React.FC = () => {
  const location = useLocation();

  const desktopNavTabs = [
    { name: 'Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
    { name: 'My Pet Listings', path: '/provider/pets', icon: Dog },
    { name: 'Add New Pet', path: '/provider/pets/new', icon: PlusCircle },
    { name: 'Incoming Requests', path: '/provider/requests', icon: Inbox },
    { name: 'Adoptions Completed', path: '/provider/adoptions', icon: Award },
    { name: 'Provider Profile', path: '/provider/profile', icon: UserCheck },
    { name: 'Settings', path: '/provider/settings', icon: Settings },
  ];

  const mobileBottomItems = [
    { name: 'Dashboard', path: '/provider/dashboard', icon: LayoutDashboard },
    { name: 'Pets', path: '/provider/pets', icon: Dog },
    { name: 'Add Pet', path: '/provider/pets/new', icon: PlusCircle },
    { name: 'Requests', path: '/provider/requests', icon: Inbox },
    { name: 'Profile', path: '/provider/profile', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-soft text-brand-950 font-sans pb-20 md:pb-0">
      <Navbar />

      {/* Provider Sub-header & Tabs */}
      <div className="pt-20 md:pt-24 bg-surface border-b border-brand-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                Pet Provider Portal
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-900 mt-0.5">
                Provider Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/provider/pets/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List a New Pet</span>
              </Link>
            </div>
          </div>

          {/* Desktop Subnav Tabs */}
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto pb-1 pt-1 -mb-px">
            {desktopNavTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname === tab.path;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-brand-700 text-brand-900 bg-brand-50/70 rounded-t-xl'
                      : 'border-transparent text-brand-muted hover:text-brand-900 hover:border-brand-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <Footer />

      {/* Mobile Sticky Bottom Navigation for Provider (Section 27) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-brand-200 py-2 px-3 flex items-center justify-around shadow-soft-lg">
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-brand-800 font-bold' : 'text-brand-muted hover:text-brand-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-1 tracking-tight">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <DemoRoleBar />
    </div>
  );
};
