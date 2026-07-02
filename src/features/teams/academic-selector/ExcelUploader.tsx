import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx-js-style'
import { FileSpreadsheet, Upload, Loader2, Clock } from 'lucide-react'
import type { UploadRow } from './types'
import { registerStudentAccount, generatePassword, studentEmail } from './studentAuth'

interface ExcelUploaderProps {
  onParsedRows: (rows: UploadRow[]) => void
  onError: (message: string) => void
}

const EXPECTED_HEADERS = ['name', 'student id', 'branch', 'year']
const normalizeHeader = (value: unknown) => String(value || '').trim().toLowerCase()
const SECONDS_PER_STUDENT = 1.5

const parseYear = (value: unknown) => {
  const raw = String(value || '').toLowerCase().trim()
  const numeric = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10)
  if (!Number.isNaN(numeric) && numeric > 0) return Math.min(4, numeric)
  if (raw.includes('first') || raw.includes('1st')) return 1
  if (raw.includes('second') || raw.includes('2nd')) return 2
  if (raw.includes('third') || raw.includes('3rd')) return 3
  if (raw.includes('fourth') || raw.includes('4th')) return 4
  return 1
}

// ── Beautiful styled Excel generator ────────────────────────────────────────
function buildCredentialsExcel(rows: UploadRow[]): void {
  const outputData = rows.map((row, i) => ({
    '#': i + 1,
    'Student Name': row.name,
    'Student ID': row.studentId,
    Branch: row.branch,
    Year: `Year ${row.year}`,
    'Login Email': row.email,
    'Password': row.password,
  }))

  const ws = XLSX.utils.json_to_sheet(outputData)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:G1')

  // Header style — dark navy with white bold text
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
    fill: { fgColor: { rgb: '1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    border: {
      top: { style: 'medium', color: { rgb: '2563EB' } },
      bottom: { style: 'medium', color: { rgb: '2563EB' } },
      left: { style: 'thin', color: { rgb: '334155' } },
      right: { style: 'thin', color: { rgb: '334155' } },
    },
  }

  // Data row styles — alternate between two shades
  const dataStyleEven = {
    font: { sz: 11, color: { rgb: '1E293B' } },
    fill: { fgColor: { rgb: 'F0F4FF' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    },
  }
  const dataStyleOdd = {
    ...dataStyleEven,
    fill: { fgColor: { rgb: 'FFFFFF' } },
  }

  // Email column style
  const emailStyle = {
    ...dataStyleEven,
    font: { sz: 11, color: { rgb: '1D4ED8' }, italic: true },
  }

  // Password column style
  const pwStyle = {
    ...dataStyleEven,
    font: { sz: 11, color: { rgb: '059669' }, bold: true },
    fill: { fgColor: { rgb: 'ECFDF5' } },
  }

  // Apply header styles
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const addr = XLSX.utils.encode_cell({ c: C, r: 0 })
    if (ws[addr]) ws[addr].s = headerStyle
  }

  // Apply data row styles
  for (let R = 1; R <= range.e.r; ++R) {
    const isEven = R % 2 === 0
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ c: C, r: R })
      if (!ws[addr]) continue
      const colKey = Object.keys(outputData[0])[C]
      if (colKey === 'Login Email') {
        ws[addr].s = { ...emailStyle, fill: { fgColor: { rgb: isEven ? 'EFF6FF' : 'FFFFFF' } } }
      } else if (colKey === 'Password') {
        ws[addr].s = { ...pwStyle, fill: { fgColor: { rgb: isEven ? 'ECFDF5' : 'F0FDF4' } } }
      } else {
        ws[addr].s = isEven ? dataStyleEven : dataStyleOdd
      }
    }
  }

  // Column widths
  ws['!cols'] = [
    { wch: 5 },  // #
    { wch: 22 }, // Student Name
    { wch: 14 }, // Student ID
    { wch: 22 }, // Branch
    { wch: 8 },  // Year
    { wch: 32 }, // Login Email
    { wch: 14 }, // Password
  ]

  // Row height for header
  ws['!rows'] = [{ hpt: 22 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Student Credentials')
  XLSX.writeFile(wb, 'students_credentials.xlsx')
}
// ──────────────────────────────────────────────────────────────────────────────

export default function ExcelUploader({ onParsedRows, onError }: ExcelUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [totalStudents, setTotalStudents] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [estimated, setEstimated] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isProcessing) {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000)
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setElapsed(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isProcessing])

  const remaining = Math.max(Math.ceil(estimated - elapsed), 0)
  const progress = estimated > 0 ? Math.min((elapsed / estimated) * 100, 97) : 0

  const readRows = async (file: File) => {
    setIsProcessing(true)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) throw new Error('No worksheet found in file.')

      const sheet = workbook.Sheets[sheetName]
      const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, blankrows: false })

      if (matrix.length < 2) throw new Error('File is empty or missing student rows.')

      const headerRow = matrix[0].map(normalizeHeader)
      if (!EXPECTED_HEADERS.every((h) => headerRow.includes(h))) {
        throw new Error('Invalid format. Expected columns: Name | Student ID | Branch | Year')
      }

      const idx = (h: string) => headerRow.indexOf(h)

      const parsedRows: UploadRow[] = matrix
        .slice(1)
        .map((row) => {
          const id = String(row[idx('student id')] || '').trim()
          return {
            name: String(row[idx('name')] || '').trim(),
            studentId: id,
            branch: String(row[idx('branch')] || '').trim(),
            year: parseYear(row[idx('year')]),
            email: studentEmail(id),
            password: generatePassword(),
          }
        })
        .filter((r) => r.name && r.studentId && r.branch)

      if (parsedRows.length === 0) throw new Error('No valid rows found in file.')

      // Set timer estimate
      setTotalStudents(parsedRows.length)
      setEstimated(parsedRows.length * SECONDS_PER_STUDENT)

      // ── STEP 1: Generate + download the styled Excel immediately ─────────
      buildCredentialsExcel(parsedRows)
      // ─────────────────────────────────────────────────────────────────────

      // ── STEP 2: Update the Academic Structure UI ─────────────────────────
      onParsedRows(parsedRows)
      // ─────────────────────────────────────────────────────────────────────

      // ── STEP 3: Register Firebase accounts in the background (no await) ──
      Promise.allSettled(
        parsedRows.map((row) =>
          registerStudentAccount(row.name, row.studentId, row.email!, row.password!)
        )
      ).catch(console.warn)
      // ─────────────────────────────────────────────────────────────────────

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to parse file. Please upload a valid .xlsx or .csv file.'
      onError(msg)
    } finally {
      // Dismiss loading immediately — Excel is already downloaded
      setIsProcessing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur shadow-lg relative overflow-hidden">
      {isProcessing && (
        <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 px-6">
          <Loader2 className="w-9 h-9 animate-spin text-blue-400" />
          <span className="text-sm font-semibold text-blue-300">
            Generating {totalStudents} credential{totalStudents !== 1 ? 's' : ''}…
          </span>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {remaining > 0 ? `~${remaining}s remaining` : 'Finalizing…'}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 text-slate-200">
        <FileSpreadsheet className="h-4 w-4 text-cyan-300" />
        <span className="text-sm font-medium">Bulk Upload & Register</span>
      </div>

      <label
        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 cursor-pointer text-sm text-slate-200 transition-opacity ${isProcessing ? 'opacity-40 pointer-events-none' : ''}`}
      >
        <Upload className="h-4 w-4" />
        Upload Excel / CSV
        <input
          type="file"
          accept=".xlsx,.csv"
          disabled={isProcessing}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void readRows(file)
            e.currentTarget.value = ''
          }}
          className="hidden"
        />
      </label>

      <p className="mt-2 text-xs text-slate-500">Expected columns: Name · Student ID · Branch · Year</p>
    </div>
  )
}
