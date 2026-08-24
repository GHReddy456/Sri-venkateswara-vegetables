import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vendor } from '../types';
import { Loader2 } from 'lucide-react';

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
    const { data, error } = await supabase.from('vendors').select('*').order('name');
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

  const filtered = vendors.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeCount = vendors.filter(v => v.active).length;
  const inactiveCount = vendors.filter(v => !v.active).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Outfit'] text-4xl font-bold text-[#0b1c30] tracking-tight">Vendors</h1>
          <p className="mt-1 text-sm text-[#404941]">
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); }}
          className="bg-[#004323] text-white font-['Outfit'] text-sm font-semibold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[#0d5c34] transition-all shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Vendor
        </button>
      </div>

      {/* Add vendor form */}
      {isAdding && (
        <div className="bg-[#eff4ff] border border-[#a9f3be] rounded-2xl p-6 metric-shadow">
          <h3 className="font-['Outfit'] text-base font-semibold text-[#004323] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">add_business</span> New Vendor
          </h3>
          <form onSubmit={handleAddVendor} className="flex gap-3">
            <input
              type="text"
              value={newVendorName}
              onChange={(e) => setNewVendorName(e.target.value)}
              placeholder="Enter vendor name..."
              className="flex-1 rounded-xl border border-[#bfc9bf] bg-white px-4 py-2.5 text-sm"
              required
              autoFocus
            />
            <button type="submit" className="bg-[#004323] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#0d5c34]">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="border border-[#bfc9bf] bg-white px-5 py-2.5 rounded-full text-sm font-semibold text-[#404941] hover:bg-[#eff4ff]">Cancel</button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#404941] text-[20px]">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vendors..."
          className="w-full rounded-2xl border border-[#bfc9bf] bg-white py-3 pl-12 pr-4 text-sm metric-shadow"
        />
      </div>

      {/* Vendor list */}
      <div className="bg-white border border-[#bfc9bf] rounded-2xl metric-shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#004323]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#bfc9bf]">storefront</span>
            <p className="text-[#404941] text-sm">
              {searchQuery ? 'No vendors match your search.' : 'No vendors yet. Click "Add Vendor" to create one.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#bfc9bf]/20">
            {filtered.map((vendor) => (
              <li key={vendor.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#eff4ff]/50 transition-colors">
                {editingId === vendor.id ? (
                  <form onSubmit={(e) => handleUpdateVendor(e, vendor.id)} className="flex flex-1 items-center gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 max-w-sm rounded-xl border border-[#bfc9bf] px-3 py-2 text-sm"
                      required
                      autoFocus
                    />
                    <button type="submit" className="bg-[#004323] text-white px-4 py-2 rounded-full text-xs font-semibold">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="border border-[#bfc9bf] px-4 py-2 rounded-full text-xs font-semibold text-[#404941]">Cancel</button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm font-['Outfit'] ${vendor.active ? 'bg-[#004323] text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {vendor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-semibold ${vendor.active ? 'text-[#0b1c30]' : 'text-gray-400'}`}>
                          {vendor.name}
                        </p>
                        <div className="mt-1">
                          {vendor.active ? (
                            <span className="bg-[#eff4ff] text-[#004323] text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span> Active
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">cancel</span> Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingId(vendor.id); setEditName(vendor.name); }}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#404941] hover:bg-[#eff4ff] hover:text-[#004323]"
                        title="Edit name"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleToggleActive(vendor.id, vendor.active)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${vendor.active ? 'text-[#ba1a1a] hover:bg-[#ffdad6]' : 'text-[#004323] hover:bg-[#eff4ff]'}`}
                        title={vendor.active ? 'Deactivate' : 'Activate'}
                      >
                        <span className="material-symbols-outlined text-[18px]">{vendor.active ? 'archive' : 'unarchive'}</span>
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
