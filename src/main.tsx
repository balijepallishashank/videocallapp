import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { isFirebaseConfigured, missingFirebaseEnvVars } from './config/firebase'
import App from './App'
import './index.css'

function FirebaseSetupRequired() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-2xl border border-amber-400/30 bg-slate-900 p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Setup required</p>
        <h1 className="mt-2 text-2xl font-bold">Firebase configuration is missing</h1>
        <p className="mt-3 text-slate-300">
          Create <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-200">.env.local</code> in
          the project root, add the Firebase Web App values listed below, and restart
          <code className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-amber-200">npm run dev</code>.
        </p>
        <div className="mt-5 rounded-xl bg-slate-950 p-4">
          <p className="mb-2 text-sm font-medium text-slate-300">Missing variables:</p>
          <ul className="space-y-1 font-mono text-sm text-rose-300">
            {missingFirebaseEnvVars.map((name) => <li key={name}>{name}</li>)}
          </ul>
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isFirebaseConfigured ? (
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    ) : <FirebaseSetupRequired />}
  </React.StrictMode>,
)
