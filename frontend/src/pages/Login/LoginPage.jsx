import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authClient } from "../../services/authentication"
import { updateHomeLocation } from "../../services/userProfile"
import LocationSearch from "../../components/LocationSearch"

const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors"

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [homeCity, setHomeCity] = useState(null)
  const [error, setError] = useState(null)
  const [toggle, setToggle] = useState(false)
  const navigate = useNavigate()

  const resetFields = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setHomeCity(null)
    setError(null)
  }

  const handleLogInSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const { error } = await authClient.signIn.email({
      email,
      password
    })
    if (error) {
      setError(error.message)
      return
    }
    navigate('/feed')
  }

  const handleSignUpSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    const name = `${firstName} ${lastName}`.trim()
    const { error } = await authClient.signUp.email({
      email,
      password,
      name
    })
    if (error) {
      setError(error.message)
      return
    }
    
    // Home city is optional at signup and doesn't block navigation
    if (homeCity) {
      try {
        await updateHomeLocation({ city: homeCity.city, lat: homeCity.lat, long: homeCity.lng })
      } catch (err) {
        console.error(err)
      }
    }
    navigate('/feed')
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-lg p-8">
        <Link to="/" className="font-heading text-2xl tracking-tight text-primary">
          En<span className="text-secondary">Core</span>
        </Link>

        {!toggle ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back</p>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <form onSubmit={handleLogInSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
              <div className="-mt-1 flex justify-end">
                <Link to="/forgot-password" className="text-xs font-medium text-secondary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Log in
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to EnCore?{" "}
              <button
                type="button"
                data-testid="toggle-auth"
                onClick={() => {
                  setToggle(true)
                  resetFields()
                }}
                className="font-medium text-secondary hover:underline"
              >
                Sign up
              </button>
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Create your free account</p>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <form onSubmit={handleSignUpSubmit} className="mt-6 flex flex-col gap-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
              />
              <div>
                <LocationSearch
                  placeholder="Search for your home city..."
                  onCitySelect={({ city, lat, lng }) => setHomeCity({ city, lat, lng })}
                />
                {homeCity && (
                  <p className="mt-1 text-xs text-muted-foreground">Home city: {homeCity.city}</p>
                )}
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                data-testid="toggle-auth"
                onClick={() => {
                  setToggle(false)
                  resetFields()
                }}
                className="font-medium text-secondary hover:underline"
              >
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}