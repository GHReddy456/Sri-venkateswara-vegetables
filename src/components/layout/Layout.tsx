import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Building2,
} from 'lucide-react';

export default function Layout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Add Records', to: '/records/new', icon: PlusCircle },
    { name: 'Records', to: '/records', icon: FileText },
    { name: 'Vendors', to: '/vendors', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-primary text-white shadow-lg print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex flex-shrink-0 items-center gap-2 mr-8">
                <img src="/logo.png" alt="SVV" className="h-10 w-auto" />
                <div className="hidden lg:block">
                  <span className="block text-base font-bold leading-tight">Sri Venkateswara</span>
                  <span className="block text-xs font-medium text-green-200 leading-tight">Vegetables</span>
                </div>
                <span className="lg:hidden font-bold text-lg">SVV</span>
              </div>

              {/* Nav links */}
              <div className="hidden sm:flex sm:space-x-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-green-100 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="hidden sm:flex sm:items-center sm:gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm text-green-100 max-w-[160px] truncate">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-green-100 hover:bg-white/10"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-green-700">
            <div className="space-y-1 px-3 pb-3 pt-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-green-100 hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
              <div className="mt-3 border-t border-green-700 pt-3">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-100 hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5" />
                  Logout ({user?.email})
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
