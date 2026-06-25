import { useEffect } from "react"
// just added "Navigate" below as it's used but not imported - zein
import { useNavigate, Navigate } from "react-router-dom"
import { authClient } from "../services/authentication"

const ProtectedRoute = ({ children, fallback = null }) => {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  if (isPending) return fallback; 
  if (!session) return <Navigate to="/login" replace />;
  return children
}

export default ProtectedRoute