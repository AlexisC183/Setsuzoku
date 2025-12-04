// MÓDULOS REQUERIDOS
// No se requieren módulos adicionales para este archivo

// VARIABLES GLOBALES
let usuario_actual = null;
let notificaciones = [];
let notificaciones_filtradas = [];
let pagina_actual = 1;
let elementos_por_pagina = 10;
let vista_actual = 'lista'; // 'lista' o 'tarjeta'
let filtros_actuales = {
    estado: 'todas',
    tipo: 'todos',
    fecha: 'todas',
    busqueda: ''
};

// FUNCIONES
// Formatea una fecha en formato legible
function formatear_fecha(fecha_iso) {
    const fecha = new Date(fecha_iso);
    const ahora = new Date();
    const diferencia_ms = ahora - fecha;
    const diferencia_dias = Math.floor(diferencia_ms / (1000 * 60 * 60 * 24));
    
    if (diferencia_dias === 0) {
        const diferencia_horas = Math.floor(diferencia_ms / (1000 * 60 * 60));
        if (diferencia_horas === 0) {
            const diferencia_minutos = Math.floor(diferencia_ms / (1000 * 60));
            if (diferencia_minutos === 0) {
                return 'Justo ahora';
            }
            return `Hace ${diferencia_minutos} minuto${diferencia_minutos !== 1 ? 's' : ''}`;
        }
        return `Hace ${diferencia_horas} hora${diferencia_horas !== 1 ? 's' : ''}`;
    } else if (diferencia_dias === 1) {
        return 'Ayer';
    } else if (diferencia_dias < 7) {
        return `Hace ${diferencia_dias} días`;
    } else {
        return fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: fecha.getFullYear() !== ahora.getFullYear() ? 'numeric' : undefined
        });
    }
}

// Obtiene el icono según el tipo de notificación
function obtener_icono_tipo(tipo) {
    const iconos = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'vacante': '💼',
        'entrevista': '📅',
        'curso': '📚',
        'postulacion': '📄',
        'sistema': '🔧'
    };
    
    return iconos[tipo] || '📢';
}

// Obtiene el color según el tipo de notificación
function obtener_color_tipo(tipo) {
    const colores = {
        'info': '#3498db',
        'success': '#2ecc71',
        'warning': '#f39c12',
        'error': '#e74c3c',
        'vacante': '#9b59b6',
        'entrevista': '#1abc9c',
        'curso': '#3498db',
        'postulacion': '#e67e22',
        'sistema': '#34495e'
    };
    
    return colores[tipo] || '#7f8c8d';
}

// Renderiza una notificación individual en formato lista
function renderizar_notificacion_lista(notificacion) {
    const clase_leida = notificacion.leida ? '' : 'no-leida';
    const color_tipo = obtener_color_tipo(notificacion.tipo);
    
    return `
        <div class="notificacion-item ${clase_leida}" data-id="${notificacion.id}">
            <div class="notificacion-cabecera">
                <div>
                    <div class="notificacion-titulo">
                        <span style="color: ${color_tipo}; margin-right: 8px;">${obtener_icono_tipo(notificacion.tipo)}</span>
                        ${notificacion.titulo}
                    </div>
                </div>
                <div class="notificacion-fecha">${formatear_fecha(notificacion.fecha_creacion)}</div>
            </div>
            <div class="notificacion-mensaje">${notificacion.mensaje}</div>
            <div class="notificacion-acciones">
                ${notificacion.leida ? 
                    `<button class="notificacion-btn btn-marcar-no-leida" data-id="${notificacion.id}">Marcar como no leída</button>` :
                    `<button class="notificacion-btn btn-marcar-leida" data-id="${notificacion.id}">Marcar como leída</button>`
                }
                <button class="notificacion-btn btn-eliminar" data-id="${notificacion.id}">Eliminar</button>
            </div>
        </div>
    `;
}

// Renderiza una notificación individual en formato tarjeta
function renderizar_notificacion_tarjeta(notificacion) {
    const clase_leida = notificacion.leida ? '' : 'no-leida';
    const color_tipo = obtener_color_tipo(notificacion.tipo);
    
    return `
        <div class="notificacion-tarjeta ${clase_leida}" data-id="${notificacion.id}">
            <div class="notificacion-cabecera">
                <div>
                    <div class="notificacion-titulo">
                        <span style="color: ${color_tipo}; margin-right: 8px;">${obtener_icono_tipo(notificacion.tipo)}</span>
                        ${notificacion.titulo}
                    </div>
                </div>
                <div class="notificacion-fecha">${formatear_fecha(notificacion.fecha_creacion)}</div>
            </div>
            <div class="notificacion-mensaje">${notificacion.mensaje}</div>
            <div class="notificacion-acciones">
                ${notificacion.leida ? 
                    `<button class="notificacion-btn btn-marcar-no-leida" data-id="${notificacion.id}">Marcar como no leída</button>` :
                    `<button class="notificacion-btn btn-marcar-leida" data-id="${notificacion.id}">Marcar como leída</button>`
                }
                <button class="notificacion-btn btn-eliminar" data-id="${notificacion.id}">Eliminar</button>
            </div>
        </div>
    `;
}

