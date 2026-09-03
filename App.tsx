import React, { useState } from 'react';
import { QrCode, Sparkles, Trash2, UserPlus, Calendar } from 'lucide-react';
import { ContactData, EventData, INITIAL_CONTACT_DATA, INITIAL_EVENT_DATA, QrMode } from './types';
import ContactForm from './components/ContactForm';
import EventForm from './components/EventForm';
import QRCard from './components/QRCard';
import SmartParser from './components/SmartParser';

const App: React.FC = () => {
  const [mode, setMode] = useState<QrMode>('contact');
  const [contactData, setContactData] = useState<ContactData>(INITIAL_CONTACT_DATA);
  const [eventData, setEventData] = useState<EventData>(INITIAL_EVENT_DATA);

  const handleContactChange = (field: keyof ContactData, value: string) => {
    setContactData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventChange = (field: keyof EventData, value: string) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleParsedData = (parsed: Partial<ContactData> | Partial<EventData>) => {
    if (mode === 'contact') {
      setContactData(prev => ({ ...prev, ...parsed as Partial<ContactData> }));
    } else {
      setEventData(prev => ({ ...prev, ...parsed as Partial<EventData> }));
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all fields?")) {
      if (mode === 'contact') setContactData(INITIAL_CONTACT_DATA);
      else setEventData(INITIAL_EVENT_DATA);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      
      {/* Ambient Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-200/20 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[120px] animate-float" style={{animationDelay: '-3s'}}></div>
      </div>

      {/* Glassmorphic Header */}
      <header className="fixed top-0 w-full z-40 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-2.5 rounded-xl shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform duration-300">
              <QrCode className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                UMC <span className="text-brand-600">vCard</span>
              </h1>
              <span className="text-xs font-medium text-slate-500 tracking-wide mt-0.5">Smart Generator</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-brand-50 to-white border border-brand-100 shadow-sm">
                <Sparkles size={14} className="text-brand-600 animate-pulse" />
                <span className="text-sm font-semibold text-brand-800">AI Enabled</span>
             </div>
             
             <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

             <button 
                onClick={handleClear}
                className="group p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                title="Clear all fields"
             >
                <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">
          
          {/* Left Column: Form & AI */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
               <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    {mode === 'contact' ? 'Contact Card' : 'Calendar Event'}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Create a smart, scannable destination.
                  </p>
               </div>

               {/* Segmented Control Switcher */}
               <div className="p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-xl flex shadow-inner border border-slate-200/50">
                 <button
                   onClick={() => setMode('contact')}
                   className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${mode === 'contact' ? 'bg-white text-brand-600 shadow-md translate-y-0' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                 >
                   <UserPlus size={16} />
                   <span>Contact</span>
                 </button>
                 <button
                   onClick={() => setMode('event')}
                   className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${mode === 'event' ? 'bg-white text-brand-600 shadow-md translate-y-0' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                 >
                   <Calendar size={16} />
                   <span>Event</span>
                 </button>
               </div>
            </div>

            <SmartParser onParsed={handleParsedData} mode={mode} />
            
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/40 border border-white/60 p-6 md:p-10 relative">
              {/* Form Content */}
              {mode === 'contact' ? (
                <ContactForm data={contactData} onChange={handleContactChange} />
              ) : (
                <EventForm data={eventData} onChange={handleEventChange} />
              )}
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5">
             <div className="flex items-center justify-between lg:hidden mb-4">
               <h3 className="font-bold text-slate-900 text-lg">Live Preview</h3>
             </div>
             
             <QRCard 
                data={mode === 'contact' ? contactData : eventData} 
                mode={mode}
             />
             
             <div className="text-center mt-6">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 tracking-wide uppercase">
                 <Sparkles size={10} />
                 Universal Compatibility
               </span>
             </div>
          </div>

        </div>
      </main>

    </div>
  );
};

export default App;