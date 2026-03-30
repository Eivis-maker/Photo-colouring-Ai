
import React from 'react';
import { Upload, Sparkles, Printer, Download, ArrowRight, Wand2 } from 'lucide-react';

interface LandingPageProps {
  onUpload: () => void;
  onDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onUpload, onDemo }) => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col overflow-y-auto">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
            <Sparkles className="text-white w-4 h-4" />
          </div>
          <span className="font-black text-white text-sm tracking-tight">ColorPage</span>
        </div>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Photo
        </button>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 md:px-12 py-16 md:py-24 gap-8">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Powered by Google Gemini AI
        </div>

        <div className="space-y-5 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight">
            Turn any photo into a{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              coloring page
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-xl font-medium leading-relaxed max-w-xl mx-auto">
            Upload a photo and get a printable coloring page in seconds.
            Perfect for kids, teachers, and creative activities.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            onClick={onUpload}
            className="flex items-center justify-center gap-2.5 bg-white text-black px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
          >
            <Upload className="w-4 h-4" />
            Upload Photo
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDemo}
            className="flex items-center justify-center gap-2.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all hover:bg-indigo-600/30"
          >
            <Wand2 className="w-4 h-4" />
            Try Demo
          </button>
        </div>

        <p className="text-slate-600 text-xs">No account needed. Free to try.</p>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-12 py-16 md:py-20 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl md:text-2xl font-black text-white mb-12 uppercase tracking-wide">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: '01',
                icon: Upload,
                title: 'Upload a photo',
                desc: 'Choose any photo from your device — a pet, a person, a landscape, anything.',
                color: 'from-indigo-500/20 to-indigo-600/10',
                border: 'border-indigo-500/20',
                iconColor: 'text-indigo-400',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'AI generates coloring page',
                desc: 'Our AI transforms your photo into clean black and white line art in seconds.',
                color: 'from-purple-500/20 to-purple-600/10',
                border: 'border-purple-500/20',
                iconColor: 'text-purple-400',
              },
              {
                step: '03',
                icon: Printer,
                title: 'Print or color in app',
                desc: 'Download as PNG, print it, or color it directly in the app with our coloring tools.',
                color: 'from-emerald-500/20 to-emerald-600/10',
                border: 'border-emerald-500/20',
                iconColor: 'text-emerald-400',
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`relative p-6 rounded-3xl bg-gradient-to-br ${item.color} border ${item.border} flex flex-col gap-4`}
              >
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{item.step}</span>
                <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ${item.iconColor}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base mb-1.5">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download formats */}
      <section className="px-6 md:px-12 py-12 md:py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wide">After generating, you can</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Printer, label: 'Print coloring page' },
              { icon: Download, label: 'Download PNG' },
              { icon: Download, label: 'Download JPG' },
              { icon: Sparkles, label: 'Color in app' },
            ].map((action) => (
              <div key={action.label} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-slate-300 font-medium">
                <action.icon className="w-4 h-4 text-indigo-400" />
                {action.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12 py-16 md:py-24 text-center border-t border-white/5">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-4xl font-black text-white">Ready to create your coloring page?</h2>
          <p className="text-slate-400 text-sm">Upload a photo and see the result in under 30 seconds.</p>
          <button
            onClick={onUpload}
            className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-indigo-500/20"
          >
            <Upload className="w-4 h-4" />
            Get Started — It's Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-600 font-black uppercase tracking-widest shrink-0">
        <span>© 2025 ColorPage</span>
        <span className="text-slate-500">Powered by Google Gemini</span>
      </footer>
    </div>
  );
};
