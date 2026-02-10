const { Router } = require('express');
const { verificarToken } = require('../middleware/auth');
const {
    listar, listarTodos, listarClientesConPrestamo,
    buscarPorId, buscarPorNombre, buscarPorTelefono,
    listarPorPromotor, listarPorGrupo, listarDisponiblesParaPrestamo,
    crear, actualizar, eliminar, tienePrestamoActivo, contarPrestamos
} = require('../controllers/cliente.controller');

const router = Router();

router.use(verificarToken);

router.get('/', listar);                                        // GET /api/clientes
router.get('/todos', listarTodos);                               // GET /api/clientes/todos
router.get('/con-prestamo', listarClientesConPrestamo);          // GET /api/clientes/con-prestamo
router.get('/disponibles', listarDisponiblesParaPrestamo);       // GET /api/clientes/disponibles
router.get('/buscar', buscarPorNombre);                          // GET /api/clientes/buscar?nombre=Juan
router.get('/buscar-telefono', buscarPorTelefono);               // GET /api/clientes/buscar-telefono?telefono=449
router.get('/promotor/:idPromotor', listarPorPromotor);          // GET /api/clientes/promotor/5
router.get('/grupo/:idGrupo', listarPorGrupo);                   // GET /api/clientes/grupo/3
router.get('/:id', buscarPorId);                                 // GET /api/clientes/1
router.get('/:id/prestamo-activo', tienePrestamoActivo);         // GET /api/clientes/1/prestamo-activo
router.get('/:id/prestamos/count', contarPrestamos);             // GET /api/clientes/1/prestamos/count
router.post('/', crear);                                         // POST /api/clientes
router.put('/:id', actualizar);                                  // PUT /api/clientes/1
router.delete('/:id', eliminar);                                 // DELETE /api/clientes/1

module.exports = router;