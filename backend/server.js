// MÓDULOS REQUERIDOS
const http = require('http'); // Servidor HTTP
const fs = require('fs'); // Sistema de archivos
const path = require('path'); // Manejo de rutas
const url = require('url'); // Parseo de URLs
const auth = require('./auth'); // Módulo de autenticación
const database = require('./database'); // Módulo de base de datos
const notificaciones = require('./notificaciones'); // Módulo de notificaciones

// VARIABLES GLOBALES
const puerto = 8000; // Puerto del servidor

// FUNCIONES
// Maneja las peticiones POST para registro e inicio de sesión
function manejar_peticion_post(peticion, respuesta, ruta_parseada) {
    let cuerpo = '';

    // Recibir datos del formulario
    peticion.on('data', chunk => {
        cuerpo += chunk.toString();
    });

    // Procesar datos cuando se complete la recepción
    peticion.on('end', () => {
        const parametros = new URLSearchParams(cuerpo);

        // Manejar registro de usuario
        if (ruta_parseada.pathname === '/registro') {
            // Extraer todos los parámetros del formulario
            const datos_usuario = {
                grupo: parametros.get('grupo'),
                nombre: parametros.get('nombre'),
                apellido_paterno: parametros.get('apellido_paterno'),
                apellido_materno: parametros.get('apellido_materno'),
                fecha_nacimiento: parametros.get('fecha_nacimiento'),
                genero: parametros.get('genero'),
                telefono: parametros.get('telefono'),
                estudios: parametros.get('estudios'),
                experiencia: parametros.get('experiencia'),
                habilidades: parametros.get('habilidades'),
                correo: parametros.get('correo'),
                contrasena: parametros.get('contrasena')
            };

            const resultado = auth.registrar_usuario(datos_usuario);

            if (resultado.exito) {
                console.log('Registro exitoso. Creando notificación de bienvenida...');
                console.log('Datos del nuevo usuario:', resultado.usuario);
                // Crear notificación de bienvenida para el nuevo usuario
                notificaciones.notificar_nuevo_usuario(
                    resultado.usuario.id,
                    resultado.usuario.nombre
                );

                // Redirigir a index con mensaje de éxito
                respuesta.writeHead(302, { 'Location': '/frontend/index.html?exito=1' });
                respuesta.end();
            } else {
                // Redirigir a registro con mensaje de error
                respuesta.writeHead(302, { 'Location': '/frontend/registro.html?error=1' });
                respuesta.end();
            }
        }

        // Manejar inicio de sesión
        else if (ruta_parseada.pathname === '/inicio-sesion') {
            const resultado = auth.iniciar_sesion(
                parametros.get('correo_usuario'),
                parametros.get('contrasena_usuario')
            );

            respuesta.setHeader('Content-Type', 'application/json');

            if (resultado.exito) {
                // Devolver datos del usuario en formato JSON
                respuesta.end(JSON.stringify(resultado));
            } else {
                // Devolver mensaje de error en formato JSON
                respuesta.end(JSON.stringify(resultado));
            }
        }
    });
}

