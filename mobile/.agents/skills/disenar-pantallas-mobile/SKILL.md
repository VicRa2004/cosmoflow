---
name: disenar-pantallas-mobile
description: Convenciones de UI de la app Flutter de Cosmoflow (mobile/) para que se vea como una app nativa profesional — anatomía de pantalla, navegación, listas, estados vacío/carga/error, tamaños táctiles, tipografía y espaciado del sistema «Noche índigo» adaptado a móvil. Úsala al crear, modificar o revisar cualquier pantalla o widget visual en mobile/.
---

# Pantallas en mobile

La web (`frontend/DESIGN.md`) es la fuente de la **identidad** (paleta, un solo acento índigo, bordes de 1px en lugar de sombras). La **ergonomía** es la de una app nativa: no se copian layouts de escritorio.

## 1. Un título por pantalla

El título vive **solo** en la `AppBar`. Prohibido repetirlo como `headlineSmall` dentro del body, y prohibidos los subtítulos de relleno («Gestiona tus tareas personales y asignadas.»).

- Pantallas raíz de pestaña: `SliverAppBar.large` / `.medium` (título grande que colapsa al hacer scroll) o `AppBar` normal; elige una y úsala en todas.
- Información útil (conteo, saludo) va como texto pequeño bajo el título o como primera fila de la lista, no como cabecera de marketing.

## 2. Cada pantalla es dueña de su `Scaffold`

El shell (`MainShell`) solo pone la `NavigationBar`. Cada página construye su propio `Scaffold` con `AppBar`, `actions` y `floatingActionButton`. Así cada pantalla decide su título, sus acciones y su FAB, y no hay una AppBar genérica encima de otra cabecera.

## 3. Navegación

- `NavigationBar` con **3–4 destinos** máximo, los de uso diario (Pendientes, Tareas, Notas, Perfil). Lo secundario (Tags, ajustes) se llega desde Perfil o desde el propio flujo (p. ej. «Gestionar tags» al elegir tags).
- Sin acciones globales en la AppBar (tema, cerrar sesión): viven **solo** en Perfil. Una acción, un sitio.
- Detalle de una entidad → **pantalla con ruta** (`/tareas/:id`), no bottom sheet, si tiene contenido largo o acciones de edición. El bottom sheet de detalle solo para vistas previas cortas. Ejemplo: `NotaDetallePage` (pinta con la entidad recibida y la refresca por id).
- Pantallas de auth: `AuthLayout` + `CampoEmail`/`CampoPassword`/`BotonEnviar` (`modules/auth/widgets/auth_layout.dart`); registro y recuperar se abren con `push` (tienen «atrás»).
- `context.push` para detalle/editor (hay atrás), `context.go` solo entre pestañas.

## 4. Acción primaria = FAB

Crear algo en una lista → `FloatingActionButton` (o `.extended` con «Nueva tarea» en la pantalla principal). Nunca un `FilledButton` dentro del body compitiendo con el título. Si el usuario no tiene permiso, no hay FAB.

## 5. Listas

- Elementos de lista como **filas** (`ListTile` o fila propia a ancho completo, separadas por `Divider` de 1px), no tarjetas con borde apiladas con 10px de hueco: así se ve una app nativa y cabe el doble de contenido.
- Tarjeta (`Card`) solo para agrupar bloques distintos (secciones de Perfil, un resumen).
- Fila: altura mínima 56 dp, título `bodyLarge` 1–2 líneas con `ellipsis`, metadatos en una sola línea `bodySmall` `tintaTenue`. Máximo 2 badges visibles; lo demás en el detalle.
- Acciones de fila: tap → detalle; casilla de completar a la izquierda con área táctil ≥ 48 dp; deslizar (`Dismissible`) para completar/eliminar con «Deshacer».
- Filtros: una fila de `FilterChip` con scroll horizontal (`SingleChildScrollView(scrollDirection: Axis.horizontal)`), no un `Wrap` que crece varias líneas. Búsqueda con `SearchAnchor`/`SearchBar` o un icono en la AppBar.
- `RefreshIndicator` en todas las listas remotas.
- Usa `ListView.builder` / `SliverList` para listas de datos, no `for` dentro de `children`.

## 6. Estados

Un único widget compartido por estado en `core/widgets/` (no copiado en cada página):

| Estado | Widget | Contenido |
| --- | --- | --- |
| Cargando primera vez | `EstadoCargando` | indicador centrado (o skeleton de 3 filas) |
| Error | `EstadoError(mensaje, onReintentar)` | icono, frase humana, botón «Reintentar» |
| Vacío | `EstadoVacio(icono, titulo, mensaje, accion?)` | centrado verticalmente, sin `Card` alrededor |
| Recargando con datos | — | `RefreshIndicator`; no ocultar la lista |

Errores de acciones (guardar, eliminar) → `SnackBar`; nunca un `await` sin `try` que falle en silencio.

## 7. Medidas (móvil, no escritorio)

| Token | Valor |
| --- | --- |
| Margen lateral de pantalla | **16 dp** (no 24) |
| Separación entre secciones | 24 dp; entre campos 16 dp; dentro de un grupo 8 dp |
| Área táctil mínima | **48×48 dp** (botones, iconos, casillas) |
| Alto de botón | 48 dp (`FilledButton`, a ancho completo en formularios y sheets) |
| Iconos | 24 dp en AppBar/navegación, 20 dp en filas |
| Radios | 8 dp controles, 12 dp tarjetas, 28 dp top de bottom sheets (Material 3) |

Los valores de escritorio de `DESIGN.md` (botón 36 px, radio 6 px, texto 14 px) **no** aplican en móvil.

## 8. Tipografía

Usa siempre `Theme.of(context).textTheme`; prohibido `TextStyle(fontSize: …)` suelto en widgets.

| Rol | Estilo |
| --- | --- |
| Título de pantalla | lo pone la AppBar |
| Título de sección | `titleMedium` |
| Texto de fila / cuerpo | `bodyLarge` (16) |
| Metadatos | `bodySmall` (12) en `tintaTenue` |
| Etiquetas, badges | `labelMedium` |

Respetar el escalado de texto del sistema: nada de alturas fijas que corten texto.

## 9. Color

- Tokens `context.colores` (`ColoresNocheIndigo`); nunca `Colors.xxx` ni hex en widgets.
- Índigo solo para: acción primaria, selección, foco, indicador activo. Rojo (`rosePeligro`) solo para destructivo y errores.
- Estados y prioridades: color en el punto/icono, texto neutro. No pintar toda la fila.

## 10. Plataforma

- `SafeArea` en todo lo que toque bordes; bottom sheets con `useSafeArea: true` y `showDragHandle: true`.
- Feedback háptico ligero (`HapticFeedback.selectionClick`) al completar tareas.
- Sin `Tooltip` como única explicación: en táctil no se ve.

## Checklist de revisión

- [ ] El título aparece una sola vez (AppBar).
- [ ] Ninguna acción duplicada entre AppBar, body y Perfil.
- [ ] Acción primaria en FAB; secundarias en `actions` o menú `⋮`.
- [ ] Lista con filas, `ListView.builder`, `RefreshIndicator`, estados compartidos.
- [ ] Márgenes 16 dp, áreas táctiles ≥ 48 dp, sin `fontSize` sueltos.
- [ ] Claro y oscuro revisados; a 360 dp sin overflow; con texto al 130 %.
- [ ] Formularios según `disenar-formularios-mobile`.
