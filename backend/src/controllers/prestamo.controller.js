const { Op } = require('sequelize');
const { sequelize, Prestamo, Cliente, Cuota, Promotor, Grupo, Aval } = require('../models');
const Decimal = require('decimal.js');

const includesCliente = [
    {
        model: Cliente,
        attributes: ['id_cliente', 'nombre', 'telefono', 'direccion'],
        include: [
            { model: Promotor, attributes: ['id_promotor', 'nombre'] },
            { model: Grupo, attributes: ['id_grupo', 'nombre'] },
            { model: Aval, attributes: ['id_aval', 'nombre', 'telefono'] }
        ]
    }
];

// Obtener siguiente número de préstamo para un cliente
const obtenerSiguienteNumero = async (idCliente) => {
    const max = await Prestamo.max('numero_prestamo', {
        where: { id_cliente: idCliente }
    });
    return (max || 0) + 1;
};

const crear = async (req, res) => {
    try {
        const {
            id_cliente, monto_prestado, tasa_interes, frecuencia_pago,
            numero_cuotas, fecha_primer_pago, notas
        } = req.body;

        if (!id_cliente || !monto_prestado || !tasa_interes || !frecuencia_pago || !numero_cuotas || !fecha_primer_pago) {
            return res.status(400).json({ error: 'Campos obligatorios: id_cliente, monto_prestado, tasa_interes, frecuencia_pago, numero_cuotas, fecha_primer_pago' });
        }

        // Cálculos financieros con decimal.js
        // tasa_interes viene como 10 (10%), se guarda como 0.10 en BD
        const monto = new Decimal(monto_prestado);
        const tasaDecimal = new Decimal(tasa_interes).div(100);
        const totalIntereses = monto.mul(tasaDecimal);
        const montoTotal = monto.plus(totalIntereses);
        const montoCuota = montoTotal.div(numero_cuotas).toDecimalPlaces(2);

        const numeroPrestamo = await obtenerSiguienteNumero(id_cliente);

        const prestamo = await Prestamo.create({
            id_cliente,
            numero_prestamo: numeroPrestamo,
            monto_prestado: monto.toNumber(),
            tasa_interes: tasaDecimal.toNumber(),
            frecuencia_pago,
            numero_cuotas,
            monto_cuota: montoCuota.toNumber(),
            monto_total: montoTotal.toNumber(),
            total_intereses: totalIntereses.toNumber(),
            fecha_solicitud: new Date(),
            fecha_primer_pago,
            estado: 'SOLICITADO',
            cuotas_pagadas: 0,
            cuotas_pendientes: numero_cuotas,
            cuotas_vencidas: 0,
            saldo_pendiente: montoTotal.toNumber(),
            notas,
            id_usuario_registro: req.usuario.id
        });

        const prestamoCompleto = await Prestamo.findByPk(prestamo.id_prestamo, {
            include: includesCliente
        });

        res.status(201).json({ mensaje: 'Préstamo creado exitosamente', prestamo: prestamoCompleto });
    } catch (error) {
        console.error('Error al crear préstamo:', error);
        res.status(500).json({ error: 'Error al crear préstamo' });
    }
};

const aprobar = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const prestamo = await Prestamo.findByPk(req.params.id, { transaction: t });
        if (!prestamo) {
            await t.rollback();
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        if (prestamo.estado !== 'SOLICITADO') {
            await t.rollback();
            return res.status(400).json({ error: 'Solo se pueden aprobar préstamos en estado SOLICITADO' });
        }

        // Actualizar estado
        await prestamo.update({
            estado: 'ACTIVO',
            fecha_aprobacion: new Date()
        }, { transaction: t });

        // Generar cuotas
        const diasIncremento = prestamo.frecuencia_pago === 'QUINCENAL' ? 15 : 30;
        const fechaBase = new Date(prestamo.fecha_primer_pago);

        for (let i = 0; i < prestamo.numero_cuotas; i++) {
            const fechaProgramada = new Date(fechaBase);
            fechaProgramada.setDate(fechaProgramada.getDate() + (diasIncremento * i));

            await Cuota.create({
                id_prestamo: prestamo.id_prestamo,
                numero_cuota: i + 1,
                monto_cuota: prestamo.monto_cuota,
                fecha_programada: fechaProgramada,
                estado: 'PENDIENTE',
                monto_pagado: 0,
                monto_mora: 0,
                dias_atraso: 0
            }, { transaction: t });
        }

        await t.commit();

        const prestamoActualizado = await Prestamo.findByPk(req.params.id, {
            include: includesCliente
        });

        res.json({ mensaje: 'Préstamo aprobado y cuotas generadas', prestamo: prestamoActualizado });
    } catch (error) {
        await t.rollback();
        console.error('Error al aprobar préstamo:', error);
        res.status(500).json({ error: 'Error al aprobar préstamo' });
    }
};

