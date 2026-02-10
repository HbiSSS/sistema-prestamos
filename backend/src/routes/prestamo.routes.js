const { Router } = require('express');
const { verificarToken } = require('../middleware/auth');
const {
    crear, aprobar, liquidar, cancelar, actualizar,
    buscarPorId, listar, listarPorEstado, listarActivos,
    listarPorCliente, buscarActivosPorCliente, obtenerPrestamoActivo,
    listarConMora, actualizarContadores, obtenerResumenCartera, revertirASolicitado
} = require('../controllers/prestamo.controller');

const router = Router();

router.use(verificarToken);

router.get('/', listar);                                         // GET /api/prestamos
router.get('/activos', listarActivos);                            // GET /api/prestamos/activos
router.get('/mora', listarConMora);                               // GET /api/prestamos/mora
router.get('/resumen', obtenerResumenCartera);                    // GET /api/prestamos/resumen
router.get('/buscar-activos', buscarActivosPorCliente);           // GET /api/prestamos/buscar-activos?nombre=Juan
router.get('/estado/:estado', listarPorEstado);                   // GET /api/prestamos/estado/ACTIVO
router.get('/cliente/:idCliente', listarPorCliente);              // GET /api/prestamos/cliente/1
router.get('/cliente/:idCliente/activo', obtenerPrestamoActivo);  // GET /api/prestamos/cliente/1/activo
router.get('/:id', buscarPorId);                                  // GET /api/prestamos/5
router.post('/', crear);                                          // POST /api/prestamos
router.put('/:id', actualizar);                                   // PUT /api/prestamos/5
router.put('/:id/aprobar', aprobar);                              // PUT /api/prestamos/5/aprobar
router.put('/:id/liquidar', liquidar);                            // PUT /api/prestamos/5/liquidar
router.put('/:id/cancelar', cancelar);                            // PUT /api/prestamos/5/cancelar
router.put('/:id/contadores', actualizarContadores);              // PUT /api/prestamos/5/contadores
router.put('/:id/revertir', revertirASolicitado);

module.exports = router;