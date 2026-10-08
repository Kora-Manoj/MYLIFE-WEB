import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Eye, 
  Sparkles, 
  Sun, 
  Moon, 
  Coffee, 
  Trees, 
  Check, 
  Type,
  Settings
} from 'lucide-react';
import { UITheme, TextScale } from '../types';

export const ThemeSettingsModal: React.FC = () => {
  const { 
    uiTheme, 
    setUiTheme, 
    textScale, 
    setTextScale, 
    isThemeModalOpen, 
    setIsThemeModalOpen 
  } = useApp();

  if (!isThemeModalOpen) return null;

  const themes: Array<{
    id: UITheme;
    name: string;
    description: string;
    icon: React.ReactNode;
    previewBg: string;
    previewBorder: string;
    previewAccent: string;
  }> = [
    {
      id: 'dark',
      name: 'OLED Midnight',
      description: 'Deep obsidian for dark rooms and maximum battery life.',
      icon: <Moon className="w-4 h-4 text-amber-400" />,
      previewBg: 'bg-slate-950',
      previewBorder: 'border-slate-800',
      previewAccent: 'bg-amber-400'
    },
    {
      id: 'sepia',
      name: 'Warm Amber (Eye Comfort)',
      description: 'Zero blue-light strain, warm candle paper tones for tired eyes.',
      icon: <Coffee className="w-4 h-4 text-amber-500" />,
      previewBg: 'bg-[#1c1814]',
      previewBorder: 'border-[#382d24]',
      previewAccent: 'bg-amber-500'
    },
    {
      id: 'sage',
      name: 'Nordic Sage (Calm Focus)',
      description: 'Restful muted forest slate, soothing for long working sessions.',
      icon: <Trees className="w-4 h-4 text-emerald-400" />,
      previewBg: 'bg-[#0e1915]',
      previewBorder: 'border-[#1b3329]',
      previewAccent: 'bg-emerald-400'
    },
    {
      id: 'light',
      name: 'Daylight Soft',
      description: 'High ambient light readability with soft pearl backgrounds.',
      icon: <Sun className="w-4 h-4 text-amber-600" />,
      previewBg: 'bg-slate-100',
      previewBorder: 'border-slate-300',
      previewAccent: 'bg-amber-500'
    },
    {
      id: 'high_contrast',
      name: 'Ultra High Contrast',
      description: 'Pure black & vivid yellow for maximum visual clarity and accessibility.',
      icon: <Eye className="w-4 h-4 text-yellow-300" />,
      previewBg: 'bg-black',
      previewBorder: 'border-yellow-400',
      previewAccent: 'bg-yellow-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Settings & UI Themes</h3>
              <p className="text-[10px] text-slate-400">Personalize visuals, eye comfort & theme options</p>
            </div>
          </div>
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Themes List */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
            Choose Your Visual Comfort
          </span>
          <div className="space-y-2">
            {themes.map(t => {
              const isSelected = uiTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setUiTheme(t.id)}
                  className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center justify-between group ${
                    isSelected 
                      ? 'border-amber-400 bg-slate-850 shadow-md ring-1 ring-amber-400/40' 
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl ${t.previewBg} border ${t.previewBorder} flex items-center justify-center shadow-inner`}>
                      {t.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {isSelected && (
                          <span className="text-[10px] text-amber-400 font-mono font-medium bg-amber-400/10 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {t.description}
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-amber-400 border-amber-400 text-slate-950' : 'border-slate-700'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Scaling for Low Vision / Eye Strain */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Text Scaling
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {textScale === 'large' ? 'Large (+15%)' : 'Standard'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTextScale('normal')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                textScale === 'normal'
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Standard Size</span>
            </button>

            <button
              onClick={() => setTextScale('large')}
              className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                textScale === 'large'
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-4 h-4 font-bold" />
              <span>Large Text (Comfort)</span>
            </button>
          </div>
        </div>

        {/* Done button */}
        <button
          onClick={() => setIsThemeModalOpen(false)}
          className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
        >
          Apply & Return
        </button>

      </div>
    </div>
  );
};
