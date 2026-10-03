# MARIFÉ — Motor de Asignación y Relaciones para la Intermediación entre Formación y Empresa

## 1. Concepto y Visión

MARIFÉ es una herramienta local, offline y de alta privacidad para emparejar personas con empresas mediante una interfaz visual de **tarjetas y drag & drop**. La experiencia busca ser **inmediata, táctil y sin fricción**: el usuario arrastra una persona sobre una empresa y la asociación se crea al instante. El tono visual es profesional pero accesible, pensado para usuarios sin formación técnica.

---

## 2. Design Language

### Aesthetic Direction
Interfaz de **panel de control profesional** — limpia, organizada, con tarjetas como protagonistas. Inspiración en herramientas de gestión de proyectos (Trello, Notion) pero más minimalista.

### Color Palette
| Rol | Color | Uso |
|-----|-------|-----|
| Background | `#F5F7FA` | Fondo general |
| Surface | `#FFFFFF` | Tarjetas, paneles |
| Primary (Personas) | `#3B82F6` | Tarjetas de persona, acentos |
| Secondary (Empresas) | `#8B5CF6` | Tarjetas de empresa |
| Success | `#10B981` | Asociación creada |
| Warning | `#F59E0B` | Discrepancia de requisitos |
| Danger | `#EF4444` | Eliminar, errores |
| Text Primary | `#1F2937` | Texto principal |
| Text Secondary | `#6B7280` | Texto auxiliar |
| Border | `#E5E7EB` | Bordes de tarjetas |

### Typography
- **Font**: `Inter` (Google Fonts) con fallback `system-ui, sans-serif`
- **Headings**: 600 weight
- **Body**: 400 weight
- **Scale**: 12px / 14px / 16px / 20px / 24px

### Spatial System
- Grid base: 8px
- Padding tarjetas: 16px
- Gap entre tarjetas: 12px
- Border radius: 12px

### Motion Philosophy
- **Drag**: elevación con `box-shadow` + `scale(1.02)` + `opacity 0.9`
- **Drop**: animación de "pegado" con `transition 200ms ease-out`
- **Hover tarjetas**: `box-shadow` elevado + borde coloreado
- **Feedback de drop válido**: highlight del área destino durante 300ms
- **Transiciones de estado**: 150ms ease

### Visual Assets
- Iconos: **Phosphor Icons** (CDN) — estilo `regular`
- Persona: 👤 (emoji) o icono genérico
- Empresa: 🏢 (emoji) o icono genérico
- Sin vehículo: 🚗 (solo icono rojo)
- Con vehículo: 🚗 (verde) — usar color del icono, no emoji diferente

---

## 3. Layout & Structure

