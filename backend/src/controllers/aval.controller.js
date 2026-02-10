const { Op } = require('sequelize');
const { Aval, Cliente } = require('../models');

const listar = async (req, res) => {
    try {
        const avales = await Aval.findAll({
            where: { activo: true },
            order: [['nombre', 'ASC']]
        });
        res.json(avales);
    } catch (error) {
        console.error('Error al listar avales:', error);
        res.status(500).json({ error: 'Error al listar avales' });
    }
};

const listarTodos = async (req, res) => {
    try {
        const avales = await Aval.findAll({
            order: [['activo', 'DESC'], ['nombre', 'ASC']]
        });
        res.json(avales);
    } catch (error) {
        console.error('Error al listar avales:', error);
        res.status(500).json({ error: 'Error al listar avales' });
    }
};

const buscarPorId = async (req, res) => {
    try {
        const aval = await Aval.findByPk(req.params.id);
        if (!aval) {
            return res.status(404).json({ error: 'Aval no encontrado' });
        }
        res.json(aval);
    } catch (error) {
        console.error('Error al buscar aval:', error);
        res.status(500).json({ error: 'Error al buscar aval' });
    }
};

const buscarPorNombre = async (req, res) => {
    try {
        const { nombre } = req.query;
        const avales = await Aval.findAll({
            where: {
                nombre: { [Op.like]: `%${nombre}%` },
                activo: true
            },
            order: [['nombre', 'ASC']]
        });
        res.json(avales);
    } catch (error) {
        console.error('Error al buscar aval:', error);
        res.status(500).json({ error: 'Error al buscar aval' });
    }
};

const buscarPorTelefono = async (req, res) => {
    try {
        const { telefono } = req.query;
        const avales = await Aval.findAll({
            where: {
                telefono: { [Op.like]: `%${telefono}%` },
                activo: true
            },
            order: [['nombre', 'ASC']]
        });
        res.json(avales);
    } catch (error) {
        console.error('Error al buscar aval:', error);
        res.status(500).json({ error: 'Error al buscar aval' });
    }
};

const crear = async (req, res) => {
    try {
        const { nombre, direccion, telefono } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const aval = await Aval.create({
            nombre, direccion, telefono, activo: true
        });

        res.status(201).json({ mensaje: 'Aval creado exitosamente', aval });
    } catch (error) {
        console.error('Error al crear aval:', error);
        res.status(500).json({ error: 'Error al crear aval' });
    }
};

const actualizar = async (req, res) => {
    try {
        const aval = await Aval.findByPk(req.params.id);
        if (!aval) {
            return res.status(404).json({ error: 'Aval no encontrado' });
        }

        const { nombre, direccion, telefono, activo } = req.body;
        await aval.update({
            nombre, direccion, telefono, activo,
            fecha_modificacion: new Date()
        });

        res.json({ mensaje: 'Aval actualizado exitosamente', aval });
    } catch (error) {
        console.error('Error al actualizar aval:', error);
        res.status(500).json({ error: 'Error al actualizar aval' });
    }
};

const eliminar = async (req, res) => {
    try {
        const aval = await Aval.findByPk(req.params.id);
        if (!aval) {
            return res.status(404).json({ error: 'Aval no encontrado' });
        }

        await aval.update({ activo: false });
        res.json({ mensaje: 'Aval eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar aval:', error);
        res.status(500).json({ error: 'Error al eliminar aval' });
    }
};

const contarClientes = async (req, res) => {
    try {
        const count = await Cliente.count({
            where: { id_aval: req.params.id, activo: true }
        });
        res.json({ total: count });
    } catch (error) {
        console.error('Error al contar clientes:', error);
        res.status(500).json({ error: 'Error al contar clientes' });
    }
};

module.exports = { listar, listarTodos, buscarPorId, buscarPorNombre, buscarPorTelefono, crear, actualizar, eliminar, contarClientes };