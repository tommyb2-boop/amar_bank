import React from 'react';

export const Watermark: React.FC = () => {
  return (
    <div
      className="fixed bottom-2 right-3 z-50 pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-white/90 border border-white/10 shadow-sm"
      style={{ fontSize: '11px', letterSpacing: '0.04em' }}
      aria-hidden="true"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
      <span className="font-semibold tracking-wide">The Update</span>
    </div>
  );
};
