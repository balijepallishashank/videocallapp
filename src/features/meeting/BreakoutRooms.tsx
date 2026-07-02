import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Play, Pause, RotateCw } from 'lucide-react'

export interface BreakoutRoom {
  id: string
  name: string
  participants: string[]
  duration: number
  isActive: boolean
}

interface BreakoutRoomsProps {
  mainParticipants: string[]
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
}

export default function BreakoutRooms({ mainParticipants, onToast }: BreakoutRoomsProps) {
  const [rooms, setRooms] = useState<BreakoutRoom[]>([])
  const [roomCount, setRoomCount] = useState(2)
  const [duration, setDuration] = useState(10)
  const [assignmentMethod, setAssignmentMethod] = useState<'auto' | 'manual'>('auto')
   
  const createRooms = () => {
    const newRooms: BreakoutRoom[] = []
    
    if (assignmentMethod === 'auto') {
      // Auto-assign participants
      const shuffled = [...mainParticipants].sort(() => Math.random() - 0.5)
      const perRoom = Math.ceil(shuffled.length / roomCount)
      
      for (let i = 0; i < roomCount; i++) {
        const start = i * perRoom
        const end = start + perRoom
        newRooms.push({
          id: `room-${i + 1}`,
          name: `Room ${i + 1}`,
          participants: shuffled.slice(start, end),
          duration,
          isActive: false,
        })
      }
    } else {
      // Manual assignment - create empty rooms
      for (let i = 0; i < roomCount; i++) {
        newRooms.push({
          id: `room-${i + 1}`,
          name: `Room ${i + 1}`,
          participants: [],
          duration,
          isActive: false,
        })
      }
    }
    
    setRooms(newRooms)
    onToast(`${roomCount} breakout rooms created`, 'success')
  }

  const startBreakoutRooms = () => {
    setRooms(rooms.map((room) => ({ ...room, isActive: true })))
    onToast('Breakout rooms started!', 'success')
  }

  const endBreakoutRooms = () => {
    setRooms(rooms.map((room) => ({ ...room, isActive: false })))
    onToast('All participants returned to main room', 'info')
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-orange-400" />
          <span className="font-semibold text-white">Breakout Rooms</span>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Number of Rooms
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Assignment Method
            </label>
            <select
              value={assignmentMethod}
              onChange={(e) => setAssignmentMethod(e.target.value as 'auto' | 'manual')}
              className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white"
            >
              <option value="auto">Automatically</option>
              <option value="manual">Manually</option>
            </select>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createRooms}
            disabled={mainParticipants.length < 2}
            className="w-full py-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Breakout Rooms
          </motion.button>

          {mainParticipants.length < 2 && (
            <p className="text-xs text-slate-400 text-center">
              Need at least 2 participants to create breakout rooms
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex gap-2">
            {!rooms.some((r) => r.isActive) ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startBreakoutRooms}
                className="flex-1 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Rooms
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={endBreakoutRooms}
                className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                End Rooms
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRooms([])}
              className="px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-medium transition-all flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Reset
            </motion.button>
          </div>

          {/* Rooms List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-3 rounded-lg transition-all ${
                  room.isActive
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white">{room.name}</h4>
                  {room.isActive && (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300">
                      Active
                    </span>
                  )}
                </div>

                <div className="text-sm text-slate-400">
                  {room.participants.length === 0 ? (
                    <p>No participants assigned</p>
                  ) : (
                    <div className="space-y-1">
                      {room.participants.map((participant, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs text-white">
                            {participant[0]}
                          </div>
                          <span className="text-white">{participant}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
