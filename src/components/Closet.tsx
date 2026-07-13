import React, { useState, useEffect } from 'react';
import { Camera, Plus, Loader2, Search, Trash2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addClothingItem, fetchClothingItems } from '../services/dataService';
import { categorizeClothing } from '../lib/gemini';

export default function Closet() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const unsubscribe = fetchClothingItems(setItems);
    setLoading(false);
    return unsubscribe;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          // AI Categorization
          const categoryData = await categorizeClothing(base64);
          
          await addClothingItem({
            ...categoryData,
            imageUrl: base64,
          });
          setUploading(false);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to analyze image. Please try again.');
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setError('Failed to read file.');
      setUploading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Closet</h2>
          <p className="text-gray-500">Manage your collection of {items.length} items.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl cursor-pointer hover:bg-gray-800 transition-all font-medium shadow-lg hover:shadow-xl active:scale-95">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            {uploading ? 'Analyzing...' : 'Add Item'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {error && (
          <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'top', 'bottom', 'shoes', 'outerwear', 'accessory'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-3.5 rounded-2xl whitespace-nowrap font-medium transition-all ${
                filter === f ? 'bg-white text-black shadow-md border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>

    {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-50">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.isDirty ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {item.isDirty ? 'Dirty' : 'Clean'}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 truncate">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">{item.category} • {item.season}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredItems.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shirt className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No items found</h3>
              <p className="text-gray-500">Try adjusting your search or upload your first item.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Shirt({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.62 1.96v4.42a2 2 0 0 0 .39 1.2l3.4 4.88a2 2 0 0 1 .3 1V20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.08a2 2 0 0 1 .3-1l3.4-4.88a2 2 0 0 0 .39-1.2V5.42a2 2 0 0 0-1.62-1.96Z"/>
      <path d="M10 8c.5 1 2.5 1 3 0"/>
    </svg>
  );
}
