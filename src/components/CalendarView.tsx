import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Loader2, Sparkles, Trash2, CheckCircle2, CloudSun, Shirt, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { addEvent, fetchEvents, fetchClothingItems, saveOutfit, fetchOutfits } from '../services/dataService';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { fetchCurrentWeather, WeatherData } from '../services/weatherService';

export default function CalendarView() {
  const [events, setEvents] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', type: 'casual', formality: 'casual', date: format(new Date(), 'yyyy-MM-dd') });
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = [...Array(7)].map((_, i) => addDays(weekStart, i));

  useEffect(() => {
    const unsubEvents = fetchEvents(setEvents);
    const unsubItems = fetchClothingItems(setItems);
    const unsubOutfits = fetchOutfits(setOutfits);
    fetchCurrentWeather().then(setWeather).catch(console.error);
    setLoading(false);
    return () => {
      unsubEvents?.();
      unsubItems?.();
      unsubOutfits?.();
    };
  }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEvent(newEvent);
    setShowEventModal(false);
    setNewEvent({ title: '', type: 'casual', formality: 'casual', date: format(new Date(), 'yyyy-MM-dd') });
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over) {
      const itemId = active.id as string;
      const date = over.id as string;
      
      const existingOutfit = outfits.find(o => o.date === date);
      const newItemIds = existingOutfit ? [...existingOutfit.itemIds, itemId] : [itemId];
      
      // Limit to unique items
      const uniqueItemIds = Array.from(new Set(newItemIds));
      
      await saveOutfit({
        date,
        itemIds: uniqueItemIds
      });
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-10 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Weekly Planner</h2>
            <p className="text-gray-500">Drag items from your closet to plan your week.</p>
          </div>
          <div className="flex items-center gap-4">
            {weather && (
              <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                <CloudSun className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-bold">{weather.temp}°C</span>
              </div>
            )}
            <button 
              onClick={() => setShowEventModal(true)}
              className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Event
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = events.filter(e => e.date === dateStr);
            const dayOutfit = outfits.find(o => o.date === dateStr);
            const outfitItems = items.filter(item => dayOutfit?.itemIds.includes(item.id));

            return (
              <div key={dateStr} className="flex flex-col gap-3 min-w-0">
                <div className={`p-4 rounded-2xl flex flex-col items-center justify-center ${isSameDay(day, today) ? 'bg-black text-white ring-4 ring-black/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSameDay(day, today) ? 'text-gray-400' : 'text-gray-400'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className="text-xl font-bold">{format(day, 'd')}</span>
                </div>

                <div className="space-y-2 flex-1">
                  {dayEvents.map(event => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={event.id} 
                      className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{event.type}</span>
                      </div>
                      <h4 className="text-sm font-semibold truncate leading-tight">{event.title}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 capitalize">{event.formality}</p>
                    </motion.div>
                  ))}

                  <DroppableZone id={dateStr}>
                    <div className="min-h-[120px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col gap-2 p-2 hover:bg-gray-50 transition-all">
                      {outfitItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {outfitItems.map(item => (
                            <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center flex-1 py-4 text-center">
                          <Sparkles className="w-4 h-4 text-gray-300 mb-1" />
                          <span className="text-[10px] text-gray-400 font-medium">Drop items here</span>
                        </div>
                      )}
                    </div>
                  </DroppableZone>
                </div>
              </div>
            );
          })}
        </div>

        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Shirt className="w-5 h-5" />
              Closet Picker
            </h3>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse">Drag & Drop Now</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {items.filter(i => !i.isDirty).map(item => (
              <DraggableItem key={item.id} item={item} />
            ))}
            {items.filter(i => !i.isDirty).length === 0 && (
              <div className="w-full py-10 text-center text-gray-400">
                <Waves className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No clean clothes available! Check your laundry.</p>
              </div>
            )}
          </div>
        </section>

        <DragOverlay>
          {activeId ? (
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl border-2 border-white ring-4 ring-black/10 scale-110">
              <img src={items.find(i => i.id === activeId)?.imageUrl} className="w-full h-full object-cover" />
            </div>
          ) : null}
        </DragOverlay>

        {/* Modal */}
        <AnimatePresence>
          {showEventModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEventModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden"
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Create New Event</h3>
                  <form onSubmit={handleAddEvent} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Event Title</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-black/5" 
                        value={newEvent.title}
                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Type</label>
                        <select 
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3"
                          value={newEvent.type}
                          onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                        >
                          <option value="casual">Casual</option>
                          <option value="work">Work</option>
                          <option value="formal">Formal</option>
                          <option value="party">Party</option>
                          <option value="sport">Sport</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Formality</label>
                        <select 
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3"
                          value={newEvent.formality}
                          onChange={e => setNewEvent({...newEvent, formality: e.target.value})}
                        >
                          <option value="casual">Casual</option>
                          <option value="smart-casual">Smart Casual</option>
                          <option value="business">Business</option>
                          <option value="formal">Formal</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-2 tracking-widest">Date</label>
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3" 
                        value={newEvent.date}
                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </div>
                    <button className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95">
                      Save Event
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
}

function DraggableItem({ item }: { item: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative min-w-[120px] aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${isDragging ? 'opacity-50 grayscale scale-105' : ''}`}
    >
      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
        <span className="text-white text-[10px] font-bold truncate">{item.name}</span>
      </div>
    </div>
  );
}

function DroppableZone({ children, id }: { children: React.ReactNode; id: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className={`rounded-2xl transition-all ${isOver ? 'ring-2 ring-black bg-gray-50' : ''}`}>
      {children}
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

function Waves({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  );
}
