import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit, Trash2, X, Save, Users } from 'lucide-react';

const initialForm = { nombre: '', telefono: '', direccion: '' };

const Promotores = () => {
    const [promotores, setPromotores] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [editando, setEditando] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargarPromotores = async () => {
        try {
            const { data } = await api.get('/promotores/todos');
            setPromotores(data);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarPromotores(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editando) {
                await api.put(`/promotores/${editando}`, form);
            } else {
                await api.post('/promotores', form);
            }
            setModalOpen(false);
            setForm(initialForm);
            setEditando(null);
            cargarPromotores();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar');
        }
    };

    const handleEditar = (promotor) => {
        setForm({
            nombre: promotor.nombre,
            telefono: promotor.telefono || '',
            direccion: promotor.direccion || ''
        });
        setEditando(promotor.id_promotor);
        setModalOpen(true);
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Estás seguro de desactivar este promotor?')) return;
        try {
            await api.delete(`/promotores/${id}`);
            cargarPromotores();
        } catch (err) {
            alert(err.response?.data?.error || 'Error al eliminar');
        }
    };

    const abrirNuevo = () => {
        setForm(initialForm);
        setEditando(null);
        setError('');
        setModalOpen(true);
    };

    const promotoresFiltrados = promotores.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.telefono && p.telefono.includes(busqueda))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Barra superior */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o teléfono..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
                <button onClick={abrirNuevo} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
                    <Plus className="w-5 h-5" /> Nuevo Promotor
                </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {promotoresFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No se encontraron promotores
                                </td>
                            </tr>
                        ) : (
                            promotoresFiltrados.map((p) => (
                                <tr key={p.id_promotor} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-sm">{p.nombre.charAt(0)}</span>
                                            </div>
                                            <span className="font-medium text-gray-800">{p.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.telefono || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{p.direccion || '—'}</td>
                                    <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {p.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEditar(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {p.activo && (
                                                <button onClick={() => handleEliminar(p.id_promotor)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Desactivar">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {editando ? 'Editar Promotor' : 'Nuevo Promotor'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    value={form.telefono}
                                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={form.direccion}
                                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                                    Cancelar
                                </button>
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

export default Promotores;