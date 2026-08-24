import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendor, PurchaseRecordInput } from '../types';
import { calculateLineTotal, calculateDailyTotal } from '../lib/calculations';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  CalendarDays,
  Building2,
  Package,
  AlertCircle,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AddRecords() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [items, setItems] = useState<PurchaseRecordInput[]>([
    { item: '', bags_count: 0, kgs: 0, unit_price: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('vendors').select('*').eq('active', true).order('name').then(({ data, error }) => {
      if (!error && data) setVendors(data);
      setLoadingVendors(false);
    });
  }, []);

  const handleAddItem = () => setItems([...items, { item: '', bags_count: 0, kgs: 0, unit_price: 0 }]);

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseRecordInput, value: string) => {
    const updated = [...items];
    if (field === 'item') {
      updated[index][field] = value;
    } else {
      (updated[index] as Record<string, number | string>)[field] = value === '' ? 0 : Number(value);
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
      setError('Unable to save records. ' + insertError.message);
    } else {
      setSaveSuccess(true);
      setItems([{ item: '', bags_count: 0, kgs: 0, unit_price: 0 }]);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
    setIsSaving(false);
  };

  const dailyTotal = calculateDailyTotal(items);
  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  return (
    <div className="space-y-6 px-1 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Purchase Records</h1>
        <p className="mt-1 text-sm text-gray-500">Record daily vegetable purchases from vendors.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date & Vendor selector */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <CalendarDays className="h-4 w-4 text-primary" /> Purchase Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Building2 className="h-4 w-4 text-primary" /> Vendor
            </label>
            {loadingVendors ? (
              <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors...
              </div>
            ) : (
              <select
                required
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm"
              >
                <option value="">Select a vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Package className="h-4 w-4 text-primary" />
              Items
              {selectedVendor && (
                <span className="badge bg-green-100 text-green-700 ml-2">{selectedVendor.name}</span>
              )}
            </h3>
            <span className="text-sm text-gray-400">{items.length} row{items.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Item Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-28">Bags</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-32">Kgs</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-36">₹ / kg</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, index) => (
                  <tr key={index} className="table-row-hover">
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tomato"
                        value={item.item}
                        onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.bags_count || ''}
                        onChange={(e) => handleItemChange(index, 'bags_count', e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                        className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
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
                        className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                      {calculateLineTotal(item.kgs, item.unit_price) > 0
                        ? formatCurrency(calculateLineTotal(item.kgs, item.unit_price))
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="pr-4 py-3 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                    Daily Cumulative Total
                  </td>
                  <td className="px-4 py-4 text-right text-lg font-bold text-primary">
                    {formatCurrency(dailyTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-primary hover:bg-green-100"
            >
              <Plus className="h-4 w-4" /> Add Item Row
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Records saved successfully!
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-green-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Save Records</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
