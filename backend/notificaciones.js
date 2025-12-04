// MÓDULOS REQUERIDOS
const database = require('./database'); // Módulo de base de datos

// FUNCIONES
// Crea una nueva notificación
function crear_notificacion(id_usuario, tipo, titulo, mensaje, datos_adicionales = {}) {
    // Obtener notificaciones existentes
    const notificaciones = database.leer_notificaciones();
    
    // Crear nueva notificación
    const nueva_notificacion = {
        id: Date.now(), // ID único basado en timestamp
        id_usuario: id_usuario,
        tipo: tipo, // 'info', 'success', 'warning', 'error'
        titulo: titulo,
        mensaje: mensaje,
        leida: false,
        fecha_creacion: new Date().toISOString(),
        ...datos_adicionales
    };
    
    // Agregar a la lista
    notificaciones.push(nueva_notificacion);
    
    // Guardar en el archivo
    database.escribir_notificaciones(notificaciones);
    
    return nueva_notificacion;
}

// Obtiene todas las notificaciones de un usuario
function obtener_notificaciones_usuario(id_usuario, solo_no_leidas = false) {
    // Obtener notificaciones
    const notificaciones = database.leer_notificaciones();
    
    // Filtrar por usuario y estado de lectura
    return notificaciones.filter(notificacion => {
        if (notificacion.id_usuario !== id_usuario) {
            return false;
        }
        
        if (solo_no_leidas && notificacion.leida) {
            return false;
        }
        
        return true;
    });
}

// Marca una notificación como leída
function marcar_como_leida(id_notificacion) {
    // Obtener notificaciones
    const notificaciones = database.leer_notificaciones();
    
    // Buscar y actualizar la notificación
    const indice = notificaciones.findIndex(n => n.id === id_notificacion);
    
    if (indice !== -1) {
        notificaciones[indice].leida = true;
        database.escribir_notificaciones(notificaciones);
        return true;
    }
    
    return false;
}

// Marca todas las notificaciones de un usuario como leídas
function marcar_todas_como_leidas(id_usuario) {
    // Obtener notificaciones
    const notificaciones = database.leer_notificaciones();
    
    // Actualizar notificaciones del usuario
    let actualizadas = false;
    
    for (let i = 0; i < notificaciones.length; i++) {
        if (notificaciones[i].id_usuario === id_usuario && !notificaciones[i].leida) {
            notificaciones[i].leida = true;
            actualizadas = true;
        }
    }
    
    if (actualizadas) {
        database.escribir_notificaciones(notificaciones);
    }
    
    return actualizadas;
}

// Elimina una notificación
function eliminar_notificacion(id_notificacion) {
    // Obtener notificaciones
    const notificaciones = database.leer_notificaciones();
    
    // Filtrar para eliminar la notificación
    const nuevas_notificaciones = notificaciones.filter(n => n.id !== id_notificacion);
    
    // Verificar si se eliminó alguna
    if (nuevas_notificaciones.length < notificaciones.length) {
        database.escribir_notificaciones(nuevas_notificaciones);
        return true;
    }
    
    return false;
}

// Crea notificaciones específicas para eventos del sistema
function notificar_nuevo_usuario(id_usuario, nombre_usuario) {
    return crear_notificacion(
        id_usuario,
        'success',
        '¡Bienvenido a Setsuzoku!',
        `Hola ${nombre_usuario}, tu cuenta ha sido creada exitosamente.`
    );
}

function notificar_nueva_inscripcion_curso(id_instructor, nombre_curso, nombre_estudiante) {
    return crear_notificacion(
        id_instructor,
        'info',
        'Nueva inscripción',
        `${nombre_estudiante} se ha inscrito en tu curso "${nombre_curso}".`,
        { tipo_referencia: 'curso', id_referencia: nombre_curso }
    );
}

function notificar_nueva_postulacion(id_reclutador, nombre_vacante, nombre_candidato) {
    return crear_notificacion(
        id_reclutador,
        'info',
        'Nueva postulación',
        `${nombre_candidato} se ha postulado a tu vacante "${nombre_vacante}".`,
        { tipo_referencia: 'vacante', id_referencia: nombre_vacante }
    );
}

function notificar_vacante_aprobada(id_candidato, nombre_vacante, nombre_empresa) {
    return crear_notificacion(
        id_candidato,
        'success',
        '¡Buenas noticias!',
        `Tu postulación a "${nombre_vacante}" en ${nombre_empresa} ha sido aprobada.`,
        { tipo_referencia: 'vacante', id_referencia: nombre_vacante }
    );
}

// EXPORTAR FUNCIONES
module.exports = {
    crear_notificacion,
    obtener_notificaciones_usuario,
    marcar_como_leida,
    marcar_todas_como_leidas,
    eliminar_notificacion,
    notificar_nuevo_usuario,
    notificar_nueva_inscripcion_curso,
    notificar_nueva_postulacion,
    notificar_vacante_aprobada
};