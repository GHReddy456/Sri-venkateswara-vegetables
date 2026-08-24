import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { PurchaseRecord, Vendor } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { calculateLineTotal, calculateDailyTotal, calculateTotalBags, calculateTotalKgs } from '../lib/calculations';
import {
  ArrowLeft,
  Printer,
  Loader2,
  Edit2,
  Trash2,
  X,
  Check,
  Package,
  Scale,
  ShoppingBag,
  IndianRupee,
  FileText,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';

export default function DailyRecords() {
  const { date } = useParams<{ date: string }>();
  const [searchParams] = useSearchParams();
  const vendorId = searchParams.get('vendor');

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ item: '', bags_count: 0, kgs: 0, unit_price: 0 });

  const fetchRecords = async () => {
    if (!vendorId || !date) return;
    setLoading(true);
    const [{ data: vData }, { data: rData }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', vendorId).single(),
      supabase.from('purchase_records').select('*').eq('vendor_id', vendorId).eq('purchase_date', date).order('created_at'),
    ]);
    if (vData) setVendor(vData);
    if (rData) setRecords(rData);
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

  const totalBags = calculateTotalBags(records);
  const totalKgs = calculateTotalKgs(records);
  const dailyTotal = calculateDailyTotal(records);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link
            to="/records"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {vendor?.name}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
              <CalendarDays className="h-4 w-4" />
              {date ? formatDate(date) : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-200 hover:bg-primary-hover"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </button>
      </div>

      {/* Print header */}
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

      {/* Records table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm print:shadow-none">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-2 print:hidden">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-base font-semibold text-gray-900">Purchase Details</span>
          <span className="ml-auto badge bg-gray-100 text-gray-600">{records.length} item{records.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full print:border-t print:border-b print:border-black">
            <thead className="bg-gray-50 print:bg-transparent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 print:border-b print:border-black print:text-sm print:py-2">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 print:border-b print:border-black print:text-sm print:py-2">Bags</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 print:border-b print:border-black print:text-sm print:py-2">Kgs</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 print:border-b print:border-black print:text-sm print:py-2">Rate / kg</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 print:border-b print:border-black print:text-sm print:py-2">Total</th>
                <th className="w-20 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">No records found for this date.</td>
                </tr>
              ) : records.map((record) => (
                <tr key={record.id} className="table-row-hover print:border-b print:border-gray-200">
                  {editingId === record.id ? (
                    <>
                      <td className="px-6 py-3"><input type="text" value={editForm.item} onChange={e => setEditForm({...editForm, item: e.target.value})} className="w-full rounded-lg border px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.bags_count} onChange={e => setEditForm({...editForm, bags_count: Number(e.target.value)})} className="w-full rounded-lg border px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.kgs} onChange={e => setEditForm({...editForm, kgs: Number(e.target.value)})} className="w-full rounded-lg border px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3"><input type="number" value={editForm.unit_price} onChange={e => setEditForm({...editForm, unit_price: Number(e.target.value)})} className="w-full rounded-lg border px-3 py-2 text-sm" /></td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(calculateLineTotal(editForm.kgs, editForm.unit_price))}
                      </td>
                      <td className="pr-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={handleSaveEdit} className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 hover:bg-green-200"><Check className="h-4 w-4"/></button>
                          <button onClick={() => setEditingId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><X className="h-4 w-4"/></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 print:text-base print:py-2">{record.item}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 print:text-black print:text-base print:py-2">{record.bags_count}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 print:text-black print:text-base print:py-2">{record.kgs}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 print:text-black print:text-base print:py-2">{formatCurrency(record.unit_price)}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900 print:text-black print:text-base print:py-2">{formatCurrency(record.total_price)}</td>
                      <td className="pr-4 py-4 print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingId(record.id); setEditForm({ item: record.item, bags_count: record.bags_count, kgs: record.kgs, unit_price: record.unit_price }); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Edit2 className="h-4 w-4"/></button>
                          <button onClick={() => handleDelete(record.id, record.item, record.kgs, record.unit_price, record.total_price)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals footer */}
        {records.length > 0 && (
          <div className="border-t-2 border-gray-200 px-6 py-5 print:border-t-2 print:border-black">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 print:bg-transparent print:border print:border-gray-300">
                  <ShoppingBag className="h-4 w-4 text-primary print:hidden" />
                  <div>
                    <p className="text-xs text-gray-400 print:text-gray-600">Total Bags</p>
                    <p className="text-lg font-bold text-gray-900">{totalBags}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 print:bg-transparent print:border print:border-gray-300">
                  <Scale className="h-4 w-4 text-primary print:hidden" />
                  <div>
                    <p className="text-xs text-gray-400 print:text-gray-600">Total Kgs</p>
                    <p className="text-lg font-bold text-gray-900">{totalKgs} kg</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-primary px-6 py-4 text-white shadow-lg shadow-green-200 print:bg-transparent print:shadow-none print:border-2 print:border-black print:text-black">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 print:hidden" />
                  <div>
                    <p className="text-xs text-green-100 print:text-gray-600 print:text-sm">Daily Cumulative Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(dailyTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="print:hidden">
        <Link to="/records" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Records
        </Link>
      </div>
    </div>
  );
}
