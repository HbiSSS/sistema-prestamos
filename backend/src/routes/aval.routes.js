const { Router } = require('express');
const { verificarToken } = require('../middleware/auth');
const {
    listar, listarTodos, buscarPorId, buscarPorNombre,
    buscarPorTelefono, crear, actualizar, eliminar, contarClientes
} = require('../controllers/aval.controller');

const router = Router();

router.use(verificarToken);

router.get('/', listar);                          // GET /api/avales
router.get('/todos', listarTodos);                 // GET /api/avales/todos
router.get('/buscar', buscarPorNombre);            // GET /api/avales/buscar?nombre=Juan
router.get('/buscar-telefono', buscarPorTelefono); // GET /api/avales/buscar-telefono?telefono=123
router.get('/:id', buscarPorId);                   // GET /api/avales/5
router.get('/:id/clientes/count', contarClientes); // GET /api/avales/5/clientes/count
router.post('/', crear);                           // POST /api/avales
router.put('/:id', actualizar);                    // PUT /api/avales/5
router.delete('/:id', eliminar);                   // DELETE /api/avales/5

module.exports = router;