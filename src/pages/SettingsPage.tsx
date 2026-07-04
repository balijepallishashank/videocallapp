import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Lock, Bell, Palette, Shield, ArrowLeft, Upload, Save,
  Camera, Eye as EyeIcon, EyeOff, Smartphone,
  Trash2, Download
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { saveUserProfile } from '../services/db'

interface UserSettings {
  // Profile
  profilePicture: string
  fullName: string
  username: string
  email: string
  phone: string
  status: 'available' | 'busy' | 'away' | 'in-meeting'
  statusMessage: string
  timezone: string
  language: string

  // Meeting Preferences
  defaultCamera: string
  defaultMicrophone: string
  speakerOutput: string
  autoMuteOnJoin: boolean
  autoTurnOffCameraOnJoin: boolean
  noiseCancellation: boolean
  hdVideo: boolean

  // Notifications
  meetingReminders: boolean
  chatNotifications: boolean
  emailNotifications: boolean
  desktopNotifications: boolean
  soundAlerts: boolean

  // Privacy
  loginHistory: { date: string; device: string; location: string }[]
  activeDevices: string[]
  privacyLevel: 'public' | 'friends-only' | 'private'

  // Appearance
  darkMode: boolean
  accentColor: string
  layoutStyle: 'default' | 'compact' | 'spacious'
  backgroundBlur: boolean

  // Account
  storageUsed: number
  subscription: 'free' | 'pro' | 'business'
}

interface SettingsPageProps {
  onBack: () => void
  initialTab?: 'profile' | 'meeting' | 'notifications' | 'privacy' | 'appearance' | 'account'
}

type SettingsTabId = NonNullable<SettingsPageProps['initialTab']>

const defaultSettings: UserSettings = {
  profilePicture: '👤',
  fullName: 'Demo User',
  username: 'demo_user',
  email: 'demo@example.com',
  phone: '+1 (555) 000-0000',
  status: 'available',
  statusMessage: 'Available to chat',
  timezone: 'UTC-8',
  language: 'English',

  defaultCamera: 'Built-in Camera',
  defaultMicrophone: 'Built-in Microphone',
  speakerOutput: 'Built-in Audio',
  autoMuteOnJoin: true,
  autoTurnOffCameraOnJoin: false,
  noiseCancellation: true,
  hdVideo: true,

  meetingReminders: true,
  chatNotifications: true,
  emailNotifications: false,
  desktopNotifications: true,
  soundAlerts: true,

  loginHistory: [
    { date: 'Today 2:30 PM', device: 'Chrome on Windows', location: 'New York, USA' },
    { date: 'Yesterday 10:15 AM', device: 'Safari on iPad', location: 'New York, USA' },
    { date: 'Mar 2, 2026 5:45 PM', device: 'Chrome on Windows', location: 'New York, USA' },
  ],
  activeDevices: ['This Device (Chrome on Windows)', 'Safari on iPad'],
  privacyLevel: 'friends-only',

  darkMode: true,
  accentColor: 'blue',
  layoutStyle: 'default',
  backgroundBlur: true,

  storageUsed: 2.5,
  subscription: 'free',
}

const isStatusValue = (value: unknown): value is UserSettings['status'] =>
  value === 'available' || value === 'busy' || value === 'away' || value === 'in-meeting'

const isPrivacyLevelValue = (value: unknown): value is UserSettings['privacyLevel'] =>
  value === 'public' || value === 'friends-only' || value === 'private'

const isLayoutStyleValue = (value: unknown): value is UserSettings['layoutStyle'] =>
  value === 'default' || value === 'compact' || value === 'spacious'

