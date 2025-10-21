// MÓDULOS REQUERIDOS
const crypto = require('crypto'); // Para hashear contraseñas
const database = require('./database'); // Módulo de base de datos

// VARIABLES GLOBALES
const algoritmo_hash = 'sha256'; // Algoritmo para hashear contraseñas

// FUNCIONES
// Genera un hash seguro para la contraseña
function hashear_contrasena(contrasena) {
    return crypto.createHash(algoritmo_hash).update(contrasena).digest('hex');
}

// Registra un nuevo usuario en el sistema
function registrar_usuario(datos_usuario) {
    // Verificar si el correo ya está registrado
    const usuarios = database.leer_usuarios();

    if (usuarios.some(usuario => usuario.correo === datos_usuario.correo)) {
        return { exito: false, mensaje: 'El correo electrónico ya está registrado' };
    }

    // Crear nuevo usuario
    const nuevo_usuario = {
        id: Date.now(), // ID único basado en timestamp
        grupo: datos_usuario.grupo,
        nombre: datos_usuario.nombre,
        apellido_paterno: datos_usuario.apellido_paterno,
        apellido_materno: datos_usuario.apellido_materno,
        fecha_nacimiento: datos_usuario.fecha_nacimiento,
        genero: datos_usuario.genero,
        telefono: datos_usuario.telefono,
        estudios: datos_usuario.estudios,
        experiencia: datos_usuario.experiencia,
        habilidades: datos_usuario.habilidades,
        correo: datos_usuario.correo,
        contrasena: hashear_contrasena(datos_usuario.contrasena),
        fecha_registro: new Date().toISOString()
    };

    // Guardar usuario en la base de datos
    usuarios.push(nuevo_usuario);
    database.escribir_usuarios(usuarios);

    return { exito: true, mensaje: 'Usuario registrado exitosamente' };
}

// Inicia sesión de un usuario existente
function iniciar_sesion(correo_usuario, contrasena_usuario) {
    // Obtener usuarios de la base de datos
    const usuarios = database.leer_usuarios();

    // Buscar usuario por correo
    const usuario = usuarios.find(u => u.correo === correo_usuario);

    if (!usuario) {
        return { exito: false, mensaje: 'Correo o contraseña incorrectos' };
    }

    // Verificar contraseña
    if (usuario.contrasena !== hashear_contrasena(contrasena_usuario)) {
        return { exito: false, mensaje: 'Correo o contraseña incorrectos' };
    }

    // Devolver todos los datos necesarios del usuario
    return {
        exito: true,
        mensaje: 'Sesión iniciada correctamente',
        usuario: {
            id: usuario.id,
            grupo: usuario.grupo,
            nombre: usuario.nombre,
            apellido_paterno: usuario.apellido_paterno,
            apellido_materno: usuario.apellido_materno,
            fecha_nacimiento: usuario.fecha_nacimiento,
            genero: usuario.genero,
            telefono: usuario.telefono,
            estudios: usuario.estudios,
            experiencia: usuario.experiencia,
            habilidades: usuario.habilidades,
            correo: usuario.correo,
            fecha_registro: usuario.fecha_registro
        }
    };
}

// EXPORTAR FUNCIONES
module.exports = {
    registrar_usuario,
    iniciar_sesion
};