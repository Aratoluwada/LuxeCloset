import React, { useState, useEffect } from 'react';
import { Waves, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchClothingItems, updateItemLaundry } from '../services/dataService';

export default function Laundry() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = fetchClothingItems(setItems);
    setLoading(false);
    return unsubscribe;
  }, []);

  const dirtyItems = items.filter(item => item.isDirty);

  const handleWashAll = async () => {
    for (const item of dirtyItems) {
      await updateItemLaundry(item.id, false);
    }
  };

  const handleWashItem = async (id: string) => {
    await updateItemLaundry(id, false);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laundry Basket</h2>
          <p className="text-gray-500">Track and manage your dirty clothing items.</p>
        </div>
        
        {dirtyItems.length > 0 && (
          <button 
            onClick={handleWashAll}
            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Wash All Items
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {dirtyItems.map((item) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-all"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                  <p className="text-xs text-gray-400 capitalize">{item.category} • {item.season}</p>
                </div>
                <button 
                  onClick={() => handleWashItem(item.id)}
                  className="p-3 rounded-xl hover:bg-green-50 text-gray-300 hover:text-green-500 transition-all border border-transparent hover:border-green-100"
                >
                  <CheckCircle2 className="w-6 h-6" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {dirtyItems.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Basket Empty!</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Everything is fresh and clean. Your closet is ready for the week.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