const buildSettingsFromProfile = (profile: Record<string, unknown> | null | undefined): UserSettings => {
  const email = typeof profile?.email === 'string' && profile.email.trim() ? profile.email : defaultSettings.email
  const name = typeof profile?.name === 'string' && profile.name.trim() ? profile.name : defaultSettings.fullName

  return {
    ...defaultSettings,
    profilePicture: typeof profile?.profilePhoto === 'string' && profile.profilePhoto.trim()
      ? profile.profilePhoto
      : defaultSettings.profilePicture,
    fullName: name,
    username: typeof profile?.username === 'string' && profile.username.trim()
      ? profile.username
      : email.split('@')[0] || defaultSettings.username,
    email,
    phone: typeof profile?.phone === 'string' ? profile.phone : defaultSettings.phone,
    status: isStatusValue(profile?.status) ? profile.status : defaultSettings.status,
    statusMessage: typeof profile?.statusMessage === 'string' ? profile.statusMessage : defaultSettings.statusMessage,
    timezone: typeof profile?.timezone === 'string' ? profile.timezone : defaultSettings.timezone,
    language: typeof profile?.language === 'string' ? profile.language : defaultSettings.language,
    defaultCamera: typeof profile?.defaultCamera === 'string' ? profile.defaultCamera : defaultSettings.defaultCamera,
    defaultMicrophone: typeof profile?.defaultMicrophone === 'string' ? profile.defaultMicrophone : defaultSettings.defaultMicrophone,
    speakerOutput: typeof profile?.speakerOutput === 'string' ? profile.speakerOutput : defaultSettings.speakerOutput,
    autoMuteOnJoin: typeof profile?.autoMuteOnJoin === 'boolean' ? profile.autoMuteOnJoin : defaultSettings.autoMuteOnJoin,
    autoTurnOffCameraOnJoin: typeof profile?.autoTurnOffCameraOnJoin === 'boolean' ? profile.autoTurnOffCameraOnJoin : defaultSettings.autoTurnOffCameraOnJoin,
    noiseCancellation: typeof profile?.noiseCancellation === 'boolean' ? profile.noiseCancellation : defaultSettings.noiseCancellation,
    hdVideo: typeof profile?.hdVideo === 'boolean' ? profile.hdVideo : defaultSettings.hdVideo,
    meetingReminders: typeof profile?.meetingReminders === 'boolean' ? profile.meetingReminders : defaultSettings.meetingReminders,
    chatNotifications: typeof profile?.chatNotifications === 'boolean' ? profile.chatNotifications : defaultSettings.chatNotifications,
    emailNotifications: typeof profile?.emailNotifications === 'boolean' ? profile.emailNotifications : defaultSettings.emailNotifications,
    desktopNotifications: typeof profile?.desktopNotifications === 'boolean' ? profile.desktopNotifications : defaultSettings.desktopNotifications,
    soundAlerts: typeof profile?.soundAlerts === 'boolean' ? profile.soundAlerts : defaultSettings.soundAlerts,
    privacyLevel: isPrivacyLevelValue(profile?.privacyLevel) ? profile.privacyLevel : defaultSettings.privacyLevel,
    darkMode: typeof profile?.darkMode === 'boolean' ? profile.darkMode : defaultSettings.darkMode,
    accentColor: typeof profile?.accentColor === 'string' ? profile.accentColor : defaultSettings.accentColor,
    layoutStyle: isLayoutStyleValue(profile?.layoutStyle) ? profile.layoutStyle : defaultSettings.layoutStyle,
    backgroundBlur: typeof profile?.backgroundBlur === 'boolean' ? profile.backgroundBlur : defaultSettings.backgroundBlur,
    storageUsed: typeof profile?.storageUsed === 'number' ? profile.storageUsed : defaultSettings.storageUsed,
    subscription: profile?.subscription === 'pro' || profile?.subscription === 'business' || profile?.subscription === 'free'
      ? profile.subscription
      : defaultSettings.subscription,
  }
}

const buildProfileUpdate = (settings: UserSettings) => ({
  name: settings.fullName.trim(),
  email: settings.email.trim(),
  phone: settings.phone.trim(),
  profilePhoto: settings.profilePicture,
  username: settings.username.trim(),
  status: settings.status,
  statusMessage: settings.statusMessage.trim(),
  timezone: settings.timezone,
  language: settings.language,
  defaultCamera: settings.defaultCamera,
  defaultMicrophone: settings.defaultMicrophone,
  speakerOutput: settings.speakerOutput,
  autoMuteOnJoin: settings.autoMuteOnJoin,
  autoTurnOffCameraOnJoin: settings.autoTurnOffCameraOnJoin,
  noiseCancellation: settings.noiseCancellation,
  hdVideo: settings.hdVideo,
  meetingReminders: settings.meetingReminders,
  chatNotifications: settings.chatNotifications,
  emailNotifications: settings.emailNotifications,
  desktopNotifications: settings.desktopNotifications,
  soundAlerts: settings.soundAlerts,
  privacyLevel: settings.privacyLevel,
  darkMode: settings.darkMode,
  accentColor: settings.accentColor,
  layoutStyle: settings.layoutStyle,
  backgroundBlur: settings.backgroundBlur,
})

