import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendor, DailySummary } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { Link } from 'react-router-dom';
import {
  Loader2,
  Printer,
  Search,
  Building2,
  CalendarDays,
  ChevronRight,
  TrendingUp,
  FileBarChart2,
} from 'lucide-react';
import { subDays, format } from 'date-fns';

export default function Records() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('vendors').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setVendors(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedVendorId) { setSummaries([]); return; }
    setLoading(true);
    const thirtyDaysAgo = format(subDays(new Date(), 29), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    supabase
      .from('purchase_records')
      .select('purchase_date, total_price')
      .eq('vendor_id', selectedVendorId)
      .gte('purchase_date', thirtyDaysAgo)
      .lte('purchase_date', today)
      .then(({ data, error }) => {
        if (!error && data) {
          const grouped = data.reduce((acc, r) => {
            acc[r.purchase_date] = (acc[r.purchase_date] || 0) + Number(r.total_price);
            return acc;
          }, {} as Record<string, number>);
          setSummaries(
            Object.keys(grouped)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map(date => ({ purchase_date: date, daily_total: grouped[date] }))
          );
        }
        setLoading(false);
      });
  }, [selectedVendorId]);

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);
  const thirtyDayTotal = summaries.reduce((s, r) => s + r.daily_total, 0);

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Records</h1>
          <p className="mt-1 text-sm text-gray-500">View 30-day vendor summaries and detailed daily reports.</p>
        </div>
        {summaries.length > 0 && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print Summary
          </button>
        )}
      </div>

      {/* Vendor selector */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm print:hidden">
        <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Building2 className="h-4 w-4 text-primary" /> Select Vendor
        </label>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="block w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm shadow-sm"
          >
            <option value="">-- Choose a vendor --</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}{!v.active ? ' (Inactive)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {selectedVendorId && (
        <>
          {/* Summary cards (when data loaded) */}
          {!loading && summaries.length > 0 && (
            <div className="grid grid-cols-2 gap-4 print:hidden">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">30-Day Total</p>
                <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(thirtyDayTotal)}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Days with Records</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{summaries.length}</p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm print:shadow-none print:border-none">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between print:hidden">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <FileBarChart2 className="h-4 w-4 text-primary" />
                Last 30 Days — {selectedVendor?.name}
              </h3>
              <span className="badge bg-green-100 text-green-700">
                <CalendarDays className="h-3 w-3 mr-1" />
                30 days
              </span>
            </div>

            {/* Print header */}
            <div className="hidden print:block mb-8 text-center border-b-2 border-gray-400 pb-6">
              <div className="flex justify-center mb-3">
                <img src="/logo.png" alt="Sri Venkateswara Vegetables" className="h-24 w-auto" />
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wide">SRI VENKATESWARA VEGETABLES</h1>
              <p className="text-sm text-gray-600 mt-1">📞 9440217996 &nbsp;|&nbsp; 9032145195</p>
              <h2 className="text-xl mt-4 font-semibold">Vendor: {selectedVendor?.name}</h2>
              <p className="mt-1 text-gray-600">Purchase Summary — Last 30 Days</p>
              <p className="text-sm text-gray-500 mt-4 text-right">Generated on: {format(new Date(), 'dd-MM-yyyy')}</p>
            </div>

            {loading ? (
              <div className="flex justify-center p-16 print:hidden">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : summaries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-16 text-center print:hidden">
                <CalendarDays className="h-12 w-12 text-gray-200" />
                <p className="text-gray-500">No purchase records found for this vendor in the last 30 days.</p>
              </div>
            ) : (
              <table className="min-w-full print:border print:border-gray-300">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 print:border-b print:border-gray-300 print:text-sm">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 print:border-b print:border-gray-300 print:text-sm">
                      Daily Total
                    </th>
                    <th className="w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summaries.map((s) => (
                    <tr key={s.purchase_date} className="table-row-hover group print:border-b print:border-gray-200">
                      <td className="px-6 py-4 text-sm print:py-2 print:text-base print:border-b print:border-gray-200">
                        <Link
                          to={`/records/${s.purchase_date}?vendor=${selectedVendorId}`}
                          className="flex items-center gap-2 font-medium text-primary hover:underline print:text-black print:no-underline"
                        >
                          <CalendarDays className="h-4 w-4 text-gray-400 print:hidden" />
                          {formatDate(s.purchase_date)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 print:py-2 print:text-base print:border-b print:border-gray-200">
                        {formatCurrency(s.daily_total)}
                      </td>
                      <td className="pr-3 py-4 print:hidden">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 print:border-t-2 print:border-black">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 flex items-center gap-2 print:py-3 print:text-base">
                      <TrendingUp className="h-4 w-4 text-primary print:hidden" />
                      30-Day Total
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-primary print:text-black print:py-3">
                      {formatCurrency(thirtyDayTotal)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