// Maneja las peticiones a la API
function manejar_peticion_api(peticion, respuesta, ruta_parseada) {
    const metodo = peticion.method;
    const pathname = ruta_parseada.pathname;

    console.log(`Petición API recibida: ${metodo} ${pathname}`);

    // Configurar cabeceras para respuestas JSON
    respuesta.setHeader('Content-Type', 'application/json');

    // API para usuarios
    if (pathname.startsWith('/api/usuarios')) {
        if (pathname === '/api/usuarios' && metodo === 'GET') {
            console.log('Obteniendo todos los usuarios...');
            // Obtener todos los usuarios
            try {
                const usuarios = database.leer_usuarios();
                console.log(`Usuarios encontrados: ${usuarios.length}`);
                respuesta.end(JSON.stringify(usuarios));
            } catch (error) {
                console.error('Error al leer usuarios:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener los usuarios' }));
            }
        } 
        // ACTUALIZAR USUARIO POR ID
        else if (pathname.match(/^\/api\/usuarios\/\d+$/) && metodo === 'PUT') {
            const usuario_id = parseInt(pathname.split('/').pop());
            let cuerpo = '';

            peticion.on('data', chunk => {
                cuerpo += chunk.toString();
            });

            peticion.on('end', () => {
                try {
                    const datos_actualizados = JSON.parse(cuerpo);
                    
                    // Leer usuarios existentes
                    let usuarios = database.leer_usuarios();
                    
                    // Encontrar índice del usuario
                    const indice = usuarios.findIndex(u => u.id === usuario_id);
                    
                    if (indice !== -1) {
                        // Mantener la contraseña original (no actualizar)
                        if (datos_actualizados.contrasena) {
                            delete datos_actualizados.contrasena;
                        }
                        
                        // Actualizar datos del usuario
                        usuarios[indice] = { 
                            ...usuarios[indice], 
                            ...datos_actualizados,
                            id: usuario_id // Asegurar que el ID no cambie
                        };
                        
                        // Guardar en archivo
                        database.escribir_usuarios(usuarios);
                        
                        respuesta.end(JSON.stringify({ 
                            exito: true, 
                            mensaje: 'Usuario actualizado correctamente',
                            usuario: usuarios[indice]
                        }));
                    } else {
                        respuesta.statusCode = 404;
                        respuesta.end(JSON.stringify({ exito: false, mensaje: 'Usuario no encontrado' }));
                    }
                } catch (error) {
                    console.error('Error al actualizar usuario:', error);
                    respuesta.statusCode = 500;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al actualizar el usuario' }));
                }
            });
        }
        // OBTENER USUARIO POR ID
        else if (pathname.match(/^\/api\/usuarios\/\d+$/) && metodo === 'GET') {
            const usuario_id = parseInt(pathname.split('/').pop());
            
            try {
                const usuarios = database.leer_usuarios();
                const usuario = usuarios.find(u => u.id === usuario_id);
                
                if (usuario) {
                    // No devolver la contraseña
                    const usuario_sin_contrasena = { ...usuario };
                    delete usuario_sin_contrasena.contrasena;
                    
                    respuesta.end(JSON.stringify(usuario_sin_contrasena));
                } else {
                    respuesta.statusCode = 404;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Usuario no encontrado' }));
                }
            } catch (error) {
                console.error('Error al obtener usuario:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener el usuario' }));
            }
        }
        else {
            console.log(`Ruta no encontrada: ${pathname}`);
            respuesta.statusCode = 404;
            respuesta.end(JSON.stringify({ exito: false, mensaje: 'Ruta no encontrada' }));
        }
    }

    // API para cursos
    else if (pathname.startsWith('/api/cursos')) {
        if (pathname === '/api/cursos' && metodo === 'GET') {
            console.log('Obteniendo todos los cursos...');
            // Obtener todos los cursos
            try {
                const cursos = database.leer_cursos();
                console.log(`Cursos encontrados: ${cursos.length}`);
                respuesta.end(JSON.stringify(cursos));
            } catch (error) {
                console.error('Error al leer cursos:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener los cursos' }));
            }
        } else if (pathname === '/api/cursos' && metodo === 'POST') {
            // Crear un nuevo curso
            let cuerpo = '';

            peticion.on('data', chunk => {
                cuerpo += chunk.toString();
            });

            peticion.on('end', () => {
                try {
                    const datosCurso = JSON.parse(cuerpo);
                    console.log('Datos del nuevo curso:', datosCurso);

                    // Leer cursos existentes
                    const cursos = database.leer_cursos();

                    // Generar nuevo ID
                    const nuevoId = cursos.length > 0 ? Math.max(...cursos.map(c => c.id)) + 1 : 1;

                    // Crear nuevo curso
                    const nuevoCurso = {
                        id: nuevoId,
                        ...datosCurso
                    };

                    // Agregar a la lista
                    cursos.push(nuevoCurso);

                    // Guardar en el archivo
                    database.escribir_cursos(cursos);

                    respuesta.end(JSON.stringify({ exito: true, mensaje: 'Curso creado correctamente', curso: nuevoCurso }));
                } catch (error) {
                    console.error('Error al crear curso:', error);
                    respuesta.statusCode = 500;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al crear el curso' }));
                }
            });
        } else {
            console.log(`Ruta no encontrada: ${pathname}`);
            respuesta.statusCode = 404;
            respuesta.end(JSON.stringify({ exito: false, mensaje: 'Ruta no encontrada' }));
        }
    }

    // APIs para trabajos
    else if (pathname.startsWith('/api/trabajos')) {
        if (pathname === '/api/trabajos' && metodo === 'GET') {
            // Obtener todos los trabajos
            try {
                const trabajos = database.leer_trabajos();
                respuesta.end(JSON.stringify(trabajos));
            } catch (error) {
                console.error('Error al leer trabajos:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener los trabajos' }));
            }
        } else if (pathname === '/api/trabajos' && metodo === 'POST') {
            // Crear un nuevo trabajo
            let cuerpo = '';

            peticion.on('data', chunk => {
                cuerpo += chunk.toString();
            });

            peticion.on('end', () => {
                try {
                    const datosTrabajo = JSON.parse(cuerpo);

                    // Leer trabajos existentes
                    const trabajos = database.leer_trabajos();

                    // Generar nuevo ID
                    const nuevoId = trabajos.length > 0 ? Math.max(...trabajos.map(t => t.id)) + 1 : 1;

                    // Crear nuevo trabajo
                    const nuevoTrabajo = {
                        id: nuevoId,
                        ...datosTrabajo
                    };

                    // Agregar a la lista
                    trabajos.push(nuevoTrabajo);

                    // Guardar en el archivo
                    database.escribir_trabajos(trabajos);

                    respuesta.end(JSON.stringify({ exito: true, mensaje: 'Trabajo creado correctamente', trabajo: nuevoTrabajo }));
                } catch (error) {
                    console.error('Error al crear trabajo:', error);
                    respuesta.statusCode = 500;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al crear el trabajo' }));
                }
            });
        } else if (pathname.match(/^\/api\/trabajos\/\d+$/)) {
            const trabajoId = parseInt(pathname.split('/').pop());

            if (metodo === 'GET') {
                // Obtener un trabajo específico
                try {
                    const trabajos = database.leer_trabajos();
                    const trabajo = trabajos.find(t => t.id === trabajoId);

                    if (trabajo) {
                        respuesta.end(JSON.stringify(trabajo));
                    } else {
                        respuesta.statusCode = 404;
                        respuesta.end(JSON.stringify({ exito: false, mensaje: 'Trabajo no encontrado' }));
                    }
                } catch (error) {
                    console.error('Error al obtener trabajo:', error);
                    respuesta.statusCode = 500;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener el trabajo' }));
                }
            } else if (metodo === 'PUT') {
                // Actualizar un trabajo
                let cuerpo = '';

                peticion.on('data', chunk => {
                    cuerpo += chunk.toString();
                });

                peticion.on('end', () => {
                    try {
                        const datosActualizados = JSON.parse(cuerpo);

                        // Leer trabajos existentes
                        let trabajos = database.leer_trabajos();

                        // Encontrar el índice del trabajo
                        const indice = trabajos.findIndex(t => t.id === trabajoId);

                        if (indice !== -1) {
                            // Actualizar el trabajo
                            trabajos[indice] = { ...trabajos[indice], ...datosActualizados };

                            // Guardar en el archivo
                            database.escribir_trabajos(trabajos);

                            respuesta.end(JSON.stringify({ exito: true, mensaje: 'Trabajo actualizado correctamente' }));
                        } else {
                            respuesta.statusCode = 404;
                            respuesta.end(JSON.stringify({ exito: false, mensaje: 'Trabajo no encontrado' }));
                        }
                    } catch (error) {
                        console.error('Error al actualizar trabajo:', error);
                        respuesta.statusCode = 500;
                        respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al actualizar el trabajo' }));
                    }
                });
            } else if (metodo === 'DELETE') {
                // Eliminar un trabajo
                try {
                    // Leer trabajos existentes
                    let trabajos = database.leer_trabajos();

                    // Filtrar para eliminar el trabajo
                    const trabajosFiltrados = trabajos.filter(t => t.id !== trabajoId);

                    if (trabajosFiltrados.length < trabajos.length) {
                        // Guardar en el archivo
                        database.escribir_trabajos(trabajosFiltrados);

                        respuesta.end(JSON.stringify({ exito: true, mensaje: 'Trabajo eliminado correctamente' }));
                    } else {
                        respuesta.statusCode = 404;
                        respuesta.end(JSON.stringify({ exito: false, mensaje: 'Trabajo no encontrado' }));
                    }
                } catch (error) {
                    console.error('Error al eliminar trabajo:', error);
                    respuesta.statusCode = 500;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al eliminar el trabajo' }));
                }
            } else {
                respuesta.statusCode = 405;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Método no permitido' }));
            }
        } else {
            respuesta.statusCode = 404;
            respuesta.end(JSON.stringify({ exito: false, mensaje: 'Ruta no encontrada' }));
        }
    }

    // API para notificaciones
    else if (pathname.startsWith('/api/notificaciones')) {
        if (pathname === '/api/notificaciones' && metodo === 'GET') {
            // Obtener notificaciones de un usuario
            const url_params = new URLSearchParams(ruta_parseada.search);
            const id_usuario = url_params.get('id_usuario');
            const solo_no_leidas = url_params.get('solo_no_leidas') === 'true';
            
            if (!id_usuario) {
                respuesta.statusCode = 400;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'ID de usuario requerido' }));
                return;
            }
            
            try {
                const notificaciones_usuario = notificaciones.obtener_notificaciones_usuario(parseInt(id_usuario), solo_no_leidas);
                respuesta.end(JSON.stringify(notificaciones_usuario));
            } catch (error) {
                console.error('Error al obtener notificaciones:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener las notificaciones' }));
            }
        } else if (pathname === '/api/notificaciones/marcar-leida' && metodo === 'POST') {
            // Marcar notificación como leída
            let cuerpo = '';

            peticion.on('data', chunk => {
                cuerpo += chunk.toString();
            });

            peticion.on('end', () => {
                try {
                    const datos = JSON.parse(cuerpo);
                    const id_notificacion = datos.id_notificacion;
                    
                    if (!id_notificacion) {
                        respuesta.statusCode = 400;
                        respuesta.end(JSON.stringify({ exito: false, mensaje: 'ID de notificación requerido' }));
                        return;
                    }
                    
                    const resultado = notificaciones.marcar_como_leida(parseInt(id_notificacion));
                    
                    if (resultado) {
                        respuesta.end(JSON.stringify({ exito: true, mensaje: 'Notificación marcada como leída' }));
                    } else {
                        respuesta.statusCode = 404;
                        respuesta.end(JSON.stringify({ exito: false, mensaje: 'Notificación no encontrada' }));
                    }
                } catch (error) {
                    console.error('Error al marcar notificación como leída:', error);
                    respuesta.statusCode = 500;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al marcar la notificación como leída' }));
                }
            });
        } else if (pathname === '/api/notificaciones/marcar-todas-leidas' && metodo === 'POST') {
            // Marcar todas las notificaciones de un usuario como leídas
            let cuerpo = '';

            peticion.on('data', chunk => {
                cuerpo += chunk.toString();
            });

            peticion.on('end', () => {
                try {
                    const datos = JSON.parse(cuerpo);
                    const id_usuario = datos.id_usuario;
                    
                    if (!id_usuario) {
                        respuesta.statusCode = 400;
                        respuesta.end(JSON.stringify({ exito: false, mensaje: 'ID de usuario requerido' }));
                        return;
                    }
                    
                    const resultado = notificaciones.marcar_todas_como_leidas(parseInt(id_usuario));
                    
                    if (resultado) {
                        respuesta.end(JSON.stringify({ exito: true, mensaje: 'Todas las notificaciones marcadas como leídas' }));
                    } else {
                        respuesta.end(JSON.stringify({ exito: true, mensaje: 'No había notificaciones sin leer' }));
                    }
                } catch (error) {
                    console.error('Error al marcar notificaciones como leídas:', error);
                    respuesta.statusCode = 500;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al marcar las notificaciones como leídas' }));
                }
            });
        } else if (pathname === '/api/notificaciones' && metodo === 'DELETE') {
            // Eliminar notificación
            const url_params = new URLSearchParams(ruta_parseada.search);
            const id_notificacion = url_params.get('id_notificacion');
            
            if (!id_notificacion) {
                respuesta.statusCode = 400;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'ID de notificación requerido' }));
                return;
            }
            
            try {
                const resultado = notificaciones.eliminar_notificacion(parseInt(id_notificacion));
                
                if (resultado) {
                    respuesta.end(JSON.stringify({ exito: true, mensaje: 'Notificación eliminada correctamente' }));
                } else {
                    respuesta.statusCode = 404;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Notificación no encontrada' }));
                }
            } catch (error) {
                console.error('Error al eliminar notificación:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al eliminar la notificación' }));
            }
        } else {
            respuesta.statusCode = 404;
            respuesta.end(JSON.stringify({ exito: false, mensaje: 'Ruta no encontrada' }));
        }
    }

    // APIs para inscripciones a cursos
    else if (pathname === '/api/inscripciones-cursos' && metodo === 'GET') {
        // Obtener todas las inscripciones
        try {
            const inscripciones = database.leer_inscripciones();
            respuesta.end(JSON.stringify(inscripciones));
        } catch (error) {
            console.error('Error al leer inscripciones:', error);
            respuesta.statusCode = 500;
            respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener las inscripciones' }));
        }
    }
    else if (pathname.match(/^\/api\/inscripciones-cursos\/\d+$/) && metodo === 'PUT') {
        // Actualizar una inscripción

        const inscripcionId = parseInt(pathname.split('/').pop());
        let cuerpo = '';

        peticion.on('data', chunk => {
            cuerpo += chunk.toString();
        });

        peticion.on('end', () => {
            try {
                const datosActualizados = JSON.parse(cuerpo);

                // Leer inscripciones existentes
                let inscripciones = database.leer_inscripciones();

                // Encontrar el índice de la inscripción
                const indice = inscripciones.findIndex(i => i.id === inscripcionId);

                if (indice !== -1) {
                    // Actualizar la inscripción
                    inscripciones[indice] = { ...inscripciones[indice], ...datosActualizados };

                    // Guardar en el archivo
                    database.escribir_inscripciones(inscripciones);

                    respuesta.end(JSON.stringify({ exito: true, mensaje: 'Inscripción actualizada correctamente' }));
                } else {
                    respuesta.statusCode = 404;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Inscripción no encontrada' }));
                }
            } catch (error) {
                console.error('Error al actualizar inscripción:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al actualizar la inscripción' })); 
            }
        });
    }
    else if (pathname === '/api/inscribir-curso' && metodo === 'POST') {
        console.log('Recibida petición para inscribirse en curso');
        let cuerpo = '';

        peticion.on('data', chunk => {
            cuerpo += chunk.toString();
        });

        peticion.on('end', () => {
            try {
                const datosInscripcion = JSON.parse(cuerpo);
                console.log('Datos de inscripción:', datosInscripcion);

                // Leer inscripciones existentes
                const inscripciones = database.leer_inscripciones();

                // Verificar si el usuario ya está inscrito en este curso
                const inscripcionExistente = inscripciones.find(
                    i => i.usuario_id === datosInscripcion.usuario_id && i.curso_id === datosInscripcion.curso_id
                );

                if (inscripcionExistente) {
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Ya estás inscrito en este curso' }));
                    return;
                }

                // Generar nuevo ID
                const nuevoId = inscripciones.length > 0 ? Math.max(...inscripciones.map(i => i.id)) + 1 : 1;

                // Crear nueva inscripción
                const nuevaInscripcion = {
                    id: nuevoId,
                    usuario_id: datosInscripcion.usuario_id,
                    curso_id: datosInscripcion.curso_id,
                    fecha_inscripcion: new Date().toISOString(),
                    estado: "en-curso",
                    progreso: 0
                };

                // Agregar a la lista
                inscripciones.push(nuevaInscripcion);

                // Guardar en el archivo
                database.escribir_inscripciones(inscripciones);

                // --- INICIO: CÓDIGO DE NOTIFICACIÓN (CORREGIDO) ---
                
                console.log('Inscripción exitosa. Buscando datos para la notificación...');
                console.log('ID del curso inscrito:', datosInscripcion.curso_id);
                console.log('ID del usuario inscrito:', datosInscripcion.usuario_id);

                // Obtener detalles del curso para encontrar al instructor
                const cursos = database.leer_cursos();
                const curso_inscrito = cursos.find(c => c.id === datosInscripcion.curso_id);

                console.log('Curso encontrado:', curso_inscrito);

                if (curso_inscrito && curso_inscrito.instructor_id) {
                    console.log('ID del instructor encontrado:', curso_inscrito.instructor_id);
                    
                    // Obtener detalles del estudiante
                    const usuarios = database.leer_usuarios();
                    const estudiante = usuarios.find(u => u.id === datosInscripcion.usuario_id);

                    console.log('Estudiante encontrado:', estudiante);

                    if (estudiante) {
                        console.log('Llamando a la función de notificación...');
                        // Crear notificación para el instructor
                        notificaciones.notificar_nueva_inscripcion_curso(
                            curso_inscrito.instructor_id,          // ID del instructor
                            curso_inscrito.titulo,                  // Nombre del curso
                            `${estudiante.nombre} ${estudiante.apellido_paterno}` // Nombre del estudiante
                        );
                        console.log('Función de notificación ejecutada.');
                    } else {
                        console.log('ERROR: No se encontró al estudiante con ID:', datosInscripcion.usuario_id);
                    }
                } else {
                    console.log('ERROR: No se encontró el curso o el curso no tiene instructor_id.');
                    console.log('curso_inscrito:', curso_inscrito);
                }

                // --- FIN: CÓDIGO DE NOTIFICACIÓN ---

                respuesta.end(JSON.stringify({ exito: true, mensaje: 'Inscripción realizada correctamente' }));
            } catch (error) {
                console.error('Error al inscribirse en curso:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al inscribirse en el curso' }));
            }
        });
    }

    // APIs para postulaciones a trabajos
    else if (pathname === '/api/postulaciones' && metodo === 'GET') {
        // Obtener todas las postulaciones
        try {
            const postulaciones = database.leer_postulaciones();
            respuesta.end(JSON.stringify(postulaciones));
        } catch (error) {
            console.error('Error al leer postulaciones:', error);
            respuesta.statusCode = 500;
            respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al obtener las postulaciones' }));
        }
    }
    else if (pathname === '/api/postularse-trabajo' && metodo === 'POST') {
        let cuerpo = '';

        peticion.on('data', chunk => {
            cuerpo += chunk.toString();
        });

        peticion.on('end', () => {
            try {
                const datosPostulacion = JSON.parse(cuerpo);

                // Leer postulaciones existentes
                const postulaciones = database.leer_postulaciones();

                // Verificar si el usuario ya se ha postulado a este trabajo
                const postulacionExistente = postulaciones.find(
                    p => p.usuario_id === datosPostulacion.usuario_id && p.trabajo_id === datosPostulacion.trabajo_id
                );

                if (postulacionExistente) {
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Ya te has postulado a este trabajo' }));
                    return;
                }

                // Generar nuevo ID
                const nuevoId = postulaciones.length > 0 ? Math.max(...postulaciones.map(p => p.id)) + 1 : 1;

                // Crear nueva postulación
                const nuevaPostulacion = {
                    id: nuevoId,
                    usuario_id: datosPostulacion.usuario_id,
                    trabajo_id: datosPostulacion.trabajo_id,
                    fecha_postulacion: new Date().toISOString(),
                    estado: "pendiente",
                    mensaje: datosPostulacion.mensaje || ""
                };

                // Agregar a la lista
                postulaciones.push(nuevaPostulacion);

                // Guardar en el archivo
                database.escribir_postulaciones(postulaciones);

                // --- INICIO: CÓDIGO DE NOTIFICACIÓN ---
                
                console.log('Postulación exitosa. Buscando datos para la notificación...');
                
                // Obtener detalles del trabajo para encontrar al reclutador
                const trabajos = database.leer_trabajos();
                const trabajo_postulado = trabajos.find(t => t.id === datosPostulacion.trabajo_id);

                console.log('Trabajo encontrado:', trabajo_postulado);

                if (trabajo_postulado && trabajo_postulado.reclutador_id) {
                    console.log('ID del reclutador encontrado:', trabajo_postulado.reclutador_id);
                    
                    // Obtener detalles del candidato
                    const usuarios = database.leer_usuarios();
                    const candidato = usuarios.find(u => u.id === datosPostulacion.usuario_id);

                    console.log('Candidato encontrado:', candidato);

                    if (candidato) {
                        console.log('Llamando a la función de notificación...');
                        // Crear notificación para el reclutador
                        notificaciones.notificar_nueva_postulacion(
                            trabajo_postulado.reclutador_id,            // ID del reclutador
                            trabajo_postulado.titulo,                  // Nombre de la vacante
                            `${candidato.nombre} ${candidato.apellido_paterno}` // Nombre del candidato
                        );
                        console.log('Función de notificación ejecutada.');
                    } else {
                        console.log('ERROR: No se encontró al candidato con ID:', datosPostulacion.usuario_id);
                    }
                } else {
                    console.log('ERROR: No se encontró el trabajo o el trabajo no tiene reclutador_id.');
                    console.log('trabajo_postulado:', trabajo_postulado);
                }

                // --- FIN: CÓDIGO DE NOTIFICACIÓN ---
                
                respuesta.end(JSON.stringify({ exito: true, mensaje: 'Postulación realizada correctamente' }));
            } catch (error) {
                console.error('Error al postularse a trabajo:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al postularse al trabajo' }));
            }
        });
    }
    else if (pathname.match(/^\/api\/postulaciones\/\d+$/) && metodo === 'PUT') {
        // Actualizar una postulación

        const postulacionId = parseInt(pathname.split('/').pop());
        let cuerpo = '';

        peticion.on('data', chunk => {
            cuerpo += chunk.toString();
        });

        peticion.on('end', () => {
            try {
                const datosActualizados = JSON.parse(cuerpo);

                // Leer postulaciones existentes
                let postulaciones = database.leer_postulaciones();

                // Encontrar el índice de la postulación
                const indice = postulaciones.findIndex(p => p.id === postulacionId);

                if (indice !== -1) {
                    // Actualizar la postulación
                    postulaciones[indice] = { ...postulaciones[indice], ...datosActualizados };

                    // Guardar en el archivo
                    database.escribir_postulaciones(postulaciones);

                    respuesta.end(JSON.stringify({ exito: true, mensaje: 'Postulación actualizada correctamente' }));
                } else {
                    respuesta.statusCode = 404;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Postulación no encontrada' }));
                }
            } catch (error) {
                console.error('Error al actualizar postulación:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al actualizar la postulación' })); 
            }
        });
    }

    // API para notificar aprobación de postulación (NUEVO)
    else if (pathname === '/api/notificar-aprobacion' && metodo === 'POST') {
        let cuerpo = '';

        peticion.on('data', chunk => {
            cuerpo += chunk.toString();
        });

        peticion.on('end', () => {
            try {
                const datos = JSON.parse(cuerpo);
                const { usuario_id, titulo_vacante, nombre_empresa } = datos;
                
                if (!usuario_id || !titulo_vacante || !nombre_empresa) {
                    respuesta.statusCode = 400;
                    respuesta.end(JSON.stringify({ exito: false, mensaje: 'Faltan datos requeridos' }));
                    return;
                }
                
                // Crear notificación para el candidato
                notificaciones.notificar_vacante_aprobada(
                    usuario_id,            // ID del candidato
                    titulo_vacante,       // Título de la vacante
                    nombre_empresa         // Nombre de la empresa
                );
                
                respuesta.end(JSON.stringify({ exito: true, mensaje: 'Notificación enviada correctamente' }));
            } catch (error) {
                console.error('Error al notificar aprobación:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al enviar la notificación' }));
            }
        });
    }

    else {
        console.log(`Ruta no encontrada: ${pathname}`);
        respuesta.statusCode = 404;
        respuesta.end(JSON.stringify({ exito: false, mensaje: 'Ruta no encontrada' }));
    }
}

