import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit, Trash2, X, Save } from 'lucide-react';

const initialForm = { nombre: '', descripcion: '', id_promotor: '' };

const Grupos = () => {
    const [grupos, setGrupos] = useState([]);
    const [promotores, setPromotores] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [editando, setEditando] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargar = async () => {
        try {
            const [gRes, pRes] = await Promise.all([
                api.get('/grupos/todos'),
                api.get('/promotores')
            ]);
            setGrupos(gRes.data);
            setPromotores(pRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const payload = { ...form, id_promotor: form.id_promotor || null };
        try {
            if (editando) await api.put(`/grupos/${editando}`, payload);
            else await api.post('/grupos', payload);
            setModalOpen(false); setForm(initialForm); setEditando(null); cargar();
        } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    };

    const handleEditar = (g) => {
        setForm({ nombre: g.nombre, descripcion: g.descripcion || '', id_promotor: g.id_promotor || '' });
        setEditando(g.id_grupo); setModalOpen(true);
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Desactivar este grupo?')) return;
        try { await api.delete(`/grupos/${id}`); cargar(); }
        catch (err) { alert(err.response?.data?.error || 'Error'); }
    };

    const filtrados = grupos.filter(g =>
        g.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Buscar grupo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                </div>
                <button onClick={() => { setForm(initialForm); setEditando(null); setError(''); setModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                    <Plus className="w-5 h-5" /> Nuevo Grupo
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {filtrados.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No se encontraron grupos</td></tr>
                        ) : filtrados.map((g) => (
                            <tr key={g.id_grupo} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 font-semibold text-sm">{g.nombre.charAt(0)}</span>
                                        </div>
                                        <span className="font-medium text-gray-800">{g.nombre}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{g.descripcion || '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{g.Promotor?.nombre || 'Sin promotor'}</td>
                                <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${g.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {g.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleEditar(g)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                                        {g.activo && <button onClick={() => handleEliminar(g.id_grupo)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">{editando ? 'Editar Grupo' : 'Nuevo Grupo'}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Promotor</label>
                                <select value={form.id_promotor} onChange={(e) => setForm({ ...form, id_promotor: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                                    <option value="">Sin promotor</option>
                                    {promotores.map(p => <option key={p.id_promotor} value={p.id_promotor}>{p.nombre}</option>)}
                                </select>
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

export default Grupos;