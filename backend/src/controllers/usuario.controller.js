const Usuario = require('../models/Usuario');
const Rol = require('../models/Rol');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const listar = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            include: [{ model: Rol, attributes: ['nombre'] }],
            order: [['activo', 'DESC'], ['nombre_completo', 'ASC']]
        });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const buscarPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            include: [{ model: Rol, attributes: ['nombre'] }]
        });
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const crear = async (req, res) => {
    try {
        const { username, password, nombre_completo, email, id_rol } = req.body;

        const existe = await Usuario.findOne({ where: { username } });
        if (existe) return res.status(400).json({ error: 'El username ya existe' });

        const hash = await bcrypt.hash(password, 10);
        const usuario = await Usuario.create({
            username, password: hash, nombre_completo, email, id_rol
        });
        res.status(201).json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const actualizar = async (req, res) => {
    try {
        const { username, nombre_completo, email, id_rol, activo } = req.body;
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Verificar username único excluyendo el actual
        const existe = await Usuario.findOne({
            where: { username, id_usuario: { [Op.ne]: req.params.id } }
        });
        if (existe) return res.status(400).json({ error: 'El username ya existe' });

        await usuario.update({
            username, nombre_completo, email, id_rol, activo,
            fecha_modificacion: new Date()
        });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const hash = await bcrypt.hash(password, 10);
        await usuario.update({ password: hash, fecha_modificacion: new Date() });
        res.json({ mensaje: 'Contraseña actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const eliminar = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        await usuario.update({ activo: false, fecha_modificacion: new Date() });
        res.json({ mensaje: 'Usuario desactivado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const listarRoles = async (req, res) => {
    try {
        const roles = await Rol.findAll({
            where: { activo: true },
            order: [['id_rol', 'ASC']]
        });
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { listar, buscarPorId, crear, actualizar, cambiarPassword, eliminar, listarRoles };