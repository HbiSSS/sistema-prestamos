const { Router } = require('express');
const { listar, buscarPorId, crear, actualizar, cambiarPassword, eliminar, listarRoles } = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middleware/auth');

const router = Router();

// Todas las rutas requieren SUPERUSUARIO
router.use(verificarToken, verificarRol('SUPER_ADMIN'));

router.get('/', listar);
router.get('/roles', listarRoles);
router.get('/:id', buscarPorId);
router.post('/', crear);
router.put('/:id', actualizar);
router.put('/:id/password', cambiarPassword);
router.delete('/:id', eliminar);

module.exports = router;