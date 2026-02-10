import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { DollarSign, Users, CreditCard, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Link to={link} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
            <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </Link>
);

const Dashboard = () => {
    const [resumen, setResumen] = useState({ total_prestado: 0, total_por_cobrar: 0, total_vencido: 0 });
    const [prestamosActivos, setPrestamosActivos] = useState([]);
    const [cobranza, setCobranza] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resumenRes, activosRes, cobranzaRes] = await Promise.all([
                    api.get('/prestamos/resumen'),
                    api.get('/prestamos/activos'),
                    api.get('/cuotas/resumen-cobranza')
                ]);
                setResumen(resumenRes.data);
                setPrestamosActivos(activosRes.data);
                setCobranza(cobranzaRes.data);
            } catch (error) {
                console.error('Error al cargar dashboard:', error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Prestado"
                    value={formatMoney(resumen.total_prestado)}
                    icon={DollarSign}
                    color="bg-blue-600"
                    link="/prestamos"
                />
                <StatCard
                    title="Por Cobrar"
                    value={formatMoney(resumen.total_por_cobrar)}
                    icon={TrendingUp}
                    color="bg-green-600"
                    link="/cuotas"
                />
                <StatCard
                    title="Vencido"
                    value={formatMoney(resumen.total_vencido)}
                    icon={AlertTriangle}
                    color="bg-red-600"
                    link="/cuotas"
                />
                <StatCard
                    title="Préstamos Activos"
                    value={prestamosActivos.length}
                    icon={CreditCard}
                    color="bg-purple-600"
                    link="/prestamos"
                />
            </div>

            {/* Próximos cobros */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Próximos Cobros</h3>
                    <Link to="/cuotas" className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                        Ver todos <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    {cobranza.length === 0 ? (
                        <p className="p-6 text-gray-500 text-center">No hay cuotas pendientes</p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {cobranza.slice(0, 10).map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{c.cliente}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{c.promotor}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">#{c.numero_cuota}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{c.fecha_programada}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{formatMoney(c.monto_cuota)}</td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                c.estado === 'VENCIDA'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {c.estado}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;