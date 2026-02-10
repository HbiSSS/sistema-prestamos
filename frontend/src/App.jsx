import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Promotores from './pages/Promotores';
import Avales from './pages/Avales';
import Grupos from './pages/Grupos';
import Clientes from './pages/Clientes';
import Prestamos from './pages/Prestamos';
import Cuotas from './pages/Cuotas';
import Cobranza from './pages/Cobranza';

// Ruta protegida
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

// Placeholder para páginas que aún no creamos
const Placeholder = ({ title }) => (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-500">Página en construcción...</p>
    </div>
);

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />

            <Route path="/" element={
                <ProtectedRoute><Layout /></ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="prestamos" element={<Prestamos />} />
                <Route path="cuotas" element={<Cuotas />} />
                <Route path="promotores" element={<Promotores />} />
                <Route path="grupos" element={<Grupos />} />
                <Route path="avales" element={<Avales />} />
                <Route path="cobranza" element={<Cobranza />} />
            </Route>
        </Routes>
    );
};

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    </BrowserRouter>
);

export default App;