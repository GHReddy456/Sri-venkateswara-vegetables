import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/format';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAmount: 0, entries: 0, vendorsCount: 0, itemsCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('purchase_records')
        .select('vendor_id, item, total_price')
        .eq('purchase_date', today);
      if (!error && data) {
        setStats({
          totalAmount: data.reduce((s, r) => s + Number(r.total_price), 0),
          entries: data.length,
          vendorsCount: new Set(data.map(r => r.vendor_id)).size,
          itemsCount: new Set(data.map(r => r.item.toLowerCase().trim())).size,
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const today = formatDate(format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-['Outfit'] text-5xl font-bold text-[#0b1c30] tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-1.5 text-[#404941] mt-2">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span className="text-sm font-medium">{today}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/records/new')}
          className="bg-[#004323] text-white font-['Outfit'] text-base font-semibold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[#0d5c34] transition-all shadow-sm active:scale-95 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
          <span className="material-symbols-outlined relative z-10 text-[20px]">add_circle</span>
          <span className="relative z-10">Add Records</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#004323]" />
        </div>
      ) : (
        <>
          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Primary highlight */}
            <div className="bg-[#004323] text-white rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
              <div>
                <h3 className="text-white/80 text-base font-medium">Today's Total</h3>
                <div className="font-['Outfit'] text-4xl font-bold mt-2">{formatCurrency(stats.totalAmount)}</div>
              </div>
              <div className="absolute bottom-6 right-6 bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <span className="material-symbols-outlined text-[24px]">trending_up</span>
              </div>
            </div>

            {/* Metric: Entries */}
            <div className="bg-white border border-[#bfc9bf] rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-[#404941] text-base font-medium">Today's Entries</h3>
                <div className="bg-[#eff4ff] text-[#004323] p-2 rounded-full">
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                </div>
              </div>
              <div className="font-['Outfit'] text-5xl font-bold text-[#0b1c30]">{stats.entries}</div>
            </div>

            {/* Metric: Vendors */}
            <div className="bg-white border border-[#bfc9bf] rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-[#404941] text-base font-medium">Active Vendors</h3>
                <div className="bg-[#eff4ff] text-[#004323] p-2 rounded-full">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
              </div>
              <div className="font-['Outfit'] text-5xl font-bold text-[#0b1c30]">{stats.vendorsCount}</div>
            </div>

            {/* Metric: Items */}
            <div className="bg-white border border-[#bfc9bf] rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-[#404941] text-base font-medium">Unique Items</h3>
                <div className="bg-[#eff4ff] text-[#004323] p-2 rounded-full">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
              </div>
              <div className="font-['Outfit'] text-5xl font-bold text-[#0b1c30]">{stats.itemsCount}</div>
            </div>
          </div>

          {/* Lower grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white border border-[#bfc9bf] rounded-2xl p-6 metric-shadow">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[#004323] text-[24px]">bolt</span>
                <h2 className="font-['Outfit'] text-2xl font-semibold text-[#0b1c30]">Quick Actions</h2>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { to: '/records/new', label: 'Add Purchase Records', icon: 'shopping_cart' },
                  { to: '/records', label: 'View Past Records', icon: 'history' },
                  { to: '/vendors', label: 'Manage Vendors', icon: 'manage_accounts' },
                ].map(action => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center justify-between p-4 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-2xl transition-colors border border-transparent hover:border-[#bfc9bf]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-[#404941] group-hover:text-[#004323] transition-colors text-[22px]">{action.icon}</span>
                      <span className="text-base font-semibold text-[#0b1c30]">{action.label}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#404941] group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Today at a Glance */}
            <div className="bg-white border border-[#bfc9bf] rounded-2xl p-6 metric-shadow relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#004323 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <span className="material-symbols-outlined text-[#004323] text-[24px]">visibility</span>
                <h2 className="font-['Outfit'] text-2xl font-semibold text-[#0b1c30]">Today at a Glance</h2>
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                {[
                  { label: 'Total Purchases', value: formatCurrency(stats.totalAmount) },
                  { label: 'Records Entered', value: stats.entries },
                  { label: 'Vendors Active', value: stats.vendorsCount },
                  { label: 'Item Types', value: stats.itemsCount },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    className={`flex justify-between items-center py-4 hover:bg-[#eff4ff] px-2 rounded-xl transition-colors ${i < arr.length - 1 ? 'border-b border-[#bfc9bf]/30' : ''}`}
                  >
                    <span className="text-[#404941] text-base">{row.label}</span>
                    <span className="font-['Outfit'] text-xl font-semibold text-[#0b1c30]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
