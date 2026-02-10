import { useState, useEffect } from 'react';
import api from '../services/api';

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalPassword, setModalPassword] = useState(false);
    const [editando, setEditando] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    const formVacio = { username: '', password: '', nombre_completo: '', email: '', id_rol: '', activo: true };
    const [form, setForm] = useState(formVacio);
    const [passForm, setPassForm] = useState({ password: '', confirmar: '' });
    const [usuarioPassword, setUsuarioPassword] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [resUsuarios, resRoles] = await Promise.all([
                api.get('/usuarios'),
                api.get('/usuarios/roles')
            ]);
            setUsuarios(resUsuarios.data);
            setRoles(resRoles.data);
        } catch (err) {
            setError('Error al cargar usuarios');
        } finally {
            setCargando(false);
        }
    };

    const abrirCrear = () => {
        setEditando(null);
        setForm({ ...formVacio, id_rol: roles[0]?.id_rol || '' });
        setError('');
        setModalAbierto(true);
    };

    const abrirEditar = (usuario) => {
        setEditando(usuario);
        setForm({
            username: usuario.username,
            password: '',
            nombre_completo: usuario.nombre_completo,
            email: usuario.email || '',
            id_rol: usuario.id_rol,
            activo: usuario.activo
        });
        setError('');
        setModalAbierto(true);
    };

    const abrirCambiarPassword = (usuario) => {
        setUsuarioPassword(usuario);
        setPassForm({ password: '', confirmar: '' });
        setError('');
        setModalPassword(true);
    };

    const guardar = async () => {
        if (!form.username.trim() || !form.nombre_completo.trim() || !form.id_rol) {
            setError('Username, nombre completo y rol son obligatorios');
            return;
        }
        if (!editando && !form.password) {
            setError('La contraseña es obligatoria para nuevos usuarios');
            return;
        }

        try {
            setGuardando(true);
            setError('');
            if (editando) {
                const { password, ...datos } = form;
                await api.put(`/usuarios/${editando.id_usuario}`, datos);
            } else {
                await api.post('/usuarios', form);
            }
            setModalAbierto(false);
            cargarDatos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar');
        } finally {
            setGuardando(false);
        }
    };

    const guardarPassword = async () => {
        if (!passForm.password || passForm.password.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres');
            return;
        }
        if (passForm.password !== passForm.confirmar) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            setGuardando(true);
            setError('');
            await api.put(`/usuarios/${usuarioPassword.id_usuario}/password`, {
                password: passForm.password
            });
            setModalPassword(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cambiar contraseña');
        } finally {
            setGuardando(false);
        }
    };

    const toggleActivo = async (usuario) => {
        const accion = usuario.activo ? 'desactivar' : 'activar';
        if (!confirm(`¿Seguro que deseas ${accion} a ${usuario.nombre_completo}?`)) return;

        try {
            if (usuario.activo) {
                await api.delete(`/usuarios/${usuario.id_usuario}`);
            } else {
                await api.put(`/usuarios/${usuario.id_usuario}`, { ...usuario, activo: true });
            }
            cargarDatos();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al actualizar');
        }
    };

    const filtrados = usuarios.filter(u =>
        u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.username.toLowerCase().includes(busqueda.toLowerCase())
    );

    const formatFecha = (fecha) => {
        if (!fecha) return 'Nunca';
        return new Date(fecha).toLocaleString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getNombreRol = (id_rol) => {
        const rol = roles.find(r => r.id_rol === id_rol);
        return rol ? rol.nombre : '-';
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <button onClick={abrirCrear}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Usuario
                </button>
            </div>

            {/* Buscador */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre o username..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full sm:w-80 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Acceso</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                        {filtrados.map(u => (
                            <tr key={u.id_usuario} className={`hover:bg-gray-50 ${!u.activo ? 'opacity-50' : ''}`}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.username}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{u.nombre_completo}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{u.email || '-'}</td>
                                <td className="px-4 py-3">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                            getNombreRol(u.id_rol) === 'SUPERUSUARIO'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {getNombreRol(u.id_rol)}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{formatFecha(u.ultimo_acceso)}</td>
                                <td className="px-4 py-3">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                            u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {u.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => abrirEditar(u)}
                                                className="text-indigo-600 hover:text-indigo-800 p-1" title="Editar">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => abrirCambiarPassword(u)}
                                                className="text-yellow-600 hover:text-yellow-800 p-1" title="Cambiar Contraseña">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => toggleActivo(u)}
                                                className={`p-1 ${u.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                                title={u.activo ? 'Desactivar' : 'Activar'}>
                                            {u.activo ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                    No se encontraron usuarios
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Crear/Editar */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">
                                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>

                            {error && (
                                <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                    <input type="text" value={form.username}
                                           onChange={(e) => setForm({ ...form, username: e.target.value })}
                                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                           placeholder="usuario123" />
                                </div>

                                {!editando && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                                        <input type="password" value={form.password}
                                               onChange={(e) => setForm({ ...form, password: e.target.value })}
                                               className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                               placeholder="••••••••" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                                    <input type="text" value={form.nombre_completo}
                                           onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                           placeholder="Juan Pérez López" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" value={form.email}
                                           onChange={(e) => setForm({ ...form, email: e.target.value })}
                                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                           placeholder="correo@ejemplo.com" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                                    <select value={form.id_rol}
                                            onChange={(e) => setForm({ ...form, id_rol: parseInt(e.target.value) })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                        <option value="">Seleccionar rol...</option>
                                        {roles.map(r => (
                                            <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {editando && (
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="activo" checked={form.activo}
                                               onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                                               className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setModalAbierto(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button onClick={guardar} disabled={guardando}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                    {guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cambiar Contraseña */}
            {modalPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-1">Cambiar Contraseña</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Usuario: <span className="font-medium">{usuarioPassword?.username}</span>
                            </p>

                            {error && (
                                <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                    <input type="password" value={passForm.password}
                                           onChange={(e) => setPassForm({ ...passForm, password: e.target.value })}
                                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                           placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                                    <input type="password" value={passForm.confirmar}
                                           onChange={(e) => setPassForm({ ...passForm, confirmar: e.target.value })}
                                           className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                           placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setModalPassword(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button onClick={guardarPassword} disabled={guardando}
                                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50">
                                    {guardando ? 'Guardando...' : 'Cambiar Contraseña'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;