const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username y password son requeridos' });
        }

        // Buscar usuario activo con su rol
        const usuario = await Usuario.findOne({
            where: { username, activo: true },
            include: [{ model: Rol, attributes: ['id_rol', 'nombre'] }]
        });

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Actualizar último acceso
        await usuario.update({ ultimo_acceso: new Date() });

        // Generar token JWT
        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                username: usuario.username,
                nombre: usuario.nombre_completo,
                rol: usuario.Rol.nombre,
                id_rol: usuario.id_rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id_usuario,
                username: usuario.username,
                nombre: usuario.nombre_completo,
                email: usuario.email,
                rol: usuario.Rol.nombre
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const registrar = async (req, res) => {
    try {
        const { username, password, nombre_completo, email, id_rol } = req.body;

        if (!username || !password || !nombre_completo || !id_rol) {
            return res.status(400).json({ error: 'Campos obligatorios: username, password, nombre_completo, id_rol' });
        }

        // Verificar si el username ya existe
        const existe = await Usuario.findOne({ where: { username } });
        if (existe) {
            return res.status(400).json({ error: 'El username ya está registrado' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const usuario = await Usuario.create({
            username,
            password: passwordHash,
            nombre_completo,
            email,
            id_rol,
            activo: true
        });

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: {
                id: usuario.id_usuario,
                username: usuario.username,
                nombre: usuario.nombre_completo
            }
        });

    } catch (error) {
        console.error('Error al registrar:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const perfil = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: { exclude: ['password'] },
            include: [{ model: Rol, attributes: ['id_rol', 'nombre'] }]
        });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const cambiarPassword = async (req, res) => {
    try {
        const { password_actual, password_nueva } = req.body;

        if (!password_actual || !password_nueva) {
            return res.status(400).json({ error: 'Password actual y nueva son requeridos' });
        }

        const usuario = await Usuario.findByPk(req.usuario.id);

        const passwordValida = await bcrypt.compare(password_actual, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password_nueva, salt);

        await usuario.update({ password: passwordHash });

        res.json({ mensaje: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Error al cambiar password:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { login, registrar, perfil, cambiarPassword };