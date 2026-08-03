import Timeline from "@/components/Timeline";

export const revalidate = 1800;

export default async function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      
      {/* Editorial Masthead */}
      <header className="max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-12">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted">
            The Polarization Index
          </span>
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted hidden md:block">
            Vol. I / Global News
          </span>
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-muted">
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-32 pb-16 md:pb-24">
        <h1 className="font-serif text-6xl sm:text-7xl md:text-[9rem] xl:text-[12rem] leading-[0.85] tracking-tight">
          The Bias<br/>
          <span className="text-muted italic">Wave</span>
        </h1>
        
        <div className="mt-8 md:mt-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <p className="font-sans text-base md:text-lg text-muted leading-relaxed max-w-xl">
            A real-time visualization of how left, center, and right-leaning outlets report the same global events. Truth is often a matter of angle.
          </p>
          
          <div className="flex items-center gap-8 font-mono text-[10px] md:text-xs uppercase tracking-widest">
            <div className="flex flex-col gap-1">
              <span className="text-muted">Status</span>
              <span className="text-left text-base flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-left animate-pulse"></span>
                Live Left
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted">Status</span>
              <span className="text-ink text-base flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ink"></span>
                Live Center
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted">Status</span>
              <span className="text-accent text-base flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                Live Right
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Timeline Component */}
      <Timeline />

      {/* Editorial Footer */}
      <footer className="max-w-7xl mx-auto px-6 md:px-12 py-16 mt-24 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">The Methodology</h3>
            <p className="font-serif text-xl leading-tight">
              News sources are tagged based on established media bias charts. We visualize the divergence.
            </p>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Left Sources</h3>
            <ul className="space-y-2 font-sans text-sm text-ink">
              <li>NY Times</li>
              <li>The Guardian</li>
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Right Sources</h3>
            <ul className="space-y-2 font-sans text-sm text-ink">
              <li>Fox News</li>
              <li>NY Post</li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            © {new Date().getFullYear()} The Polarization Index
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted mt-4 md:mt-0">
            No Tracking. No Cookies. Just Data.
          </span>
        </div>
      </footer>
    </main>
  );
          }
