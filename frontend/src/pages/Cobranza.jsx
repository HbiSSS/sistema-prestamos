import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ClipboardList, Search, Calendar, Filter, ChevronLeft, ChevronRight,
    CheckCircle, Clock, AlertTriangle, DollarSign, Phone, Users, Printer
} from 'lucide-react';
import { printReport, fmtMoney, badgeClass } from '../utils/printReport';

const formatMoney = (v) => {
    const n = parseFloat(v) || 0;
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
};

const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const getLunes = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d;
};

const toISO = (d) => d.toISOString().split('T')[0];

const estadoBadge = (estado) => {
    const map = {
        PAGADA: { bg: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Pagada' },
        PENDIENTE: { bg: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pendiente' },
        VENCIDA: { bg: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Vencida' }
    };
    const cfg = map[estado] || map.PENDIENTE;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg}`}>
            <Icon className="w-3 h-3" /> {cfg.label}
        </span>
    );
};

const Cobranza = () => {
    const [cuotas, setCuotas] = useState([]);
    const [resumen, setResumen] = useState({});
    const [promotores, setPromotores] = useState([]);
    const [idPromotor, setIdPromotor] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [loading, setLoading] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    // Inicializar con semana actual
    useEffect(() => {
        const lunes = getLunes(new Date());
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        setFechaInicio(toISO(lunes));
        setFechaFin(toISO(domingo));
        cargarPromotores();
    }, []);

    // Cargar reporte cuando cambian filtros
    useEffect(() => {
        if (fechaInicio && fechaFin) cargarReporte();
    }, [fechaInicio, fechaFin, idPromotor]);

    const cargarPromotores = async () => {
        try {
            const { data } = await api.get('/promotores');
            setPromotores(data);
        } catch (e) {
            console.error('Error al cargar promotores:', e);
        }
    };

    const cargarReporte = async () => {
        setLoading(true);
        try {
            const params = { fechaInicio, fechaFin };
            if (idPromotor) params.idPromotor = idPromotor;
            const { data } = await api.get('/cuotas/reporte-semanal', { params });
            setCuotas(data.cuotas || []);
            setResumen(data.resumen || {});
        } catch (e) {
            console.error('Error al cargar reporte:', e);
        } finally {
            setLoading(false);
        }
    };

    const cambiarSemana = (dir) => {
        const d = new Date(fechaInicio);
        d.setDate(d.getDate() + (dir * 7));
        const lunes = getLunes(d);
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        setFechaInicio(toISO(lunes));
        setFechaFin(toISO(domingo));
    };

    const irSemanaActual = () => {
        const lunes = getLunes(new Date());
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        setFechaInicio(toISO(lunes));
        setFechaFin(toISO(domingo));
    };

    const cuotasFiltradas = cuotas.filter(c =>
        !busqueda ||
        c.cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.promotor?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.grupo?.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Agrupar por día
    const cuotasPorDia = cuotasFiltradas.reduce((acc, c) => {
        const dia = c.fecha_programada;
        if (!acc[dia]) acc[dia] = [];
        acc[dia].push(c);
        return acc;
    }, {});

    const diasOrdenados = Object.keys(cuotasPorDia).sort();

    const imprimirReporte = () => {
        const promotorNombre = idPromotor
            ? promotores.find(p => p.id_promotor == idPromotor)?.nombre || 'Promotor'
            : 'Todos los Promotores';

        const filas = diasOrdenados.map(dia =>
            cuotasPorDia[dia].map((c, i) => `
                <tr>
                    <td>${i === 0 ? `<strong>${formatDate(dia)}</strong>` : ''}</td>
                    <td>${c.cliente}</td>
                    <td>${c.promotor}</td>
                    <td>${c.grupo}</td>
                    <td class="text-center">#${c.numero_cuota}</td>
                    <td class="text-right">${formatMoney(c.monto_cuota)}</td>
                    <td class="text-center"><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></td>
                    <td>${c.telefono || ''}</td>
                </tr>
            `).join('')
        ).join('');

        const html = `
            <div class="header">
                <h1>Cobranza Semanal</h1>
                <p>${promotorNombre} — ${formatDate(fechaInicio)} al ${formatDate(fechaFin)}</p>
            </div>
            <div class="resumen">
                <div class="resumen-item"><div class="label">Total Cuotas</div><div class="valor">${resumen.total_cuotas || 0}</div></div>
                <div class="resumen-item"><div class="label">Cobrado</div><div class="valor verde">${formatMoney(resumen.monto_cobrado)}</div></div>
                <div class="resumen-item"><div class="label">Pendiente</div><div class="valor amarillo">${formatMoney(resumen.monto_pendiente)}</div></div>
                <div class="resumen-item"><div class="label">Vencidas</div><div class="valor rojo">${resumen.cuotas_vencidas || 0}</div></div>
            </div>
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Cliente</th><th>Promotor</th><th>Grupo</th><th class="text-center">Cuota</th><th class="text-right">Monto</th><th class="text-center">Estado</th><th>Teléfono</th></tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr class="totales">
                        <td colspan="5">Total: ${cuotasFiltradas.length} cuotas</td>
                        <td class="text-right">${formatMoney(resumen.monto_total)}</td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
            </table>`;

        printReport('Cobranza Semanal', html);
    };

    const porcentajeCobrado = resumen.total_cuotas
        ? Math.round((resumen.cuotas_pagadas / resumen.total_cuotas) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                    {/* Navegación de semana */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semana</label>
                        <div className="flex items-center gap-1">
                            <button onClick={() => cambiarSemana(-1)}
                                    className="p-2 rounded-lg border hover:bg-gray-50 transition">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border min-w-0">
                                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {fechaInicio} al {fechaFin}
                                </span>
                            </div>
                            <button onClick={() => cambiarSemana(1)}
                                    className="p-2 rounded-lg border hover:bg-gray-50 transition">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={irSemanaActual}
                                    className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition whitespace-nowrap">
                                Hoy
                            </button>
                        </div>
                    </div>

                    {/* Filtro promotor */}
                    <div className="w-full lg:w-56">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Promotor</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select value={idPromotor} onChange={e => setIdPromotor(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Todos</option>
                                {promotores.map(p => (
                                    <option key={p.id_promotor} value={p.id_promotor}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Búsqueda */}
                    <div className="w-full lg:w-64">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Cliente, promotor, grupo..."
                                   value={busqueda} onChange={e => setBusqueda(e.target.value)}
                                   className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Botón imprimir */}
                    <div className="flex items-end">
                        <button onClick={imprimirReporte} disabled={cuotasFiltradas.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                            <Printer className="w-4 h-4" /> Imprimir PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg"><ClipboardList className="w-5 h-5 text-blue-600" /></div>
                        <p className="text-sm text-gray-500">Total Cuotas</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{resumen.total_cuotas || 0}</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${porcentajeCobrado}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{porcentajeCobrado}% cobrado</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
                        <p className="text-sm text-gray-500">Cobrado</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatMoney(resumen.monto_cobrado)}</p>
                    <p className="text-xs text-gray-500 mt-1">{resumen.cuotas_pagadas || 0} cuotas pagadas</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
                        <p className="text-sm text-gray-500">Pendiente</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{formatMoney(resumen.monto_pendiente)}</p>
                    <p className="text-xs text-gray-500 mt-1">{resumen.cuotas_pendientes || 0} cuotas por cobrar</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                        <p className="text-sm text-gray-500">Vencidas</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{resumen.cuotas_vencidas || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {formatMoney(resumen.monto_total ? resumen.monto_total - resumen.monto_cobrado - (resumen.monto_pendiente - (resumen.monto_total - resumen.monto_cobrado - 0)) : 0)} en mora
                    </p>
                </div>
            </div>

            {/* Tabla agrupada por día */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                        Cargando reporte...
                    </div>
                ) : cuotasFiltradas.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No hay cuotas para esta semana</p>
                        <p className="text-sm mt-1">Prueba seleccionando otra semana o promotor</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Cliente</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Promotor</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Grupo</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Cuota #</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Monto</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-center">Estado</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                            </tr>
                            </thead>
                            <tbody>
                            {diasOrdenados.map(dia => (
                                cuotasPorDia[dia].map((c, i) => (
                                    <tr key={`${dia}-${i}`} className="border-t hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                            {i === 0 ? (
                                                <span className="font-semibold text-gray-800">
                                                        {formatDate(dia)}
                                                    </span>
                                            ) : ''}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{c.cliente}</td>
                                        <td className="px-4 py-3 text-gray-600">{c.promotor}</td>
                                        <td className="px-4 py-3 text-gray-600">{c.grupo}</td>
                                        <td className="px-4 py-3 text-center">
                                                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                                                    #{c.numero_cuota}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">{formatMoney(c.monto_cuota)}</td>
                                        <td className="px-4 py-3 text-center">{estadoBadge(c.estado)}</td>
                                        <td className="px-4 py-3">
                                            {c.telefono && (
                                                <a href={`tel:${c.telefono}`}
                                                   className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
                                                    <Phone className="w-3 h-3" /> {c.telefono}
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ))}
                            </tbody>
                        </table>

                        {/* Totales al pie */}
                        <div className="border-t bg-gray-50 px-4 py-3 flex flex-wrap gap-6 text-sm">
                            <span className="text-gray-500">
                                Total: <strong className="text-gray-800">{formatMoney(resumen.monto_total)}</strong>
                            </span>
                            <span className="text-gray-500">
                                Cobrado: <strong className="text-green-600">{formatMoney(resumen.monto_cobrado)}</strong>
                            </span>
                            <span className="text-gray-500">
                                Pendiente: <strong className="text-yellow-600">{formatMoney(resumen.monto_pendiente)}</strong>
                            </span>
                            <span className="text-gray-500 ml-auto">
                                {cuotasFiltradas.length} cuotas
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cobranza;