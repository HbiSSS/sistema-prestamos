const { Op } = require('sequelize');
const { sequelize, Cuota, Prestamo, Cliente, Promotor, Grupo } = require('../models');

const buscarPorId = async (req, res) => {
    try {
        const cuota = await Cuota.findByPk(req.params.id, {
            include: [{
                model: Prestamo,
                attributes: ['id_prestamo', 'numero_prestamo', 'id_cliente'],
                include: [{ model: Cliente, attributes: ['id_cliente', 'nombre'] }]
            }]
        });
        if (!cuota) {
            return res.status(404).json({ error: 'Cuota no encontrada' });
        }
        res.json(cuota);
    } catch (error) {
        console.error('Error al buscar cuota:', error);
        res.status(500).json({ error: 'Error al buscar cuota' });
    }
};

const listarPorPrestamo = async (req, res) => {
    try {
        const cuotas = await Cuota.findAll({
            where: { id_prestamo: req.params.idPrestamo },
            order: [['numero_cuota', 'ASC']]
        });
        res.json(cuotas);
    } catch (error) {
        console.error('Error al listar cuotas:', error);
        res.status(500).json({ error: 'Error al listar cuotas' });
    }
};

const listarPendientesPorPrestamo = async (req, res) => {
    try {
        const cuotas = await Cuota.findAll({
            where: {
                id_prestamo: req.params.idPrestamo,
                estado: { [Op.in]: ['PENDIENTE', 'VENCIDA'] }
            },
            order: [['numero_cuota', 'ASC']]
        });
        res.json(cuotas);
    } catch (error) {
        console.error('Error al listar cuotas pendientes:', error);
        res.status(500).json({ error: 'Error al listar cuotas' });
    }
};

const obtenerProximaCuota = async (req, res) => {
    try {
        const cuota = await Cuota.findOne({
            where: {
                id_prestamo: req.params.idPrestamo,
                estado: { [Op.in]: ['PENDIENTE', 'VENCIDA'] }
            },
            order: [['numero_cuota', 'ASC']],
            include: [{
                model: Prestamo,
                attributes: ['id_prestamo', 'numero_prestamo'],
                include: [{ model: Cliente, attributes: ['id_cliente', 'nombre'] }]
            }]
        });

        if (!cuota) {
            return res.status(404).json({ error: 'No hay cuotas pendientes' });
        }
        res.json(cuota);
    } catch (error) {
        console.error('Error al obtener próxima cuota:', error);
        res.status(500).json({ error: 'Error al obtener cuota' });
    }
};

