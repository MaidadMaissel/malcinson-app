import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('employee');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (name, phone) => {
        const res = await api.post('/auth/login', { name, phone });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('employee', JSON.stringify(res.data.employee));
        setUser(res.data.employee);
        return res.data.employee;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('employee');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