### Área Principal (3 columnas)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Logo + Título + Botones de acción                      │
├──────────────┬──────────────────────────┬───────────────────────┤
│              │                          │                       │
│  PERSONAS    │   EMPRESAS              │   ASIGNACIONES        │
│  (sin asig.) │   (con personas         │   (resumen visual     │
│              │    pegadas)             │    de cada empresa)   │
│              │                          │                       │
│  [tarjeta]   │   [tarjeta empresa]     │                       │
│  [tarjeta]   │     [persona][persona]  │                       │
│  [tarjeta]   │                          │   Empresa A           │
│              │   [tarjeta empresa]     │     → Ana López       │
│              │     [persona]           │     → Pedro Ruiz      │
│              │                          │                       │
└──────────────┴──────────────────────────┴───────────────────────┘
```

### Panel de diálogo (overlay)

Aparece centrado con backdrop semitransparente:
- **Modal de mapeo de columnas** (al cargar CSV)
- **Modal de confirmación** (carga con datos existentes, eliminar empresa con asignaciones)
- **Modal de errores** (CSV rechazado)

### Responsive Strategy
- **Desktop (>1024px)**: 3 columnas side-by-side
- **Tablet (768-1024px)**: 2 columnas (personas + empresas), panel de asignaciones colapsable
- **Móvil (<768px)**: 1 columna con tabs (no prioritario — RNF indica navegadores modernos de escritorio)

---

## 4. Features & Interactions

### 4.1 Carga de CSV — Personas

**Flujo:**
1. Usuario pulsa "Cargar Personas" (o arrastra fichero al área designada)
2. Si ya existen personas con asignaciones → **modal de confirmación**:
   - "Esto desemparejará a X personas. ¿Continuar?"
   - Botones: Cancelar / Confirmar
3. Usuario ve **modal de mapeo de columnas**:
   - Lista de campos requeridos a la izquierda (Nombre, Email, Vehículo, Población)
   - Selectores a la derecha con las columnas detectadas del CSV
   - Primera fila (cabeceras) visible como referencia
4. Usuario acepta → se procesa el CSV
5. **Si errores** → modal con lista de motivos (ej: "Fila 3: email vacío", "Fila 7: formato desconocido")
6. **Si éxito** → tarjetas de persona aparecen en columna izquierda, panel de asignaciones se actualiza

**Validación de CSV:**
- Fichero vacío → error
- Sin cabecera → error
- Campos requeridos ausentes en mapeo → error
- Email duplicado en el mismo CSV → se ignora la segunda occurrence (sin avisar)

### 4.2 Carga de CSV — Empresas

Mismo flujo que personas, pero con campos:
- Nombre de empresa (requerido)
- Responsable (requerido)
- Email responsable (requerido)
- Dirección (opcional)
- Requisitos adicionales (opcional, texto libre)

### 4.3 Asignación mediante Drag & Drop

**Desde persona a empresa:**
1. Usuario arrastra tarjeta de persona
2. La tarjeta se eleva visualmente
3. Al pasar sobre una empresa → la zona de drop de esa empresa se resalta
4. Al soltar sobre empresa → la persona se "pega" a la empresa (dentro de su tarjeta)
5. Si la persona ya estaba asignada a otra empresa → se desvincula automáticamente

**Desde empresa a persona:**
1. Usuario arrastra la empresa (o su grupo de personas) para reasignar
2. La persona desvinculada pasa a estar "suelta"
3. Se puede soltar sobre otra empresa

**Personas sin asignar:** Viven en la columna izquierda. Se muestran siempre en orden de carga.

**Empresas con personas asignadas:** Las personas aparecen dentro/pegadas a la tarjeta de la empresa en la columna central.

### 4.4 Desasignación

- **Botón "×" en cada persona asignada** dentro de la tarjeta de empresa
- Al pulsar → la persona vuelve a la columna de personas sin asignar
- No requiere confirmación (acción menor, reversible con CTRL+Z)

### 4.5 Eliminar empresa

- Botón de eliminar en cada tarjeta de empresa (solo si no tiene personas asignadas directamente)
- Si tiene personas → botón deshabilitado + tooltip "Desasigna primero las personas"
- **Alternativa**: Modal de confirmación si se quiere forzar eliminación con personas → las personas quedan desasignadas

### 4.6 Exportación de asignaciones

**CSV de asignaciones:**
```
empresa,persona,email
Empresa A,Ana López,ana@correo.es
Empresa A,Pedro Ruiz,pedro@correo.es
Empresa B,Lucía Díaz,lucia@correo.es
```

Botón "Exportar Asignaciones" → descarga `asignaciones_YYYY-MM-DD.csv`

### 4.7 Guardar / Cargar sesión (JSON)

**Guardar sesión:**
Botón "Guardar Sesión" → descarga `marife_sesion_YYYY-MM-DD.json`

El JSON contiene:
```json
{
  "version": "1.0",
  "fecha": "2026-10-01T10:30:00",
  "personas": [...],
  "empresas": [...],
  "asignaciones": [
    { "personaEmail": "...", "empresaNombre": "..." }
  ]
}
```

**Cargar sesión:**
Botón "Cargar Sesión" → selector de fichero JSON
- Si ya hay datos → modal de confirmación (como en CSV)
- Se restaura todo el estado completo

### 4.8 Deshacer / Rehacer

- **CTRL+Z**: deshace la última acción (asignación, desasignación, eliminación)
- **CTRL+Y** o **CTRL+Shift+Z**: rehace
- Pila de hasta 50 acciones
- Acciones registrables: crear asignación, eliminar asociación, cargar datos (personas/empresas), eliminar empresa

### 4.9 Marcado de discrepancias de requisitos (futuro – MVP solo marca)

Cuando se implemente la lectura de requisitos:
- Si la empresa tiene campo `requisitos` y la persona tiene datos de idiomas/carnés
- Se marca visualmente (badge de advertencia en la persona asignada)
- No se bloquea la asignación

---

## 5. Component Inventory

### 5.1 Tarjeta de Persona

```
┌─────────────────────────────┐
│ 👤  Ana López              │
│      ana@correo.es         │
│      🚗 Oviedo             │
└─────────────────────────────┘
```

| Estado | Appearance |
|--------|------------|
| Default | Borde `#E5E7EB`, fondo blanco |
| Hover | Borde `#3B82F6`, shadow elevada |
| Dragging | Scale 1.02, shadow máxima, opacity 0.9 |
| Asignada | No cambia visualmente (por ahora) |

### 5.2 Tarjeta de Empresa

```
┌─────────────────────────────────────┐
│ 🏢  Empresa A                  [×] │
│      María Pérez                   │
│      maria@empresa.es              │
│      Calle Mayor 1                 │
│      Requisitos: Inglés B1         │
│  ┌─────┐ ┌─────┐                   │
│  │👤 Ana│ │👤 Pedro│              │
│  └─────┘ └─────┘                   │
└─────────────────────────────────────┘
```