const registrarPago = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const cuota = await Cuota.findByPk(req.params.id, { transaction: t });
        if (!cuota) {
            await t.rollback();
            return res.status(404).json({ error: 'Cuota no encontrada' });
        }

        if (cuota.estado === 'PAGADA') {
            await t.rollback();
            return res.status(400).json({ error: 'Esta cuota ya está pagada' });
        }

        // Marcar cuota como pagada
        await cuota.update({
            estado: 'PAGADA',
            fecha_pago: new Date(),
            monto_pagado: cuota.monto_cuota
        }, { transaction: t });

        // Actualizar contadores del préstamo
        const idPrestamo = cuota.id_prestamo;
        const [pagadas, pendientes, vencidas, saldo] = await Promise.all([
            Cuota.count({ where: { id_prestamo: idPrestamo, estado: 'PAGADA' }, transaction: t }),
            Cuota.count({ where: { id_prestamo: idPrestamo, estado: { [Op.in]: ['PENDIENTE', 'VENCIDA'] } }, transaction: t }),
            Cuota.count({ where: { id_prestamo: idPrestamo, estado: 'VENCIDA' }, transaction: t }),
            Cuota.sum('monto_cuota', { where: { id_prestamo: idPrestamo, estado: { [Op.ne]: 'PAGADA' } }, transaction: t })
        ]);

        await Prestamo.update({
            cuotas_pagadas: pagadas,
            cuotas_pendientes: pendientes,
            cuotas_vencidas: vencidas,
            saldo_pendiente: saldo || 0
        }, { where: { id_prestamo: idPrestamo }, transaction: t });

        // Verificar si se liquidó el préstamo
        if (pendientes === 0) {
            await Prestamo.update({
                estado: 'LIQUIDADO',
                fecha_liquidacion: new Date(),
                saldo_pendiente: 0
            }, { where: { id_prestamo: idPrestamo }, transaction: t });
        }

        await t.commit();

        res.json({
            mensaje: 'Pago registrado exitosamente',
            cuota: await Cuota.findByPk(req.params.id),
            prestamo: {
                cuotas_pagadas: pagadas,
                cuotas_pendientes: pendientes,
                cuotas_vencidas: vencidas,
                saldo_pendiente: saldo || 0,
                liquidado: pendientes === 0
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al registrar pago:', error);
        res.status(500).json({ error: 'Error al registrar pago' });
    }
};

const registrarPagoConHistorial = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id_usuario } = req.body;
        const cuota = await Cuota.findByPk(req.params.id, { transaction: t });

        if (!cuota) {
            await t.rollback();
            return res.status(404).json({ error: 'Cuota no encontrada' });
        }

        if (cuota.estado === 'PAGADA') {
            await t.rollback();
            return res.status(400).json({ error: 'Esta cuota ya está pagada' });
        }

        // Marcar cuota como pagada
        await cuota.update({
            estado: 'PAGADA',
            fecha_pago: new Date(),
            monto_pagado: cuota.monto_cuota
        }, { transaction: t });

        // Registrar en historial de pagos
        await sequelize.query(
            `INSERT INTO historial_pagos (id_cuota, id_prestamo, monto_pagado, fecha_pago, id_usuario_registro) 
             VALUES (?, ?, ?, NOW(), ?)`,
            {
                replacements: [cuota.id_cuota, cuota.id_prestamo, cuota.monto_cuota, id_usuario || req.usuario.id],
                transaction: t
            }
        );

        // Actualizar contadores del préstamo
        const idPrestamo = cuota.id_prestamo;
        const [pagadas, pendientes, vencidas, saldo] = await Promise.all([
            Cuota.count({ where: { id_prestamo: idPrestamo, estado: 'PAGADA' }, transaction: t }),
            Cuota.count({ where: { id_prestamo: idPrestamo, estado: { [Op.in]: ['PENDIENTE', 'VENCIDA'] } }, transaction: t }),
            Cuota.count({ where: { id_prestamo: idPrestamo, estado: 'VENCIDA' }, transaction: t }),
            Cuota.sum('monto_cuota', { where: { id_prestamo: idPrestamo, estado: { [Op.ne]: 'PAGADA' } }, transaction: t })
        ]);

        await Prestamo.update({
            cuotas_pagadas: pagadas,
            cuotas_pendientes: pendientes,
            cuotas_vencidas: vencidas,
            saldo_pendiente: saldo || 0
        }, { where: { id_prestamo: idPrestamo }, transaction: t });

        if (pendientes === 0) {
            await Prestamo.update({
                estado: 'LIQUIDADO',
                fecha_liquidacion: new Date(),
                saldo_pendiente: 0
            }, { where: { id_prestamo: idPrestamo }, transaction: t });
        }

        await t.commit();

        res.json({
            mensaje: 'Pago registrado con historial exitosamente',
            liquidado: pendientes === 0
        });
    } catch (error) {
        await t.rollback();
        console.error('Error al registrar pago:', error);
        res.status(500).json({ error: 'Error al registrar pago' });
    }
};

const actualizarCuotasVencidas = async (req, res) => {
    try {
        const [actualizadas] = await sequelize.query(`
            UPDATE cuotas 
            SET estado = 'VENCIDA', 
                dias_atraso = DATEDIFF(CURDATE(), fecha_programada) 
            WHERE estado = 'PENDIENTE' 
            AND fecha_programada < CURDATE()
        `);

        // Actualizar contadores de todos los préstamos activos
        const [prestamosActivos] = await sequelize.query(
            `SELECT id_prestamo FROM prestamos WHERE estado = 'ACTIVO'`
        );

        for (const p of prestamosActivos) {
            const id = p.id_prestamo;
            const [pagadas, pendientes, vencidas, saldo] = await Promise.all([
                Cuota.count({ where: { id_prestamo: id, estado: 'PAGADA' } }),
                Cuota.count({ where: { id_prestamo: id, estado: { [Op.in]: ['PENDIENTE', 'VENCIDA'] } } }),
                Cuota.count({ where: { id_prestamo: id, estado: 'VENCIDA' } }),
                Cuota.sum('monto_cuota', { where: { id_prestamo: id, estado: { [Op.ne]: 'PAGADA' } } })
            ]);

            await Prestamo.update({
                cuotas_pagadas: pagadas,
                cuotas_pendientes: pendientes,
                cuotas_vencidas: vencidas,
                saldo_pendiente: saldo || 0
            }, { where: { id_prestamo: id } });
        }

        res.json({
            mensaje: 'Cuotas vencidas actualizadas',
            cuotas_marcadas: actualizadas.affectedRows || 0,
            prestamos_actualizados: prestamosActivos.length
        });
    } catch (error) {
        console.error('Error al actualizar cuotas vencidas:', error);
        res.status(500).json({ error: 'Error al actualizar cuotas' });
    }
};

