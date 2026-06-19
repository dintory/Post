import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Play,
  Pause,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  AlertTriangle
} from 'lucide-react'
import { AutomationCreator, getScheduleSummary, type AutomationConfig } from '@/components/automation/AutomationCreator'

const activeAutomations = [
  {
    id: 1,
    name: 'Daily Tech Upload',
    type: 'workflow',
    status: 'active',
    lastRun: '2 hours ago',
    nextRun: 'Tomorrow 9:00 AM',
    successRate: 98,
    description: 'Auto-generate and upload tech videos daily'
  },
  {
    id: 2,
    name: 'Vlog Theme Rotation',
    type: 'theme',
    status: 'active',
    lastRun: '5 hours ago',
    nextRun: 'Next Monday',
    successRate: 100,
    description: 'Rotate between morning/day/evening vlog themes'
  },
  {
    id: 3,
    name: 'Gaming Highlights',
    type: 'prompt',
    status: 'paused',
    lastRun: '3 days ago',
    nextRun: 'Manual',
    successRate: 85,
    description: 'Auto-clip gaming highlights with AI commentary'
  },
  {
    id: 4,
    name: 'Multi-Account Posting',
    type: 'account',
    status: 'active',
    lastRun: '1 hour ago',
    nextRun: 'In 3 hours',
    successRate: 100,
    description: 'Cross-post content to all connected accounts'
  },
]

type AutomationItem = {
  id: number
  name: string
  type: string
  status: string
  lastRun: string
  nextRun: string
  pausedNextRun?: string
  successRate: number
  description: string
}

type StatusFilter = 'all' | 'active' | 'paused'

// ── Double-confirm delete button ───────────────────────────────────────────────
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const [stage, setStage] = useState<'idle' | 'confirm'>('idle')

  // Reset if user mouses away without confirming
  const handleBlur = () => {
    if (stage === 'confirm') setStage('idle')
  }

  if (stage === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setStage('confirm')}
        title="Delete automation"
        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
      >
        <Trash2 className="w-4 h-4 text-zinc-400" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleBlur}>
      <button
        type="button"
        onClick={() => setStage('idle')}
        className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Cancel"
      >
        <X className="w-3.5 h-3.5 text-zinc-500" />
      </button>
      <button
        type="button"
        onClick={() => { setStage('idle'); onConfirm() }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
        title="Confirm delete"
      >
        <AlertTriangle className="w-3 h-3" />
        Delete
      </button>
    </div>
  )
}

