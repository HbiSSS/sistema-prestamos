const { Router } = require('express');
const { verificarToken } = require('../middleware/auth');
const {
    buscarPorId, listarPorPrestamo, listarPendientesPorPrestamo,
    obtenerProximaCuota, registrarPago, registrarPagoConHistorial,
    actualizarCuotasVencidas, listarCuotasSemanaPromotor,
    listarTodasVencidas, listarCarteraVencida, listarResumenCobranza,
    reporteSemanal
} = require('../controllers/cuota.controller');

const router = Router();

router.use(verificarToken);

router.get('/vencidas', listarTodasVencidas);                          // GET /api/cuotas/vencidas
router.get('/cartera-vencida', listarCarteraVencida);                  // GET /api/cuotas/cartera-vencida?idPromotor=1
router.get('/resumen-cobranza', listarResumenCobranza);                // GET /api/cuotas/resumen-cobranza
router.get('/semana', listarCuotasSemanaPromotor);                     // GET /api/cuotas/semana?idPromotor=1&fechaInicio=...&fechaFin=...
router.put('/actualizar-vencidas', actualizarCuotasVencidas);          // PUT /api/cuotas/actualizar-vencidas
router.get('/prestamo/:idPrestamo', listarPorPrestamo);                // GET /api/cuotas/prestamo/5
router.get('/prestamo/:idPrestamo/pendientes', listarPendientesPorPrestamo); // GET /api/cuotas/prestamo/5/pendientes
router.get('/prestamo/:idPrestamo/proxima', obtenerProximaCuota);
router.get('/reporte-semanal', reporteSemanal)// GET /api/cuotas/prestamo/5/proxima
router.get('/:id', buscarPorId);                                       // GET /api/cuotas/10
router.put('/:id/pagar', registrarPago);                               // PUT /api/cuotas/10/pagar
router.put('/:id/pagar-historial', registrarPagoConHistorial);         // PUT /api/cuotas/10/pagar-historial

module.exports = router;