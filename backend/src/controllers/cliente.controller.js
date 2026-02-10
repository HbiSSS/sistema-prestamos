const { Op } = require('sequelize');
const { sequelize, Cliente, Promotor, Grupo, Aval, Prestamo } = require('../models');

// Includes reutilizables para las consultas
const includesCompletos = [
    { model: Promotor, attributes: ['id_promotor', 'nombre', 'telefono', 'activo'] },
    { model: Grupo, attributes: ['id_grupo', 'nombre', 'descripcion', 'activo'] },
    { model: Aval, attributes: ['id_aval', 'nombre', 'telefono', 'direccion', 'activo'] }
];

const listar = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            where: { activo: true },
            include: includesCompletos,
            order: [['nombre', 'ASC']]
        });
        res.json(clientes);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ error: 'Error al listar clientes' });
    }
};

const listarTodos = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            include: includesCompletos,
            order: [['activo', 'DESC'], ['nombre', 'ASC']]
        });
        res.json(clientes);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ error: 'Error al listar clientes' });
    }
};

const listarClientesConPrestamo = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            where: { activo: true },
            include: [
                ...includesCompletos,
                {
                    model: Prestamo,
                    attributes: ['id_prestamo'],
                    required: true // INNER JOIN - solo clientes con préstamos
                }
            ],
            order: [['nombre', 'ASC']]
        });

        // Eliminar duplicados por el JOIN
        const clientesUnicos = [];
        const idsVistos = new Set();
        for (const c of clientes) {
            if (!idsVistos.has(c.id_cliente)) {
                idsVistos.add(c.id_cliente);
                clientesUnicos.push(c);
            }
        }

        res.json(clientesUnicos);
    } catch (error) {
        console.error('Error al listar clientes con prestamo:', error);
        res.status(500).json({ error: 'Error al listar clientes' });
    }
};

const buscarPorId = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id, {
            include: includesCompletos
        });
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        res.status(500).json({ error: 'Error al buscar cliente' });
    }
};

const buscarPorNombre = async (req, res) => {
    try {
        const { nombre } = req.query;
        const clientes = await Cliente.findAll({
            where: {
                nombre: { [Op.like]: `%${nombre}%` },
                activo: true
            },
            include: includesCompletos,
            order: [['nombre', 'ASC']]
        });
        res.json(clientes);
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        res.status(500).json({ error: 'Error al buscar cliente' });
    }
};

const buscarPorTelefono = async (req, res) => {
    try {
        const { telefono } = req.query;
        const clientes = await Cliente.findAll({
            where: {
                [Op.or]: [
                    { telefono: { [Op.like]: `%${telefono}%` } },
                    { telefono_secundario: { [Op.like]: `%${telefono}%` } }
                ],
                activo: true
            },
            include: includesCompletos,
            order: [['nombre', 'ASC']]
        });
        res.json(clientes);
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        res.status(500).json({ error: 'Error al buscar cliente' });
    }
};

const listarPorPromotor = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            where: { id_promotor: req.params.idPromotor, activo: true },
            include: includesCompletos,
            order: [['nombre', 'ASC']]
        });
        res.json(clientes);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ error: 'Error al listar clientes' });
    }
};

const listarPorGrupo = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            where: { id_grupo: req.params.idGrupo, activo: true },
            include: includesCompletos,
            order: [['nombre', 'ASC']]
        });
        res.json(clientes);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ error: 'Error al listar clientes' });
    }
};

const listarDisponiblesParaPrestamo = async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            where: { activo: true },
            include: [
                ...includesCompletos,
                {
                    model: Prestamo,
                    where: { estado: { [Op.in]: ['SOLICITADO', 'ACTIVO'] } },
                    required: false,
                    attributes: ['id_prestamo']
                }
            ],
            order: [['nombre', 'ASC']]
        });

        // Filtrar solo los que NO tienen préstamos activos
        const disponibles = clientes.filter(c => c.Prestamos.length === 0);
        res.json(disponibles);
    } catch (error) {
        console.error('Error al listar clientes disponibles:', error);
        res.status(500).json({ error: 'Error al listar clientes' });
    }
};

const crear = async (req, res) => {
    try {
        const { nombre, direccion, telefono, telefono_secundario, id_promotor, id_grupo, id_aval, notas } = req.body;

        if (!nombre || !id_promotor) {
            return res.status(400).json({ error: 'Nombre y promotor son requeridos' });
        }

        const cliente = await Cliente.create({
            nombre, direccion, telefono, telefono_secundario,
            id_promotor, id_grupo, id_aval, notas, activo: true
        });

        // Retornar con relaciones incluidas
        const clienteCompleto = await Cliente.findByPk(cliente.id_cliente, {
            include: includesCompletos
        });

        res.status(201).json({ mensaje: 'Cliente creado exitosamente', cliente: clienteCompleto });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

const actualizar = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const { nombre, direccion, telefono, telefono_secundario, id_promotor, id_grupo, id_aval, notas, activo } = req.body;
        await cliente.update({
            nombre, direccion, telefono, telefono_secundario,
            id_promotor, id_grupo, id_aval, notas, activo,
            fecha_modificacion: new Date()
        });

        const clienteActualizado = await Cliente.findByPk(req.params.id, {
            include: includesCompletos
        });

        res.json({ mensaje: 'Cliente actualizado exitosamente', cliente: clienteActualizado });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
};

const eliminar = async (req, res) => {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        await cliente.update({ activo: false });
        res.json({ mensaje: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
};

const tienePrestamoActivo = async (req, res) => {
    try {
        const count = await Prestamo.count({
            where: {
                id_cliente: req.params.id,
                estado: { [Op.in]: ['SOLICITADO', 'ACTIVO'] }
            }
        });
        res.json({ tiene: count > 0, total: count });
    } catch (error) {
        console.error('Error al verificar prestamo:', error);
        res.status(500).json({ error: 'Error al verificar prestamo' });
    }
};

const contarPrestamos = async (req, res) => {
    try {
        const count = await Prestamo.count({
            where: { id_cliente: req.params.id }
        });
        res.json({ total: count });
    } catch (error) {
        console.error('Error al contar prestamos:', error);
        res.status(500).json({ error: 'Error al contar prestamos' });
    }
};

module.exports = {
    listar, listarTodos, listarClientesConPrestamo,
    buscarPorId, buscarPorNombre, buscarPorTelefono,
    listarPorPromotor, listarPorGrupo, listarDisponiblesParaPrestamo,
    crear, actualizar, eliminar, tienePrestamoActivo, contarPrestamos
};