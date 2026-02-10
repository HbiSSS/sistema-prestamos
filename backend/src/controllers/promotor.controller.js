const { Op } = require('sequelize');
const { Promotor, Cliente } = require('../models');

const listar = async (req, res) => {
    try {
        const promotores = await Promotor.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });
        res.json(promotores);
    } catch (error) {
        console.error('Error al listar promotores:', error);
        res.status(500).json({ error: 'Error al listar promotores' });
    }
};

const listarTodos = async (req, res) => {
    try {
        const promotores = await Promotor.findAll({
            order: [['activo', 'DESC'], ['nombre', 'ASC']]
        });
        res.json(promotores);
    } catch (error) {
        console.error('Error al listar promotores:', error);
        res.status(500).json({ error: 'Error al listar promotores' });
    }
};

const buscarPorId = async (req, res) => {
    try {
        const promotor = await Promotor.findByPk(req.params.id);
        if (!promotor) {
            return res.status(404).json({ error: 'Promotor no encontrado' });
        }
        res.json(promotor);
    } catch (error) {
        console.error('Error al buscar promotor:', error);
        res.status(500).json({ error: 'Error al buscar promotor' });
    }
};

const buscarPorNombre = async (req, res) => {
    try {
        const { nombre } = req.query;
        const promotores = await Promotor.findAll({
            where: {
                nombre: { [Op.like]: `%${nombre}%` },
                activo: true
            },
            order: [['nombre', 'ASC']]
        });
        res.json(promotores);
    } catch (error) {
        console.error('Error al buscar promotor:', error);
        res.status(500).json({ error: 'Error al buscar promotor' });
    }
};

const crear = async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const promotor = await Promotor.create({
            nombre, telefono, direccion, activo: true
        });

        res.status(201).json({ mensaje: 'Promotor creado exitosamente', promotor });
    } catch (error) {
        console.error('Error al crear promotor:', error);
        res.status(500).json({ error: 'Error al crear promotor' });
    }
};

const actualizar = async (req, res) => {
    try {
        const promotor = await Promotor.findByPk(req.params.id);
        if (!promotor) {
            return res.status(404).json({ error: 'Promotor no encontrado' });
        }

        const { nombre, telefono, direccion, activo } = req.body;
        await promotor.update({
            nombre, telefono, direccion, activo,
            fecha_modificacion: new Date()
        });

        res.json({ mensaje: 'Promotor actualizado exitosamente', promotor });
    } catch (error) {
        console.error('Error al actualizar promotor:', error);
        res.status(500).json({ error: 'Error al actualizar promotor' });
    }
};

const eliminar = async (req, res) => {
    try {
        const promotor = await Promotor.findByPk(req.params.id);
        if (!promotor) {
            return res.status(404).json({ error: 'Promotor no encontrado' });
        }

        await promotor.update({ activo: false });
        res.json({ mensaje: 'Promotor eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar promotor:', error);
        res.status(500).json({ error: 'Error al eliminar promotor' });
    }
};

const contarClientes = async (req, res) => {
    try {
        const count = await Cliente.count({
            where: { id_promotor: req.params.id, activo: true }
        });
        res.json({ total: count });
    } catch (error) {
        console.error('Error al contar clientes:', error);
        res.status(500).json({ error: 'Error al contar clientes' });
    }
};

module.exports = { listar, listarTodos, buscarPorId, buscarPorNombre, crear, actualizar, eliminar, contarClientes };