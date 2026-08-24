import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/format';
import {
  TrendingUp,
  ClipboardList,
  Building2,
  Package,
  Loader2,
  ArrowRight,
  ShoppingCart,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    entries: 0,
    vendorsCount: 0,
    itemsCount: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('purchase_records')
        .select('vendor_id, item, total_price')
        .eq('purchase_date', today);

      if (!error && data) {
        const totalAmount = data.reduce((sum, r) => sum + Number(r.total_price), 0);
        const vendorsCount = new Set(data.map(r => r.vendor_id)).size;
        const itemsCount = new Set(data.map(r => r.item.toLowerCase().trim())).size;
        setStats({ totalAmount, entries: data.length, vendorsCount, itemsCount });
      }
      setLoading(false);
    };
    fetchDashboardStats();
  }, []);

  const cards = [
    {
      name: "Today's Total",
      value: formatCurrency(stats.totalAmount),
      icon: TrendingUp,
      primary: true,
    },
    {
      name: "Today's Entries",
      value: stats.entries.toString(),
      icon: ClipboardList,
      primary: false,
    },
    {
      name: 'Active Vendors',
      value: stats.vendorsCount.toString(),
      icon: Building2,
      primary: false,
    },
    {
      name: 'Unique Items',
      value: stats.itemsCount.toString(),
      icon: Package,
      primary: false,
    },
  ];

  return (
    <div className="space-y-8 px-1">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            {formatDate(format(new Date(), 'yyyy-MM-dd'))}
          </p>
        </div>
        <Link
          to="/records/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-200 hover:bg-primary-hover"
        >
          <ShoppingCart className="h-4 w-4" />
          Add Records
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.name}
                className={`card-hover relative overflow-hidden rounded-2xl p-6 shadow-sm ${
                  card.primary
                    ? 'stat-gradient text-white'
                    : 'bg-white border border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${card.primary ? 'text-green-100' : 'text-gray-500'}`}>
                      {card.name}
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${card.primary ? 'text-white' : 'text-gray-900'}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    card.primary ? 'bg-white/20' : 'bg-green-50'
                  }`}>
                    <card.icon className={`h-6 w-6 ${card.primary ? 'text-white' : 'text-primary'}`} />
                  </div>
                </div>
                {card.primary && (
                  <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="mb-4 text-base font-semibold text-gray-900 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" /> Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  { to: '/records/new', label: 'Add Purchase Records', icon: ShoppingCart },
                  { to: '/records', label: 'View Past Records', icon: ClipboardList },
                  { to: '/vendors', label: 'Manage Vendors', icon: Building2 },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary/30 hover:bg-green-50 hover:text-primary"
                  >
                    <span className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      {action.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="mb-4 text-base font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Today at a Glance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                  <span className="text-gray-500">Total Purchases</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                  <span className="text-gray-500">Records Entered</span>
                  <span className="font-semibold text-gray-900">{stats.entries}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                  <span className="text-gray-500">Vendors Active</span>
                  <span className="font-semibold text-gray-900">{stats.vendorsCount}</span>
                </div>
                <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                  <span className="text-gray-500">Item Types</span>
                  <span className="font-semibold text-gray-900">{stats.itemsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
