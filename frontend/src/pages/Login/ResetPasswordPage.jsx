import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authClient } from "../../services/authentication"

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError("This reset link is invalid or has expired. Please request a new one.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token
    })
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-lg p-8">
        <Link to="/" className="font-heading text-2xl tracking-tight text-primary">
          En<span className="text-secondary">Core</span>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new password</p>
 
        {success ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Your password has been updated. Redirecting you to log in&hellip;
          </p>
        ) : (
          <>
            {!token && (
              <p className="mt-4 text-sm text-destructive">
                This reset link is invalid or has expired.{" "}
                <Link to="/forgot-password" className="font-medium underline">
                  Request a new one
                </Link>
                .
              </p>
            )}
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
 
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
              />
              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Reset password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}