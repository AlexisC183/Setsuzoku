// MÓDULOS REQUERIDOS
const http = require('http'); // Servidor HTTP
const fs = require('fs'); // Sistema de archivos
const path = require('path'); // Manejo de rutas
const url = require('url'); // Parseo de URLs
const auth = require('./auth'); // Módulo de autenticación
const database = require('./database'); // Módulo de base de datos

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

    // API para cursos
    if (pathname.startsWith('/api/cursos')) {
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

    // API para trabajos
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

    // API para inscripciones a cursos
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
                    estado: "en-curso"
                };

                // Agregar a la lista
                inscripciones.push(nuevaInscripcion);

                // Guardar en el archivo
                database.escribir_inscripciones(inscripciones);

                respuesta.end(JSON.stringify({ exito: true, mensaje: 'Inscripción realizada correctamente' }));
            } catch (error) {
                console.error('Error al inscribirse en curso:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al inscribirse en el curso' }));
            }
        });
    }

    // API para postulaciones a trabajos
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

                respuesta.end(JSON.stringify({ exito: true, mensaje: 'Postulación realizada correctamente' }));
            } catch (error) {
                console.error('Error al postularse a trabajo:', error);
                respuesta.statusCode = 500;
                respuesta.end(JSON.stringify({ exito: false, mensaje: 'Error al postularse al trabajo' }));
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
        '/index.html',
        '/inicio_sesion.html',
        '/registro.html',
        '/perfil.html',
        '/postulaciones.html',
        '/cursos_usuario.html',
        '/trabajos.html',
        '/cursos.html'
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

    // Ruta completa del archivo
    const ruta_completa = path.join(__dirname, '..', ruta_archivo);

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