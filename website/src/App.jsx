import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Copilot from './pages/Copilot'
import Documents from './pages/Documents'
import History from './pages/History'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="copilot" element={<Copilot />} />
        <Route path="documents" element={<Documents />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  )
}

export default App
