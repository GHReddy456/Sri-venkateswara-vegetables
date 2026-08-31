import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendor, PurchaseRecordInput } from '../types';
import { calculateLineTotal, calculateItemsTotal, calculateDailyTotal } from '../lib/calculations';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AddRecords() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [coolieAmount, setCoolieAmount] = useState<number | ''>('');
  const [items, setItems] = useState<PurchaseRecordInput[]>([
    { item: '', bags_count: 0, kgs: 0, unit_price: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendors
  useEffect(() => {
    supabase.from('vendors').select('*').eq('active', true).order('name').then(({ data, error }) => {
      if (!error && data) setVendors(data);
      setLoadingVendors(false);
    });
  }, []);

  // Fetch existing coolie amount when vendor or date changes
  useEffect(() => {
    if (!selectedVendorId || !date) {
      setCoolieAmount('');
      return;
    }

    supabase
      .from('vendor_daily_coolie')
      .select('coolie_amount')
      .eq('vendor_id', selectedVendorId)
      .eq('purchase_date', date)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.coolie_amount !== undefined) {
          setCoolieAmount(data.coolie_amount);
        } else {
          setCoolieAmount('');
        }
      });
  }, [selectedVendorId, date]);

  const handleAddItem = () => setItems([...items, { item: '', bags_count: 0, kgs: 0, unit_price: 0 }]);

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseRecordInput, value: string) => {
    const updated = [...items];
    if (field === 'item') {
      updated[index].item = value;
    } else {
      const numVal = value === '' ? 0 : Number(value);
      if (field === 'bags_count') updated[index].bags_count = numVal;
      if (field === 'kgs') updated[index].kgs = numVal;
      if (field === 'unit_price') updated[index].unit_price = numVal;
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);
    if (!date) { setError('Please select a date.'); return; }
    if (!selectedVendorId) { setError('Please select a vendor.'); return; }
    const validItems = items.filter(i => i.item.trim() && i.bags_count > 0 && i.kgs > 0 && i.unit_price > 0);
    if (validItems.length === 0) { setError('Please enter at least one valid item (bags, kgs, and unit price must be > 0).'); return; }

    setIsSaving(true);

    const records = validItems.map(item => ({
      purchase_date: date,
      vendor_id: selectedVendorId,
      item: item.item.trim(),
      bags_count: item.bags_count,
      kgs: item.kgs,
      unit_price: item.unit_price,
      total_price: calculateLineTotal(item.kgs, item.unit_price),
      created_by: user?.id,
    }));

    const { error: insertError } = await supabase.from('purchase_records').insert(records);

    if (insertError) {
      setError('Unable to save records: ' + insertError.message);
      setIsSaving(false);
      return;
    }

    // Upsert vendor coolie charge for this date
    const parsedCoolie = Math.floor(Number(coolieAmount)) || 0;
    try {
      await supabase
        .from('vendor_daily_coolie')
        .upsert(
          {
            vendor_id: selectedVendorId,
            purchase_date: date,
            coolie_amount: parsedCoolie,
          },
          { onConflict: 'vendor_id,purchase_date' }
        );
    } catch (cErr) {
      console.warn('Could not save coolie record:', cErr);
    }

    setSaveSuccess(true);
    setItems([{ item: '', bags_count: 0, kgs: 0, unit_price: 0 }]);
    setCoolieAmount('');
    setTimeout(() => setSaveSuccess(false), 4000);
    setIsSaving(false);
  };

  const itemsTotal = calculateItemsTotal(items);
  const numCoolie = Math.floor(Number(coolieAmount)) || 0;
  const dailyTotal = calculateDailyTotal(items, numCoolie);
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-['Outfit'] text-4xl font-bold text-slate-900 tracking-tight">Add Purchase Records</h1>
        <p className="mt-1 text-sm text-slate-500">Record daily vegetable purchases and vendor-wise coolie charges.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Date, Vendor & Coolie selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Purchase Date */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">calendar_today</span>
              Purchase Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 text-slate-900"
            />
          </div>

          {/* Vendor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">storefront</span>
              Vendor
            </label>
            {loadingVendors ? (
              <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading vendors...
              </div>
            ) : (
              <select
                required
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 text-slate-900"
              >
                <option value="">Select a vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Coolie Amount (Vendor-wise per day) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 metric-shadow">
            <label className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-900">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">engineering</span>
                Coolie (₹)
              </span>
              <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Per Vendor / Day
              </span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 100"
              value={coolieAmount}
              onChange={(e) => setCoolieAmount(e.target.value === '' ? '' : Math.floor(Number(e.target.value)))}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 text-slate-900 font-['Outfit'] font-semibold"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">Added once per vendor per day to daily cumulative total.</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-slate-200 rounded-2xl metric-shadow overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h3 className="font-['Outfit'] text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">inventory_2</span>
              Items
              {selectedVendor && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 ml-2">
                  {selectedVendor.name}
                </span>
              )}
            </h3>
            <span className="text-xs font-semibold text-slate-500">{items.length} row{items.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-28">Bags</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-32">Kgs</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 w-36">₹ / kg</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 w-36">Total</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tomato"
                        value={item.item}
                        onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.bags_count || ''}
                        onChange={(e) => handleItemChange(index, 'bags_count', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        required
                        min="0.001"
                        step="any"
                        value={item.kgs || ''}
                        onChange={(e) => handleItemChange(index, 'kgs', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-['Outfit'] font-semibold text-slate-900 text-base">
                      {calculateLineTotal(item.kgs, item.unit_price) > 0
                        ? formatCurrency(calculateLineTotal(item.kgs, item.unit_price))
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="pr-4 py-3 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Breakdown rows */}
                <tr className="border-t border-slate-200 bg-slate-50/50">
                  <td colSpan={4} className="px-6 py-2.5 text-right text-xs font-semibold text-slate-500">
                    Items Total
                  </td>
                  <td className="px-4 py-2.5 text-right font-['Outfit'] font-semibold text-slate-700 text-sm">
                    {formatCurrency(itemsTotal)}
                  </td>
                  <td></td>
                </tr>
                {numCoolie > 0 && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={4} className="px-6 py-2.5 text-right text-xs font-semibold text-emerald-700">
                      + Coolie Charge (Vendor/Day)
                    </td>
                    <td className="px-4 py-2.5 text-right font-['Outfit'] font-semibold text-emerald-700 text-sm">
                      {formatCurrency(numCoolie)}
                    </td>
                    <td></td>
                  </tr>
                )}
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                    Daily Cumulative Total (Items + Coolie)
                  </td>
                  <td className="px-4 py-4 text-right font-['Outfit'] text-2xl font-bold text-emerald-600">
                    {formatCurrency(dailyTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t border-slate-200 px-6 py-4 bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-emerald-600 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Item Row
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <span className="material-symbols-outlined text-red-600">error</span>
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            Records & Coolie saved successfully!
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 font-['Outfit'] text-base font-semibold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-60 transition-all active:scale-95"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin text-white" /> Saving...</>
            ) : (
              <><span className="material-symbols-outlined text-[20px]">save</span> Save Records</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
