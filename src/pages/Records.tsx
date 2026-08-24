import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendor, DailySummary } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { subDays, format } from 'date-fns';

export default function Records() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorSearchText, setVendorSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);
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

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(vendorSearchText.toLowerCase())
  );

  const handleSelectVendor = (v: Vendor) => {
    setSelectedVendorId(v.id);
    setVendorSearchText(v.name);
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedVendorId('');
    setVendorSearchText('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h1 className="font-['Outfit'] text-4xl font-bold text-[#0b1c30] tracking-tight">Purchase Records</h1>
          <p className="mt-1 text-sm text-[#404941]">View 30-day vendor summaries and detailed daily reports.</p>
        </div>
        {summaries.length > 0 && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-[#bfc9bf] bg-white px-5 py-2.5 text-sm font-semibold text-[#0b1c30] shadow-sm hover:bg-[#eff4ff] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            Print Summary
          </button>
        )}
      </div>

      {/* Full-Width Vendor Selection Section */}
      <div className="bg-white border border-[#bfc9bf] rounded-xl p-6 metric-shadow print:hidden">
        <label className="mb-3 flex items-center gap-2 text-base font-semibold text-[#0b1c30]">
          <span className="material-symbols-outlined text-[#004323] text-[22px]">storefront</span>
          Select Vendor
        </label>
        
        <div className="w-full max-w-2xl" ref={dropdownRef}>
          {/* Search Input Box */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#404941] text-[22px] pointer-events-none">search</span>
            <input
              type="text"
              value={vendorSearchText}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setVendorSearchText(e.target.value);
                setIsDropdownOpen(true);
                if (selectedVendorId) setSelectedVendorId('');
              }}
              placeholder="Type or click to search vendor name..."
              style={{ width: '100%', minWidth: '100%' }}
              className="w-full rounded-lg border-2 border-[#bfc9bf] bg-white py-3.5 pl-12 pr-10 text-base font-semibold text-[#0b1c30] shadow-sm focus:border-[#004323] focus:ring-0 transition-all placeholder:text-[#707a70]"
            />
            {vendorSearchText && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#404941] hover:text-[#0b1c30] hover:bg-[#eff4ff] rounded-full"
                title="Clear selection"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* Quick Vendor Chips for Easy One-Click Selection */}
          {vendors.length > 0 && !selectedVendorId && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-[#404941] self-center mr-1">Quick Select:</span>
              {vendors.slice(0, 8).map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVendor(v)}
                  className="px-3 py-1.5 rounded-md bg-[#eff4ff] text-[#004323] text-xs font-semibold hover:bg-[#004323] hover:text-white transition-all border border-[#bfc9bf]/50"
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}

          {/* Dropdown Menu when typing or focused */}
          {isDropdownOpen && (
            <div className="absolute z-30 mt-2 w-full max-w-2xl max-h-64 overflow-y-auto rounded-lg border-2 border-[#004323] bg-white shadow-xl">
              {filteredVendors.length === 0 ? (
                <div className="px-4 py-4 text-sm text-[#404941] font-medium">No vendor matches "{vendorSearchText}"</div>
              ) : (
                filteredVendors.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVendor(v)}
                    className={`w-full text-left px-5 py-3.5 text-base font-semibold transition-colors border-b border-[#bfc9bf]/30 last:border-0 hover:bg-[#eff4ff] flex items-center justify-between ${
                      selectedVendorId === v.id ? 'bg-[#eff4ff] text-[#004323]' : 'text-[#0b1c30]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#004323] text-white flex items-center justify-center font-bold text-xs">
                        {v.name.charAt(0).toUpperCase()}
                      </span>
                      {v.name} {!v.active && <span className="text-xs text-gray-400 font-normal">(Inactive)</span>}
                    </span>
                    {selectedVendorId === v.id && (
                      <span className="material-symbols-outlined text-[20px] text-[#004323]">check_circle</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {selectedVendorId && (
        <>
          {/* Summary Stat Cards */}
          {!loading && summaries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:hidden">
              <div className="bg-[#004323] text-white rounded-xl p-6 metric-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">30-Day Cumulative Total</p>
                <p className="font-['Outfit'] text-3xl font-bold mt-2">{formatCurrency(thirtyDayTotal)}</p>
              </div>
              <div className="bg-white border border-[#bfc9bf] rounded-xl p-6 metric-shadow">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#404941]">Active Purchase Days</p>
                <p className="font-['Outfit'] text-3xl font-bold mt-2 text-[#0b1c30]">{summaries.length}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-[#bfc9bf] rounded-xl metric-shadow overflow-hidden print:shadow-none print:border-none">
            <div className="border-b border-[#bfc9bf]/40 px-6 py-4 flex items-center justify-between print:hidden">
              <h3 className="font-['Outfit'] text-lg font-semibold text-[#0b1c30] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004323]">receipt_long</span>
                Last 30 Days — {selectedVendor?.name}
              </h3>
              <span className="bg-[#eff4ff] text-[#004323] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                30 Days History
              </span>
            </div>

            {/* Print Header */}
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
                <Loader2 className="h-8 w-8 animate-spin text-[#004323]" />
              </div>
            ) : summaries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-16 text-center print:hidden">
                <span className="material-symbols-outlined text-[48px] text-[#bfc9bf]">calendar_today</span>
                <p className="text-[#404941] text-sm">No purchase records found for this vendor in the last 30 days.</p>
              </div>
            ) : (
              <table className="min-w-full print:border print:border-gray-300">
                <thead className="bg-[#eff4ff] print:bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#404941] print:border-b print:border-gray-300 print:text-sm">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#404941] print:border-b print:border-gray-300 print:text-sm">
                      Daily Total
                    </th>
                    <th className="w-12 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bfc9bf]/20">
                  {summaries.map((s) => (
                    <tr key={s.purchase_date} className="hover:bg-[#eff4ff]/50 transition-colors group print:border-b print:border-gray-200">
                      <td className="px-6 py-4 text-sm font-semibold print:py-2 print:text-base print:border-b print:border-gray-200">
                        <Link
                          to={`/records/${s.purchase_date}?vendor=${selectedVendorId}`}
                          className="flex items-center gap-2 text-[#004323] hover:underline print:text-black print:no-underline"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#404941] print:hidden">calendar_today</span>
                          {formatDate(s.purchase_date)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-['Outfit'] font-semibold text-[#0b1c30] text-base print:py-2 print:text-base print:border-b print:border-gray-200">
                        {formatCurrency(s.daily_total)}
                      </td>
                      <td className="pr-4 py-4 text-right print:hidden">
                        <span className="material-symbols-outlined text-[#bfc9bf] group-hover:text-[#004323] group-hover:translate-x-1 transition-all">chevron_right</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#eff4ff] border-t-2 border-[#bfc9bf] print:border-t-2 print:border-black">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-[#0b1c30] flex items-center gap-2 print:py-3 print:text-base">
                      <span className="material-symbols-outlined text-[#004323] print:hidden">trending_up</span>
                      30-Day Cumulative Total
                    </td>
                    <td className="px-6 py-4 text-right font-['Outfit'] text-2xl font-bold text-[#004323] print:text-black print:py-3">
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
