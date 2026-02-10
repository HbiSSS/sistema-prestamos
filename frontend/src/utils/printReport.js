/**
 * Abre una ventana nueva con contenido HTML formateado y lanza impresión / guardar PDF.
 * @param {string} titulo - Título del reporte
 * @param {string} htmlContenido - HTML del cuerpo (tablas, resumen, etc.)
 */
export const printReport = (titulo, htmlContenido) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
        alert('Permite las ventanas emergentes para imprimir');
        return;
    }

    win.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>${titulo}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { font-size: 18px; margin-bottom: 4px; }
        .header p { font-size: 12px; color: #666; }
        .resumen { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
        .resumen-item { flex: 1; min-width: 120px; border: 1px solid #ddd; border-radius: 6px; padding: 10px; text-align: center; }
        .resumen-item .label { font-size: 10px; color: #666; text-transform: uppercase; }
        .resumen-item .valor { font-size: 16px; font-weight: bold; margin-top: 4px; }
        .verde { color: #16a34a; }
        .amarillo { color: #ca8a04; }
        .rojo { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background: #f3f4f6; padding: 8px 6px; text-align: left; font-size: 11px; border-bottom: 2px solid #ddd; }
        td { padding: 6px; border-bottom: 1px solid #eee; font-size: 11px; }
        tr:hover { background: #fafafa; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
        .badge-pagada { background: #dcfce7; color: #16a34a; }
        .badge-pendiente { background: #fef9c3; color: #ca8a04; }
        .badge-vencida { background: #fee2e2; color: #dc2626; }
        .dia-header { background: #e5e7eb; font-weight: bold; }
        .footer { margin-top: 15px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
        .totales { background: #f9fafb; font-weight: bold; }
        @media print {
            body { padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align:center;margin-bottom:15px;">
        <button onclick="window.print()" style="padding:8px 24px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
            🖨️ Imprimir / Guardar PDF
        </button>
        <button onclick="window.close()" style="padding:8px 24px;background:#6b7280;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;margin-left:8px;">
            Cerrar
        </button>
    </div>
    ${htmlContenido}
    <div class="footer">
        Generado el ${new Date().toLocaleString('es-MX')} — Sistema de Préstamos
    </div>
</body>
</html>`);

    win.document.close();
    // Auto-imprimir después de cargar
    win.onload = () => win.print();
};

/**
 * Formatea número a moneda MXN
 */
export const fmtMoney = (v) => {
    const n = parseFloat(v) || 0;
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
};

/**
 * Devuelve clase CSS del badge según estado
 */
export const badgeClass = (estado) => {
    const map = { PAGADA: 'badge-pagada', PENDIENTE: 'badge-pendiente', VENCIDA: 'badge-vencida' };
    return map[estado] || 'badge-pendiente';
};