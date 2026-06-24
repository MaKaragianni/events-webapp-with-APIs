// frontend/src/components/ProtectedRoute.jsx
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authClient } from "../services/authentication"

const ProtectedRoute = ({ children }) => {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/login")
    }
  }, [session, isPending])

  if (isPending) return <p>Loading...</p>
  if (!session) return null

  return children
}

export default ProtectedRoute