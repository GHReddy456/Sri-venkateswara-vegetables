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
      {/* Top Navigation */}
      <header className="bg-[#f8f9ff] border-b border-[#bfc9bf] shadow-sm fixed top-0 w-full z-50 print:hidden">
        <div className="flex justify-between items-center px-6 md:px-10 h-20 max-w-[1440px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SVV" className="h-12 w-auto" />
              <div className="flex flex-col leading-none">
                <span className="font-['Outfit'] text-xl font-bold text-[#004323] leading-tight">Sri Venkateswara</span>
                <span className="text-[11px] font-semibold text-[#004323] tracking-[0.15em] uppercase mt-0.5">Vegetables</span>
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
                        ? 'text-[#004323] border-b-2 border-[#004323] rounded-none pb-1'
                        : 'text-[#404941] hover:text-[#004323] hover:bg-[#eff4ff]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                      >
                        {item.icon}
                      </span>
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-[#eff4ff] px-4 py-2 rounded-full">
              <div className="w-8 h-8 rounded-full bg-[#004323] text-white flex items-center justify-center font-bold text-sm font-['Outfit']">
                {userInitial}
              </div>
              <span className="text-[#404941] text-xs font-semibold max-w-[160px] truncate">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[#404941] hover:text-[#ba1a1a] transition-colors px-4 py-2 rounded-full hover:bg-[#ffdad6] text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="hidden md:inline">Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center rounded-full p-2 text-[#404941] hover:bg-[#eff4ff]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#bfc9bf] bg-[#f8f9ff] px-4 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-2 ${
                    isActive
                      ? 'bg-[#eff4ff] text-[#004323]'
                      : 'text-[#404941] hover:bg-[#eff4ff] hover:text-[#004323]'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-2 text-[#ba1a1a] hover:bg-[#ffdad6]"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
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
