// MÓDULOS REQUERIDOS
const fs = require('fs'); // Sistema de archivos
const path = require('path'); // Manejo de rutas

// VARIABLES GLOBALES
const ruta_usuarios = path.join(__dirname, '..', 'data', 'usuarios.json');
const ruta_cursos = path.join(__dirname, '..', 'data', 'cursos.json');
const ruta_trabajos = path.join(__dirname, '..', 'data', 'trabajos.json');
const ruta_inscripciones = path.join(__dirname, '..', 'data', 'inscripciones_cursos.json');
const ruta_postulaciones = path.join(__dirname, '..', 'data', 'postulaciones.json');

// FUNCIONES
// Lee el archivo de usuarios y devuelve los datos
function leer_usuarios() {
    try {
        if (fs.existsSync(ruta_usuarios)) {
            const datos = fs.readFileSync(ruta_usuarios, 'utf8');
            return JSON.parse(datos);
        }
    } catch (error) {
        console.error('Error al leer usuarios:', error);
    }
    return [];
}

// Escribe los usuarios en el archivo
function escribir_usuarios(usuarios) {
    try {
        fs.writeFileSync(ruta_usuarios, JSON.stringify(usuarios, null, 2));
        return true;
    } catch (error) {
        console.error('Error al escribir usuarios:', error);
        return false;
    }
}

// Lee el archivo de cursos
function leer_cursos() {
    try {
        if (fs.existsSync(ruta_cursos)) {
            const datos = fs.readFileSync(ruta_cursos, 'utf8');
            return JSON.parse(datos);
        }
    } catch (error) {
        console.error('Error al leer cursos:', error);
    }
    return [];
}

// Escribe los cursos en el archivo
function escribir_cursos(cursos) {
    try {
        fs.writeFileSync(ruta_cursos, JSON.stringify(cursos, null, 2));
        return true;
    } catch (error) {
        console.error('Error al escribir cursos:', error);
        return false;
    }
}

// Lee el archivo de trabajos
function leer_trabajos() {
    try {
        if (fs.existsSync(ruta_trabajos)) {
            const datos = fs.readFileSync(ruta_trabajos, 'utf8');
            return JSON.parse(datos);
        }
    } catch (error) {
        console.error('Error al leer trabajos:', error);
    }
    return [];
}

// Escribe los trabajos en el archivo
function escribir_trabajos(trabajos) {
    try {
        fs.writeFileSync(ruta_trabajos, JSON.stringify(trabajos, null, 2));
        return true;
    } catch (error) {
        console.error('Error al escribir trabajos:', error);
        return false;
    }
}

// Lee el archivo de inscripciones
function leer_inscripciones() {
    try {
        if (fs.existsSync(ruta_inscripciones)) {
            const datos = fs.readFileSync(ruta_inscripciones, 'utf8');
            return JSON.parse(datos);
        }
    } catch (error) {
        console.error('Error al leer inscripciones:', error);
    }
    return [];
}

// Escribe las inscripciones en el archivo
function escribir_inscripciones(inscripciones) {
    try {
        fs.writeFileSync(ruta_inscripciones, JSON.stringify(inscripciones, null, 2));
        return true;
    } catch (error) {
        console.error('Error al escribir inscripciones:', error);
        return false;
    }
}

// Lee el archivo de postulaciones
function leer_postulaciones() {
    try {
        if (fs.existsSync(ruta_postulaciones)) {
            const datos = fs.readFileSync(ruta_postulaciones, 'utf8');
            return JSON.parse(datos);
        }
    } catch (error) {
        console.error('Error al leer postulaciones:', error);
    }
    return [];
}

// Escribe las postulaciones en el archivo
function escribir_postulaciones(postulaciones) {
    try {
        fs.writeFileSync(ruta_postulaciones, JSON.stringify(postulaciones, null, 2));
        return true;
    } catch (error) {
        console.error('Error al escribir postulaciones:', error);
        return false;
    }
}

// EXPORTAR FUNCIONES
module.exports = {
    leer_usuarios,
    escribir_usuarios,
    leer_cursos,
    escribir_cursos,
    leer_trabajos,
    escribir_trabajos,
    leer_inscripciones,
    escribir_inscripciones,
    leer_postulaciones,
    escribir_postulaciones
};