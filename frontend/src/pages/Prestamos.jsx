import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Eye, X, Save, CheckCircle, XCircle, Filter } from 'lucide-react';

const initialForm = { id_cliente: '', monto_prestado: '', tasa_interes: '', frecuencia_pago: 'QUINCENAL', numero_cuotas: '', fecha_primer_pago: '', notas: '' };

const estadoColor = {
    SOLICITADO: 'bg-yellow-100 text-yellow-700',
    APROBADO: 'bg-blue-100 text-blue-700',
    ACTIVO: 'bg-green-100 text-green-700',
    LIQUIDADO: 'bg-gray-100 text-gray-600',
    CANCELADO: 'bg-red-100 text-red-700'
};

const Prestamos = () => {
    const [prestamos, setPrestamos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detalleOpen, setDetalleOpen] = useState(null);
    const [cuotasDetalle, setCuotasDetalle] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

    const cargar = async () => {
        try {
            const [pRes, cRes] = await Promise.all([
                api.get('/prestamos'),
                api.get('/clientes')
            ]);
            setPrestamos(pRes.data);
            setClientes(cRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    // Preview de cálculos
    useEffect(() => {
        const { monto_prestado, tasa_interes, numero_cuotas } = form;
        if (monto_prestado && tasa_interes && numero_cuotas) {
            const monto = parseFloat(monto_prestado);
            const tasa = parseFloat(tasa_interes) / 100;
            const intereses = monto * tasa;
            const total = monto + intereses;
            const cuota = total / parseInt(numero_cuotas);
            setPreview({ intereses, total, cuota });
        } else {
            setPreview(null);
        }
    }, [form.monto_prestado, form.tasa_interes, form.numero_cuotas]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/prestamos', {
                ...form,
                monto_prestado: parseFloat(form.monto_prestado),
                tasa_interes: parseFloat(form.tasa_interes),
                numero_cuotas: parseInt(form.numero_cuotas)
            });
            setModalOpen(false); setForm(initialForm); cargar();
        } catch (err) { setError(err.response?.data?.error || 'Error al crear préstamo'); }
    };

    const handleAprobar = async (id) => {
        if (!confirm('¿Aprobar este préstamo? Se generarán las cuotas automáticamente.')) return;
        try {
            await api.put(`/prestamos/${id}/aprobar`);
            cargar();
            if (detalleOpen?.id_prestamo === id) verDetalle(id);
        } catch (err) { alert(err.response?.data?.error || 'Error al aprobar'); }
    };

    const handleCancelar = async (id) => {
        if (!confirm('¿Cancelar este préstamo?')) return;
        try {
            await api.put(`/prestamos/${id}/cancelar`);
            cargar();
            if (detalleOpen?.id_prestamo === id) verDetalle(id);
        } catch (err) { alert(err.response?.data?.error || 'Error al cancelar'); }
    };

    const handleLiquidar = async (id) => {
        if (!confirm('¿Liquidar este préstamo?')) return;
        try {
            await api.put(`/prestamos/${id}/liquidar`);
            cargar();
            if (detalleOpen?.id_prestamo === id) verDetalle(id);
        } catch (err) { alert(err.response?.data?.error || 'Error al liquidar'); }
    };

    const verDetalle = async (id) => {
        try {
            const [pRes, cRes] = await Promise.all([
                api.get(`/prestamos/${id}`),
                api.get(`/cuotas/prestamo/${id}`)
            ]);
            setDetalleOpen(pRes.data);
            setCuotasDetalle(cRes.data);
        } catch (err) { console.error(err); }
    };

    const handlePagarCuota = async (idCuota) => {
        if (!confirm('¿Registrar pago de esta cuota?')) return;
        try {
            await api.put(`/cuotas/${idCuota}/pagar`);
            verDetalle(detalleOpen.id_prestamo);
            cargar();
        } catch (err) { alert(err.response?.data?.error || 'Error al pagar'); }
    };

    const filtrados = prestamos.filter(p => {
        const matchBusqueda = p.Cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || false;
        const matchEstado = !filtroEstado || p.estado === filtroEstado;
        return matchBusqueda && matchEstado;
    });

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-4">
            {/* Barra superior */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Buscar por cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                               className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                    </div>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                        <option value="">Todos</option>
                        <option value="SOLICITADO">Solicitado</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="LIQUIDADO">Liquidado</option>
                        <option value="CANCELADO">Cancelado</option>
                    </select>
                </div>
                <button onClick={() => { setForm(initialForm); setError(''); setModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                    <Plus className="w-5 h-5" /> Nuevo Préstamo
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"># Prést.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuotas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {filtrados.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No se encontraron préstamos</td></tr>
                        ) : filtrados.map((p) => (
                            <tr key={p.id_prestamo} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-800">{p.Cliente?.nombre || '—'}</p>
                                    <p className="text-xs text-gray-500">{p.frecuencia_pago}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">#{p.numero_prestamo}</td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-gray-800">{formatMoney(p.monto_prestado)}</p>
                                    <p className="text-xs text-gray-500">Total: {formatMoney(p.monto_total)}</p>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <span className="text-green-600">{p.cuotas_pagadas}</span> / {p.numero_cuotas}
                                    {p.cuotas_vencidas > 0 && <span className="text-red-600 ml-1">({p.cuotas_vencidas} venc.)</span>}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-800">{formatMoney(p.saldo_pendiente)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColor[p.estado]}`}>{p.estado}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => verDetalle(p.id_prestamo)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Ver detalle"><Eye className="w-4 h-4" /></button>
                                        {p.estado === 'SOLICITADO' && (
                                            <>
                                                <button onClick={() => handleAprobar(p.id_prestamo)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Aprobar"><CheckCircle className="w-4 h-4" /></button>
                                                <button onClick={() => handleCancelar(p.id_prestamo)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Cancelar"><XCircle className="w-4 h-4" /></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Crear */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-gray-800">Nuevo Préstamo</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                                <select value={form.id_cliente} onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required>
                                    <option value="">Seleccionar cliente...</option>
                                    {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto a prestar *</label>
                                    <input type="number" step="0.01" value={form.monto_prestado} onChange={(e) => setForm({ ...form, monto_prestado: e.target.value })}
                                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa de interés (%) *</label>
                                    <input type="number" step="0.01" value={form.tasa_interes} onChange={(e) => setForm({ ...form, tasa_interes: e.target.value })}
                                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia *</label>
                                    <select value={form.frecuencia_pago} onChange={(e) => setForm({ ...form, frecuencia_pago: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                                        <option value="QUINCENAL">Quincenal</option>
                                        <option value="MENSUAL">Mensual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de cuotas *</label>
                                    <input type="number" value={form.numero_cuotas} onChange={(e) => setForm({ ...form, numero_cuotas: e.target.value })}
                                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha primer pago *</label>
                                <input type="date" value={form.fecha_primer_pago} onChange={(e) => setForm({ ...form, fecha_primer_pago: e.target.value })}
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                            </div>

                            {/* Preview de cálculos */}
                            {preview && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
                                    <p className="font-semibold text-blue-800">Resumen del préstamo</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><span className="text-blue-600">Intereses:</span><p className="font-bold">{formatMoney(preview.intereses)}</p></div>
                                        <div><span className="text-blue-600">Total a pagar:</span><p className="font-bold">{formatMoney(preview.total)}</p></div>
                                        <div><span className="text-blue-600">Cuota:</span><p className="font-bold">{formatMoney(preview.cuota)}</p></div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows="2"
                                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancelar</button>
                                <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                                    <Save className="w-4 h-4" /> Crear Préstamo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalle */}
            {detalleOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Préstamo #{detalleOpen.numero_prestamo}</h3>
                                <p className="text-sm text-gray-500">{detalleOpen.Cliente?.nombre}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${estadoColor[detalleOpen.estado]}`}>{detalleOpen.estado}</span>
                                <button onClick={() => { setDetalleOpen(null); setCuotasDetalle([]); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info del préstamo */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-gray-500">Monto prestado</span>
                                    <p className="font-bold text-lg">{formatMoney(detalleOpen.monto_prestado)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-gray-500">Total a pagar</span>
                                    <p className="font-bold text-lg">{formatMoney(detalleOpen.monto_total)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-gray-500">Saldo pendiente</span>
                                    <p className="font-bold text-lg text-orange-600">{formatMoney(detalleOpen.saldo_pendiente)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <span className="text-gray-500">Cuota</span>
                                    <p className="font-bold text-lg">{formatMoney(detalleOpen.monto_cuota)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div><span className="text-gray-500">Tasa:</span> <span className="font-medium">{(detalleOpen.tasa_interes * 100).toFixed(0)}%</span></div>
                                <div><span className="text-gray-500">Frecuencia:</span> <span className="font-medium">{detalleOpen.frecuencia_pago}</span></div>
                                <div><span className="text-gray-500">Cuotas:</span> <span className="font-medium text-green-600">{detalleOpen.cuotas_pagadas}</span>/{detalleOpen.numero_cuotas}</div>
                                <div><span className="text-gray-500">Vencidas:</span> <span className={`font-medium ${detalleOpen.cuotas_vencidas > 0 ? 'text-red-600' : 'text-gray-600'}`}>{detalleOpen.cuotas_vencidas}</span></div>
                            </div>

                            {/* Acciones */}
                            {detalleOpen.estado === 'SOLICITADO' && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleAprobar(detalleOpen.id_prestamo)} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition font-medium">
                                        <CheckCircle className="w-4 h-4" /> Aprobar y Generar Cuotas
                                    </button>
                                    <button onClick={() => handleCancelar(detalleOpen.id_prestamo)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition font-medium">
                                        <XCircle className="w-4 h-4" /> Cancelar
                                    </button>
                                </div>
                            )}

                            {detalleOpen.estado === 'ACTIVO' && (
                                <button onClick={() => handleLiquidar(detalleOpen.id_prestamo)} className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition font-medium">
                                    Liquidar Préstamo
                                </button>
                            )}

                            {/* Tabla de cuotas */}
                            {cuotasDetalle.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">Cuotas ({cuotasDetalle.length})</h4>
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Monto</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha Pago</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Acción</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                            {cuotasDetalle.map((c) => (
                                                <tr key={c.id_cuota} className={`${c.estado === 'PAGADA' ? 'bg-green-50/50' : c.estado === 'VENCIDA' ? 'bg-red-50/50' : ''}`}>
                                                    <td className="px-4 py-2 font-medium">{c.numero_cuota}</td>
                                                    <td className="px-4 py-2">{c.fecha_programada}</td>
                                                    <td className="px-4 py-2 font-medium">{formatMoney(c.monto_cuota)}</td>
                                                    <td className="px-4 py-2">
                                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                                c.estado === 'PAGADA' ? 'bg-green-100 text-green-700' :
                                                                    c.estado === 'VENCIDA' ? 'bg-red-100 text-red-700' :
                                                                        'bg-yellow-100 text-yellow-700'
                                                            }`}>{c.estado}</span>
                                                        {c.dias_atraso > 0 && c.estado === 'VENCIDA' && <span className="text-xs text-red-500 ml-1">({c.dias_atraso}d)</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-500">{c.fecha_pago || '—'}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        {(c.estado === 'PENDIENTE' || c.estado === 'VENCIDA') && detalleOpen.estado === 'ACTIVO' && (
                                                            <button onClick={() => handlePagarCuota(c.id_cuota)}
                                                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition">
                                                                Pagar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Prestamos;