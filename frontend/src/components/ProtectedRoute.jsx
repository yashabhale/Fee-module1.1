import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const isAuthenticated = localStorage.getItem('fees_auth') === 'true' || sessionStorage.getItem('fees_auth') === 'true'

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
