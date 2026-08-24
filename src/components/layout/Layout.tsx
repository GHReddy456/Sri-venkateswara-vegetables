import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
    { name: 'Add Records', to: '/records/new', icon: 'add_circle' },
    { name: 'Records', to: '/records', icon: 'receipt_long' },
    { name: 'Vendors', to: '/vendors', icon: 'storefront' },
  ];

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? 'A';

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-['Plus_Jakarta_Sans'] antialiased flex flex-col print:bg-white">
      {/* Top Navigation - Subtle Green with White Text and Icons */}
      <header className="bg-[#15803d] text-white shadow-md fixed top-0 w-full z-50 print:hidden">
        <div className="flex justify-between items-center px-6 md:px-10 h-20 max-w-[1440px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SVV" className="h-12 w-auto brightness-0 invert" />
              <div className="flex flex-col leading-none">
                <span className="font-['Outfit'] text-xl font-bold text-white leading-tight">Sri Venkateswara</span>
                <span className="text-[11px] font-semibold text-green-100 tracking-[0.15em] uppercase mt-0.5">Vegetables</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1 ml-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'text-green-100 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className="material-symbols-outlined text-[20px] text-white"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                      >
                        {item.icon}
                      </span>
                      <span className="text-white">{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <div className="w-8 h-8 rounded-full bg-white text-[#15803d] flex items-center justify-center font-bold text-sm font-['Outfit']">
                {userInitial}
              </div>
              <span className="text-white text-xs font-semibold max-w-[160px] truncate">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-white hover:bg-white/20 transition-colors px-4 py-2 rounded-full text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[20px] text-white">logout</span>
              <span className="hidden md:inline text-white">Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center rounded-full p-2 text-white hover:bg-white/15"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined text-white">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-[#15803d] px-4 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-2 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px] text-white">{item.icon}</span>
                <span className="text-white">{item.name}</span>
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-2 text-white hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[20px] text-white">logout</span>
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 mt-20 pt-8 pb-16 px-4 md:px-10 max-w-[1440px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
