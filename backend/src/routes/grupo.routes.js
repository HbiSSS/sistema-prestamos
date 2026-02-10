const { Router } = require('express');
const { verificarToken } = require('../middleware/auth');
const {
    listar, listarTodos, buscarPorId, buscarPorNombre,
    listarPorPromotor, crear, actualizar, eliminar, contarClientes
} = require('../controllers/grupo.controller');

const router = Router();

router.use(verificarToken);

router.get('/', listar);                                // GET /api/grupos
router.get('/todos', listarTodos);                       // GET /api/grupos/todos
router.get('/buscar', buscarPorNombre);                  // GET /api/grupos/buscar?nombre=Norte
router.get('/promotor/:idPromotor', listarPorPromotor);  // GET /api/grupos/promotor/5
router.get('/:id', buscarPorId);                         // GET /api/grupos/3
router.get('/:id/clientes/count', contarClientes);       // GET /api/grupos/3/clientes/count
router.post('/', crear);                                 // POST /api/grupos
router.put('/:id', actualizar);                          // PUT /api/grupos/3
router.delete('/:id', eliminar);                         // DELETE /api/grupos/3

module.exports = router;