const liquidar = async (req, res) => {
    try {
        const prestamo = await Prestamo.findByPk(req.params.id);
        if (!prestamo) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        await prestamo.update({
            estado: 'LIQUIDADO',
            fecha_liquidacion: new Date(),
            saldo_pendiente: 0,
            cuotas_pendientes: 0
        });

        res.json({ mensaje: 'Préstamo liquidado exitosamente' });
    } catch (error) {
        console.error('Error al liquidar préstamo:', error);
        res.status(500).json({ error: 'Error al liquidar préstamo' });
    }
};

const cancelar = async (req, res) => {
    try {
        const prestamo = await Prestamo.findByPk(req.params.id);
        if (!prestamo) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        await prestamo.update({ estado: 'CANCELADO' });
        res.json({ mensaje: 'Préstamo cancelado exitosamente' });
    } catch (error) {
        console.error('Error al cancelar préstamo:', error);
        res.status(500).json({ error: 'Error al cancelar préstamo' });
    }
};

const actualizar = async (req, res) => {
    try {
        const prestamo = await Prestamo.findByPk(req.params.id);
        if (!prestamo) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        const campos = req.body;
        campos.fecha_modificacion = new Date();
        await prestamo.update(campos);

        const prestamoActualizado = await Prestamo.findByPk(req.params.id, {
            include: includesCliente
        });

        res.json({ mensaje: 'Préstamo actualizado', prestamo: prestamoActualizado });
    } catch (error) {
        console.error('Error al actualizar préstamo:', error);
        res.status(500).json({ error: 'Error al actualizar préstamo' });
    }
};

const buscarPorId = async (req, res) => {
    try {
        const prestamo = await Prestamo.findByPk(req.params.id, {
            include: includesCliente
        });
        if (!prestamo) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }
        res.json(prestamo);
    } catch (error) {
        console.error('Error al buscar préstamo:', error);
        res.status(500).json({ error: 'Error al buscar préstamo' });
    }
};

const listar = async (req, res) => {
    try {
        const prestamos = await Prestamo.findAll({
            include: includesCliente,
            order: [['fecha_creacion', 'DESC']]
        });
        res.json(prestamos);
    } catch (error) {
        console.error('Error al listar préstamos:', error);
        res.status(500).json({ error: 'Error al listar préstamos' });
    }
};

const listarPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        const prestamos = await Prestamo.findAll({
            where: { estado },
            include: includesCliente,
            order: [['fecha_creacion', 'DESC']]
        });
        res.json(prestamos);
    } catch (error) {
        console.error('Error al listar préstamos:', error);
        res.status(500).json({ error: 'Error al listar préstamos' });
    }
};

const listarActivos = async (req, res) => {
    try {
        const prestamos = await Prestamo.findAll({
            where: { estado: 'ACTIVO' },
            include: includesCliente,
            order: [['fecha_creacion', 'DESC']]
        });
        res.json(prestamos);
    } catch (error) {
        console.error('Error al listar préstamos activos:', error);
        res.status(500).json({ error: 'Error al listar préstamos' });
    }
};

const listarPorCliente = async (req, res) => {
    try {
        const prestamos = await Prestamo.findAll({
            where: { id_cliente: req.params.idCliente },
            include: includesCliente,
            order: [['numero_prestamo', 'DESC']]
        });
        res.json(prestamos);
    } catch (error) {
        console.error('Error al listar préstamos:', error);
        res.status(500).json({ error: 'Error al listar préstamos' });
    }
};

