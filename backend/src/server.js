const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Sistema de Préstamos - API funcionando',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            clientes: '/api/clientes',
            prestamos: '/api/prestamos',
            cuotas: '/api/cuotas',
            promotores: '/api/promotores',
            grupos: '/api/grupos',
            avales: '/api/avales'
        }
    });
});

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/promotores', require('./routes/promotor.routes'));
app.use('/api/avales', require('./routes/aval.routes'));
app.use('/api/grupos', require('./routes/grupo.routes'));
app.use('/api/clientes', require('./routes/cliente.routes'));
app.use('/api/prestamos', require('./routes/prestamo.routes'));
app.use('/api/cuotas', require('./routes/cuota.routes'));

// Iniciar servidor
const iniciar = async () => {
    await testConnection();

    // Sincronizar modelos (NO altera tablas existentes)
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados');

    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
};

iniciar();