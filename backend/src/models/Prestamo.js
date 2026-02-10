const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prestamo = sequelize.define('Prestamo', {
    id_prestamo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    numero_prestamo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    monto_prestado: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    tasa_interes: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    frecuencia_pago: {
        type: DataTypes.ENUM('QUINCENAL', 'MENSUAL'),
        allowNull: false
    },
    numero_cuotas: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    monto_cuota: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    monto_total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    total_intereses: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    fecha_solicitud: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fecha_aprobacion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fecha_primer_pago: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('SOLICITADO', 'APROBADO', 'ACTIVO', 'LIQUIDADO', 'CANCELADO'),
        defaultValue: 'SOLICITADO'
    },
    cuotas_pagadas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cuotas_pendientes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cuotas_vencidas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    saldo_pendiente: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    fecha_liquidacion: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    id_usuario_registro: {
        type: DataTypes.INTEGER,
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
    tableName: 'prestamos',
    timestamps: false
});

module.exports = Prestamo;