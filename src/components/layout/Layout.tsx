import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-['Plus_Jakarta_Sans'] antialiased flex flex-col print:bg-white">
      {/* Top Navigation - Transparent at top, light green on scroll */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 print:hidden ${
          isScrolled
            ? 'bg-emerald-50/90 backdrop-blur-md border-b border-emerald-200/80 shadow-sm'
            : 'bg-transparent border-b border-transparent shadow-none'
        }`}
      >
        <div className="flex justify-between items-center px-6 md:px-10 h-20 max-w-[1440px] mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <img src="/logo.png" alt="Sri Venkateswara Vegetables" className="h-12 w-auto" />
              <div className="flex flex-col leading-none">
                <span className="font-['Outfit'] text-xl font-bold text-emerald-900 leading-tight">Sri Venkateswara</span>
                <span className="text-[11px] font-semibold text-emerald-700 tracking-[0.15em] uppercase mt-0.5">Vegetables</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1.5 ml-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-emerald-800 hover:bg-emerald-100/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`material-symbols-outlined text-[20px] ${isActive ? 'text-white' : 'text-slate-500'}`}
                        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                      >
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2.5 bg-white/80 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-xs backdrop-blur-sm">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-['Outfit']">
                {userInitial}
              </div>
              <span className="text-slate-700 text-xs font-semibold max-w-[160px] truncate">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors px-3.5 py-2 rounded-full text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="hidden md:inline">Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-emerald-100/60"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-200/80 bg-emerald-50/95 backdrop-blur-md px-4 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-2 ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-emerald-100'
                  }`
                }
              >
                <span className={`material-symbols-outlined text-[20px] ${item.icon ? '' : ''}`}>{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mt-2 text-red-600 hover:bg-red-50"
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
