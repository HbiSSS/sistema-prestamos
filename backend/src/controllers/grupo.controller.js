const { Op } = require('sequelize');
const { Grupo, Promotor, Cliente } = require('../models');

const listar = async (req, res) => {
    try {
        const grupos = await Grupo.findAll({
            where: { activo: true },
            include: [{ model: Promotor, attributes: ['id_promotor', 'nombre'] }],
            order: [['nombre', 'ASC']]
        });
        res.json(grupos);
    } catch (error) {
        console.error('Error al listar grupos:', error);
        res.status(500).json({ error: 'Error al listar grupos' });
    }
};

const listarTodos = async (req, res) => {
    try {
        const grupos = await Grupo.findAll({
            include: [{ model: Promotor, attributes: ['id_promotor', 'nombre'] }],
            order: [['activo', 'DESC'], ['nombre', 'ASC']]
        });
        res.json(grupos);
    } catch (error) {
        console.error('Error al listar grupos:', error);
        res.status(500).json({ error: 'Error al listar grupos' });
    }
};

const buscarPorId = async (req, res) => {
    try {
        const grupo = await Grupo.findByPk(req.params.id, {
            include: [{ model: Promotor, attributes: ['id_promotor', 'nombre'] }]
        });
        if (!grupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }
        res.json(grupo);
    } catch (error) {
        console.error('Error al buscar grupo:', error);
        res.status(500).json({ error: 'Error al buscar grupo' });
    }
};

const buscarPorNombre = async (req, res) => {
    try {
        const { nombre } = req.query;
        const grupos = await Grupo.findAll({
            where: {
                nombre: { [Op.like]: `%${nombre}%` },
                activo: true
            },
            include: [{ model: Promotor, attributes: ['id_promotor', 'nombre'] }],
            order: [['nombre', 'ASC']]
        });
        res.json(grupos);
    } catch (error) {
        console.error('Error al buscar grupo:', error);
        res.status(500).json({ error: 'Error al buscar grupo' });
    }
};

const listarPorPromotor = async (req, res) => {
    try {
        const grupos = await Grupo.findAll({
            where: { id_promotor: req.params.idPromotor, activo: true },
            include: [{ model: Promotor, attributes: ['id_promotor', 'nombre'] }],
            order: [['nombre', 'ASC']]
        });
        res.json(grupos);
    } catch (error) {
        console.error('Error al listar grupos:', error);
        res.status(500).json({ error: 'Error al listar grupos' });
    }
};

const crear = async (req, res) => {
    try {
        const { nombre, descripcion, id_promotor } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const grupo = await Grupo.create({
            nombre, descripcion, id_promotor, activo: true
        });

        res.status(201).json({ mensaje: 'Grupo creado exitosamente', grupo });
    } catch (error) {
        console.error('Error al crear grupo:', error);
        res.status(500).json({ error: 'Error al crear grupo' });
    }
};

const actualizar = async (req, res) => {
    try {
        const grupo = await Grupo.findByPk(req.params.id);
        if (!grupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        const { nombre, descripcion, id_promotor, activo } = req.body;
        await grupo.update({ nombre, descripcion, id_promotor, activo });

        res.json({ mensaje: 'Grupo actualizado exitosamente', grupo });
    } catch (error) {
        console.error('Error al actualizar grupo:', error);
        res.status(500).json({ error: 'Error al actualizar grupo' });
    }
};

const eliminar = async (req, res) => {
    try {
        const grupo = await Grupo.findByPk(req.params.id);
        if (!grupo) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        await grupo.update({ activo: false });
        res.json({ mensaje: 'Grupo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar grupo:', error);
        res.status(500).json({ error: 'Error al eliminar grupo' });
    }
};

const contarClientes = async (req, res) => {
    try {
        const count = await Cliente.count({
            where: { id_grupo: req.params.id, activo: true }
        });
        res.json({ total: count });
    } catch (error) {
        console.error('Error al contar clientes:', error);
        res.status(500).json({ error: 'Error al contar clientes' });
    }
};

module.exports = { listar, listarTodos, buscarPorId, buscarPorNombre, listarPorPromotor, crear, actualizar, eliminar, contarClientes };