// Renderiza la lista de notificaciones según la vista actual
function renderizar_notificaciones() {
    const contenedor = document.getElementById('notificaciones-contenido');
    
    if (notificaciones_filtradas.length === 0) {
        contenedor.innerHTML = `
            <div class="estado-vacio">
                <div class="estado-vacio-icono">📭</div>
                <div class="estado-vacio-titulo">No hay notificaciones</div>
                <div class="estado-vacio-mensaje">No tienes notificaciones que coincidan con los filtros seleccionados</div>
            </div>
        `;
        
        // Actualizar contadores
        document.getElementById('contador-mostradas').textContent = '0';
        document.getElementById('contador-total').textContent = '0';
        
        // Ocultar paginación
        document.getElementById('paginacion').innerHTML = '';
        
        return;
    }
    
    // Calcular paginación
    const total_paginas = Math.ceil(notificaciones_filtradas.length / elementos_por_pagina);
    const indice_inicio = (pagina_actual - 1) * elementos_por_pagina;
    const indice_fin = Math.min(indice_inicio + elementos_por_pagina, notificaciones_filtradas.length);
    const notificaciones_pagina = notificaciones_filtradas.slice(indice_inicio, indice_fin);
    
    // Renderizar notificaciones según vista
    let html = '';
    
    if (vista_actual === 'lista') {
        html = '<div class="notificaciones-lista">';
        notificaciones_pagina.forEach(notificacion => {
            html += renderizar_notificacion_lista(notificacion);
        });
        html += '</div>';
    } else {
        html = '<div class="notificaciones-grid">';
        notificaciones_pagina.forEach(notificacion => {
            html += renderizar_notificacion_tarjeta(notificacion);
        });
        html += '</div>';
    }
    
    contenedor.innerHTML = html;
    
    // Actualizar contadores
    document.getElementById('contador-mostradas').textContent = notificaciones_pagina.length;
    document.getElementById('contador-total').textContent = notificaciones_filtradas.length;
    
    // Renderizar paginación
    renderizar_paginacion(total_paginas);
    
    // Agregar event listeners a los botones de notificaciones
    agregar_event_listeners_notificaciones();
}

// Renderiza los controles de paginación
function renderizar_paginacion(total_paginas) {
    const contenedor = document.getElementById('paginacion');
    
    if (total_paginas <= 1) {
        contenedor.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Botón anterior
    html += `<button class="paginacion-btn" ${pagina_actual === 1 ? 'disabled' : ''} data-pagina="${pagina_actual - 1}">Anterior</button>`;
    
    // Botones de página
    for (let i = 1; i <= total_paginas; i++) {
        // Mostrar siempre la primera y última página
        // Y hasta 3 páginas alrededor de la actual
        if (
            i === 1 || 
            i === total_paginas || 
            (i >= pagina_actual - 1 && i <= pagina_actual + 1)
        ) {
            html += `<button class="paginacion-btn ${i === pagina_actual ? 'activo' : ''}" data-pagina="${i}">${i}</button>`;
        } 
        // Mostrar puntos suspensivos si hay un salto
        else if (
            (i === pagina_actual - 2 && i > 1) || 
            (i === pagina_actual + 2 && i < total_paginas)
        ) {
            html += '<span>...</span>';
        }
    }
    
    // Botón siguiente
    html += `<button class="paginacion-btn" ${pagina_actual === total_paginas ? 'disabled' : ''} data-pagina="${pagina_actual + 1}">Siguiente</button>`;
    
    contenedor.innerHTML = html;
    
    // Agregar event listeners a los botones de paginación
    document.querySelectorAll('.paginacion-btn').forEach(boton => {
        boton.addEventListener('click', function() {
            pagina_actual = parseInt(this.dataset.pagina);
            renderizar_notificaciones();
        });
    });
}

// Agrega event listeners a los botones de acciones de notificaciones
function agregar_event_listeners_notificaciones() {
    // Botones para marcar como leída
    document.querySelectorAll('.btn-marcar-leida').forEach(boton => {
        boton.addEventListener('click', function() {
            const id_notificacion = parseInt(this.dataset.id);
            marcar_como_leida(id_notificacion);
        });
    });
    
    // Botones para marcar como no leída
    document.querySelectorAll('.btn-marcar-no-leida').forEach(boton => {
        boton.addEventListener('click', function() {
            const id_notificacion = parseInt(this.dataset.id);
            marcar_como_no_leida(id_notificacion);
        });
    });
    
    // Botones para eliminar
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', function() {
            const id_notificacion = parseInt(this.dataset.id);
            if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
                eliminar_notificacion(id_notificacion);
            }
        });
    });
}