const listarCuotasSemanaPromotor = async (req, res) => {
    try {
        const { idPromotor, fechaInicio, fechaFin } = req.query;

        const [cuotas] = await sequelize.query(`
            SELECT c.nombre AS cliente, cu.numero_cuota, cu.fecha_programada, 
                   cu.monto_cuota, cu.estado, cu.dias_atraso, c.telefono,
                   COALESCE(g.nombre, 'Sin grupo') AS grupo
            FROM cuotas cu
            INNER JOIN prestamos p ON cu.id_prestamo = p.id_prestamo
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            LEFT JOIN grupos g ON c.id_grupo = g.id_grupo
            WHERE c.id_promotor = ? 
            AND cu.fecha_programada BETWEEN ? AND ?
            AND p.estado = 'ACTIVO'
            ORDER BY cu.fecha_programada, c.nombre
        `, { replacements: [idPromotor, fechaInicio, fechaFin] });

        res.json(cuotas);
    } catch (error) {
        console.error('Error al listar cuotas de la semana:', error);
        res.status(500).json({ error: 'Error al listar cuotas' });
    }
};

const listarTodasVencidas = async (req, res) => {
    try {
        const [cuotas] = await sequelize.query(`
            SELECT c.nombre AS cliente, c.telefono, pr.nombre AS promotor,
                   cu.numero_cuota, cu.monto_cuota, cu.fecha_programada, cu.dias_atraso
            FROM cuotas cu
            INNER JOIN prestamos p ON cu.id_prestamo = p.id_prestamo
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN promotores pr ON c.id_promotor = pr.id_promotor
            WHERE cu.estado = 'VENCIDA' AND p.estado = 'ACTIVO'
            ORDER BY cu.dias_atraso DESC, c.nombre
        `);

        res.json(cuotas);
    } catch (error) {
        console.error('Error al listar cuotas vencidas:', error);
        res.status(500).json({ error: 'Error al listar cuotas' });
    }
};

const listarCarteraVencida = async (req, res) => {
    try {
        const { idPromotor } = req.query;
        let filtroPromotor = '';
        const params = [];

        if (idPromotor) {
            filtroPromotor = 'AND c.id_promotor = ?';
            params.push(idPromotor);
        }

        const [resultado] = await sequelize.query(`
            SELECT c.nombre AS cliente, c.telefono, pr.nombre AS promotor,
                   COALESCE(g.nombre, 'Sin grupo') AS grupo, p.numero_prestamo,
                   COUNT(cu.id_cuota) AS cuotas_vencidas,
                   SUM(cu.monto_cuota) AS monto_vencido,
                   DATEDIFF(CURDATE(), MIN(cu.fecha_programada)) AS dias_atraso,
                   (SELECT MAX(cu2.fecha_pago) FROM cuotas cu2 
                    WHERE cu2.id_prestamo = p.id_prestamo AND cu2.estado = 'PAGADA') AS ultima_fecha_pago
            FROM cuotas cu
            INNER JOIN prestamos p ON cu.id_prestamo = p.id_prestamo
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN promotores pr ON c.id_promotor = pr.id_promotor
            LEFT JOIN grupos g ON c.id_grupo = g.id_grupo
            WHERE cu.estado = 'VENCIDA' AND p.estado = 'ACTIVO' ${filtroPromotor}
            GROUP BY p.id_prestamo, c.id_cliente, c.nombre, c.telefono, 
                     pr.id_promotor, pr.nombre, g.id_grupo, g.nombre, p.numero_prestamo
            ORDER BY dias_atraso DESC
        `, { replacements: params });

        res.json(resultado);
    } catch (error) {
        console.error('Error al listar cartera vencida:', error);
        res.status(500).json({ error: 'Error al listar cartera' });
    }
};

