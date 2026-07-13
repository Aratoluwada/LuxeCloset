import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, Star, MessageCircle, Loader2, Calendar, CloudSun, Thermometer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchClothingItems, fetchEvents, fetchOutfits, saveOutfit } from '../services/dataService';
import { suggestOutfit, rateOutfit } from '../lib/gemini';
import { fetchCurrentWeather, WeatherData } from '../services/weatherService';
import ReactMarkdown from 'react-markdown';

export default function AIAdvisor() {
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [ratingData, setRatingData] = useState<{ rating: number, feedback: string } | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

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

  const handleSuggest = async () => {
    setGenerating(true);
    try {
      const weatherStr = weather ? `${weather.description}, ${weather.temp}°C` : "Mild weather";
      const result = await suggestOutfit(items.filter(i => !i.isDirty), events, weatherStr);
      setSuggestions(result);
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleApplySuggestion = async (suggestion: any, date: string) => {
    await saveOutfit({
      date,
      itemIds: suggestion.itemIds,
    });
    // Remove suggestion from list
    setSuggestions(suggestions.filter(s => s.eventId !== suggestion.eventId));
  };

  const handleRateCurrentOutfit = async (outfit: any, event: any) => {
    setRatingLoading(true);
    try {
      const outfitItems = items.filter(i => outfit.itemIds.includes(i.id));
      const result = await rateOutfit(outfitItems, event);
      setRatingData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Advisor</h2>
          <p className="text-gray-500">Intelligent outfit suggestions and fashion feedback.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {weather && (
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
              <CloudSun className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Weather</p>
                <p className="text-sm font-bold">{weather.temp}°C • {weather.description}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleSuggest}
            disabled={generating || events.length === 0}
            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate Suggestions
          </button>
        </div>
      </header>

      {events.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Events Scheduled</h3>
          <p className="text-gray-500 max-w-sm mx-auto">Add some events to your calendar so the AI can suggest appropriate outfits for you.</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            AI Recommended Outfits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((s, idx) => {
              const event = events.find(e => e.id === s.eventId);
              const suggestedItems = items.filter(i => s.itemIds.includes(i.id));
              
              if (!event) return null;

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={s.eventId} 
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4"
                >
                  <div>
                    <h4 className="font-bold text-lg">{event.title}</h4>
                    <p className="text-xs text-gray-400">{event.date} • {event.type}</p>
                  </div>
                  
                  <div className="flex -space-x-3 overflow-hidden">
                    {suggestedItems.map(item => (
                      <div key={item.id} className="inline-block h-16 w-16 rounded-xl ring-4 ring-white overflow-hidden bg-gray-50 border border-gray-100">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl italic">
                    "{s.reasoning}"
                  </div>

                  <button 
                    onClick={() => handleApplySuggestion(s, event.date)}
                    className="w-full bg-gray-100 text-black py-3 rounded-xl font-bold hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    Apply Suggestion
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Outfit Rating
        </h3>
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          {outfits.length > 0 ? (
            <div className="space-y-8">
              <p className="text-gray-500">Rate your planned outfits to get style feedback.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase text-gray-400 tracking-widest">Selected Outfit</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-4 font-bold"
                    onChange={(e) => {
                      const outfit = outfits.find(o => o.id === e.target.value);
                      const event = events.find(ev => ev.date === outfit?.date);
                      if (outfit && event) handleRateCurrentOutfit(outfit, event);
                    }}
                  >
                    <option value="">Select an outfit to rate...</option>
                    {outfits.map(o => (
                      <option key={o.id} value={o.id}>Outfit for {o.date}</option>
                    ))}
                  </select>

                  {ratingLoading && (
                    <div className="flex items-center gap-3 text-gray-400 py-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>AI is analysing your style...</span>
                    </div>
                  )}

                  {ratingData && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-black text-white p-6 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden"
                    >
                      <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/5" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold uppercase tracking-widest text-white/50">Gemini Score</span>
                        <div className="flex items-center gap-1">
                          {[...Array(10)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < ratingData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="text-4xl font-black">{ratingData.rating}/10</div>
                      <div className="text-sm text-gray-300 leading-relaxed markdown-body">
                        <ReactMarkdown>{ratingData.feedback}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="hidden md:flex items-center justify-center">
                   <div className="w-full h-full min-h-[300px] bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 p-10 text-center">
                      <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-sm">Select a planned outfit to see AI feedback here.</p>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
               <p>Plan some outfits in the Planner first to get them rated!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
