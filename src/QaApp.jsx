import { ClipboardCheck } from 'lucide-react'
import AdminDashboard from './components/AdminDashboard.jsx'

export default function QaApp() {
  return (
    <div className="flex h-screen min-h-0 flex-col bg-[#f4f6f8] text-slate-800">
      <header className="app-header flex shrink-0 items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime text-ink-950">
            <ClipboardCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-dim">TechSmith training</p>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">QA Admin Dashboard</h1>
          </div>
        </div>
        <p className="max-w-md text-right text-xs leading-relaxed text-slate-500">
          Lead-only page. Share this URL with QA and admins, not with agents sitting the knowledge check.
        </p>
      </header>
      <AdminDashboard />
    </div>
  )
}