export function Automation() {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [automations, setAutomations] = useState<AutomationItem[]>(activeAutomations)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Edit drawer state
  const [editingAutomation, setEditingAutomation] = useState<AutomationItem | null>(null)
  // Pre-fill config passed to AutomationCreator when editing
  const [editInitialConfig, setEditInitialConfig] = useState<Partial<AutomationConfig> | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':  return 'bg-emerald-500/20 text-emerald-400'
      case 'paused':  return 'bg-amber-500/20 text-amber-400'
      case 'error':   return 'bg-red-500/20 text-red-400'
      default:        return 'bg-zinc-800 text-zinc-400'
    }
  }

  // Open create drawer
  const handleNewAutomation = () => {
    setEditingAutomation(null)
    setEditInitialConfig(null)
    setShowCreateDrawer(true)
  }

  // Open edit drawer — pass existing data as initial config
  const openEditDrawer = (automation: AutomationItem) => {
    setEditingAutomation(automation)
    // Build a partial AutomationConfig from the automation's stored description
    // AutomationCreator will receive these as defaults
    setEditInitialConfig({
      name: automation.name,
    })
    setShowCreateDrawer(true)
  }

  const handleCloseDrawer = () => {
    setShowCreateDrawer(false)
    setEditingAutomation(null)
    setEditInitialConfig(null)
  }

  // Called by AutomationCreator on finish
  const handleSaveAutomation = (config: AutomationConfig) => {
    if (editingAutomation) {
      // Edit mode — update existing item
      setAutomations(prev => prev.map(a =>
        a.id === editingAutomation.id
          ? {
              ...a,
              name: config.name,
              nextRun: getScheduleSummary(config),
              description: `${config.contentType === 'short' ? 'Short' : 'Video'} · ${config.themeLabel} · ${config.accountNames.join(', ')}`,
            }
          : a
      ))
    } else {
      // Create mode — add new item
      const newAutomation: AutomationItem = {
        id: Date.now(),
        name: config.name,
        type: 'workflow',
        status: 'active',
        lastRun: 'Never',
        nextRun: getScheduleSummary(config),
        successRate: 100,
        description: `${config.contentType === 'short' ? 'Short' : 'Video'} · ${config.themeLabel} · ${config.accountNames.join(', ')}`,
      }
      setAutomations(prev => [newAutomation, ...prev])
    }
    handleCloseDrawer()
  }

  const filteredAutomations = automations.filter((automation) => {
    if (statusFilter === 'active') return automation.status === 'active'
    if (statusFilter === 'paused') return automation.status === 'paused'
    return true
  })

  const toggleAutomationStatus = (id: number) => {
    setAutomations(prev => prev.map((automation) => {
      if (automation.id !== id) return automation
      if (automation.status === 'active') {
        return { ...automation, status: 'paused', pausedNextRun: automation.nextRun, nextRun: 'Manual' }
      }
      return { ...automation, status: 'active', nextRun: automation.pausedNextRun || automation.nextRun, pausedNextRun: undefined }
    }))
  }

  const deleteAutomation = (id: number) => {
    setAutomations(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Automation</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your automated workflows and tasks</p>
        </div>
        <button
          onClick={handleNewAutomation}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Automation
        </button>
      </div>

      {/* Active Automations */}
      <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-white">Active Automations</h2>
            <p className="text-xs text-zinc-500">Running and scheduled workflows</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Filter:</span>
            {(['all', 'active', 'paused'] as StatusFilter[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                  statusFilter === f
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredAutomations.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500">No automations match this filter.</p>
            </div>
          )}
          {filteredAutomations.map((automation) => (
            <div
              key={automation.id}
              className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  automation.status === 'active' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                }`}>
                  {automation.status === 'active'
                    ? <Play className="w-5 h-5 text-emerald-400" />
                    : <Pause className="w-5 h-5 text-amber-400" />
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{automation.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(automation.status)}`}>
                      {automation.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{automation.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last: {automation.lastRun}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Next: {automation.nextRun}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {automation.successRate}%
                  </div>
                  <p className="text-xs text-zinc-500">Success Rate</p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Edit — opens full AutomationCreator drawer in edit mode */}
                  <button
                    type="button"
                    onClick={() => openEditDrawer(automation)}
                    title="Edit automation"
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* Pause / Resume */}
                  <button
                    type="button"
                    onClick={() => toggleAutomationStatus(automation.id)}
                    title={automation.status === 'active' ? 'Pause automation' : 'Resume automation'}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {automation.status === 'active'
                      ? <Pause className="w-4 h-4 text-amber-400" />
                      : <Play  className="w-4 h-4 text-emerald-400" />
                    }
                  </button>

                  {/* Double-confirm delete */}
                  <DeleteButton onConfirm={() => deleteAutomation(automation.id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Drawer — same component, different mode */}
      <AnimatePresence>
        {showCreateDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-[#1A1A1A] z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-[#1A1A1A] shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#E8E8E8]">
                      {editingAutomation ? 'Edit Automation' : 'New Automation'}
                    </h3>
                    <p className="text-xs text-[#505050]">
                      {editingAutomation
                        ? 'Update configuration for this automation'
                        : 'Configure type, theme, style & accounts'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[#909090]" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-hidden">
                <AutomationCreator
                  onCreate={handleSaveAutomation}
                  initialConfig={editInitialConfig}
                  submitLabel={editingAutomation ? 'Save Changes' : 'Create Automation'}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}