const listarResumenCobranza = async (req, res) => {
    try {
        const [resultado] = await sequelize.query(`
            SELECT c.nombre AS cliente, c.telefono, pr.nombre AS promotor,
                   COALESCE(g.nombre, 'Sin grupo') AS grupo, p.numero_prestamo,
                   cu.numero_cuota, cu.fecha_programada, cu.monto_cuota, cu.estado,
                   CASE WHEN cu.estado = 'VENCIDA' 
                        THEN DATEDIFF(CURDATE(), cu.fecha_programada) ELSE 0 END AS dias_atraso
            FROM cuotas cu
            INNER JOIN (
                SELECT id_prestamo, MIN(numero_cuota) AS primera_cuota
                FROM cuotas WHERE estado IN ('PENDIENTE', 'VENCIDA')
                GROUP BY id_prestamo
            ) primera ON cu.id_prestamo = primera.id_prestamo 
                     AND cu.numero_cuota = primera.primera_cuota
            INNER JOIN prestamos p ON cu.id_prestamo = p.id_prestamo
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN promotores pr ON c.id_promotor = pr.id_promotor
            LEFT JOIN grupos g ON c.id_grupo = g.id_grupo
            WHERE p.estado = 'ACTIVO' AND cu.estado IN ('PENDIENTE', 'VENCIDA')
            ORDER BY cu.estado DESC, cu.fecha_programada ASC
        `);

        res.json(resultado);
    } catch (error) {
        console.error('Error al listar resumen de cobranza:', error);
        res.status(500).json({ error: 'Error al listar resumen' });
    }
};

const reporteSemanal = async (req, res) => {
    try {
        const { idPromotor, fechaInicio, fechaFin } = req.query;

        // Si no mandan fechas, usar semana actual (lunes a domingo)
        let inicio = fechaInicio;
        let fin = fechaFin;
        if (!inicio || !fin) {
            const hoy = new Date();
            const diaSemana = hoy.getDay();
            const lunes = new Date(hoy);
            lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
            lunes.setHours(0, 0, 0, 0);
            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
            domingo.setHours(23, 59, 59, 999);
            inicio = lunes.toISOString().split('T')[0];
            fin = domingo.toISOString().split('T')[0];
        }

        // Filtro opcional por promotor
        let filtroPromotor = '';
        const params = [];
        if (idPromotor) {
            filtroPromotor = 'AND c.id_promotor = ?';
            params.push(idPromotor);
        }
        params.push(inicio, fin);

        // Detalle de cuotas de la semana
        const [cuotas] = await sequelize.query(`
            SELECT cu.id_cuota, cu.numero_cuota, cu.fecha_programada, 
                   cu.monto_cuota, cu.estado, cu.dias_atraso, cu.fecha_pago,
                   c.nombre AS cliente, c.telefono,
                   pr.nombre AS promotor, pr.id_promotor,
                   COALESCE(g.nombre, 'Sin grupo') AS grupo,
                   p.id_prestamo, p.numero_prestamo
            FROM cuotas cu
            INNER JOIN prestamos p ON cu.id_prestamo = p.id_prestamo
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN promotores pr ON c.id_promotor = pr.id_promotor
            LEFT JOIN grupos g ON c.id_grupo = g.id_grupo
            WHERE p.estado = 'ACTIVO' ${filtroPromotor}
            AND cu.fecha_programada BETWEEN ? AND ?
            ORDER BY cu.fecha_programada ASC, pr.nombre, c.nombre
        `, { replacements: params });

        // Resumen totales
        const paramsResumen = [...params];
        const [resumen] = await sequelize.query(`
            SELECT 
                COUNT(*) AS total_cuotas,
                SUM(CASE WHEN cu.estado = 'PAGADA' THEN 1 ELSE 0 END) AS cuotas_pagadas,
                SUM(CASE WHEN cu.estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS cuotas_pendientes,
                SUM(CASE WHEN cu.estado = 'VENCIDA' THEN 1 ELSE 0 END) AS cuotas_vencidas,
                COALESCE(SUM(cu.monto_cuota), 0) AS monto_total,
                COALESCE(SUM(CASE WHEN cu.estado = 'PAGADA' THEN cu.monto_cuota ELSE 0 END), 0) AS monto_cobrado,
                COALESCE(SUM(CASE WHEN cu.estado != 'PAGADA' THEN cu.monto_cuota ELSE 0 END), 0) AS monto_pendiente
            FROM cuotas cu
            INNER JOIN prestamos p ON cu.id_prestamo = p.id_prestamo
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN promotores pr ON c.id_promotor = pr.id_promotor
            WHERE p.estado = 'ACTIVO' ${filtroPromotor}
            AND cu.fecha_programada BETWEEN ? AND ?
        `, { replacements: paramsResumen });

        res.json({
            fechaInicio: inicio,
            fechaFin: fin,
            resumen: resumen[0] || {},
            cuotas
        });
    } catch (error) {
        console.error('Error al generar reporte semanal:', error);
        res.status(500).json({ error: 'Error al generar reporte semanal' });
    }
};

module.exports = {
    buscarPorId, listarPorPrestamo, listarPendientesPorPrestamo,
    obtenerProximaCuota, registrarPago, registrarPagoConHistorial,
    actualizarCuotasVencidas, listarCuotasSemanaPromotor,
    listarTodasVencidas, listarCarteraVencida, listarResumenCobranza,
    reporteSemanal
};