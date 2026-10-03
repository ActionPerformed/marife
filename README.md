# MARIFÉ

**Motor de Asignación y Relaciones para la Intermediación entre Formación y Empresa**

Aplicación web para gestionar la asignación de personas en prácticas a empresas colaboradoras.

## Inicio rápido

### Cargar datos desde CSV

1. **Personas**: Haz clic en el botón de cargar (📤) en el grupo "Personas" de la barra superior
2. **Empresas**: Haz clic en el botón de cargar (📤) en el grupo "Empresas" de la barra superior

Se abrirá un modal donde podrás:
- Ver una vista previa de las columnas del CSV
- Mapear cada campo Required a la columna correspondiente del archivo

#### Campos de Personas
| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | texto | Sí |
| email | texto | Sí |
| vehiculo | sí/no | No |
| poblacion | texto | No |
| curso | 1º, 2º, 2º+ | No |
| anotaciones | texto | No |

#### Campos de Empresas
| Campo | Tipo | Requerido |
|-------|------|-----------|
| nombre | texto | Sí |
| responsable | texto | Sí |
| email | texto | Sí |
| direccion | texto | No |
| requisitos | texto | No |
| capacidad_1 | número | No |
| capacidad_2 | número | No |
| vehiculo | sí/no | No |
| anotaciones | texto | No |

### Realizar asignaciones

1. **Arrastra** una tarjeta de persona desde el panel izquierdo
2. **Suelta** sobre el área de una empresa en el panel derecho
3. La persona desaparece del panel de "sin asignar" y aparece dentro de la empresa

Para **desasignar**, arrastra la persona desde la empresa de vuelta al panel izquierdo, o haz clic en la × de la persona asignada.

### Editar registros

Haz clic en el botón de **lápiz** (✏️) en la tarjeta de cualquier persona o empresa. Se abrirá un formulario con los datos actuales para modificar.

### Eliminar registros

- **Personas**: Haz clic en la × de la tarjeta. Si estaba asignada, se desasigna automáticamente.
- **Empresas**: Haz clic en la × de la tarjeta. Si tiene personas asignadas, el botón estará deshabilitado hasta desasignar todas.

## Guardar y exportar

### Guardar sesión
Haz clic en **💾** en el grupo "Sesión" para descargar un archivo `.json` con todos los datos y asignaciones.

### Restaurar sesión
Haz clic en **📂** en el grupo "Sesión" y selecciona un archivo `.json` previamente guardado.

### Exportar asignaciones
Haz clic en **📥** en el grupo "Sesión" para exportar un CSV con las asignaciones realizadas.

### Exportar/Importar CSVs
Los botones **💾** en los grupos "Personas" y "Empresas" permiten exportar los datos actuales a CSV.

## Añadir registros manualmente

Usa los botones **"+ añadir"** en los títulos de cada panel para agregar personas o empresas sin necesidad de CSV.

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + Z` | Deshacer última asignación/desasignación |
| `Ctrl + Y` | Rehacer asignación/desasignación deshecha |

> **Nota**: Las acciones de deshacer/rehacer solo aplican a emparejamientos y desemparejamientos. La edición y eliminación de registros no son reversible mediante estos atajos.

## Barra de estadísticas

La barra superior muestra en tiempo real:
- **Personas**: total de personas cargadas
- **Asignadas**: personas actualmente asignadas a empresas
- **Sin asignar**: personas pendientes de asignar
- **Empresas**: total de empresas cargadas

## Capacidad de empresas

Cada empresa muestra dos contadores:
- **1º**: personas de 1º curso asignadas vs capacidad
- **2º**: personas de 2º/2º+ curso asignadas vs capacidad

Si se excede la capacidad, el número aparece en rojo con ⚠️.

## Privacidad y seguridad

**Todos los datos se procesan exclusivamente en tu dispositivo.**

- El CSV se lee y procesa localmente en tu navegador
- Las asignaciones y modificaciones se guardan en localStorage del navegador
- **No se envía ningún dato a Internet** en ningún momento
- No hay servidores, APIs externas ni servicios de terceros involucrados
- Puedes usar la aplicación sin conexión a Internet una vez cargada

Tu privacidad está garantizada: los datos de personas y empresas nunca abandonan tu dispositivo.

## Requisitos técnicos

- Navegador moderno con soporte para HTML5, CSS3 y JavaScript ES6+
- No requiere instalación ni servidor backend
- Los datos se guardan automáticamente en localStorage del navegador