// Sirve archivos estáticos
function servir_archivo(respuesta, ruta_completa) {
    fs.readFile(ruta_completa, (error, datos) => {
        if (error) {
            respuesta.writeHead(404, { 'Content-Type': 'text/html' });
            respuesta.end(`
                <html>
                    <body>
                        <h1>Error 404 - Archivo no encontrado</h1>
                        <p>No se pudo encontrar: ${ruta_completa}</p>
                        <a href="/frontend/index.html">Ir al inicio</a>
                    </body>
                </html>
            `);
        } else {
            // Determinar tipo de contenido
            const extension = path.extname(ruta_completa);
            const tipos_mime = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'text/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.ico': 'image/x-icon'
            };

            respuesta.writeHead(200, {
                'Content-Type': tipos_mime[extension] || 'text/plain'
            });
            respuesta.end(datos);
        }
    });
}

// Verifica si la ruta corresponde a un archivo HTML en el frontend
function es_ruta_html_frontend(ruta) {
    // Lista de archivos HTML en el frontend
    const archivos_html_frontend = [
        '/acerca_de.html',
        '/ayuda.html',
        '/contacto.html',
        '/cursos.html',
        '/faq.html',
        '/index.html',
        '/inicio_sesion.html',
        '/registro.html',
        '/terminos.html',
        '/trabajos.html'
    ];

    return archivos_html_frontend.includes(ruta);
}

