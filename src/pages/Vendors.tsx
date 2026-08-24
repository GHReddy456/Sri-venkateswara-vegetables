import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendor } from '../types';
import {
  Plus,
  Edit2,
  Archive,
  Loader2,
  RefreshCw,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name');
    if (!error && data) setVendors(data);
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;
    const { error } = await supabase.from('vendors').insert([{ name: newVendorName.trim() }]);
    if (error) { alert('Error adding vendor: ' + error.message); return; }
    setNewVendorName('');
    setIsAdding(false);
    fetchVendors();
  };

  const handleUpdateVendor = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const { error } = await supabase.from('vendors').update({ name: editName.trim() }).eq('id', id);
    if (error) { alert('Error updating vendor: ' + error.message); return; }
    setEditingId(null);
    fetchVendors();
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this vendor?`)) return;
    const { error } = await supabase.from('vendors').update({ active: !currentActive }).eq('id', id);
    if (error) { alert('Error updating vendor: ' + error.message); return; }
    fetchVendors();
  };

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeCount = vendors.filter(v => v.active).length;
  const inactiveCount = vendors.filter(v => !v.active).length;

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-200 hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-green-800 flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> New Vendor
          </h3>
          <form onSubmit={handleAddVendor} className="flex gap-3">
            <input
              type="text"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              placeholder="Enter vendor name..."
              className="flex-1 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400"
              required
              autoFocus
            />
            <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
              Save
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vendors..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm shadow-sm"
        />
      </div>

      {/* Vendor list */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
            <Building2 className="h-12 w-12 text-gray-200" />
            <p className="text-gray-500">
              {searchQuery ? 'No vendors match your search.' : 'No vendors yet. Click "Add Vendor" to create one.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filtered.map((vendor) => (
              <li key={vendor.id} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50">
                {editingId === vendor.id ? (
                  <form onSubmit={(e) => handleUpdateVendor(e, vendor.id)} className="flex flex-1 items-center gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 max-w-sm rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      required
                      autoFocus
                    />
                    <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600">Cancel</button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${vendor.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-medium ${vendor.active ? 'text-gray-900' : 'text-gray-400'}`}>
                          {vendor.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {vendor.active ? (
                            <span className="badge bg-green-100 text-green-700">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="badge bg-gray-100 text-gray-500">
                              <XCircle className="mr-1 h-3 w-3" /> Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingId(vendor.id); setEditName(vendor.name); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit name"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(vendor.id, vendor.active)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${vendor.active ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-500 hover:bg-green-50 hover:text-green-700'}`}
                        title={vendor.active ? 'Deactivate' : 'Activate'}
                      >
                        {vendor.active ? <Archive className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
