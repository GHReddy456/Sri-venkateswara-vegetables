import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendor, PurchaseRecord, DailySummary } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { calculateLineTotal } from '../lib/calculations';
import { Loader2 } from 'lucide-react';
import { subDays, format } from 'date-fns';

export default function Records() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorSearchText, setVendorSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Data states
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [detailedRecords, setDetailedRecords] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit record state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ item: '', bags_count: 0, kgs: 0, unit_price: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('vendors').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setVendors(data);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRecords = () => {
    if (!selectedVendorId && !selectedDate) {
      setSummaries([]);
      setDetailedRecords([]);
      return;
    }

    setLoading(true);

    if (selectedVendorId && selectedDate) {
      supabase
        .from('purchase_records')
        .select('*')
        .eq('vendor_id', selectedVendorId)
        .eq('purchase_date', selectedDate)
        .order('created_at')
        .then(({ data, error }) => {
          if (!error && data) {
            setDetailedRecords(data);
            setSummaries([]);
          }
          setLoading(false);
        });
    } else if (selectedVendorId && !selectedDate) {
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
            setDetailedRecords([]);
          }
          setLoading(false);
        });
    } else if (!selectedVendorId && selectedDate) {
      supabase
        .from('purchase_records')
        .select('*')
        .eq('purchase_date', selectedDate)
        .order('created_at')
        .then(({ data, error }) => {
          if (!error && data) {
            setDetailedRecords(data);
            setSummaries([]);
          }
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedVendorId, selectedDate]);

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const lineTotal = calculateLineTotal(editForm.kgs, editForm.unit_price);
    const { error } = await supabase
      .from('purchase_records')
      .update({
        item: editForm.item,
        bags_count: editForm.bags_count,
        kgs: editForm.kgs,
        unit_price: editForm.unit_price,
        total_price: lineTotal,
      })
      .eq('id', editingId);

    if (error) {
      alert('Failed to update record: ' + error.message);
    } else {
      setEditingId(null);
      fetchRecords();
    }
  };

  const handleDeleteRecord = async (id: string, itemName: string, kgs: number, price: number, total: number) => {
    if (!confirm(`Are you sure you want to delete this record?\n\nItem: ${itemName}\nKgs: ${kgs} kg\nRate: ₹${price}/kg\nTotal: ${formatCurrency(total)}`)) {
      return;
    }
    const { error } = await supabase.from('purchase_records').delete().eq('id', id);
    if (error) {
      alert('Failed to delete record: ' + error.message);
    } else {
      fetchRecords();
    }
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);
  const vendorMap = new Map(vendors.map(v => [v.id, v.name]));

  const thirtyDayTotal = summaries.reduce((s, r) => s + r.daily_total, 0);
  const totalDetailedAmount = detailedRecords.reduce((s, r) => s + Number(r.total_price), 0);
  const totalDetailedBags = detailedRecords.reduce((s, r) => s + Number(r.bags_count), 0);
  const totalDetailedKgs = detailedRecords.reduce((s, r) => s + Number(r.kgs), 0);

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(vendorSearchText.toLowerCase())
  );

  const handleSelectVendor = (v: Vendor) => {
    setSelectedVendorId(v.id);
    setVendorSearchText(v.name);
    setIsDropdownOpen(false);
  };

  const handleClearVendor = () => {
    setSelectedVendorId('');
    setVendorSearchText('');
    setIsDropdownOpen(false);
  };

  const handleClearDate = () => {
    setSelectedDate('');
  };

  const hasDataToPrint = (summaries.length > 0) || (detailedRecords.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h1 className="font-['Outfit'] text-4xl font-bold text-slate-900 tracking-tight">Purchase Records</h1>
          <p className="mt-1 text-sm text-slate-500">Filter by vendor, date, or combination to view, edit, delete, and print reports.</p>
        </div>
        {hasDataToPrint && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-emerald-600">print</span>
            Print Report
          </button>
        )}
      </div>

      {/* Filter Card: Vendor (Left) + Date (Right) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Select Vendor */}
          <div className="flex flex-col">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">storefront</span>
              Select Vendor
            </label>
            
            <div className="relative w-full" ref={dropdownRef}>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">search</span>
                <input
                  type="text"
                  value={vendorSearchText}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setVendorSearchText(e.target.value);
                    setIsDropdownOpen(true);
                    if (selectedVendorId) setSelectedVendorId('');
                  }}
                  placeholder="Search vendor name..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-600 focus:bg-white focus:ring-0 transition-all placeholder:text-slate-400"
                />
                {vendorSearchText && (
                  <button
                    type="button"
                    onClick={handleClearVendor}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                    title="Clear vendor filter"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              {/* Quick Vendor Chips */}
              {vendors.length > 0 && !selectedVendorId && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {vendors.slice(0, 5).map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVendor(v)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200/60"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Vendor Dropdown Results */}
              {isDropdownOpen && (
                <div className="absolute z-30 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border-2 border-emerald-600 bg-white shadow-xl">
                  {filteredVendors.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500 font-medium">No vendor matches "{vendorSearchText}"</div>
                  ) : (
                    filteredVendors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVendor(v)}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors border-b border-slate-100 last:border-0 hover:bg-emerald-50 flex items-center justify-between ${
                          selectedVendorId === v.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            {v.name.charAt(0).toUpperCase()}
                          </span>
                          {v.name} {!v.active && <span className="text-xs text-slate-400 font-normal">(Inactive)</span>}
                        </span>
                        {selectedVendorId === v.id && (
                          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Select Date */}
          <div className="flex flex-col">
            <label className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">calendar_today</span>
              Select Date
            </label>
            
            <div className="relative w-full">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-semibold text-slate-900 shadow-sm focus:border-emerald-600 focus:bg-white focus:ring-0 transition-all"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="absolute right-9 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                  title="Clear date filter"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Quick Date Chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200/60"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'))}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200/60"
              >
                Yesterday
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white transition-all border border-red-200"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Active Filter Indicator */}
        {(selectedVendorId || selectedDate) && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Active Filter:</span>
              {selectedVendorId && (
                <span className="bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                  Vendor: {selectedVendor?.name}
                </span>
              )}
              {selectedDate && (
                <span className="bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                  Date: {formatDate(selectedDate)}
                </span>
              )}
            </div>
            <button
              onClick={() => { handleClearVendor(); handleClearDate(); }}
              className="text-red-600 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ----------------- MODE A: Vendor Selected, Date Empty -> 30-Day Summary ----------------- */}
      {selectedVendorId && !selectedDate && (
        <>
          {!loading && summaries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:hidden">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 metric-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">30-Day Cumulative Total</p>
                <p className="font-['Outfit'] text-3xl font-bold mt-2">{formatCurrency(thirtyDayTotal)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Purchase Days</p>
                <p className="font-['Outfit'] text-3xl font-bold mt-2 text-slate-900">{summaries.length}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl metric-shadow overflow-hidden print:shadow-none print:border-none">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
              <h3 className="font-['Outfit'] text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                Last 30 Days — {selectedVendor?.name}
              </h3>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                30 Days Summary
              </span>
            </div>

            {/* Print Header for Vendor Summary */}
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
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : summaries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-16 text-center print:hidden">
                <span className="material-symbols-outlined text-[48px] text-slate-300">calendar_today</span>
                <p className="text-slate-500 text-sm">No purchase records found for this vendor in the last 30 days.</p>
              </div>
            ) : (
              <table className="min-w-full print:border print:border-gray-300">
                <thead className="bg-slate-50 print:bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Daily Total</th>
                    <th className="w-12 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaries.map((s) => (
                    <tr
                      key={s.purchase_date}
                      onClick={() => setSelectedDate(s.purchase_date)}
                      className="hover:bg-emerald-50/60 transition-colors group print:border-b print:border-gray-200 cursor-pointer"
                      title="Click row to view detailed purchase records for this date"
                    >
                      <td className="px-6 py-4 text-sm font-semibold print:py-2 print:text-base print:border-b print:border-gray-200">
                        <span className="flex items-center gap-2 text-emerald-700 group-hover:underline print:text-black print:no-underline">
                          <span className="material-symbols-outlined text-[18px] text-slate-400 print:hidden">calendar_today</span>
                          {formatDate(s.purchase_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-['Outfit'] font-semibold text-slate-900 text-base print:py-2 print:text-base print:border-b print:border-gray-200">
                        {formatCurrency(s.daily_total)}
                      </td>
                      <td className="pr-4 py-4 text-right print:hidden">
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">chevron_right</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 print:border-t-2 print:border-black">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 flex items-center gap-2 print:py-3 print:text-base">
                      <span className="material-symbols-outlined text-emerald-600 print:hidden">trending_up</span>
                      30-Day Cumulative Total
                    </td>
                    <td className="px-6 py-4 text-right font-['Outfit'] text-2xl font-bold text-emerald-600 print:text-black print:py-3">
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

      {/* ----------------- MODE B & C: Detailed Records (Date Selected OR Both Selected) ----------------- */}
      {selectedDate && (
        <>
          {/* Summary Stat Cards for Detailed View */}
          {!loading && detailedRecords.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:hidden">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 metric-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Total Amount</p>
                <p className="font-['Outfit'] text-3xl font-bold mt-2">{formatCurrency(totalDetailedAmount)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Bags</p>
                <p className="font-['Outfit'] text-3xl font-bold mt-2 text-slate-900">{totalDetailedBags}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Kgs</p>
                <p className="font-['Outfit'] text-3xl font-bold mt-2 text-slate-900">{totalDetailedKgs} kg</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl metric-shadow overflow-hidden print:shadow-none print:border-none">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
              <h3 className="font-['Outfit'] text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                {selectedVendorId ? `Detailed Purchase Report — ${selectedVendor?.name}` : `All Purchase Records for ${formatDate(selectedDate)}`}
              </h3>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
                {detailedRecords.length} record{detailedRecords.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Print Header for Detailed Report */}
            <div className="hidden print:block mb-8 text-center border-b-2 border-gray-400 pb-6">
              <div className="flex justify-center mb-3">
                <img src="/logo.png" alt="Sri Venkateswara Vegetables" className="h-24 w-auto" />
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wide">SRI VENKATESWARA VEGETABLES</h1>
              <p className="text-sm text-gray-600 mt-1">📞 9440217996 &nbsp;|&nbsp; 9032145195</p>
              <h2 className="text-xl mt-4 font-bold uppercase underline">PURCHASE REPORT</h2>
              <div className="mt-4 flex justify-between text-left px-8 text-base">
                <span><strong>Vendor:</strong> {selectedVendorId ? selectedVendor?.name : 'ALL VENDORS'}</span>
                <span><strong>Date:</strong> {formatDate(selectedDate)}</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-16 print:hidden">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : detailedRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-16 text-center print:hidden">
                <span className="material-symbols-outlined text-[48px] text-slate-300">calendar_today</span>
                <p className="text-slate-500 text-sm">
                  No records found {selectedVendorId ? `for ${selectedVendor?.name}` : ''} on {formatDate(selectedDate)}.
                </p>
              </div>
            ) : (
              <table className="min-w-full print:border print:border-gray-300">
                <thead className="bg-slate-50 print:bg-gray-100">
                  <tr>
                    {!selectedVendorId && (
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Vendor</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Bags</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Kgs</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Rate / kg</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-gray-300 print:text-sm">Total</th>
                    <th className="w-24 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailedRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors print:border-b print:border-gray-200">
                      {editingId === r.id ? (
                        <>
                          {!selectedVendorId && (
                            <td className="px-6 py-3 font-bold text-emerald-700">{vendorMap.get(r.vendor_id)}</td>
                          )}
                          <td className="px-6 py-3"><input type="text" value={editForm.item} onChange={e => setEditForm({...editForm, item: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm" /></td>
                          <td className="px-4 py-3"><input type="number" value={editForm.bags_count} onChange={e => setEditForm({...editForm, bags_count: Number(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm" /></td>
                          <td className="px-4 py-3"><input type="number" value={editForm.kgs} onChange={e => setEditForm({...editForm, kgs: Number(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm" /></td>
                          <td className="px-4 py-3"><input type="number" value={editForm.unit_price} onChange={e => setEditForm({...editForm, unit_price: Number(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-sm" /></td>
                          <td className="px-4 py-3 text-right font-['Outfit'] font-semibold text-slate-900">
                            {formatCurrency(calculateLineTotal(editForm.kgs, editForm.unit_price))}
                          </td>
                          <td className="pr-4 py-3 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={handleSaveEdit} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100" title="Save edit"><span className="material-symbols-outlined text-[18px]">check</span></button>
                              <button onClick={() => setEditingId(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" title="Cancel"><span className="material-symbols-outlined text-[18px]">close</span></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {!selectedVendorId && (
                            <td className="px-6 py-4 text-sm font-bold text-emerald-700 print:text-black print:py-2">
                              {vendorMap.get(r.vendor_id) || 'Vendor'}
                            </td>
                          )}
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 print:text-black print:py-2">{r.item}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 print:text-black print:py-2">{r.bags_count}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 print:text-black print:py-2">{r.kgs}</td>
                          <td className="px-4 py-4 text-sm text-slate-600 print:text-black print:py-2">{formatCurrency(r.unit_price)}</td>
                          <td className="px-4 py-4 text-right font-['Outfit'] text-base font-semibold text-slate-900 print:text-black print:py-2">{formatCurrency(r.total_price)}</td>
                          <td className="pr-4 py-4 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingId(r.id); setEditForm({ item: r.item, bags_count: r.bags_count, kgs: r.kgs, unit_price: r.unit_price }); }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                                title="Edit record"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(r.id, r.item, r.kgs, r.unit_price, r.total_price)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete record"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 print:border-t-2 print:border-black">
                  <tr>
                    <td colSpan={!selectedVendorId ? 2 : 1} className="px-6 py-4 text-sm font-bold text-slate-900 print:py-3">
                      Total ({detailedRecords.length} Items)
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900 text-sm print:py-3">{totalDetailedBags}</td>
                    <td className="px-4 py-4 font-bold text-slate-900 text-sm print:py-3">{totalDetailedKgs} kg</td>
                    <td className="px-4 py-4 print:py-3"></td>
                    <td className="px-4 py-4 text-right font-['Outfit'] text-2xl font-bold text-emerald-600 print:text-black print:py-3">
                      {formatCurrency(totalDetailedAmount)}
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
