const { Router } = require('express');
const { login, registrar, perfil, cambiarPassword } = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth');

const router = Router();

// Rutas públicas (no necesitan token)
router.post('/login', login);
router.post('/registrar', registrar);

// Rutas protegidas (necesitan token)
router.get('/perfil', verificarToken, perfil);
router.put('/cambiar-password', verificarToken, cambiarPassword);

module.exports = router;