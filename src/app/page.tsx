"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/exposure/Header';
import PlayerInputForm from '@/components/exposure/PlayerInputForm';
import AnalysisResultView from '@/components/exposure/AnalysisResult';
import type { PlayerProfile, AnalysisResult } from '@/types';
import { GraduationCap, Users, ShieldCheck, X, Info } from 'lucide-react';

export default function Home() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const handleFormSubmit = async (submittedProfile: PlayerProfile) => {
    setProfile(submittedProfile);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submittedProfile),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data.result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error("Analysis Error Details:", err);
      let errorMessage = "Failed to analyze profile. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setProfile(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden relative transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none print:hidden">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-emerald-200/20 dark:bg-emerald-900/10 rounded-full blur-[120px] -translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4"></div>
      </div>

      <Header toggleTheme={toggleTheme} isDark={theme === 'dark'} />

      <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center text-red-800 dark:text-red-200 text-sm backdrop-blur-sm" data-testid="error-message">
             <span className="font-bold mr-2">Error:</span> {error}
          </div>
        )}

        {!analysisResult ? (
          <div className="space-y-8 animate-fade-in">
             <div className="text-center mb-10">
               <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                 What level would a college <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500">coach put you at today?</span>
               </h2>
               <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                 Answer a few questions about your league, minutes, grades, and video to get an honest visibility score and 90 day plan.
               </p>

               <div className="mt-8 flex justify-center space-x-8 text-xs font-mono text-slate-500 uppercase tracking-widest">
                  <span>MLS NEXT</span>
                  <span className="text-slate-400 dark:text-slate-700">•</span>
                  <span>ECNL</span>
                  <span className="text-slate-400 dark:text-slate-700">•</span>
                  <span>GA</span>
                  <span className="text-slate-400 dark:text-slate-700">•</span>
                  <span>USL ACADEMY</span>
               </div>
             </div>

             <PlayerInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />

             <div className="mt-24 border-t border-slate-200 dark:border-white/5 pt-12">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                    Powered by Warubi Sports
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Elite Pathways. Global Reach.</h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                    Warubi Sports provides pathways into NCAA, NAIA, and JuCo soccer, collaborates with pro agents across the world, develops players in a Bundesliga academy, and supports coaches in earning UEFA licenses.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
                    <div className="bg-white/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-center hover:bg-white dark:hover:bg-slate-900/60 transition-colors group shadow-sm">
                       <div className="w-10 h-10 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                          <GraduationCap className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                       </div>
                       <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">1,000+</div>
                       <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">College & Semi-Pro Placements</div>
                    </div>
                     <div className="bg-white/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-center hover:bg-white dark:hover:bg-slate-900/60 transition-colors group shadow-sm">
                       <div className="w-10 h-10 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                          <Users className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                       </div>
                       <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">500+</div>
                       <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Licensed Coaches Network</div>
                    </div>
                     <div className="bg-white/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 text-center hover:bg-white dark:hover:bg-slate-900/60 transition-colors group shadow-sm">
                       <div className="w-10 h-10 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors">
                          <ShieldCheck className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                       </div>
                       <div className="text-xl font-bold text-slate-900 dark:text-white mb-1 pt-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">TRUSTED</div>
                       <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mt-0.5">FIFA Agents & Bundesliga Academies</div>
                    </div>
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setShowMethodologyModal(true)}
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
                    data-testid="button-read-methodology"
                  >
                    <Info className="w-4 h-4" />
                    Read Algorithm Methodology
                  </button>
                </div>
             </div>

          </div>
        ) : (
          <AnalysisResultView result={analysisResult} profile={profile!} onReset={handleReset} isDark={theme === 'dark'} />
        )}
      </main>

      <footer className="relative z-10 py-8 text-center text-[10px] text-slate-500 dark:text-slate-600 font-mono print:hidden">
        <p>&copy; 2025 ExposureEngine by Warubi Sports Analytics</p>
      </footer>

      {showMethodologyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowMethodologyModal(false)}>
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMethodologyModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
              data-testid="button-close-methodology"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Algorithm Methodology</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Transparency in our predictive modeling.</p>

              <div className="bg-slate-100 dark:bg-slate-800/50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-amber-600 dark:text-amber-400">Disclaimer:</span> These results are based purely on user inputs and our proprietary modeling logic. They serve as an objective orientation tool, not a guarantee of recruitment.
                </p>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                The ExposureEngine Algorithm uses a multivariate predictive model designed to simulate the evaluation process of a US collegiate recruiting director. Unlike generic &quot;chance calculators,&quot; this system utilizes a weighted scoring matrix based on historical recruiting data, roster composition analytics, and NCAA/NAIA eligibility standards.
              </p>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Phase 1: The &quot;On-Paper&quot; Baseline</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                The foundation is the competitive environment. The algorithm assigns a base &quot;Visibility Score&quot; derived from the league tier relative to the target college division. A &quot;Minutes Coefficient&quot; adjusts this: a Key Starter (&gt;80% minutes) receives a positive multiplier, while a Bench player (&lt;30%) sees their league advantage reduced.
              </p>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Phase 2: Athletic & Academic Filters</h3>
              <ul className="text-slate-600 dark:text-slate-300 text-sm mb-6 space-y-2">
                <li><span className="font-bold text-slate-900 dark:text-white">Academic Admissibility:</span> GPAs below 3.0 trigger a &quot;Hard Blocker&quot; for D3 (no athletic scholarships) and Ivy/Patriot D1s.</li>
                <li><span className="font-bold text-slate-900 dark:text-white">Athletic Benchmarking:</span> Self-reported metrics are normalized. &quot;Average&quot; ratings reduce D1/D2 probability, which require &quot;Above Average&quot; to &quot;Elite&quot; profiles.</li>
              </ul>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Phase 3: Market Reality Multiplier</h3>
              <ul className="text-slate-600 dark:text-slate-300 text-sm mb-6 space-y-2">
                <li><span className="font-bold text-slate-900 dark:text-white">Video Binary:</span> No video results in a 0.6x penalty (40% reduction) across all levels.</li>
                <li><span className="font-bold text-slate-900 dark:text-white">Funnel Logic:</span> High outreach with low replies flags &quot;Spamming&quot; or &quot;Talent Gap&quot;. Zero outreach triggers &quot;Invisible&quot; status.</li>
              </ul>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Phase 4: Maturity & Experience</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                Players over 18.5 years old or with verified Semi-Pro/International Academy experience receive scoring boosts for D1/D2, reflecting readiness for college physicality.
              </p>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Scoring Key</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-lg text-center">
                  <div className="text-emerald-400 font-bold text-sm">90-100%</div>
                  <div className="text-slate-400 text-xs">Ideal Fit. Expect offers.</div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-lg text-center">
                  <div className="text-yellow-400 font-bold text-sm">70-89%</div>
                  <div className="text-slate-400 text-xs">Possible. Needs optimization.</div>
                </div>
                <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-lg text-center">
                  <div className="text-red-400 font-bold text-sm">&lt; 50%</div>
                  <div className="text-slate-400 text-xs">Misalignment / Blocker.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
