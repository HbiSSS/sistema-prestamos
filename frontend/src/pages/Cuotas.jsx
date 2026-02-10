import { useState, useEffect } from 'react';
import api from '../services/api';
import { RefreshCw, AlertTriangle, CalendarCheck, ClipboardList, Printer } from 'lucide-react';
import { printReport, fmtMoney, badgeClass } from '../utils/printReport';

const Cuotas = () => {
    const [tab, setTab] = useState('cobranza');
    const [cobranza, setCobranza] = useState([]);
    const [vencidas, setVencidas] = useState([]);
    const [cartera, setCartera] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatMoney = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

    const cargar = async () => {
        setLoading(true);
        try {
            const [cobRes, vencRes, cartRes] = await Promise.all([
                api.get('/cuotas/resumen-cobranza'),
                api.get('/cuotas/vencidas'),
                api.get('/cuotas/cartera-vencida')
            ]);
            setCobranza(cobRes.data);
            setVencidas(vencRes.data);
            setCartera(cartRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const actualizarVencidas = async () => {
        try {
            const { data } = await api.put('/cuotas/actualizar-vencidas');
            alert(`Cuotas marcadas como vencidas: ${data.cuotas_marcadas}\nPréstamos actualizados: ${data.prestamos_actualizados}`);
            cargar();
        } catch (err) { alert('Error al actualizar'); }
    };

    const handlePagar = async (idCuota) => {
        if (!confirm('¿Registrar pago de esta cuota?')) return;
        try {
            await api.put(`/cuotas/${idCuota}/pagar`);
            cargar();
        } catch (err) { alert(err.response?.data?.error || 'Error al pagar'); }
    };

    // ========== FUNCIONES DE IMPRESIÓN ==========

    const imprimirCobranza = () => {
        const filas = cobranza.map(c => `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.promotor}</td>
                <td>${c.grupo}</td>
                <td class="text-center">#${c.numero_cuota}</td>
                <td>${c.fecha_programada}</td>
                <td class="text-right">${formatMoney(c.monto_cuota)}</td>
                <td class="text-center"><span class="badge ${badgeClass(c.estado)}">${c.estado}</span></td>
                <td class="text-center">${c.dias_atraso > 0 ? c.dias_atraso + ' días' : '—'}</td>
            </tr>
        `).join('');

        const totalMonto = cobranza.reduce((s, c) => s + (parseFloat(c.monto_cuota) || 0), 0);
        const totalVenc = cobranza.filter(c => c.estado === 'VENCIDA').length;
        const totalPend = cobranza.filter(c => c.estado === 'PENDIENTE').length;

        printReport('Resumen de Cobranza', `
            <div class="header">
                <h1>Resumen de Cobranza</h1>
                <p>Próxima cuota de cada préstamo activo</p>
            </div>
            <div class="resumen">
                <div class="resumen-item"><div class="label">Total</div><div class="valor">${cobranza.length} cuotas</div></div>
                <div class="resumen-item"><div class="label">Pendientes</div><div class="valor amarillo">${totalPend}</div></div>
                <div class="resumen-item"><div class="label">Vencidas</div><div class="valor rojo">${totalVenc}</div></div>
                <div class="resumen-item"><div class="label">Monto Total</div><div class="valor">${formatMoney(totalMonto)}</div></div>
            </div>
            <table>
                <thead>
                    <tr><th>Cliente</th><th>Promotor</th><th>Grupo</th><th class="text-center">Cuota</th><th>Fecha</th><th class="text-right">Monto</th><th class="text-center">Estado</th><th class="text-center">Atraso</th></tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr class="totales"><td colspan="5">Total: ${cobranza.length} cuotas</td><td class="text-right">${formatMoney(totalMonto)}</td><td colspan="2"></td></tr>
                </tfoot>
            </table>
        `);
    };

    const imprimirVencidas = () => {
        const filas = vencidas.map(c => `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.telefono || ''}</td>
                <td>${c.promotor}</td>
                <td class="text-center">#${c.numero_cuota}</td>
                <td class="text-right">${formatMoney(c.monto_cuota)}</td>
                <td>${c.fecha_programada}</td>
                <td class="text-center rojo"><strong>${c.dias_atraso} días</strong></td>
            </tr>
        `).join('');

        const totalMonto = vencidas.reduce((s, c) => s + (parseFloat(c.monto_cuota) || 0), 0);

        printReport('Cuotas Vencidas', `
            <div class="header">
                <h1>Cuotas Vencidas</h1>
                <p>Todas las cuotas con estado VENCIDA</p>
            </div>
            <div class="resumen">
                <div class="resumen-item"><div class="label">Total Cuotas</div><div class="valor rojo">${vencidas.length}</div></div>
                <div class="resumen-item"><div class="label">Monto Total</div><div class="valor rojo">${formatMoney(totalMonto)}</div></div>
            </div>
            <table>
                <thead>
                    <tr><th>Cliente</th><th>Teléfono</th><th>Promotor</th><th class="text-center">Cuota</th><th class="text-right">Monto</th><th>Fecha</th><th class="text-center">Días Atraso</th></tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr class="totales"><td colspan="4">Total: ${vencidas.length} cuotas</td><td class="text-right">${formatMoney(totalMonto)}</td><td colspan="2"></td></tr>
                </tfoot>
            </table>
        `);
    };

    const imprimirCartera = () => {
        const filas = cartera.map(c => `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.telefono || ''}</td>
                <td>${c.promotor}</td>
                <td>${c.grupo}</td>
                <td class="text-center">#${c.numero_prestamo}</td>
                <td class="text-center rojo"><strong>${c.cuotas_vencidas}</strong></td>
                <td class="text-right rojo"><strong>${formatMoney(c.monto_vencido)}</strong></td>
                <td class="text-center rojo"><strong>${c.dias_atraso} días</strong></td>
            </tr>
        `).join('');

        const totalMonto = cartera.reduce((s, c) => s + (parseFloat(c.monto_vencido) || 0), 0);
        const totalCuotas = cartera.reduce((s, c) => s + (parseInt(c.cuotas_vencidas) || 0), 0);

        printReport('Cartera Vencida', `
            <div class="header">
                <h1>Cartera Vencida</h1>
                <p>Resumen por préstamo</p>
            </div>
            <div class="resumen">
                <div class="resumen-item"><div class="label">Préstamos</div><div class="valor rojo">${cartera.length}</div></div>
                <div class="resumen-item"><div class="label">Cuotas Vencidas</div><div class="valor rojo">${totalCuotas}</div></div>
                <div class="resumen-item"><div class="label">Monto Vencido</div><div class="valor rojo">${formatMoney(totalMonto)}</div></div>
            </div>
            <table>
                <thead>
                    <tr><th>Cliente</th><th>Teléfono</th><th>Promotor</th><th>Grupo</th><th class="text-center"># Prést.</th><th class="text-center">Cuotas Venc.</th><th class="text-right">Monto Venc.</th><th class="text-center">Días Atraso</th></tr>
                </thead>
                <tbody>${filas}</tbody>
                <tfoot>
                    <tr class="totales"><td colspan="5">Total: ${cartera.length} préstamos</td><td class="text-center">${totalCuotas}</td><td class="text-right">${formatMoney(totalMonto)}</td><td></td></tr>
                </tfoot>
            </table>
        `);
    };

    const handleImprimir = () => {
        if (tab === 'cobranza') imprimirCobranza();
        else if (tab === 'vencidas') imprimirVencidas();
        else imprimirCartera();
    };

    const currentData = tab === 'cobranza' ? cobranza : tab === 'vencidas' ? vencidas : cartera;

    // ========== FIN FUNCIONES DE IMPRESIÓN ==========

    const tabs = [
        { id: 'cobranza', label: 'Resumen Cobranza', icon: ClipboardList, count: cobranza.length },
        { id: 'vencidas', label: 'Cuotas Vencidas', icon: AlertTriangle, count: vencidas.length },
        { id: 'cartera', label: 'Cartera Vencida', icon: CalendarCheck, count: cartera.length },
    ];

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-4">
            {/* Acciones y Tabs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex gap-1 bg-white rounded-lg shadow-sm p-1">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <t.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.label}</span>
                            {t.count > 0 && <span className={`px-1.5 py-0.5 text-xs rounded-full ${tab === t.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{t.count}</span>}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={handleImprimir} disabled={currentData.length === 0}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                        <Printer className="w-4 h-4" /> Imprimir PDF
                    </button>
                    <button onClick={actualizarVencidas} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-700 transition font-medium">
                        <RefreshCw className="w-4 h-4" /> Actualizar Vencidas
                    </button>
                </div>
            </div>

            {/* Tab: Resumen Cobranza */}
            {tab === 'cobranza' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b"><h3 className="font-semibold text-gray-800">Próxima cuota de cada préstamo activo</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atraso</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {cobranza.length === 0 ? (
                                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No hay cuotas pendientes</td></tr>
                            ) : cobranza.map((c, i) => (
                                <tr key={i} className={`hover:bg-gray-50 ${c.estado === 'VENCIDA' ? 'bg-red-50/50' : ''}`}>
                                    <td className="px-4 py-3 font-medium text-gray-800">{c.cliente}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.promotor}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.grupo}</td>
                                    <td className="px-4 py-3">#{c.numero_cuota}</td>
                                    <td className="px-4 py-3">{c.fecha_programada}</td>
                                    <td className="px-4 py-3 font-medium">{formatMoney(c.monto_cuota)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c.estado === 'VENCIDA' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.estado}</span>
                                    </td>
                                    <td className="px-4 py-3">{c.dias_atraso > 0 ? <span className="text-red-600 font-medium">{c.dias_atraso} días</span> : '—'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Cuotas Vencidas */}
            {tab === 'vencidas' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b"><h3 className="font-semibold text-gray-800">Todas las cuotas vencidas</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días atraso</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {vencidas.length === 0 ? (
                                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No hay cuotas vencidas 🎉</td></tr>
                            ) : vencidas.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50 bg-red-50/30">
                                    <td className="px-4 py-3 font-medium text-gray-800">{c.cliente}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.promotor}</td>
                                    <td className="px-4 py-3">#{c.numero_cuota}</td>
                                    <td className="px-4 py-3 font-medium">{formatMoney(c.monto_cuota)}</td>
                                    <td className="px-4 py-3">{c.fecha_programada}</td>
                                    <td className="px-4 py-3"><span className="text-red-600 font-bold">{c.dias_atraso} días</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab: Cartera Vencida */}
            {tab === 'cartera' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b"><h3 className="font-semibold text-gray-800">Resumen de cartera vencida por préstamo</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"># Prést.</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuotas Venc.</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Venc.</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días atraso</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {cartera.length === 0 ? (
                                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No hay cartera vencida 🎉</td></tr>
                            ) : cartera.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-800">{c.cliente}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.promotor}</td>
                                    <td className="px-4 py-3 text-gray-600">{c.grupo}</td>
                                    <td className="px-4 py-3">#{c.numero_prestamo}</td>
                                    <td className="px-4 py-3"><span className="text-red-600 font-bold">{c.cuotas_vencidas}</span></td>
                                    <td className="px-4 py-3 font-medium text-red-600">{formatMoney(c.monto_vencido)}</td>
                                    <td className="px-4 py-3"><span className="text-red-600 font-bold">{c.dias_atraso} días</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cuotas;