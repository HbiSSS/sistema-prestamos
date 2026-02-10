import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit, Trash2, X, Save, Eye } from 'lucide-react';

const initialForm = { nombre: '', direccion: '', telefono: '', telefono_secundario: '', id_promotor: '', id_grupo: '', id_aval: '', notas: '' };

const Clientes = () => {
    const [clientes, setClientes] = useState([]);
    const [promotores, setPromotores] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [avales, setAvales] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detalleOpen, setDetalleOpen] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [editando, setEditando] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = async () => {
        try {
            const [cRes, pRes, gRes, aRes] = await Promise.all([
                api.get('/clientes/todos'),
                api.get('/promotores'),
                api.get('/grupos'),
                api.get('/avales')
            ]);
            setClientes(cRes.data);
            setPromotores(pRes.data);
            setGrupos(gRes.data);
            setAvales(aRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const payload = {
            ...form,
            id_promotor: form.id_promotor || null,
            id_grupo: form.id_grupo || null,
            id_aval: form.id_aval || null
        };
        try {
            if (editando) await api.put(`/clientes/${editando}`, payload);
            else await api.post('/clientes', payload);
            setModalOpen(false); setForm(initialForm); setEditando(null); cargar();
        } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    };

    const handleEditar = (c) => {
        setForm({
            nombre: c.nombre, direccion: c.direccion || '', telefono: c.telefono || '',
            telefono_secundario: c.telefono_secundario || '', id_promotor: c.id_promotor || '',
            id_grupo: c.id_grupo || '', id_aval: c.id_aval || '', notas: c.notas || ''
        });
        setEditando(c.id_cliente); setModalOpen(true);
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Desactivar este cliente?')) return;
        try { await api.delete(`/clientes/${id}`); cargar(); }
        catch (err) { alert(err.response?.data?.error || 'Error'); }
    };

    const filtrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.telefono && c.telefono.includes(busqueda))
    );

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Buscar por nombre o teléfono..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <button onClick={() => { setForm(initialForm); setEditando(null); setError(''); setModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                    <Plus className="w-5 h-5" /> Nuevo Cliente
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {filtrados.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No se encontraron clientes</td></tr>
                        ) : filtrados.map((c) => (
                            <tr key={c.id_cliente} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <span className="text-indigo-600 font-semibold text-sm">{c.nombre.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{c.nombre}</p>
                                            <p className="text-xs text-gray-500">{c.direccion || ''}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{c.telefono || '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{c.Promotor?.nombre || '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{c.Grupo?.nombre || '—'}</td>
                                <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {c.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => setDetalleOpen(c)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => handleEditar(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                        {c.activo && <button onClick={() => handleEliminar(c.id_cliente)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detalle */}
            {detalleOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Detalle del Cliente</h3>
                            <button onClick={() => setDetalleOpen(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div><span className="text-gray-500">Nombre:</span><p className="font-medium">{detalleOpen.nombre}</p></div>
                                <div><span className="text-gray-500">Teléfono:</span><p className="font-medium">{detalleOpen.telefono || '—'}</p></div>
                                <div><span className="text-gray-500">Tel. Secundario:</span><p className="font-medium">{detalleOpen.telefono_secundario || '—'}</p></div>
                                <div><span className="text-gray-500">Dirección:</span><p className="font-medium">{detalleOpen.direccion || '—'}</p></div>
                                <div><span className="text-gray-500">Promotor:</span><p className="font-medium">{detalleOpen.Promotor?.nombre || '—'}</p></div>
                                <div><span className="text-gray-500">Grupo:</span><p className="font-medium">{detalleOpen.Grupo?.nombre || '—'}</p></div>
                                <div><span className="text-gray-500">Aval:</span><p className="font-medium">{detalleOpen.Aval?.nombre || '—'}</p></div>
                                <div><span className="text-gray-500">Estado:</span><p className="font-medium">{detalleOpen.activo ? 'Activo' : 'Inactivo'}</p></div>
                            </div>
                            {detalleOpen.notas && <div><span className="text-gray-500">Notas:</span><p className="font-medium">{detalleOpen.notas}</p></div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Crear/Editar */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-gray-800">{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tel. Secundario</label>
                                    <input type="text" value={form.telefono_secundario} onChange={(e) => setForm({ ...form, telefono_secundario: e.target.value })}
                                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input type="text" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Promotor *</label>
                                    <select value={form.id_promotor} onChange={(e) => setForm({ ...form, id_promotor: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required>
                                        <option value="">Seleccionar...</option>
                                        {promotores.map(p => <option key={p.id_promotor} value={p.id_promotor}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                                    <select value={form.id_grupo} onChange={(e) => setForm({ ...form, id_grupo: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                                        <option value="">Sin grupo</option>
                                        {grupos.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aval</label>
                                <select value={form.id_aval} onChange={(e) => setForm({ ...form, id_aval: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                                    <option value="">Sin aval</option>
                                    {avales.map(a => <option key={a.id_aval} value={a.id_aval}>{a.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows="2"
                                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">Cancelar</button>
                                <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                                    <Save className="w-4 h-4" /> {editando ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clientes;