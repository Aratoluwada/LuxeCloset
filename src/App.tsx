import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { Shirt, Calendar as CalendarIcon, Waves, BrainCircuit, LogOut, Loader2, Plus, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Closet from './components/Closet';
import CalendarView from './components/CalendarView';
import Laundry from './components/Laundry';
import AIAdvisor from './components/AIAdvisor';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'closet' | 'calendar' | 'laundry' | 'ai'>('closet');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Shirt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">LuxeCloset</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Your personal AI wardrobe assistant. Organise, track, and style your life effortlessly.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-black text-white hover:bg-gray-800 transition-all font-medium py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 rounded-full" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0 lg:pl-64">
      {/* Sidebar - Desktop */}
      <nav className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col p-6 z-30">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
            <Shirt className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">LuxeCloset</span>
        </div>

        <div className="space-y-1">
          {[
            { id: 'closet', label: 'Closet', icon: Shirt },
            { id: 'calendar', label: 'Planner', icon: CalendarIcon },
            { id: 'laundry', label: 'Laundry', icon: Waves },
            { id: 'ai', label: 'AI Advisor', icon: BrainCircuit },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeTab === tab.id 
                ? 'bg-black text-white shadow-lg' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-black'}`} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-6">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-10 h-10 rounded-xl shadow-md border border-gray-200" 
              alt="Profile" 
            />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate">{user.displayName}</span>
              <span className="text-xs text-gray-400 truncate">{user.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="fixed bottom-6 left-6 right-6 lg:hidden z-50">
        <nav className="bg-black/90 backdrop-blur-xl rounded-3xl p-2.5 flex items-center justify-around shadow-2xl border border-white/10">
          {[
            { id: 'closet', icon: Shirt },
            { id: 'calendar', icon: CalendarIcon },
            { id: 'laundry', icon: Waves },
            { id: 'ai', icon: BrainCircuit },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-4 rounded-2xl transition-all ${
                activeTab === tab.id ? 'bg-white text-black scale-110 shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="p-6 md:p-10 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'closet' && <Closet />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'laundry' && <Laundry />}
            {activeTab === 'ai' && <AIAdvisor />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
