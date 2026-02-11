import {createContext, useContext, useState} from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children}) => {
    const [usuario, setUsuario] = useState(() => {
        const saved = sessionStorage.getItem('usuario');
        return saved ? JSON.parse(saved) : null;
    });

    const login = async (username, password) => {
        const {data} = await api.post('/auth/login', {username, password});
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
        setUsuario(data.usuario);
        return data;
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('usuario');
        setUsuario(null);
    };
    return (
        <AuthContext.Provider value={{usuario, login, logout, isAuthenticated: !!usuario}}>
            {children}
        </AuthContext.Provider>
    );
};