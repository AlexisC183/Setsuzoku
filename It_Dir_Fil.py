import os # Funciones del sistema operativo para manejo de archivos y directorios

# VARIABLES GLOBALES
codificaciones_txt = ['utf-8'] # Lista de codificaciones a probar para archivos de texto

# FUNCIONES
# Función recursiva que procesa archivos y subdirectorios y guarda en archivo
def guardar_contenido_archivos(ruta_dir, archivo_salida, codificaciones_txt, nivel=0):
    # Recorre todos los elementos en la carpeta actual
    for nombre_elemento in os.listdir(ruta_dir):
        # Construye la ruta completa del elemento
        ruta_completa = os.path.join(ruta_dir, nombre_elemento)
        
        # Verifica si es un archivo y no es el archivo de salida actual
        if os.path.isfile(ruta_completa) and ruta_completa != archivo_salida.name:
            for codificacion_iter in codificaciones_txt:
                try:
                    # Intenta abrir y leer el contenido del archivo como texto
                    with open(ruta_completa, 'r', encoding=codificacion_iter) as archivo:
                        contenido_val = archivo.read()
                        
                        # Si no hay excepción, escribe el nombre y el contenido del archivo
                        archivo_salida.write(f"{nombre_elemento}\n\n")
                        archivo_salida.write(contenido_val + "\n")
                        archivo_salida.write("------------------------------------\n")
                        
                        break
                except (UnicodeDecodeError, PermissionError, IOError):
                    # Si ocurre un error, simplemente continúa con la siguiente codificación
                    continue
        
        # Verifica si es un directorio
        elif os.path.isdir(ruta_completa):
            # Llamada recursiva para procesar el subdirectorio (sin escribir nombre del directorio)
            guardar_contenido_archivos(ruta_completa, archivo_salida, codificaciones_txt)

# Función recursiva que procesa archivos y subdirectorios
def procesar_archivos(ruta_dir, codificaciones_txt, nivel=0, archivo_salida_excluir=None):
    # Recorre todos los elementos en la carpeta actual
    for nombre_elemento in os.listdir(ruta_dir):
        # Construye la ruta completa del elemento
        ruta_completa = os.path.join(ruta_dir, nombre_elemento)
        
        # Verifica si es un archivo y no es el archivo de salida a excluir
        if os.path.isfile(ruta_completa) and (archivo_salida_excluir is None or ruta_completa != archivo_salida_excluir):
            for codificacion_iter in codificaciones_txt:
                try:
                    # Intenta abrir y leer el contenido del archivo como texto
                    with open(ruta_completa, 'r', encoding=codificacion_iter) as archivo:
                        contenido_val = archivo.read()
                        
                        # Si no hay excepción, imprime el nombre y el contenido del archivo
                        print(f"{nombre_elemento}\n")
                        print(contenido_val)
                        print("------------------------------------")
                        
                        break
                except (UnicodeDecodeError, PermissionError, IOError):
                    # Si ocurre un error, simplemente continúa con la siguiente codificación
                    continue
        
        # Verifica si es un directorio
        elif os.path.isdir(ruta_completa):
            # Llamada recursiva para procesar el subdirectorio (sin imprimir nombre del directorio)
            procesar_archivos(ruta_completa, codificaciones_txt, nivel + 1, archivo_salida_excluir)

# Función que guarda el árbol de directorios en un archivo
def guardar_arbol_directorios(ruta_dir, archivo_salida, prefijo="", nivel=0):
    # Obtiene la lista de elementos en el directorio
    elementos = os.listdir(ruta_dir)
    
    # Ordena los elementos: primero directorios, luego archivos
    elementos_ordenados = sorted(elementos, key=lambda x: (not os.path.isdir(os.path.join(ruta_dir, x)), x))
    
    # Recorre todos los elementos
    for i, nombre_elemento in enumerate(elementos_ordenados):
        # Construye la ruta completa
        ruta_completa = os.path.join(ruta_dir, nombre_elemento)
        
        # Determina el prefijo apropiado según si es el último elemento
        es_ultimo = i == len(elementos_ordenados) - 1
        prefijo_actual = "└── " if es_ultimo else "├── "
        
        # Escribe el nombre del elemento en el archivo
        archivo_salida.write(prefijo + prefijo_actual + nombre_elemento + "\n")
        
        # Si es un directorio, procesa recursivamente
        if os.path.isdir(ruta_completa):
            # Construye el nuevo prefijo para los subelementos
            nuevo_prefijo = prefijo + ("    " if es_ultimo else "│   ")
            guardar_arbol_directorios(ruta_completa, archivo_salida, nuevo_prefijo, nivel + 1)

# Función recursiva que muestra el árbol de directorios
def mostrar_arbol_directorios(ruta_dir, prefijo="", nivel=0):
    # Obtiene la lista de elementos en el directorio
    elementos = os.listdir(ruta_dir)
    
    # Ordena los elementos: primero directorios, luego archivos
    elementos_ordenados = sorted(elementos, key=lambda x: (not os.path.isdir(os.path.join(ruta_dir, x)), x))
    
    # Recorre todos los elementos
    for i, nombre_elemento in enumerate(elementos_ordenados):
        # Construye la ruta completa
        ruta_completa = os.path.join(ruta_dir, nombre_elemento)
        
        # Determina el prefijo apropiado según si es el último elemento
        es_ultimo = i == len(elementos_ordenados) - 1
        prefijo_actual = "└── " if es_ultimo else "├── "
        
        # Imprime el nombre del elemento
        print(prefijo + prefijo_actual + nombre_elemento)
        
        # Si es un directorio, procesa recursivamente
        if os.path.isdir(ruta_completa):
            # Construye el nuevo prefijo para los subelementos
            nuevo_prefijo = prefijo + ("    " if es_ultimo else "│   ")
            mostrar_arbol_directorios(ruta_completa, nuevo_prefijo, nivel + 1)

# PUNTO DE PARTIDA
# Obtiene el directorio actual donde se encuentra el script
ruta_dir = os.path.dirname(os.path.abspath(__file__))
nombre_carpeta = os.path.basename(ruta_dir)

# Crea el archivo de salida con el nombre de la carpeta
ruta_archivo_salida = os.path.join(ruta_dir, f"{nombre_carpeta}.txt")

# Abre el archivo de salida en modo escritura
with open(ruta_archivo_salida, 'w', encoding='utf-8') as archivo_salida:
    # Escribe el nombre de la carpeta actual
    archivo_salida.write(nombre_carpeta + "\n")
    
    # Guarda el árbol de directorios
    guardar_arbol_directorios(ruta_dir, archivo_salida)
    
    # Escribe el separador
    archivo_salida.write("------------------------------------\n")
    
    # Procesa los archivos y guarda su contenido (excluyendo el archivo de salida actual)
    guardar_contenido_archivos(ruta_dir, archivo_salida, codificaciones_txt)