import { useState } from 'react'
import { Check, Zap, Calendar, CalendarDays, CalendarRange, Repeat, Plus, X, Youtube } from 'lucide-react'
import { Input } from '@/components/ui/input'

export type ScheduleType = 'daily' | 'weekly' | 'specific-days' | 'specific-dates'

export interface AutomationConfig {
  name: string
  contentType: 'video' | 'short'
  theme: string
  themeLabel: string
  voiceStyle: string
  musicStyle: string
  imageStyle: string
  pacing: string
  scheduleType: ScheduleType
  scheduleTime: string
  scheduleDays: string[]
  scheduleDates: string[]
  accountIds: string[]
  accountNames: string[]
}

interface AutomationCreatorProps {
  onCreate: (config: AutomationConfig) => void
  // Pre-fill values when editing an existing automation
  initialConfig?: Partial<AutomationConfig> | null
  // Override the final button label (default: 'Create Automation')
  submitLabel?: string
}

const contentThemes = [
  { id: 'pov',      name: 'POV in the life',    description: 'First-person day-in-the-life content', icon: '👁️' },
  { id: 'storytime',name: 'Storytime',           description: 'Personal stories and experiences',     icon: '📖' },
  { id: 'reddit',   name: 'Reddit Stories',      description: 'Compelling narratives from Reddit',    icon: '📱' },
  { id: 'mystery',  name: 'Mystery',             description: 'Unsolved cases and phenomena',         icon: '🔍' },
  { id: 'facts',    name: 'Interesting Facts',   description: 'Mind-blowing facts and trivia',        icon: '🧠' },
  { id: 'list',     name: 'Top 10',              description: 'Ranked lists and countdowns',          icon: '📊' },
]

const accounts = [
  { id: '1', name: 'Tech Trends',    status: 'active',    initials: 'TT' },
  { id: '2', name: 'Gaming Hub',     status: 'active',    initials: 'GH' },
  { id: '3', name: 'Vlog Life',      status: 'pending',   initials: 'VL' },
  { id: '4', name: 'Cooking Master', status: 'suspended', initials: 'CM' },
  { id: '5', name: 'Fitness Daily',  status: 'active',    initials: 'FD' },
  { id: '6', name: 'Travel Diaries', status: 'active',    initials: 'TD' },
]

const weekDays = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]

const scheduleOptions: { id: ScheduleType; label: string; description: string; icon: typeof Repeat }[] = [
  { id: 'daily',          label: 'Daily',          description: 'Runs every day at a set time',   icon: Repeat        },
  { id: 'weekly',         label: 'Weekly',         description: 'Once a week on a chosen day',    icon: Calendar      },
  { id: 'specific-days',  label: 'Specific Days',  description: 'Only on selected weekdays',      icon: CalendarDays  },
  { id: 'specific-dates', label: 'Specific Dates', description: 'Pick exact calendar dates',      icon: CalendarRange },
]

const TOTAL_STEPS = 5

function formatDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getScheduleSummary(config: Pick<AutomationConfig, 'scheduleType' | 'scheduleTime' | 'scheduleDays' | 'scheduleDates'>) {
  const time = config.scheduleTime
  switch (config.scheduleType) {
    case 'daily':
      return `Daily at ${time}`
    case 'weekly':
      return `Weekly on ${config.scheduleDays[0] ? weekDays.find(d => d.id === config.scheduleDays[0])?.label : '—'} at ${time}`
    case 'specific-days':
      return `${config.scheduleDays.map(d => weekDays.find(w => w.id === d)?.label).join(', ')} at ${time}`
    case 'specific-dates':
      return `${config.scheduleDates.map(formatDateLabel).join(', ')} at ${time}`
    default:
      return time
  }
}

