import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, Users, Handshake, Shield, FolderOpen,
    CreditCard, CalendarCheck, LogOut, Menu, X, DollarSign,
    ClipboardList, UserCog
} from 'lucide-react';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/clientes', label: 'Clientes', icon: Users },
    { path: '/prestamos', label: 'Préstamos', icon: CreditCard },
    { path: '/cuotas', label: 'Cuotas / Cobros', icon: CalendarCheck },
    { path: '/cobranza', label: 'Cobranza Semanal', icon: ClipboardList },
    { path: '/promotores', label: 'Promotores', icon: Handshake },
    { path: '/grupos', label: 'Grupos', icon: FolderOpen },
    { path: '/avales', label: 'Avales', icon: Shield },
];

// Items solo para SUPER_ADMIN
const menuAdmin = [
    { path: '/usuarios', label: 'Usuarios', icon: UserCog },
];

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { usuario, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Combinar menú según rol
    const esSuperAdmin = usuario?.rol === 'SUPER_ADMIN';
    const todosLosMenus = esSuperAdmin ? [...menuItems, ...menuAdmin] : menuItems;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Overlay móvil */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-5 border-b flex items-center gap-3">
                        <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800">Préstamos</h1>
                            <p className="text-xs text-gray-500">Sistema de Gestión</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Menú */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}

                        {/* Sección Admin - solo SUPER_ADMIN */}
                        {esSuperAdmin && (
                            <>
                                <div className="pt-4 pb-2">
                                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Administración
                                    </p>
                                </div>
                                {menuAdmin.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
                                                isActive
                                                    ? 'bg-purple-50 text-purple-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </>
                        )}
                    </nav>

                    {/* Usuario */}
                    <div className="p-4 border-t">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                    {usuario?.nombre?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{usuario?.nombre}</p>
                                <p className="text-xs text-gray-500">
                                    {usuario?.rol === 'SUPER_ADMIN' ? '🔑 Super Admin' :
                                        usuario?.rol === 'ADMINISTRADOR' ? '👤 Administrador' :
                                            usuario?.rol === 'CAJERO' ? '💰 Cajero' :
                                                usuario?.rol === 'CONSULTA' ? '👁 Consulta' :
                                                    usuario?.rol}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {todosLosMenus.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                </header>

                {/* Página */}
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;