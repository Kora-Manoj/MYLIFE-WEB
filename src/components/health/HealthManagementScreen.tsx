import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  HeartPulse, 
  Droplet, 
  Footprints, 
  Moon, 
  Activity, 
  Plus, 
  Clock, 
  Check, 
  Sparkles 
} from 'lucide-react';

export const HealthManagementScreen: React.FC = () => {
  const { healthMetric, addWater, logHealthEntry } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);

  const [logTitle, setLogTitle] = useState('');
  const [logCategory, setLogCategory] = useState<'Vitals' | 'Workout' | 'Medication' | 'Lab Result'>('Vitals');
  const [logValue, setLogValue] = useState('');

  const waterPercent = Math.min(100, Math.round((healthMetric.waterMl / healthMetric.waterGoalMl) * 100));
  const stepsPercent = Math.min(100, Math.round((healthMetric.steps / healthMetric.stepsGoal) * 100));

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle || !logValue) return;

    logHealthEntry(logTitle, logCategory, logValue);
    setLogTitle('');
    setLogValue('');
    setShowLogModal(false);
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Top Health Vitals Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Health & Wellness</h3>
              <p className="text-[10px] text-slate-400">Daily physiological trackers & vitals</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Vital</span>
          </button>
        </div>

        {/* 2 Trackers: Water Intake & Step Counter */}
        <div className="grid grid-cols-2 gap-3">
          {/* Water Intake */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-sky-400 font-medium">
                <span className="flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Hydration</span>
                </span>
                <span className="font-mono text-slate-300">{waterPercent}%</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-2">
                {healthMetric.waterMl} <span className="text-xs font-normal text-slate-500">/ {healthMetric.waterGoalMl} ml</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => addWater(250)}
                className="flex-1 py-1 text-[10px] font-medium bg-sky-400/10 hover:bg-sky-400/20 text-sky-300 rounded border border-sky-400/20 transition-colors"
              >
                +250ml
              </button>
              <button
                onClick={() => addWater(500)}
                className="flex-1 py-1 text-[10px] font-medium bg-sky-400/10 hover:bg-sky-400/20 text-sky-300 rounded border border-sky-400/20 transition-colors"
              >
                +500ml
              </button>
            </div>
          </div>

          {/* Daily Steps */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Daily Steps</span>
                </span>
                <span className="font-mono text-slate-300">{stepsPercent}%</span>
              </div>
              <div className="text-base font-bold font-mono text-slate-100 mt-2">
                {healthMetric.steps.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {healthMetric.stepsGoal.toLocaleString()}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${stepsPercent}%` }}
                />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
              ~3.2 km distance covered
            </div>
          </div>
        </div>

        {/* 3 Micro Metric Badges */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <span className="text-[10px] text-slate-500 block">Resting HR</span>
            <span className="font-bold font-mono text-slate-200 mt-0.5 block">{healthMetric.restingHeartRate} bpm</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
            <span className="font-bold font-mono text-slate-200 mt-0.5 block">{healthMetric.systolicBp}/{healthMetric.diastolicBp}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
            <span className="text-[10px] text-slate-500 block">Sleep Rest</span>
            <span className="font-bold font-mono text-slate-200 mt-0.5 block">{healthMetric.sleepHours} hrs</span>
          </div>
        </div>
      </div>

      {/* Recent Health Logs */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>Recent Activity & Check-Ins</span>
          <span className="text-[11px] font-mono text-slate-500">{healthMetric.recentLogs.length} logged</span>
        </div>

        <div className="space-y-2">
          {healthMetric.recentLogs.map(log => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-200">{log.title}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="text-amber-400/90">{log.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{log.time}</span>
                </div>
              </div>
              <span className="font-mono text-xs font-medium text-slate-300">
                {log.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Log Health Metric / Activity</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Activity / Vital Title</label>
                <input
                  type="text"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  placeholder="e.g. Evening Run, Glucose Check"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={logCategory}
                  onChange={(e: any) => setLogCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                >
                  <option value="Vitals">Vitals (BP, Pulse, Glucose)</option>
                  <option value="Workout">Workout (Run, Gym, Cycling)</option>
                  <option value="Medication">Medication & Supplements</option>
                  <option value="Lab Result">Lab Result / Diagnostic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Value / Observation</label>
                <input
                  type="text"
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  placeholder="e.g. 120/80 mmHg or 5.2 km in 28 mins"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Record Health Entry
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
