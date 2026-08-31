import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { PurchaseRecord, Vendor } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { calculateLineTotal, calculateItemsTotal, calculateDailyTotal, calculateTotalBags, calculateTotalKgs } from '../lib/calculations';
import { Loader2 } from 'lucide-react';

export default function DailyRecords() {
  const { date } = useParams<{ date: string }>();
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get('vendor');

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [coolieAmount, setCoolieAmount] = useState<number>(0);
  const [isUpdatingCoolie, setIsUpdatingCoolie] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ item: '', bags_count: 0, kgs: 0, unit_price: 0 });

  const fetchRecords = async () => {
    if (!vendorId || !date) return;
    setLoading(true);
    const [{ data: vData }, { data: rData }, { data: cData }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', vendorId).single(),
      supabase.from('purchase_records').select('*').eq('vendor_id', vendorId).eq('purchase_date', date).order('created_at'),
      supabase.from('vendor_daily_coolie').select('coolie_amount').eq('vendor_id', vendorId).eq('purchase_date', date).maybeSingle(),
    ]);
    if (vData) setVendor(vData);
    if (rData) setRecords(rData);
    if (cData?.coolie_amount !== undefined) setCoolieAmount(Number(cData.coolie_amount) || 0);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [vendorId, date]);

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('purchase_records').update({
      item: editForm.item,
      bags_count: editForm.bags_count,
      kgs: editForm.kgs,
      unit_price: editForm.unit_price,
      total_price: calculateLineTotal(editForm.kgs, editForm.unit_price),
    }).eq('id', editingId);
    if (error) { alert('Failed to update: ' + error.message); return; }
    setEditingId(null);
    fetchRecords();
  };

  const handleDelete = async (id: string, itemName: string, kgs: number, price: number, total: number) => {
    if (!confirm(`Delete this record?\n\n${itemName}\n${kgs} kg · ₹${price}/kg\nTotal: ${formatCurrency(total)}`)) return;
    const { error } = await supabase.from('purchase_records').delete().eq('id', id);
    if (error) { alert('Failed to delete: ' + error.message); return; }
    fetchRecords();
  };

  const handleUpdateCoolie = async (newVal: number) => {
    if (!vendorId || !date) return;
    setIsUpdatingCoolie(true);
    const rounded = Math.floor(Number(newVal)) || 0;
    try {
      await supabase
        .from('vendor_daily_coolie')
        .upsert(
          {
            vendor_id: vendorId,
            purchase_date: date,
            coolie_amount: rounded,
          },
          { onConflict: 'vendor_id,purchase_date' }
        );
      setCoolieAmount(rounded);
    } catch (e) {
      console.error('Coolie update failed:', e);
    }
    setIsUpdatingCoolie(false);
  };

  const totalBags = calculateTotalBags(records);
  const totalKgs = calculateTotalKgs(records);
  const itemsTotal = calculateItemsTotal(records);
  const dailyTotal = calculateDailyTotal(records, coolieAmount);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            to="/records"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-['Outfit'] text-3xl font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">storefront</span>
              {vendor?.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {date ? formatDate(date) : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-emerald-600 text-white font-['Outfit'] text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200 active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">print</span>
          Print Detailed Report
        </button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-gray-400 pb-6">
        <div className="flex justify-center mb-3">
          <img src="/logo.png" alt="Sri Venkateswara Vegetables" className="h-24 w-auto" />
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wide">SRI VENKATESWARA VEGETABLES</h1>
        <p className="text-sm text-gray-600 mt-1">📞 9440217996 &nbsp;|&nbsp; 9032145195</p>
        <h2 className="text-xl mt-4 font-bold uppercase underline">DAILY PURCHASE REPORT</h2>
        <div className="mt-4 flex justify-between text-left px-8 text-base">
          <span><strong>Vendor:</strong> {vendor?.name}</span>
          <span><strong>Date:</strong> {date ? formatDate(date) : ''}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl metric-shadow overflow-hidden print:shadow-none">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
          <span className="font-['Outfit'] text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
            Purchase Details
          </span>
          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
            {records.length} item{records.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full print:border-t print:border-b print:border-black">
            <thead className="bg-slate-50 print:bg-transparent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-black print:text-sm print:py-2">Item</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-black print:text-sm print:py-2">Bags</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-black print:text-sm print:py-2">Kgs</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-black print:text-sm print:py-2">Rate / kg</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 print:border-b print:border-black print:text-sm print:py-2">Total</th>
                <th className="w-24 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">No records found for this date.</td>
                </tr>
              ) : records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors print:border-b print:border-gray-200">
                  {editingId === record.id ? (
                    <>
                      <td className="px-6 py-3"><input type="text" value={editForm.item} onChange={e => setEditForm({...editForm, item: e.target.value})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.bags_count} onChange={e => setEditForm({...editForm, bags_count: Number(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.kgs} onChange={e => setEditForm({...editForm, kgs: Number(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.unit_price} onChange={e => setEditForm({...editForm, unit_price: Number(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3 text-right font-['Outfit'] font-semibold text-slate-900">
                        {formatCurrency(calculateLineTotal(editForm.kgs, editForm.unit_price))}
                      </td>
                      <td className="pr-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={handleSaveEdit} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><span className="material-symbols-outlined text-[18px]">check</span></button>
                          <button onClick={() => setEditingId(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><span className="material-symbols-outlined text-[18px]">close</span></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 print:text-base print:py-2">{record.item}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 print:text-black print:text-base print:py-2">{record.bags_count}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 print:text-black print:text-base print:py-2">{record.kgs}</td>
                      <td className="px-4 py-4 text-sm text-slate-600 print:text-black print:text-base print:py-2">{formatCurrency(record.unit_price)}</td>
                      <td className="px-4 py-4 text-right font-['Outfit'] text-base font-semibold text-slate-900 print:text-black print:text-base print:py-2">{formatCurrency(record.total_price)}</td>
                      <td className="pr-4 py-4 print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingId(record.id); setEditForm({ item: record.item, bags_count: record.bags_count, kgs: record.kgs, unit_price: record.unit_price }); }} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-emerald-600"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          <button onClick={() => handleDelete(record.id, record.item, record.kgs, record.unit_price, record.total_price)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Footer */}
        {records.length > 0 && (
          <div className="border-t-2 border-slate-200 px-6 py-5 bg-slate-50 print:bg-transparent print:border-t-2 print:border-black">
            <div className="flex flex-col gap-4">
              {/* Summary Chips */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-xs print:bg-transparent print:border print:border-gray-300">
                    <span className="material-symbols-outlined text-emerald-600 print:hidden">shopping_bag</span>
                    <div>
                      <p className="text-xs text-slate-500">Total Bags</p>
                      <p className="font-['Outfit'] text-xl font-bold text-slate-900">{totalBags}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-xs print:bg-transparent print:border print:border-gray-300">
                    <span className="material-symbols-outlined text-emerald-600 print:hidden">scale</span>
                    <div>
                      <p className="text-xs text-slate-500">Total Kgs</p>
                      <p className="font-['Outfit'] text-xl font-bold text-slate-900">{totalKgs} kg</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-xs print:bg-transparent print:border print:border-gray-300">
                    <span className="material-symbols-outlined text-emerald-600 print:hidden">receipt</span>
                    <div>
                      <p className="text-xs text-slate-500">Items Subtotal</p>
                      <p className="font-['Outfit'] text-xl font-bold text-slate-900">{formatCurrency(itemsTotal)}</p>
                    </div>
                  </div>
                </div>

                {/* Editable Coolie Card */}
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 shadow-xs print:bg-transparent print:border print:border-gray-300">
                  <span className="material-symbols-outlined text-emerald-700 print:hidden">engineering</span>
                  <div>
                    <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      Coolie Charge (Vendor/Day)
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 print:hidden">
                      <span className="text-sm font-bold text-emerald-800">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={coolieAmount}
                        onChange={(e) => setCoolieAmount(Math.floor(Number(e.target.value)) || 0)}
                        onBlur={(e) => handleUpdateCoolie(Number(e.target.value))}
                        className="w-24 rounded-lg border border-emerald-300 bg-white px-2 py-0.5 text-sm font-bold text-slate-900"
                      />
                      {isUpdatingCoolie && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />}
                    </div>
                    <p className="hidden print:block font-['Outfit'] text-xl font-bold text-black">
                      + {formatCurrency(coolieAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cumulative Total Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl px-6 py-4 shadow-md flex justify-between items-center print:bg-transparent print:shadow-none print:border-2 print:border-black print:text-black">
                <div>
                  <p className="text-xs text-emerald-100 print:text-gray-600 font-semibold uppercase tracking-wider">Daily Cumulative Total (Items + Coolie)</p>
                  <p className="text-xs text-emerald-100/80 print:hidden mt-0.5">
                    Items ({formatCurrency(itemsTotal)}) + Coolie ({formatCurrency(coolieAmount)})
                  </p>
                </div>
                <p className="font-['Outfit'] text-3xl font-bold">{formatCurrency(dailyTotal)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print:hidden">
        <Link to="/records" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Records
        </Link>
      </div>
    </div>
  );
}
