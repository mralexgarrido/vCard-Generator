import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { parseInput } from '../services/geminiService';
import { ContactData, EventData, ParseStatus, QrMode } from '../types';

interface SmartParserProps {
  mode: QrMode;
  onParsed: (data: Partial<ContactData> | Partial<EventData>) => void;
}

const SmartParser: React.FC<SmartParserProps> = ({ mode, onParsed }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<ParseStatus>(ParseStatus.IDLE);

  const handleParse = async () => {
    if (!text.trim()) return;
    
    setStatus(ParseStatus.LOADING);
    try {
      const result = await parseInput(text, mode);
      onParsed(result);
      setStatus(ParseStatus.SUCCESS);
      // Reset success status after a moment to allow re-parsing
      setTimeout(() => setStatus(ParseStatus.IDLE), 2000);
    } catch (e) {
      console.error(e);
      setStatus(ParseStatus.ERROR);
      setTimeout(() => setStatus(ParseStatus.IDLE), 3000);
    }
  };

  const placeholder = mode === 'contact' 
    ? "Paste signature here (e.g. Dr. Jane Vaquero | Professor of Biology | UTRGV...)"
    : "Paste event details here (e.g. Dept Orientation at Student Union, Tue 2-4pm...)";

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-brand-200 via-slate-200 to-brand-100 shadow-xl shadow-brand-900/5 mb-6 overflow-hidden">
      
      {/* Magical Background Blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg text-white shadow-lg shadow-brand-500/30">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 leading-none text-sm">
              {mode === 'contact' ? 'AI Contact Auto-Fill' : 'AI Event Parser'}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Powered by Gemini 2.5</p>
          </div>
        </div>
        
        <div className="relative">
          <textarea
            className="w-full p-3 pr-28 rounded-xl border border-slate-200 bg-slate-50/50 
                       focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none 
                       transition-all duration-300 text-sm min-h-[70px] resize-y placeholder:text-slate-400 leading-relaxed"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          <div className="absolute bottom-2 right-2">
            <button
              onClick={handleParse}
              disabled={status === ParseStatus.LOADING || !text.trim()}
              className={`
                flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-300
                ${status === ParseStatus.LOADING 
                  ? 'bg-slate-100 text-slate-400 cursor-wait' 
                  : 'bg-slate-900 hover:bg-brand-600 text-white shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 active:translate-y-0'
                }
              `}
            >
              {status === ParseStatus.LOADING ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : status === ParseStatus.SUCCESS ? (
                <span className="text-green-400">Done</span>
              ) : (
                <>
                  <span>Magic Fill</span>
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
        {status === ParseStatus.ERROR && (
          <p className="text-xs text-red-500 mt-2 font-medium">Failed to parse text. Please try again.</p>
        )}
      </div>
    </div>
  );
};

export default SmartParser;