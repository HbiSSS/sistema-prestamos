const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 10,
            min: 3,
            acquire: 30000,
            idle: 120000
        },
        logging: false, // Cambiar a console.log para ver las queries SQL
        timezone: '-06:00' // CST - México Central
    }
);

// Probar conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos exitosa');
        console.log(`  → Host: ${process.env.DB_HOST}`);
        console.log(`  → Base de datos: ${process.env.DB_NAME}`);
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error.message);
    }
};

module.exports = { sequelize, testConnection };