const buscarActivosPorCliente = async (req, res) => {
    try {
        const { nombre } = req.query;
        const prestamos = await Prestamo.findAll({
            where: { estado: 'ACTIVO' },
            include: [{
                model: Cliente,
                where: { nombre: { [Op.like]: `%${nombre}%` } },
                attributes: ['id_cliente', 'nombre', 'telefono']
            }],
            order: [[Cliente, 'nombre', 'ASC']]
        });
        res.json(prestamos);
    } catch (error) {
        console.error('Error al buscar préstamos:', error);
        res.status(500).json({ error: 'Error al buscar préstamos' });
    }
};

const obtenerPrestamoActivo = async (req, res) => {
    try {
        const prestamo = await Prestamo.findOne({
            where: {
                id_cliente: req.params.idCliente,
                estado: { [Op.in]: ['SOLICITADO', 'ACTIVO'] }
            },
            include: includesCliente
        });

        if (!prestamo) {
            return res.status(404).json({ error: 'No tiene préstamo activo' });
        }
        res.json(prestamo);
    } catch (error) {
        console.error('Error al obtener préstamo:', error);
        res.status(500).json({ error: 'Error al obtener préstamo' });
    }
};

const listarConMora = async (req, res) => {
    try {
        const prestamos = await Prestamo.findAll({
            where: {
                estado: 'ACTIVO',
                cuotas_vencidas: { [Op.gt]: 0 }
            },
            include: includesCliente,
            order: [['cuotas_vencidas', 'DESC']]
        });
        res.json(prestamos);
    } catch (error) {
        console.error('Error al listar préstamos con mora:', error);
        res.status(500).json({ error: 'Error al listar préstamos' });
    }
};

const actualizarContadores = async (req, res) => {
    try {
        const id = req.params.id;

        const [pagadas, pendientes, vencidas, saldo] = await Promise.all([
            Cuota.count({ where: { id_prestamo: id, estado: 'PAGADA' } }),
            Cuota.count({ where: { id_prestamo: id, estado: { [Op.in]: ['PENDIENTE', 'VENCIDA'] } } }),
            Cuota.count({ where: { id_prestamo: id, estado: 'VENCIDA' } }),
            Cuota.sum('monto_cuota', {
                where: { id_prestamo: id, estado: { [Op.ne]: 'PAGADA' } }
            })
        ]);

        await Prestamo.update({
            cuotas_pagadas: pagadas,
            cuotas_pendientes: pendientes,
            cuotas_vencidas: vencidas,
            saldo_pendiente: saldo || 0
        }, { where: { id_prestamo: id } });

        res.json({ mensaje: 'Contadores actualizados', cuotas_pagadas: pagadas, cuotas_pendientes: pendientes, cuotas_vencidas: vencidas, saldo_pendiente: saldo || 0 });
    } catch (error) {
        console.error('Error al actualizar contadores:', error);
        res.status(500).json({ error: 'Error al actualizar contadores' });
    }
};

const obtenerResumenCartera = async (req, res) => {
    try {
        const [resultado] = await sequelize.query(`
            SELECT
                COALESCE(SUM(monto_prestado), 0) as total_prestado,
                COALESCE(SUM(saldo_pendiente), 0) as total_por_cobrar,
                COALESCE(SUM(CASE WHEN cuotas_vencidas > 0 THEN saldo_pendiente ELSE 0 END), 0) as total_vencido
            FROM prestamos WHERE estado = 'ACTIVO'
        `);

        res.json(resultado[0]);
    } catch (error) {
        console.error('Error al obtener resumen:', error);
        res.status(500).json({ error: 'Error al obtener resumen' });
    }
};

module.exports = {
    crear, aprobar, liquidar, cancelar, actualizar,
    buscarPorId, listar, listarPorEstado, listarActivos,
    listarPorCliente, buscarActivosPorCliente, obtenerPrestamoActivo,
    listarConMora, actualizarContadores, obtenerResumenCartera
};