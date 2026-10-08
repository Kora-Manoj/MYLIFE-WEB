import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ListTodo, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  Trash2, 
  Tag, 
  Layers,
  ArrowRight,
  CheckSquare
} from 'lucide-react';
import { ActionTask } from '../../types';

export const ActionPTScreen: React.FC = () => {
  const { tasks, addTask, toggleTaskStatus, toggleChecklistItem, deleteTask } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'todo' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task inputs
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Personal Finance');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [dueDate, setDueDate] = useState('End of Week');
  const [subtasksText, setSubtasksText] = useState('Step 1: Review statements\nStep 2: Reconcile discrepancies');

  const filteredTasks = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const checklist = subtasksText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: `c_${Date.now()}_${i}`, text, completed: false }));

    addTask({
      title,
      project,
      priority,
      status: 'todo',
      dueDate,
      checklist
    });

    setTitle('');
    setShowAddModal(false);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-4 pb-6">
      
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Action P&T</span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded">
                Planning & Tracking
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">High-leverage action sprint and project execution</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${statusFilter === 'all' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${statusFilter === 'in_progress' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('todo')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${statusFilter === 'todo' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          To Do
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg text-center ${statusFilter === 'completed' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          Done
        </button>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No action tasks in this section.
          </div>
        ) : (
          filteredTasks.map(task => {
            const completedCount = task.checklist.filter(c => c.completed).length;
            const totalCount = task.checklist.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div>
                      <div className={`text-sm font-bold leading-snug ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span className="text-amber-400/90">{task.project}</span>
                        <span aria-hidden="true">·</span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtasks checklist */}
                {task.checklist.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/60">
                      <span>Action Steps</span>
                      <span className="font-mono">{completedCount}/{totalCount} completed</span>
                    </div>
                    {task.checklist.map(step => (
                      <button
                        key={step.id}
                        onClick={() => toggleChecklistItem(task.id, step.id)}
                        className="w-full text-left flex items-center gap-2 py-1 text-slate-300 hover:text-slate-100 transition-colors group"
                      >
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${step.completed ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' : 'border-slate-700'}`}>
                          {step.completed && '✓'}
                        </span>
                        <span className={`text-[11px] ${step.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {step.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">Create Action P&T Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete quarterly investment audit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Project</label>
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="Financial Audit"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="e.g. Tomorrow, 30 Sep 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Checklist Steps (one per line)</label>
                <textarea
                  rows={3}
                  value={subtasksText}
                  onChange={(e) => setSubtasksText(e.target.value)}
                  placeholder="Step 1&#10;Step 2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/50 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
              >
                Add to Action Planner
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
