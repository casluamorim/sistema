import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/components/pages/LoginPage'
import { DashboardPage } from '@/components/pages/DashboardPage'
import { ClientesPage } from '@/components/pages/ClientesPage'
import { EntregasPage } from '@/components/pages/EntregasPage'
import { FinanceiroPage } from '@/components/pages/FinanceiroPage'
import { CRMPage } from '@/components/pages/CRMPage'
import { TrafegoPage } from '@/components/pages/TrafegoPage'
import { AgendaPage } from '@/components/pages/AgendaPage'
import { CasamentosPage } from '@/components/pages/CasamentosPage'
import { FornecedoresPage, EquipamentosPage } from '@/components/pages/FornecedoresEquipamentosPage'
import { PropostasPage, ConfiguracoesPage, PortalClientePage } from '@/components/pages/OutrasPagesPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="crm" element={<CRMPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="entregas" element={<EntregasPage />} />
        <Route path="trafego" element={<TrafegoPage />} />
        <Route path="financeiro" element={<FinanceiroPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="casamentos" element={<CasamentosPage />} />
        <Route path="fornecedores" element={<FornecedoresPage />} />
        <Route path="equipamentos" element={<EquipamentosPage />} />
        <Route path="propostas" element={<PropostasPage />} />
        <Route path="portal-cliente" element={<PortalClientePage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
