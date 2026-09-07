import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { DemoRoleBar } from '../common/DemoRoleBar';
import { MobileBottomNav } from './MobileBottomNav';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isAuthPage = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
  ].some((path) => location.pathname === path || location.pathname.startsWith(path + '/'));

  return (
    <div
      className={`min-h-screen flex flex-col bg-surface-soft text-brand-950 font-sans ${
        isAuthPage ? '' : 'pb-20 md:pb-0'
      }`}
    >
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24">
        <Outlet />
      </main>
      <Footer />
      {!isAuthPage && <MobileBottomNav />}
      <DemoRoleBar />
    </div>
  );
};
