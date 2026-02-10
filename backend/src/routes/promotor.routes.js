const { Router } = require('express');
const { verificarToken } = require('../middleware/auth');
const {
    listar, listarTodos, buscarPorId, buscarPorNombre,
    crear, actualizar, eliminar, contarClientes
} = require('../controllers/promotor.controller');

const router = Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

router.get('/', listar);                          // GET /api/promotores
router.get('/todos', listarTodos);                 // GET /api/promotores/todos
router.get('/buscar', buscarPorNombre);            // GET /api/promotores/buscar?nombre=Juan
router.get('/:id', buscarPorId);                   // GET /api/promotores/5
router.get('/:id/clientes/count', contarClientes); // GET /api/promotores/5/clientes/count
router.post('/', crear);                           // POST /api/promotores
router.put('/:id', actualizar);                    // PUT /api/promotores/5
router.delete('/:id', eliminar);                   // DELETE /api/promotores/5

module.exports = router;