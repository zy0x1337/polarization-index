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
  rageScore: number;
  rageWords: string[];
}

interface Story {
  id: string;
  keywords: string[];
  date: string;
  articles: NewsEvent[];
}

export default function Timeline() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [hoveredStory, setHoveredStory] = useState<Story | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.ok ? res.json() : Promise.resolve([]))
      .then((data: Story[]) => {
        setStories(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { xScale, ticks, processedStories } = useMemo(() => {
    if (stories.length === 0 || width === 0) {
      return { xScale: null, ticks: [], processedStories: [] };
    }
    
    const dates = stories.map((s) => new Date(s.date));
    const minDate = min(dates) as Date;
    const maxDate = max(dates) as Date;
    
    const paddedMin = new Date(minDate.getTime() - 3600000); 
    const paddedMax = new Date(maxDate.getTime() + 3600000); 
    
    const scale = scaleTime()
      .domain([paddedMin, paddedMax])
      .range([40, width - 40]);
      
    const timeTicks = scale.ticks(width < 768 ? 3 : 6);
    
    // Kollisionserkennung für Stories auf der X-Achse
    let lastX = -1000;
    let stackLevel = 0;
    
    const processed = stories.map((story) => {
      const xPos = scale(new Date(story.date));
      
      if (xPos - lastX < 80) { // Mehr Platz für Cluster
        stackLevel++;
      } else {
        stackLevel = 0;
      }
      lastX = xPos;
      
      // Wenn Cluster kollidieren, schieben wir sie leicht auf der Y-Achse
      const yOffset = stackLevel * 60 * (stackLevel % 2 === 0 ? 1 : -1);
      
      return { ...story, xPos, yOffset };
    });
    
    return { xScale: scale, ticks: timeTicks, processedStories: processed };
  }, [stories, width]);

  const activeKeywords = activeStory?.keywords.join(", ") || hoveredStory?.keywords.join(", ") || "AWAITING";
  const isComparable = activeStory || hoveredStory ? true : false;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="font-mono text-xs text-muted uppercase tracking-widest">Cross-referencing global feeds...</span>
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
              {isComparable ? "TOPIC MATCHED" : "AWAITING SELECTION"}
            </span>
            <motion.div
              key={activeKeywords}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="font-serif text-4xl xl:text-6xl leading-none text-ink capitalize"
            >
              {activeKeywords}
            </motion.div>
            <div className="h-px w-16 mt-6 bg-ink" />
            <p className="mt-6 text-sm text-muted max-w-xs font-sans leading-relaxed">
              Only stories covered by multiple political spectrums are shown. Click to compare headlines.
            </p>
          </div>
        </div>

        {/* Right Column: Connected Story Timeline */}
        <div className="md:col-span-9 relative">
          {/* Mobile Sticky Header */}
          <div className="md:hidden mb-12 h-20 flex flex-col justify-center sticky top-0 bg-canvas z-10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
              {isComparable ? "TOPIC MATCHED" : "AWAITING"}
            </span>
            <motion.div
              key={activeKeywords}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-3xl leading-none text-ink capitalize"
            >
              {activeKeywords}
            </motion.div>
          </div>

          <div className="relative w-full overflow-x-auto md:overflow-hidden pb-10 md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none]">
            <style>{`::-webkit-scrollbar { display: none; }`}</style>
            
            <div className="relative h-[60vh] md:h-[70vh]" style={{ minWidth: '1000px' }} ref={containerRef}>
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
              
              {/* STORY CLUSTERS */}
              {xScale && processedStories.map((story) => {
                const isHovered = hoveredStory?.id === story.id;
                const isActive = activeStory?.id === story.id;
                const hasLeft = story.articles.some(a => a.bias === "left");
                const hasRight = story.articles.some(a => a.bias === "right");
                
                // Finde die Artikel für die visuelle Linie
                const leftArticle = story.articles.find(a => a.bias === "left");
                const rightArticle = story.articles.find(a => a.bias === "right");
                
                return (
                  <div 
                    key={story.id} 
                    className="absolute group" 
                    style={{ 
                      left: `${story.xPos}px`, 
                      top: "50%", 
                      transform: `translate(-50%, calc(-50% + ${story.yOffset}px))` 
                    }}
                  >
                    {/* Verbinder-Linie zwischen Links und Rechts */}
                    <div 
                      className={`absolute left-1/2 w-px -translate-x-1/2 transition-colors ${isHovered || isActive ? "bg-ink" : "bg-border"}`}
                      style={{ 
                        height: "160px", 
                        top: "-80px"
                      }} 
                    />

                    {/* Hover Label */}
                    <div 
                      className={`absolute z-20 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider pointer-events-none transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} 
                      style={{ 
                        bottom: "90px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "#1A1A1A"
                      }}
                    >
                      Topic: {story.keywords.slice(0, 3).join(", ")}
                    </div>

                    {/* Center Node (Der Story-Knotenpunkt) */}
                    <button
                      onMouseEnter={() => setHoveredStory(story)}
                      onMouseLeave={() => setHoveredStory(null)}
                      onClick={() => setActiveStory(story)}
                      className="relative block focus:outline-none group"
                      aria-label="View story"
                    >
                      {/* Center Marker */}
                      <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${isActive ? "bg-ink border-ink scale-150" : "bg-canvas border-ink group-hover:scale-150"}`} />
                    </button>

                    {/* Left Node */}
                    {leftArticle && (
                      <div 
                        className="absolute"
                        style={{ 
                          left: "0%", 
                          top: "-80px", 
                          transform: "translate(-50%, -50%)" 
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full bg-left transition-all ${isHovered ? "scale-150" : ""}`} />
                      </div>
                    )}

                    {/* Right Node */}
                    {rightArticle && (
                      <div 
                        className="absolute"
                        style={{ 
                          left: "0%", 
                          top: "80px", 
                          transform: "translate(-50%, -50%)" 
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full bg-accent transition-all ${isHovered ? "scale-150" : ""}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-In Panel für Story-Vergleich */}
      <AnimatePresence>
        {activeStory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setActiveStory(null)}
              className="fixed inset-0 bg-ink/5 backdrop-blur-sm z-30"
            />
            
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
              className="fixed top-0 right-0 h-full w-full md:w-1/3 bg-canvas border-l border-border z-40 p-8 md:p-12 flex flex-col overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-ink">
                    Comparative Analysis
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {new Date(activeStory.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button onClick={() => setActiveStory(null)} className="text-ink hover:text-accent transition-colors font-mono text-sm flex items-center gap-2">
                  <span className="hidden md:inline">CLOSE</span> [ ESC ]
                </button>
              </div>

              {/* Topic Keywords */}
              <h2 className="font-serif text-3xl md:text-5xl leading-[1.1] text-ink mb-8 tracking-tight capitalize">
                {activeStory.keywords.join(", ")}
              </h2>
              
              <div className="h-px w-16 mb-8 bg-ink" />
              
              <p className="font-sans text-sm text-muted leading-relaxed mb-8 pb-8 border-b border-border">
                This topic was detected across multiple news spectrums. Observe the differences in headline framing and sensationalism scores below.
              </p>

              {/* Vergleich der Artikel */}
              <div className="space-y-6">
                {activeStory.articles.map((article) => (
                  <div key={article.id} className="border-l-2 pl-4" style={{ borderColor: article.bias === "left" ? "#1D4ED8" : article.bias === "right" ? "#9F1239" : "#1A1A1A" }}>
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${article.bias === "left" ? "text-left" : article.bias === "right" ? "text-accent" : "text-ink"}`}>
                      {article.source} ({article.bias})
                    </span>
                    <h3 className="font-serif text-xl text-ink mt-1 mb-2 leading-tight">
                      {article.title}
                    </h3>
                    
                    {/* Mini Rage Score */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[9px] uppercase text-muted">Rage: {article.rageScore}/100</span>
                      <div className="h-1 w-16 bg-border relative">
                        <div className={`h-full absolute left-0 top-0 ${article.rageScore > 60 ? "bg-accent" : "bg-ink"}`} style={{ width: `${article.rageScore}%` }} />
                      </div>
                    </div>

                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-muted hover:text-ink transition-colors inline-flex items-center gap-1 uppercase tracking-widest">
                      Read Article →
                    </a>
                  </div>
                ))}
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </section>
  );
                               }
