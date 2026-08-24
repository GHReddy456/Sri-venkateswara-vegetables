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
          <h1 className="font-['Outfit'] text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-1.5 text-slate-500 mt-1.5">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span className="text-sm font-medium">{today}</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/records/new')}
          className="bg-emerald-600 text-white font-['Outfit'] text-base font-semibold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Add Records</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Primary Highlight Card: Soft Emerald Gradient */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
              <div>
                <h3 className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Today's Total</h3>
                <div className="font-['Outfit'] text-4xl font-bold mt-2">{formatCurrency(stats.totalAmount)}</div>
              </div>
              <div className="absolute bottom-6 right-6 bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                <span className="material-symbols-outlined text-[24px]">trending_up</span>
              </div>
            </div>

            {/* Metric: Entries */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Today's Entries</h3>
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                </div>
              </div>
              <div className="font-['Outfit'] text-4xl font-bold text-slate-900">{stats.entries}</div>
            </div>

            {/* Metric: Vendors */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Active Vendors</h3>
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
              </div>
              <div className="font-['Outfit'] text-4xl font-bold text-slate-900">{stats.vendorsCount}</div>
            </div>

            {/* Metric: Items */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-40 metric-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Unique Items</h3>
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
              </div>
              <div className="font-['Outfit'] text-4xl font-bold text-slate-900">{stats.itemsCount}</div>
            </div>
          </div>

          {/* Lower Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">bolt</span>
                <h2 className="font-['Outfit'] text-2xl font-semibold text-slate-900">Quick Actions</h2>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { to: '/records/new', label: 'Add Purchase Records', icon: 'shopping_cart' },
                  { to: '/records', label: 'View Past Records', icon: 'history' },
                  { to: '/vendors', label: 'Manage Vendors', icon: 'manage_accounts' },
                ].map(action => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50/60 rounded-xl transition-colors border border-slate-100 hover:border-emerald-200"
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-600 transition-colors text-[22px]">{action.icon}</span>
                      <span className="text-base font-semibold text-slate-800">{action.label}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Today at a Glance */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">visibility</span>
                <h2 className="font-['Outfit'] text-2xl font-semibold text-slate-900">Today at a Glance</h2>
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { label: 'Total Purchases', value: formatCurrency(stats.totalAmount) },
                  { label: 'Records Entered', value: stats.entries },
                  { label: 'Vendors Active', value: stats.vendorsCount },
                  { label: 'Item Types', value: stats.itemsCount },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    className={`flex justify-between items-center py-3.5 hover:bg-slate-50 px-3 rounded-xl transition-colors ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <span className="text-slate-600 text-sm font-medium">{row.label}</span>
                    <span className="font-['Outfit'] text-lg font-bold text-slate-900">{row.value}</span>
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