| Estado | Appearance |
|--------|------------|
| Default | Borde `#E5E7EB`, fondo blanco |
| Hover | Borde `#8B5CF6`, shadow elevada |
| Drop target activo | Borde `#8B5CF6` pulsante, fondo `#F3E8FF` |
| Con personas | Muestra personas pegadas debajo de info |

### 5.3 Modal de Confirmación

- Backdrop oscuro (rgba(0,0,0,0.5))
- Caja blanca centrada, max-width 480px
- Título + mensaje + botones (Cancelar / Confirmar)
- Botón peligroso en rojo (`#EF4444`)

### 5.4 Modal de Mapeo de Columnas

- Lista de campos requeridos a la izquierda
- `<select>` por cada campo mostrando las cabeceras detectadas
- Primera fila del CSV visible como referencia
- Botón "Aplicar" / "Cancelar"

### 5.5 Toast / Notificación

- Aparece en esquina inferior derecha
- Tipos: success (verde), error (rojo), info (azul)
- Auto-dismiss tras 4 segundos
- Acción opcional: "Deshacer"

---

## 6. Technical Approach

### Stack
- **HTML5** — estructura semántica
- **CSS3** — variables CSS, Grid, Flexbox, animaciones
- **JavaScript (ES6+)** — sin frameworks, vanilla puro
- **Phosphor Icons** — CDN
- **Inter font** — Google Fonts CDN

### Arquitectura de archivos

```
/
├── index.html              # Punto de entrada, layout principal
├── css/
│   ├── reset.css           # Normalize/reset básico
│   ├── variables.css      # Variables CSS (colores, espaciado)
│   ├── layout.css         # Grid y estructura de columnas
│   ├── components.css     # Estilos de tarjetas, modales, botones
│   └── animations.css     # Transiciones y animaciones
├── js/
│   ├── app.js             # Inicialización, estado global
│   ├── state.js           # Gestión de estado + undo/redo stack
│   ├── csv.js             # Parseo y validación de CSV
│   ├── mapping.js         # Lógica de mapeo de columnas
│   ├── dragdrop.js        # Drag & drop interactions
│   ├── render.js          # Renderizado de tarjetas y UI
│   ├── export.js          # Exportación CSV y JSON
│   └── dom.js             # Utilidades de manipulación DOM
└── SPEC.md
```

### Estado de la aplicación (state.js)

```javascript
{
  personas: Map<email, Persona>,
  empresas: Map<nombre, Empresa>,
  asignaciones: Map<emailPersona, nombreEmpresa>,
  pilaAcciones: Array<{ type, payload, undo }>,  // para undo/redo
  punteroAccion: number                           // posición actual
}
```

### API de datos

Sin backend — toda la información vive en memoria del navegador.

- **Carga CSV** → `csv.js` parsea, `mapping.js` aplica mapeo, `app.js` actualiza estado
- **Guardado sesión** → `export.js` serializa estado a JSON y fuerza descarga
- **Carga sesión** → `export.js` lee JSON, `app.js` restaura estado
- **Exportación** → `export.js` genera CSV de asignaciones

### Drag & Drop

Usar **HTML5 Drag and Drop API** nativa:
- `draggable="true"` en tarjetas de persona
- `dragstart`, `dragover`, `drop`, `dragend` eventos
- `dataTransfer` para pasar el email de la persona

### Dependencias externas (CDN)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
<script src="https://unpkg.com/@phosphor-icons/web@2.0.3"></script>
```

### Limitaciones de volumen
- **40 personas + 40 empresas** — muy por debajo de umbrales de rendimiento problemáticos
- No se requiere virtualización de DOM

---

## 7. Criterios de Aceptación

- [ ] Cargar CSV de personas con mapeo manual de columnas
- [ ] Cargar CSV de empresas con mapeo manual de columnas
- [ ] Confirmación antes de reemplazar datos existentes
- [ ] Rechazo de CSV con errores claros
- [ ] Mostrar tarjetas de persona y empresa diferenciadas visualmente
- [ ] Drag & drop de persona sobre empresa = asignación
- [ ] Una persona solo puede estar en una empresa
- [ ] Varias personas pueden estar en la misma empresa
- [ ] Desasignar persona (botón ×) la devuelve a columna izquierda
- [ ] Eliminar empresa con personas → confirmación + desasignación
- [ ] CTRL+Z deshace última acción
- [ ] CTRL+Y / CTRL+Shift+Z rehace
- [ ] Exportar asignaciones a CSV
- [ ] Guardar sesión completa en JSON
- [ ] Cargar sesión desde JSON
- [ ] Funciona en Chrome, Edge, Firefox sin componentes adicionales
