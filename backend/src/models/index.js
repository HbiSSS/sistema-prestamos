const { sequelize } = require('../config/database');
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Promotor = require('./Promotor');
const Aval = require('./Aval');
const Grupo = require('./Grupo');
const Cliente = require('./Cliente');
const Prestamo = require('./Prestamo');
const Cuota = require('./Cuota');

// ==================== RELACIONES ====================

// Rol - Usuario
Rol.hasMany(Usuario, { foreignKey: 'id_rol' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });

// Promotor - Grupo
Promotor.hasMany(Grupo, { foreignKey: 'id_promotor' });
Grupo.belongsTo(Promotor, { foreignKey: 'id_promotor' });

// Promotor - Cliente
Promotor.hasMany(Cliente, { foreignKey: 'id_promotor' });
Cliente.belongsTo(Promotor, { foreignKey: 'id_promotor' });

// Grupo - Cliente
Grupo.hasMany(Cliente, { foreignKey: 'id_grupo' });
Cliente.belongsTo(Grupo, { foreignKey: 'id_grupo' });

// Aval - Cliente
Aval.hasMany(Cliente, { foreignKey: 'id_aval' });
Cliente.belongsTo(Aval, { foreignKey: 'id_aval' });

// Cliente - Prestamo
Cliente.hasMany(Prestamo, { foreignKey: 'id_cliente' });
Prestamo.belongsTo(Cliente, { foreignKey: 'id_cliente' });

// Prestamo - Cuota
Prestamo.hasMany(Cuota, { foreignKey: 'id_prestamo' });
Cuota.belongsTo(Prestamo, { foreignKey: 'id_prestamo' });

// Usuario - Prestamo (quien registró)
Usuario.hasMany(Prestamo, { foreignKey: 'id_usuario_registro' });
Prestamo.belongsTo(Usuario, { foreignKey: 'id_usuario_registro' });

module.exports = {
    sequelize,
    Rol,
    Usuario,
    Promotor,
    Aval,
    Grupo,
    Cliente,
    Prestamo,
    Cuota
};