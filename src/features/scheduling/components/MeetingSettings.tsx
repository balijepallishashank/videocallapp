import type { MeetingSettings } from '../../../services/db'

interface MeetingSettingsPanelProps {
  settings: MeetingSettings
  onChange: (settings: MeetingSettings) => void
  disabled?: boolean
}

interface ToggleRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

function ToggleRow({ id, label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-white cursor-pointer">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? 'bg-cyan-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export default function MeetingSettingsPanel({
  settings,
  onChange,
  disabled = false,
}: MeetingSettingsPanelProps) {
  const update = (key: keyof MeetingSettings) => (value: boolean) =>
    onChange({ ...settings, [key]: value })

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 space-y-0">
      <ToggleRow
        id="setting-waitingRoom"
        label="Waiting Room"
        description="Students wait for host approval before joining"
        checked={settings.waitingRoom ?? true}
        onChange={update('waitingRoom')}
        disabled={disabled}
      />
      <ToggleRow
        id="setting-allowChat"
        label="Allow Chat"
        description="Students can send messages in the meeting chat"
        checked={settings.allowChat ?? true}
        onChange={update('allowChat')}
        disabled={disabled}
      />
      <ToggleRow
        id="setting-allowReactions"
        label="Allow Reactions"
        description="Students can use emoji reactions during the meeting"
        checked={settings.allowReactions ?? true}
        onChange={update('allowReactions')}
        disabled={disabled}
      />
      <ToggleRow
        id="setting-allowHandRaise"
        label="Allow Hand Raise"
        description="Students can raise their hand to join the speaking queue"
        checked={settings.allowHandRaise ?? true}
        onChange={update('allowHandRaise')}
        disabled={disabled}
      />
      <ToggleRow
        id="setting-allowStudentMic"
        label="Allow Student Microphone"
        description="Students can unmute their microphone"
        checked={settings.allowStudentMic ?? true}
        onChange={update('allowStudentMic')}
        disabled={disabled}
      />
      <ToggleRow
        id="setting-allowStudentCamera"
        label="Allow Student Camera"
        description="Students can turn on their camera"
        checked={settings.allowStudentCamera ?? true}
        onChange={update('allowStudentCamera')}
        disabled={disabled}
      />
      <ToggleRow
        id="setting-allowScreenShare"
        label="Allow Screen Sharing"
        description="Students can share their screen"
        checked={settings.allowScreenShare ?? false}
        onChange={update('allowScreenShare')}
        disabled={disabled}
      />
      <ToggleRow
        id="setting-isLocked"
        label="Lock Meeting"
        description="Prevent new participants from joining"
        checked={settings.isLocked ?? false}
        onChange={update('isLocked')}
        disabled={disabled}
      />
    </div>
  )
}
