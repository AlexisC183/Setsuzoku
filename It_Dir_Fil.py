import os

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

# Función recursiva que procesa archivos y subdirectorios
def procesar_archivos(ruta_dir, codificaciones_txt=['utf-8'], nivel=0):
    # Recorre todos los elementos en la carpeta actual
    for nombre_elemento in os.listdir(ruta_dir):
        # Construye la ruta completa del elemento
        ruta_completa = os.path.join(ruta_dir, nombre_elemento)
        
        # Verifica si es un archivo
        if os.path.isfile(ruta_completa):
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
            procesar_archivos(ruta_completa, codificaciones_txt, nivel + 1)

# Obtiene el directorio actual donde se encuentra el script
ruta_dir = os.path.dirname(os.path.abspath(__file__))
nombre_carpeta = os.path.basename(ruta_dir)

# Lista de codificaciones a probar (en orden de prioridad)
codificaciones_txt = ['utf-8']

# Muestra el nombre de la carpeta actual
print(nombre_carpeta)

# Muestra el árbol de directorios
mostrar_arbol_directorios(ruta_dir)

# Imprime el separador
print("------------------------------------")

# Procesa los archivos
procesar_archivos(ruta_dir, codificaciones_txt)

# Espera a que el usuario presione una tecla antes de cerrar
input()