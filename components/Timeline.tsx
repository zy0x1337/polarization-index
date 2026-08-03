"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scaleTime } from "d3-scale";
import { min, max } from "d3-array";

interface NewsEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  link: string;
  source: string;
  bias: "left" | "center" | "right";
}

export default function Timeline() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<NewsEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<NewsEvent | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // 1. RSS Feeds vom Backend laden
  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.ok ? res.json() : Promise.resolve([]))
      .then((data: NewsEvent[]) => {
        setEvents(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Fensterbreite überwachen
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. D3 Skala & Bias-Verteilung
  const { xScale, ticks, processedEvents } = useMemo(() => {
    if (events.length === 0 || width === 0) {
      return { xScale: null, ticks: [], processedEvents: [] };
    }
    
    const dates = events.map((e) => new Date(e.date));
    const minDate = min(dates) as Date;
    const maxDate = max(dates) as Date;
    
    const paddedMin = new Date(minDate.getTime() - 3600000); // -1 Std
    const paddedMax = new Date(maxDate.getTime() + 3600000); // +1 Std
    
    const scale = scaleTime()
      .domain([paddedMin, paddedMax])
      .range([40, width - 40]);
      
    const timeTicks = scale.ticks(width < 768 ? 3 : 6);
    
    // Kollisionserkennung & Y-Offset
    let lastX = -1000;
    let stackLevel = 0;
    
    const processed = events.map((event) => {
      const xPos = scale(new Date(event.date));
      
      // Basis Y-Offset je nach Bias
      let baseY = 0;
      if (event.bias === "left") baseY = -90;
      if (event.bias === "right") baseY = 90;
      
      // Stack bei Kollisionen (Punkte schieben sich weiter nach außen)
      if (xPos - lastX < 25) {
        stackLevel++;
      } else {
        stackLevel = 0;
      }
      lastX = xPos;
      
      const collisionOffset = stackLevel * 25 * (event.bias === "center" ? (stackLevel % 2 === 0 ? 1 : -1) : (event.bias === "left" ? -1 : 1));
      const yOffset = baseY + collisionOffset;
      
      return { ...event, xPos, yOffset };
    });
    
    return { xScale: scale, ticks: timeTicks, processedEvents: processed };
  }, [events, width]);

  const activeSource = activeEvent?.source || hoveredEvent?.source;
  const activeBias = activeEvent?.bias || hoveredEvent?.bias;
  const activeBiasLabel = activeBias ? activeBias.toUpperCase() : "AWAITING";

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="font-mono text-xs text-muted uppercase tracking-widest">Aggregating global feeds...</span>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-12 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
        
        {/* Left Column: Sticky Info (Desktop) */}
        <div className="hidden md:block md:col-span-3">
          <div className="sticky top-24 h-[60vh] flex flex-col justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
              {activeSource ? `SOURCE: ${activeSource}` : "AWAITING SELECTION"}
            </span>
            <motion.div
              key={activeBiasLabel}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`font-serif text-6xl xl:text-8xl leading-none ${activeBias === "left" ? "text-left" : activeBias === "right" ? "text-accent" : "text-ink"}`}
            >
              {activeBiasLabel}
            </motion.div>
            <div className={`h-px w-16 mt-6 ${activeBias === "left" ? "bg-left" : activeBias === "right" ? "bg-accent" : "bg-ink"}`} />
            <p className="mt-6 text-sm text-muted max-w-xs font-sans leading-relaxed">
              Click a node to read the article. Notice how the narrative shifts across the spectrum.
            </p>
          </div>
        </div>

        {/* Right Column: Divergence Timeline */}
        <div className="md:col-span-9 relative">
          {/* Mobile Sticky Header */}
          <div className="md:hidden mb-12 h-20 flex flex-col justify-center sticky top-0 bg-canvas z-10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              {activeSource ? `SOURCE: ${activeSource}` : "AWAITING SELECTION"}
            </span>
            <motion.div
              key={activeBiasLabel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`font-serif text-5xl leading-none ${activeBias === "left" ? "text-left" : activeBias === "right" ? "text-accent" : "text-ink"}`}
            >
              {activeBiasLabel}
            </motion.div>
          </div>

          <div className="relative w-full overflow-x-auto md:overflow-hidden pb-10 md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none]">
            <style>{`::-webkit-scrollbar { display: none; }`}</style>
            
            <div className="relative h-[60vh] md:h-[70vh]" style={{ minWidth: '1000px' }} ref={containerRef}>
              {/* Linien */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-border/50" style={{ transform: "translateY(-120px)" }} />
              <span className="absolute left-0 font-mono text-[10px] uppercase tracking-widest text-left/50" style={{ top: "calc(50% - 130px)" }}>LEFT</span>
              
              <div className="absolute top-1/2 left-0 right-0 h-px bg-border/50" style={{ transform: "translateY(120px)" }} />
              <span className="absolute left-0 font-mono text-[10px] uppercase tracking-widest text-accent/50" style={{ top: "calc(50% + 125px)" }}>RIGHT</span>

              {/* Zeit-Ticks */}
              {xScale && ticks.map((tick) => {
                const xPos = xScale(tick);
                return (
                  <div key={tick.getTime()} className="absolute top-1/2" style={{ left: `${xPos}px`, transform: "translate(-50%, 0)" }}>
                    <div className="h-3 w-px bg-border mt-[-6px]" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      {tick.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              
              {/* Events */}
              {xScale && processedEvents.map((event) => {
                const isHovered = hoveredEvent?.id === event.id;
                const isActive = activeEvent?.id === event.id;
                
                return (
                  <div 
                    key={event.id} 
                    className="absolute group" 
                    style={{ 
                      left: `${event.xPos}px`, 
                      top: "50%", 
                      transform: `translate(-50%, calc(-50% + ${event.yOffset}px))` 
                    }}
                  >
                    <div 
                      className="absolute left-1/2 w-px bg-border/30"
                      style={{ 
                        height: `${Math.abs(event.yOffset)}px`, 
                        top: event.yOffset > 0 ? `-${event.yOffset}px` : "0px"
                      }} 
                    />
                    
                    <div 
                      className={`absolute z-20 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider pointer-events-none transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} 
                      style={{ 
                        bottom: event.yOffset > 0 ? "14px" : "auto",
                        top: event.yOffset > 0 ? "auto" : "14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: event.bias === "left" ? "#1D4ED8" : event.bias === "right" ? "#9F1239" : "#1A1A1A"
                      }}
                    >
                      {event.source}: {event.title.length > 25 ? `${event.title.substring(0, 25)}...` : event.title}
                    </div>

                    <button
                      onMouseEnter={() => setHoveredEvent(event)}
                      onMouseLeave={() => setHoveredEvent(null)}
                      onClick={() => setActiveEvent(event)}
                      className="relative block focus:outline-none transition-transform hover:scale-150"
                      aria-label={event.title}
                    >
                      <div 
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          event.bias === "left" ? "bg-left" : event.bias === "right" ? "bg-accent" : "bg-ink"
                        } ${isHovered || isActive ? "scale-150" : ""}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-In Panel */}
      <AnimatePresence>
        {activeEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setActiveEvent(null)}
              className="fixed inset-0 bg-ink/5 backdrop-blur-sm z-30"
            />
            
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
              className="fixed top-0 right-0 h-full w-full md:w-1/3 bg-canvas border-l border-border z-40 p-8 md:p-12 flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col gap-2">
                  <span className={`font-mono text-xs uppercase tracking-widest ${activeEvent.bias === "left" ? "text-left" : activeEvent.bias === "right" ? "text-accent" : "text-ink"}`}>
                    {activeEvent.bias} Bias
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    {activeEvent.source} / {new Date(activeEvent.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button onClick={() => setActiveEvent(null)} className="text-ink hover:text-accent transition-colors font-mono text-sm flex items-center gap-2">
                  <span className="hidden md:inline">CLOSE</span> [ ESC ]
                </button>
              </div>

              <h2 className="font-serif text-3xl md:text-5xl leading-[1.1] text-ink mb-8 tracking-tight">
                {activeEvent.title}
              </h2>
              
              <div className={`h-px w-16 mb-8 ${activeEvent.bias === "left" ? "bg-left" : activeEvent.bias === "right" ? "bg-accent" : "bg-ink"}`} />
              
              <div className="space-y-6">
                <p className="font-sans text-base text-muted leading-relaxed">
                  {activeEvent.description}
                </p>
              </div>

              <div className="mt-auto pt-8 border-t border-border">
                <a href={activeEvent.link} target="_blank" rel="noopener noreferrer" className={`font-mono text-xs transition-colors inline-flex items-center gap-2 uppercase tracking-widest ${activeEvent.bias === "left" ? "text-left hover:text-blue-800" : activeEvent.bias === "right" ? "text-accent hover:text-red-900" : "text-ink hover:text-muted"}`}>
                  Read Full Article <span className="inline-block">→</span>
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