export default function SettingsPage({ onBack, initialTab = 'profile' }: SettingsPageProps) {
  const { currentUser, updateCurrentUserProfile } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [loadedProfileId, setLoadedProfileId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser || loadedProfileId === currentUser.id) return

    setSettings(buildSettingsFromProfile(currentUser as unknown as Record<string, unknown>))
    setLoadedProfileId(currentUser.id)
  }, [currentUser, loadedProfileId])

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings((prev) => ({ ...prev, profilePicture: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSaveSettings = async () => {
    if (!currentUser) {
      setSaveError('No signed-in user profile was found.')
      return
    }

    setIsSaving(true)
    setSaveStatus(null)
    setSaveError(null)

    const profileUpdate = buildProfileUpdate(settings)

    try {
      await saveUserProfile(currentUser.id, profileUpdate)
      updateCurrentUserProfile(profileUpdate)
      setSaveStatus('Settings saved to your profile.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: Array<{ id: SettingsTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'meeting', label: 'Meeting Prefs', icon: Camera },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: Shield },
  ]

  const handleSettingChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleChangePassword = () => {
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
      alert('✅ Password changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      alert('❌ Passwords do not match!')
    }
  }

  // Profile Tab
  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div>
        <label className="block text-sm font-medium text-white mb-4">Profile Picture</label>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl border-4 border-white/10 overflow-hidden">
            {settings.profilePicture.startsWith('data:') || /^https?:\/\//.test(settings.profilePicture) ? (
              <img src={settings.profilePicture} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              settings.profilePicture
            )}
          </div>
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer px-6 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-medium transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Change Picture
            <input type="file" hidden accept="image/*" onChange={handleProfilePictureUpload} />
          </motion.label>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
        <input
          type="text"
          value={settings.fullName}
          onChange={(e) => handleSettingChange('fullName', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
        <input
          type="text"
          value={settings.username}
          onChange={(e) => handleSettingChange('username', e.target.value)}
          placeholder="@username"
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => handleSettingChange('email', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
        <input
          type="tel"
          value={settings.phone}
          onChange={(e) => handleSettingChange('phone', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'available', label: '🟢 Available', color: 'from-green-500 to-emerald-600' },
            { value: 'busy', label: '🔴 Busy', color: 'from-red-500 to-rose-600' },
            { value: 'away', label: '🟡 Away', color: 'from-amber-500 to-orange-600' },
            { value: 'in-meeting', label: '🟣 In Meeting', color: 'from-purple-500 to-pink-600' },
          ].map((status) => (
            <motion.button
              key={status.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSettingChange('status', status.value as UserSettings['status'])}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                settings.status === status.value
                  ? `bg-gradient-to-r ${status.color} text-white shadow-lg`
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-white/10'
              }`}
            >
              {status.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Status Message */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Status Message</label>
        <input
          type="text"
          value={settings.statusMessage}
          onChange={(e) => handleSettingChange('statusMessage', e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
        <select
          value={settings.timezone}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        >
          <option>UTC-8 (Pacific Time)</option>
          <option>UTC-5 (Eastern Time)</option>
          <option>UTC (London)</option>
          <option>UTC+1 (Central Europe)</option>
          <option>UTC+5:30 (India)</option>
          <option>UTC+8 (Singapore)</option>
          <option>UTC+9 (Tokyo)</option>
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
        <select
          value={settings.language}
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        >
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
          <option>Japanese</option>
          <option>Chinese (Simplified)</option>
          <option>Hindi</option>
        </select>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all flex items-center justify-center gap-2 mt-8"
      >
        <Save className="w-5 h-5" />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </div>
  )

  // Meeting Preferences Tab
  const MeetingTab = () => (
    <div className="space-y-6">
      {/* Default Camera */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Default Camera</label>
        <select
          value={settings.defaultCamera}
          onChange={(e) => handleSettingChange('defaultCamera', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        >
          <option>Built-in Camera</option>
          <option>USB Camera 1</option>
          <option>USB Camera 2</option>
        </select>
      </div>

      {/* Default Microphone */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Default Microphone</label>
        <select
          value={settings.defaultMicrophone}
          onChange={(e) => handleSettingChange('defaultMicrophone', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        >
          <option>Built-in Microphone</option>
          <option>USB Microphone</option>
          <option>Headset Microphone</option>
        </select>
      </div>

      {/* Speaker Output */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Speaker Output</label>
        <select
          value={settings.speakerOutput}
          onChange={(e) => handleSettingChange('speakerOutput', e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
        >
          <option>Built-in Audio</option>
          <option>USB Speakers</option>
          <option>Headphones</option>
        </select>
      </div>

      <hr className="border-white/10" />

      {/* Auto Mute */}
      <ToggleSetting
        label="Auto Mute Microphone on Join"
        description="Automatically mute when joining meetings"
        value={settings.autoMuteOnJoin}
        onChange={(val) => handleSettingChange('autoMuteOnJoin', val)}
      />

      {/* Auto Turn Off Camera */}
      <ToggleSetting
        label="Auto Turn Off Camera on Join"
        description="Automatically disable camera when joining"
        value={settings.autoTurnOffCameraOnJoin}
        onChange={(val) => handleSettingChange('autoTurnOffCameraOnJoin', val)}
      />

      {/* Noise Cancellation */}
      <ToggleSetting
        label="Noise Cancellation"
        description="Reduce background noise during calls"
        value={settings.noiseCancellation}
        onChange={(val) => handleSettingChange('noiseCancellation', val)}
      />

      {/* HD Video */}
      <ToggleSetting
        label="HD Video"
        description="Enable high-definition video quality (uses more bandwidth)"
        value={settings.hdVideo}
        onChange={(val) => handleSettingChange('hdVideo', val)}
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all flex items-center justify-center gap-2 mt-8"
      >
        <Save className="w-5 h-5" />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </div>
  )

  // Notifications Tab
  const NotificationsTab = () => (
    <div className="space-y-6">
      <ToggleSetting
        label="Meeting Reminders"
        description="Get notified before your scheduled meetings"
        value={settings.meetingReminders}
        onChange={(val) => handleSettingChange('meetingReminders', val)}
      />

      <ToggleSetting
        label="Chat Message Notifications"
        description="Receive alerts for new messages"
        value={settings.chatNotifications}
        onChange={(val) => handleSettingChange('chatNotifications', val)}
      />

      <ToggleSetting
        label="Email Notifications"
        description="Receive notifications via email"
        value={settings.emailNotifications}
        onChange={(val) => handleSettingChange('emailNotifications', val)}
      />

      <ToggleSetting
        label="Desktop Notifications"
        description="Show notifications on your desktop"
        value={settings.desktopNotifications}
        onChange={(val) => handleSettingChange('desktopNotifications', val)}
      />

      <ToggleSetting
        label="Sound Alerts"
        description="Play sound for notifications"
        value={settings.soundAlerts}
        onChange={(val) => handleSettingChange('soundAlerts', val)}
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all flex items-center justify-center gap-2 mt-8"
      >
        <Save className="w-5 h-5" />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </div>
  )

  // Privacy & Security Tab
  const PrivacyTab = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-400" />
          Change Password
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 pr-10 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 pr-10 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleChangePassword}
            className="w-full py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-medium transition-all"
          >
            Update Password
          </motion.button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-blue-400" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-slate-400">Add an extra layer of security</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTwoFAEnabled(!twoFAEnabled)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              twoFAEnabled
                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                : 'bg-slate-700/50 border border-white/10 text-slate-400 hover:bg-slate-600/50'
            }`}
          >
            {twoFAEnabled ? '✓ Enabled' : 'Enable'}
          </motion.button>
        </div>
      </div>

      {/* Login History */}
      <div>
        <h3 className="font-semibold text-white mb-3">📋 Login History</h3>
        <div className="space-y-2">
          {settings.loginHistory.map((entry, idx) => (
            <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{entry.device}</p>
                  <p className="text-slate-400 text-xs mt-1">{entry.location}</p>
                </div>
                <span className="text-slate-500 text-xs">{entry.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Devices */}
      <div>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Active Devices ({settings.activeDevices.length})
        </h3>
        <div className="space-y-2 mb-4">
          {settings.activeDevices.map((device, idx) => (
            <div key={idx} className="bg-slate-800/30 rounded-lg p-3 border border-white/10 flex items-center justify-between">
              <span className="text-white text-sm">{device}</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-red-400 hover:text-red-300 transition-colors text-xs px-3 py-1 rounded-lg hover:bg-red-500/10"
              >
                Sign out
              </motion.button>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-medium transition-all"
        >
          Sign Out from All Devices
        </motion.button>
      </div>

      {/* Privacy Level */}
      <div>
        <h3 className="font-semibold text-white mb-3">Privacy Level</h3>
        <div className="space-y-2">
          {[
            { value: 'private', label: '🔒 Private', desc: 'Only you can see your profile' },
            { value: 'friends-only', label: '👥 Friends Only', desc: 'Only friends can see your profile' },
            { value: 'public', label: '🌐 Public', desc: 'Everyone can see your profile' },
          ].map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSettingChange('privacyLevel', option.value as UserSettings['privacyLevel'])}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                settings.privacyLevel === option.value
                  ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                  : 'bg-slate-800/30 border border-white/10 text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-slate-400 mt-1">{option.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )

  // Appearance Tab
  const AppearanceTab = () => (
    <div className="space-y-6">
      <ToggleSetting
        label="Dark Mode"
        description="Use dark theme (currently enabled)"
        value={settings.darkMode}
        onChange={(val) => {
          handleSettingChange('darkMode', val);
          if (val) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }}
      />

      <div>
        <h3 className="font-semibold text-white mb-3">Accent Color</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: 'blue', color: 'bg-blue-500' },
            { name: 'purple', color: 'bg-purple-500' },
            { name: 'pink', color: 'bg-pink-500' },
            { name: 'green', color: 'bg-green-500' },
            { name: 'orange', color: 'bg-orange-500' },
            { name: 'cyan', color: 'bg-cyan-500' },
            { name: 'indigo', color: 'bg-indigo-500' },
            { name: 'rose', color: 'bg-rose-500' },
          ].map((accent) => (
            <motion.button
              key={accent.name}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSettingChange('accentColor', accent.name)}
              className={`w-12 h-12 rounded-lg ${accent.color} transition-all relative ${
                settings.accentColor === accent.name ? 'ring-2 ring-white' : ''
              }`}
            >
              {settings.accentColor === accent.name && (
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Layout Style</h3>
        <div className="space-y-2">
          {[
            { value: 'compact', label: '⚡ Compact', desc: 'Minimal spacing, maximum content' },
            { value: 'default', label: '⚖️ Default', desc: 'Balanced spacing' },
            { value: 'spacious', label: '✨ Spacious', desc: 'Extra spacing for comfort' },
          ].map((layout) => (
            <motion.button
              key={layout.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSettingChange('layoutStyle', layout.value as UserSettings['layoutStyle'])}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                settings.layoutStyle === layout.value
                  ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                  : 'bg-slate-800/30 border border-white/10 text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <div className="font-medium">{layout.label}</div>
              <div className="text-xs text-slate-400 mt-1">{layout.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <ToggleSetting
        label="Background Blur"
        description="Blur your background during video calls"
        value={settings.backgroundBlur}
        onChange={(val) => handleSettingChange('backgroundBlur', val)}
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSaveSettings}
        disabled={isSaving}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all flex items-center justify-center gap-2 mt-8"
      >
        <Save className="w-5 h-5" />
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </div>
  )

  // Account Tab
  const AccountTab = () => (
    <div className="space-y-6">
      {/* Subscription */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
        <h3 className="font-semibold text-white mb-2">Current Plan</h3>
        <p className="text-2xl font-bold text-white mb-2 capitalize">{settings.subscription}</p>
        <p className="text-slate-400 text-sm mb-4">
          {settings.subscription === 'free'
            ? 'Upgrade to unlock premium features'
            : 'You have all premium features unlocked'}
        </p>
        {settings.subscription === 'free' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-all"
          >
            Upgrade to Pro
          </motion.button>
        )}
      </div>

      {/* Storage */}
      <div>
        <h3 className="font-semibold text-white mb-3">Storage Usage</h3>
        <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">{settings.storageUsed} GB</span>
              <span className="text-slate-400 text-sm">based on Free plan</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                style={{ width: `${(settings.storageUsed / 15) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {15 - settings.storageUsed} GB remaining (Upgrade for more)
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/30">
        <h3 className="font-semibold text-red-200 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h3>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-medium transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export My Data
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-medium transition-all"
          >
            Delete Account
          </motion.button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex flex-col z-[9999]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 bg-slate-900/50 border-b border-white/10"
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>
        </div>


      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 p-6 bg-slate-900/30 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/30 border border-blue-500/50 text-blue-200'
                  : 'bg-slate-800/50 border border-white/10 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          )
        })}
      </div>

      {(saveStatus || saveError) && (
        <div className="px-6 pt-4">
          <div className={`rounded-2xl border px-4 py-3 text-sm ${saveError ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
            {saveError || saveStatus}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ProfileTab />
              </motion.div>
            )}
            {activeTab === 'meeting' && (
              <motion.div key="meeting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <MeetingTab />
              </motion.div>
            )}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <NotificationsTab />
              </motion.div>
            )}
            {activeTab === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <PrivacyTab />
              </motion.div>
            )}
            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AppearanceTab />
              </motion.div>
            )}
            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AccountTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Toggle Setting Component
function ToggleSetting({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-4 border border-white/10">
      <div>
        <h3 className="font-semibold text-white">{label}</h3>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(!value)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          value
            ? 'bg-green-500/20 border border-green-500/50 text-green-300'
            : 'bg-slate-700/50 border border-white/10 text-slate-400'
        }`}
      >
        {value ? '✓ ON' : '○ OFF'}
      </motion.button>
    </div>
  )
}