// Aplica los filtros actuales a la lista de notificaciones
function aplicar_filtros() {
    notificaciones_filtradas = notificaciones.filter(notificacion => {
        // Filtro por estado
        if (filtros_actuales.estado === 'no-leidas' && notificacion.leida) {
            return false;
        } else if (filtros_actuales.estado === 'leidas' && !notificacion.leida) {
            return false;
        }
        
        // Filtro por tipo
        if (filtros_actuales.tipo !== 'todos' && notificacion.tipo !== filtros_actuales.tipo) {
            return false;
        }
        
        // Filtro por fecha
        if (filtros_actuales.fecha !== 'todas') {
            const fecha_notificacion = new Date(notificacion.fecha_creacion);
            const ahora = new Date();
            const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
            
            if (filtros_actuales.fecha === 'hoy') {
                const fecha_notificacion_dia = new Date(
                    fecha_notificacion.getFullYear(), 
                    fecha_notificacion.getMonth(), 
                    fecha_notificacion.getDate()
                );
                if (fecha_notificacion_dia.getTime() !== hoy.getTime()) {
                    return false;
                }
            } else if (filtros_actuales.fecha === 'semana') {
                const semana_actual = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
                const semana_notificacion = Math.floor((fecha_notificacion - new Date(fecha_notificacion.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
                
                if (semana_actual !== semana_notificacion || fecha_notificacion.getFullYear() !== hoy.getFullYear()) {
                    return false;
                }
            } else if (filtros_actuales.fecha === 'mes') {
                if (fecha_notificacion.getMonth() !== ahora.getMonth() || 
                    fecha_notificacion.getFullYear() !== ahora.getFullYear()) {
                    return false;
                }
            }
        }
        
        // Filtro por búsqueda
        if (filtros_actuales.busqueda) {
            const busqueda_minusculas = filtros_actuales.busqueda.toLowerCase();
            const titulo_minusculas = notificacion.titulo.toLowerCase();
            const mensaje_minusculas = notificacion.mensaje.toLowerCase();
            
            if (!titulo_minusculas.includes(busqueda_minusculas) && 
                !mensaje_minusculas.includes(busqueda_minusculas)) {
                return false;
            }
        }
        
        return true;
    });
    
    // Resetear a la primera página
    pagina_actual = 1;
    
    // Renderizar notificaciones filtradas
    renderizar_notificaciones();
}

// Obtiene las notificaciones del usuario desde la API
async function obtener_notificaciones() {
    try {
        if (!usuario_actual || !usuario_actual.id) {
            console.error('No hay usuario actual');
            return;
        }
        
        const response = await fetch(`/api/notificaciones?id_usuario=${usuario_actual.id}`);
        
        if (!response.ok) {
            throw new Error('Error al obtener notificaciones');
        }
        
        const data = await response.json();
        notificaciones = data;
        
        // Aplicar filtros actuales
        aplicar_filtros();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('notificaciones-contenido').innerHTML = `
            <div class="estado-vacio">
                <div class="estado-vacio-icono">❌</div>
                <div class="estado-vacio-titulo">Error al cargar notificaciones</div>
                <div class="estado-vacio-mensaje">No se pudieron cargar las notificaciones. Por favor, intenta de nuevo más tarde.</div>
            </div>
        `;
    }
}

// Marca una notificación como leída
async function marcar_como_leida(id_notificacion) {
    try {
        const response = await fetch('/api/notificaciones/marcar-leida', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_notificacion: id_notificacion
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al marcar notificación como leída');
        }
        
        // Actualizar notificación en la lista local
        const indice = notificaciones.findIndex(n => n.id === id_notificacion);
        if (indice !== -1) {
            notificaciones[indice].leida = true;
        }
        
        // Aplicar filtros y renderizar
        aplicar_filtros();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo marcar la notificación como leída. Por favor, intenta de nuevo.');
    }
}

// Marca una notificación como no leída
async function marcar_como_no_leida(id_notificacion) {
    try {
        // Buscar la notificación en la lista local
        const indice = notificaciones.findIndex(n => n.id === id_notificacion);
        if (indice === -1) {
            throw new Error('Notificación no encontrada');
        }
        
        // Actualizar localmente
        notificaciones[indice].leida = false;
        
        // Aplicar filtros y renderizar
        aplicar_filtros();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo marcar la notificación como no leída. Por favor, intenta de nuevo.');
    }
}

// Elimina una notificación
async function eliminar_notificacion(id_notificacion) {
    try {
        const response = await fetch(`/api/notificaciones?id_notificacion=${id_notificacion}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar notificación');
        }
        
        // Eliminar notificación de la lista local
        notificaciones = notificaciones.filter(n => n.id !== id_notificacion);
        
        // Aplicar filtros y renderizar
        aplicar_filtros();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo eliminar la notificación. Por favor, intenta de nuevo.');
    }
}

// Marca todas las notificaciones como leídas
async function marcar_todas_como_leidas() {
    try {
        const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_usuario: usuario_actual.id
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al marcar todas las notificaciones como leídas');
        }
        
        // Actualizar todas las notificaciones en la lista local
        notificaciones.forEach(notificacion => {
            notificacion.leida = true;
        });
        
        // Aplicar filtros y renderizar
        aplicar_filtros();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudieron marcar todas las notificaciones como leídas. Por favor, intenta de nuevo.');
    }
}

// Elimina todas las notificaciones leídas
async function eliminar_leidas() {
    if (!confirm('¿Estás seguro de que quieres eliminar todas las notificaciones leídas?')) {
        return;
    }
    
    try {
        // Obtener IDs de notificaciones leídas
        const ids_leidas = notificaciones
            .filter(n => n.leida)
            .map(n => n.id);
        
        // Eliminar cada notificación leída
        const promesas = ids_leidas.map(id => 
            fetch(`/api/notificaciones?id_notificacion=${id}`, {
                method: 'DELETE'
            })
        );
        
        await Promise.all(promesas);
        
        // Eliminar notificaciones leídas de la lista local
        notificaciones = notificaciones.filter(n => !n.leida);
        
        // Aplicar filtros y renderizar
        aplicar_filtros();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudieron eliminar todas las notificaciones leídas. Por favor, intenta de nuevo.');
    }
}

// Obtiene los datos del usuario actual desde el almacenamiento de sesión
function obtener_usuario_actual() {
    // Cambiamos de localStorage a sessionStorage y de 'usuario_actual' a 'usuario'
    const usuario_json = sessionStorage.getItem('usuario');
    
    if (usuario_json) {
        try {
            usuario_actual = JSON.parse(usuario_json);
            return true;
        } catch (error) {
            console.error('Error al parsear datos del usuario:', error);
        }
    }
    
    // Si no hay usuario en sessionStorage, redirigir a inicio de sesión
    window.location.href = '../inicio_sesion.html';
    return false;
}

// Inicializa la página
function inicializar() {
    // Obtener usuario actual
    if (!obtener_usuario_actual()) {
        return;
    }
    
    // Configurar event listeners
    configurar_event_listeners();
    
    // Obtener notificaciones
    obtener_notificaciones();
}

// Configura los event listeners de la página
function configurar_event_listeners() {
    // Botón para volver
    document.getElementById('boton-volver').addEventListener('click', function() {
        window.history.back();
    });
    
    // Botón para marcar todas como leídas
    document.getElementById('btn-marcar-todas-leidas').addEventListener('click', marcar_todas_como_leidas);
    
    // Botón para limpiar leídas
    document.getElementById('btn-limpiar-leidas').addEventListener('click', eliminar_leidas);
    
    // Botones para cambiar vista
    document.getElementById('vista-lista').addEventListener('click', function() {
        vista_actual = 'lista';
        this.classList.add('activo');
        document.getElementById('vista-tarjeta').classList.remove('activo');
        renderizar_notificaciones();
    });
    
    document.getElementById('vista-tarjeta').addEventListener('click', function() {
        vista_actual = 'tarjeta';
        this.classList.add('activo');
        document.getElementById('vista-lista').classList.remove('activo');
        renderizar_notificaciones();
    });
    
    // Filtros
    document.getElementById('btn-aplicar-filtros').addEventListener('click', function() {
        // Actualizar filtros actuales
        filtros_actuales.estado = document.getElementById('filtro-estado').value;
        filtros_actuales.tipo = document.getElementById('filtro-tipo').value;
        filtros_actuales.fecha = document.getElementById('filtro-fecha').value;
        filtros_actuales.busqueda = document.getElementById('filtro-busqueda').value;
        
        // Aplicar filtros
        aplicar_filtros();
    });
    
    document.getElementById('btn-limpiar-filtros').addEventListener('click', function() {
        // Resetear filtros
        document.getElementById('filtro-estado').value = 'todas';
        document.getElementById('filtro-tipo').value = 'todos';
        document.getElementById('filtro-fecha').value = 'todas';
        document.getElementById('filtro-busqueda').value = '';
        
        // Actualizar filtros actuales
        filtros_actuales = {
            estado: 'todas',
            tipo: 'todos',
            fecha: 'todas',
            busqueda: ''
        };
        
        // Aplicar filtros
        aplicar_filtros();
    });
}

// PUNTO DE PARTIDA
document.addEventListener('DOMContentLoaded', inicializar);