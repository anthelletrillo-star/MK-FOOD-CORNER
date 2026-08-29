import { useState, useEffect } from 'react';

export default function SplashScreen({ children }) {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on first visit per session
    return !sessionStorage.getItem('splashShown');
  });
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!showSplash) return;

    // Start fade out after 1.5s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    // Fully hide after fade animation completes (0.5s)
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('splashShown', 'true');
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [showSplash]);

  if (!showSplash) return children;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#000000] gap-8 transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur-xl animate-pulse"></div>
        <img
          src="/favicon.png"
          alt="MK FOOD CORNER"
          className="relative w-32 h-32 rounded-3xl animate-bounce shadow-2xl object-cover"
        />
      </div>
      
      <div className="text-center flex flex-col items-center gap-2">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 text-[28px] font-black tracking-tight font-heading">
          MK FOOD CORNER
        </h1>
        <p className="text-white/60 text-[12px] font-semibold tracking-[4px] uppercase mt-2">
          Bringing home closer
        </p>
        
        {/* Loading Bar */}
        <div className="w-32 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full w-full origin-left animate-[scale-x_1.5s_ease-in-out_infinite] [animation-fill-mode:forwards]" style={{ animationName: 'progress' }}></div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: left; }
          50.1% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
      `}</style>
    </div>
  );
}
