import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authClient } from "../../services/authentication"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [devResetLink, setDevResetLink] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)

    // NOTE: DEV ONLY: no real email provider is wired up, so pull the reset
    // link from the backend's dev store in folder lib and show it in a pop-up
    // instead of making the user dig through server logs. Safe to delete
    // this block (and the /dev/reset-link route) once real emails are sent.
    try {
      const res = await fetch(`${BACKEND_URL}/dev/reset-link`)
      if (res.ok) {
        const data = await res.json()
        if (data.url) setDevResetLink(data.url)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopy = async () => {
    if (!devResetLink) return
    try {
      await navigator.clipboard.writeText(devResetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-lg p-8">
        <Link to="/" className="font-heading text-2xl tracking-tight text-primary">
          En<span className="text-secondary">Core</span>
        </Link>
 
        {sent ? (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-medium text-secondary hover:underline">
              &larr; Back to log in
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Reset your password</p>
 
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
 
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Send reset link
              </button>
            </form>
 
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link to="/login" className="font-medium text-secondary hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
 
      {/* DEV ONLY popup — shows the reset link so it can be copy-pasted while
          no real email provider is configured. Remove once emails work. */}
      {devResetLink && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-label="Development reset link"
        >
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <p className="text-sm font-semibold text-primary">Dev mode: reset link</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No email provider is configured yet, so here&apos;s the link that would have been emailed.
            </p>
            <div className="mt-4 break-all rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground">
              {devResetLink}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={() => setDevResetLink(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}