// PUNTO DE PARTIDA
const servidor = http.createServer((peticion, respuesta) => {
    const ruta_parseada = url.parse(peticion.url, true);
    let ruta_archivo = ruta_parseada.pathname;

    console.log(`Petición recibida: ${peticion.method} ${ruta_archivo}`);

    // Manejar peticiones a la API
    if (ruta_archivo.startsWith('/api/')) {
        manejar_peticion_api(peticion, respuesta, ruta_parseada);
        return;
    }

    // Manejar peticiones POST
    if (peticion.method === 'POST') {
        manejar_peticion_post(peticion, respuesta, ruta_parseada);
        return;
    }

    // Si es la raíz, servir index.html del frontend
    if (ruta_archivo === '/') {
        ruta_archivo = '/frontend/index.html';
    }
    // Si es una ruta HTML del frontend sin el prefijo /frontend/, agregarlo
    else if (es_ruta_html_frontend(ruta_archivo)) {
        ruta_archivo = `/frontend${ruta_archivo}`;
    }

    // Ruta completa del archivo - CORREGIR PARA USAR RUTAS RELATIVAS
    let ruta_completa = path.join(__dirname, '..', ruta_archivo);

    // Si la ruta no existe, intentar servir desde directorio raíz
    if (!fs.existsSync(ruta_completa)) {
        // Intentar servir archivos específicos de roles
        if (ruta_archivo.includes('/Candidato/') || ruta_archivo.includes('/Instructor/') || ruta_archivo.includes('/Reclutador/')) {
            ruta_completa = path.join(__dirname, '..', 'frontend', ruta_archivo.replace('/frontend/', ''));
        } else {
            ruta_completa = path.join(__dirname, '..', ruta_archivo);
        }
    }

    // Servir el archivo solicitado
    servir_archivo(respuesta, ruta_completa);
});

// Iniciar servidor
servidor.listen(puerto, () => {
    console.log('================================');
    console.log('   SETSUZOKU - Servidor Activo');
    console.log('================================');
    console.log(`Servidor ejecutándose en:`);
    console.log(`http://localhost:${puerto}`);
    console.log(`http://localhost:${puerto}/frontend/index.html`);
    console.log('================================');
    console.log('Presiona Ctrl + C para detener');
    console.log('================================');
});

// Manejar errores no capturados para evitar que el servidor se cierre
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rechazo de promesa no manejado:', reason);
});