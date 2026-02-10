const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Grupo = sequelize.define('Grupo', {
    id_grupo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    id_promotor: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'grupos',
    timestamps: false
});

module.exports = Grupo;