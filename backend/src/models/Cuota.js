const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cuota = sequelize.define('Cuota', {
    id_cuota: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_prestamo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_cuota: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    monto_cuota: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    fecha_programada: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_pago: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'PAGADA', 'VENCIDA'),
        defaultValue: 'PENDIENTE'
    },
    monto_pagado: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    monto_mora: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    dias_atraso: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_creacion: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fecha_modificacion: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'cuotas',
    timestamps: false
});

module.exports = Cuota;