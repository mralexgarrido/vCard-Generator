import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { ContactData, EventData, QrMode } from '../types';
import { generateVCardString } from '../utils/vcardHelper';
import { generateVCalendarString } from '../utils/calendarHelper';
import { Download, Share2, Smartphone, ShieldCheck, CalendarCheck, MapPin, Clock, QrCode, AlignLeft } from 'lucide-react';

interface QRCardProps {
  data: ContactData | EventData;
  mode: QrMode;
}

const QRCard: React.FC<QRCardProps> = ({ data, mode }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  
  let qrString = '';
  let filename = 'qrcode';
  
  if (mode === 'contact') {
    qrString = generateVCardString(data as ContactData);
    filename = `${(data as ContactData).firstName || 'contact'}-qrcode`;
  } else {
    qrString = generateVCalendarString(data as EventData);
    filename = `${(data as EventData).title || 'event'}-qrcode`;
  }
  
  const hasData = mode === 'contact'
    ? Object.values(data).some(val => typeof val === 'string' && val.trim().length > 0)
    : (data as EventData).title.length > 0 || (data as EventData).startTime.length > 0;

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40; 
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        
        const downloadLink = document.createElement("a");
        downloadLink.download = `${filename}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const renderContactPreview = (d: ContactData) => {
    const fullName = `${d.firstName} ${d.lastName}`.trim() || 'Jane Vaquero';
    const role = d.title || 'Title';
    let company = 'UTRGV';
    if (d.organization && d.organization.trim()) {
      company = d.organization.trim().toUpperCase().startsWith('UTRGV')
        ? d.organization.trim()
        : `UTRGV - ${d.organization.trim()}`;
    }

    return (
      <div className="group w-full aspect-[1.75/1] transition-transform duration-500 hover:scale-[1.02] hover:-rotate-1">
        <div className="w-full h-full bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 rounded-2xl shadow-2xl shadow-brand-500/30 overflow-hidden relative text-white p-6 md:p-8 flex flex-col justify-between border-t border-brand-400/50 backdrop-blur-sm">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.07] rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-900 opacity-30 rounded-full blur-[40px] -ml-10 -mb-10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.07] mix-blend-overlay pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight truncate drop-shadow-sm">{fullName}</h2>
                  <div className="text-brand-50 font-medium text-sm md:text-base mt-1 flex flex-col opacity-90">
                    <span className="truncate">{role}</span>
                  </div>
               </div>
               <div className="opacity-90 bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/10">
                  <ShieldCheck size={28} strokeWidth={1.5} />
               </div>
            </div>
            <span className="text-brand-100 font-medium text-xs tracking-wide uppercase mt-4 block">{company}</span>
          </div>

          <div className="relative z-10 space-y-1.5 text-xs md:text-sm text-white/90">
             {d.email && (
               <div className="flex items-center gap-3 truncate group-hover:text-white transition-colors">
                 <span className="opacity-60 uppercase text-[10px] tracking-wider w-4 font-bold">Em</span> 
                 <span className="font-light">{d.email}</span>
               </div>
             )}
             {(d.mobile || d.phone) && (
               <div className="flex items-center gap-3 truncate group-hover:text-white transition-colors">
                 <span className="opacity-60 uppercase text-[10px] tracking-wider w-4 font-bold">Ph</span> 
                 <span className="font-light">{d.mobile || d.phone}</span>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderEventPreview = (d: EventData) => {
    const dateObj = d.startTime ? new Date(d.startTime) : new Date();
    const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = dateObj.getDate();
    const time = d.startTime ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

    return (
      <div className="group w-full aspect-[1.75/1] transition-transform duration-500 hover:scale-[1.02] hover:rotate-1">
        <div className="w-full h-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden relative flex flex-col border border-slate-100">
          <div className="h-2 bg-brand-500 w-full"></div>
          
          <div className="flex-1 p-6 flex flex-col relative">
             {/* Ticket Notches */}
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-50 border-r border-slate-200 rounded-r-full shadow-inner"></div>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-50 border-l border-slate-200 rounded-l-full shadow-inner"></div>

             <div className="flex justify-between items-start gap-5 pl-2">
                <div className="flex flex-col items-center justify-center bg-brand-50 text-brand-600 rounded-xl p-3 min-w-[70px] border border-brand-100 shadow-sm">
                   <span className="text-xs font-bold tracking-widest">{month}</span>
                   <span className="text-3xl font-black leading-none mt-1">{day}</span>
                </div>
                <div className="flex-1 min-w-0">
                   <h2 className="text-xl font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
                     {d.title || 'Event Title'}
                   </h2>
                   <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-2 font-medium">
                     <Clock size={14} className="text-brand-500" />
                     <span>{time}</span>
                   </div>
                </div>
             </div>

             <div className="mt-5 pl-2 pr-2 flex-1">
                 <div className="flex gap-2">
                    <AlignLeft size={14} className="text-slate-400 mt-1 shrink-0" />
                    <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {d.description || 'Add a description to your event details to see it previewed here. This space fits about three lines of text.'}
                    </p>
                 </div>
             </div>

             <div className="border-t-2 border-dashed border-slate-100 pt-3 mt-auto pl-2">
                <div className="flex items-start gap-2.5 text-slate-600 text-sm">
                   <MapPin size={16} className="mt-0.5 text-brand-500 shrink-0" />
                   <span className="truncate font-medium">{d.location || 'Location'}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="sticky top-24 space-y-8 perspective-1000">
      
      {mode === 'contact' 
        ? renderContactPreview(data as ContactData)
        : renderEventPreview(data as EventData)
      }

      {/* QR Code Section */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/40 border border-white/50 p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
           <div className="flex items-center gap-2 text-brand-600 font-bold uppercase tracking-widest text-xs">
             <Smartphone size={14} />
             <span>Scan to {mode === 'contact' ? 'Connect' : 'RSVP'}</span>
           </div>
           <p className="text-sm text-slate-500 font-medium">Point your camera to save {mode === 'contact' ? 'contact' : 'event'}</p>
        </div>
        
        <div ref={qrRef} className="relative group cursor-pointer transition-all duration-300 transform hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500 to-orange-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            {hasData ? (
              <QRCode 
                value={qrString} 
                size={200} 
                level="M"
                fgColor="#0f172a" 
                bgColor="#ffffff"
              />
            ) : (
               <div className="w-[200px] h-[200px] bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-200">
                 <div className="p-3 bg-white rounded-full shadow-sm">
                   <QrCode size={28} className="text-slate-400" />
                 </div>
                 <span className="text-xs font-medium">Add info to generate</span>
               </div>
            )}
          </div>
          {/* Logo Overlay */}
          {hasData && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md p-1">
                 <div className="w-full h-full bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-[9px] tracking-tight">
                   {mode === 'contact' ? 'vCard' : 'iCal'}
                 </div>
               </div>
             </div>
          )}
        </div>

        <button 
          onClick={downloadQR}
          disabled={!hasData}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-slate-900 hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-slate-900/10 hover:shadow-brand-500/25 hover:-translate-y-0.5"
        >
          <Download size={18} />
          Save to Image
        </button>
      </div>

    </div>
  );
};

export default QRCard;