export function AutomationCreator({ onCreate, initialConfig, submitLabel = 'Create Automation' }: AutomationCreatorProps) {
  // Initialise every field from initialConfig if provided, else use sensible defaults
  const ic = initialConfig ?? {}

  const [step, setStep]               = useState(1)
  const [name, setName]               = useState(ic.name ?? '')
  const [contentType, setContentType] = useState<'video' | 'short' | null>(ic.contentType ?? null)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(ic.theme ?? null)
  const [voiceStyle, setVoiceStyle]   = useState(ic.voiceStyle  ?? 'neutral')
  const [musicStyle, setMusicStyle]   = useState(ic.musicStyle  ?? 'ambient')
  const [imageStyle, setImageStyle]   = useState(ic.imageStyle  ?? 'cinematic')
  const [pacing, setPacing]           = useState(ic.pacing      ?? 'normal')
  const [scheduleType, setScheduleType]   = useState<ScheduleType>(ic.scheduleType ?? 'daily')
  const [scheduleTime, setScheduleTime]   = useState(ic.scheduleTime  ?? '09:00')
  const [scheduleDays, setScheduleDays]   = useState<string[]>(ic.scheduleDays  ?? ['mon'])
  const [scheduleDates, setScheduleDates] = useState<string[]>(ic.scheduleDates ?? [])
  const [pendingDate, setPendingDate]     = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(ic.accountIds ?? [])

  const currentTheme   = contentThemes.find(t => t.id === selectedTheme)
  const activeAccounts = accounts.filter(a => a.status === 'active')

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    )
  }

  const selectAllAccounts = () => {
    setSelectedAccounts(
      selectedAccounts.length === activeAccounts.length ? [] : activeAccounts.map(a => a.id)
    )
  }

  const toggleScheduleDay = (dayId: string) => {
    if (scheduleType === 'weekly') { setScheduleDays([dayId]); return }
    setScheduleDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  const addScheduleDate = () => {
    if (!pendingDate || scheduleDates.includes(pendingDate)) return
    setScheduleDates(prev => [...prev, pendingDate].sort())
    setPendingDate('')
  }

  const removeScheduleDate = (date: string) => {
    setScheduleDates(prev => prev.filter(d => d !== date))
  }

  const isScheduleValid = () => {
    if (scheduleType === 'weekly' || scheduleType === 'specific-days') return scheduleDays.length > 0
    if (scheduleType === 'specific-dates') return scheduleDates.length > 0
    return true
  }

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim() !== '' && contentType !== null
      case 2: return selectedTheme !== null
      case 3: return true
      case 4: return selectedAccounts.length > 0 && isScheduleValid()
      case 5: return true
      default: return false
    }
  }

  const handleSubmit = () => {
    if (!contentType || !selectedTheme) return
    onCreate({
      name: name.trim(),
      contentType,
      theme: selectedTheme,
      themeLabel: currentTheme?.name || selectedTheme,
      voiceStyle,
      musicStyle,
      imageStyle,
      pacing,
      scheduleType,
      scheduleTime,
      scheduleDays,
      scheduleDates,
      accountIds: selectedAccounts,
      accountNames: accounts.filter(a => selectedAccounts.includes(a.id)).map(a => a.name),
    })
  }

  const renderScheduleDetails = () => {
    if (scheduleType === 'weekly' || scheduleType === 'specific-days') {
      return (
        <div className="space-y-2">
          <label className="text-xs text-[#505050]">
            {scheduleType === 'weekly' ? 'Day of week' : 'Select days'}
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleScheduleDay(day.id)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  scheduleDays.includes(day.id)
                    ? 'bg-[#10b981]/10 border border-[#10b981] text-[#E8E8E8]'
                    : 'bg-[#141414] border border-[#1A1A1A] text-[#909090] hover:border-[#252525]'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (scheduleType === 'specific-dates') {
      return (
        <div className="space-y-3">
          <label className="text-xs text-[#505050]">Add dates</label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={pendingDate}
              onChange={(e) => setPendingDate(e.target.value)}
              className="flex-1 bg-[#141414] border-[#1A1A1A] text-[#E8E8E8] [color-scheme:dark]"
            />
            <button
              type="button"
              onClick={addScheduleDate}
              disabled={!pendingDate}
              className="px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#252525] text-[#E8E8E8] hover:border-[#10b981] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {scheduleDates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {scheduleDates.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#1A1A1A] border border-[#252525] text-[#E8E8E8]"
                >
                  {formatDateLabel(date)}
                  <button
                    type="button"
                    onClick={() => removeScheduleDate(date)}
                    className="text-[#505050] hover:text-[#E8E8E8] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#505050]">No dates added yet</p>
          )}
        </div>
      )
    }

    return null
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-[#909090]">Automation Name</label>
              <Input
                placeholder="e.g., Daily Tech Upload"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#141414] border-[#1A1A1A] text-[#E8E8E8] placeholder:text-[#505050]"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm text-[#909090]">Content Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setContentType('video')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    contentType === 'video'
                      ? 'border-[#10b981] bg-[#10b981]/10'
                      : 'border-[#1A1A1A] bg-[#141414] hover:border-[#252525]'
                  }`}
                >
                  <div className="text-2xl mb-2">🎬</div>
                  <p className="text-sm font-medium text-[#E8E8E8]">Full Video</p>
                  <p className="text-xs text-[#505050]">8–12 min uploads</p>
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('short')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    contentType === 'short'
                      ? 'border-[#10b981] bg-[#10b981]/10'
                      : 'border-[#1A1A1A] bg-[#141414] hover:border-[#252525]'
                  }`}
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="text-sm font-medium text-[#E8E8E8]">YouTube Short</p>
                  <p className="text-xs text-[#505050]">30–60 sec clips</p>
                </button>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#909090]">Choose the content theme for this automation</p>
            <div className="grid grid-cols-2 gap-3">
              {contentThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedTheme === theme.id
                      ? 'border-[#10b981] bg-[#10b981]/10'
                      : 'border-[#1A1A1A] bg-[#141414] hover:border-[#252525]'
                  }`}
                >
                  <div className="text-2xl mb-2">{theme.icon}</div>
                  <p className="text-sm font-medium text-[#E8E8E8] mb-1">{theme.name}</p>
                  <p className="text-xs text-[#505050] leading-relaxed">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5">
            <p className="text-sm text-[#909090]">Set the overall style for generated content</p>
            <div className="space-y-4">
              {[
                { label: 'Voice Style', value: voiceStyle, setter: setVoiceStyle, options: ['neutral', 'energetic', 'calm', 'dramatic'] },
                { label: 'Music Style', value: musicStyle, setter: setMusicStyle, options: ['ambient', 'upbeat', 'cinematic', 'none']    },
                { label: 'Visual Style',value: imageStyle, setter: setImageStyle, options: ['cinematic', 'minimal', 'vibrant', 'dark']   },
                { label: 'Pacing',      value: pacing,     setter: setPacing,     options: ['slow', 'normal', 'fast']                    },
              ].map((setting) => (
                <div key={setting.label} className="space-y-2">
                  <label className="text-sm text-[#909090]">{setting.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {setting.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setting.setter(option)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          setting.value === option
                            ? 'bg-[#10b981]/10 border border-[#10b981] text-[#E8E8E8]'
                            : 'bg-[#141414] border border-[#1A1A1A] text-[#909090] hover:border-[#252525]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#909090]">Target Accounts</label>
                <button
                  type="button"
                  onClick={selectAllAccounts}
                  className="text-xs text-[#10b981] hover:text-[#10b981]/80 transition-colors"
                >
                  {selectedAccounts.length === activeAccounts.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeAccounts.map((account) => {
                  const isSelected = selectedAccounts.includes(account.id)
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => toggleAccount(account.id)}
                      className={`relative flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-[#10b981] bg-[#10b981]/10'
                          : 'border-[#1A1A1A] bg-[#141414] hover:border-[#252525]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#10b981]/20' : 'bg-[#1A1A1A]'
                      }`}>
                        <Youtube className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-rose-500/70'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#E8E8E8] truncate">{account.name}</p>
                        <p className="text-[10px] text-[#505050] uppercase tracking-wide">{account.initials}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[#0A0A0A]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-[#505050]">
                {selectedAccounts.length} of {activeAccounts.length} accounts selected
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#1A1A1A]">
              <label className="text-sm text-[#909090]">Schedule</label>
              <div className="grid grid-cols-2 gap-2">
                {scheduleOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setScheduleType(option.id)
                        if (option.id === 'weekly' && scheduleDays.length !== 1) {
                          setScheduleDays([scheduleDays[0] || 'mon'])
                        }
                        if (option.id === 'specific-dates') {
                          setScheduleDays([])
                        }
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        scheduleType === option.id
                          ? 'border-[#10b981] bg-[#10b981]/10'
                          : 'border-[#1A1A1A] bg-[#141414] hover:border-[#252525]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-2 ${scheduleType === option.id ? 'text-[#10b981]' : 'text-[#505050]'}`} />
                      <p className="text-sm font-medium text-[#E8E8E8]">{option.label}</p>
                      <p className="text-[10px] text-[#505050] mt-0.5 leading-snug">{option.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="p-4 rounded-lg bg-[#141414] border border-[#1A1A1A] space-y-4">
                {renderScheduleDetails()}
                <div className="space-y-2">
                  <label className="text-xs text-[#505050]">Run at</label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-[#0A0A0A] border-[#252525] text-[#E8E8E8] w-full [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto">
              <Zap className="w-7 h-7 text-[#10b981]" />
            </div>
            <h4 className="text-lg font-semibold text-[#E8E8E8] text-center">Review</h4>
            <div className="p-4 rounded-lg bg-[#141414] border border-[#1A1A1A] space-y-2 text-sm">
              {[
                ['Name',    name],
                ['Type',    contentType === 'short' ? 'YouTube Short' : 'Full Video'],
                ['Theme',   currentTheme?.name],
                ['Voice',   voiceStyle],
                ['Music',   musicStyle],
                ['Visual',  imageStyle],
                ['Pacing',  pacing],
                ['Schedule', getScheduleSummary({ scheduleType, scheduleTime, scheduleDays, scheduleDates })],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-[#505050] shrink-0">{label}</span>
                  <span className="text-[#E8E8E8] text-right capitalize text-xs leading-relaxed">{val}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1A1A1A]">
                <span className="text-[#505050]">Accounts</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {accounts.filter(a => selectedAccounts.includes(a.id)).map((account) => (
                    <span key={account.id} className="px-2 py-0.5 rounded-full text-xs bg-[#1A1A1A] border border-[#252525] text-[#E8E8E8]">
                      {account.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const stepLabels = ['Type', 'Theme', 'Style', 'Accounts', 'Review']

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={`h-1 rounded-full transition-all ${index + 1 <= step ? 'bg-[#10b981]' : 'bg-[#1A1A1A]'}`} />
            <p className={`text-[10px] mt-1 text-center ${index + 1 === step ? 'text-[#E8E8E8]' : 'text-[#505050]'}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#505050] mb-4">Step {step} of {TOTAL_STEPS}</p>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#252525] [&::-webkit-scrollbar-thumb]:rounded-full">
        {renderStep()}
      </div>

      {/* Nav */}
      <div className="flex gap-3 pt-4 border-t border-[#1A1A1A]">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex-1 px-4 py-2 rounded-lg text-sm text-[#909090] hover:bg-[#1A1A1A] transition-colors"
          >
            Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canProceed()
                ? 'bg-[#10b981] text-white hover:bg-[#0ea371]'
                : 'bg-[#1A1A1A] text-[#505050] cursor-not-allowed'
            }`}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 rounded-lg text-sm bg-[#10b981] text-white hover:bg-[#0ea371] transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  )
}