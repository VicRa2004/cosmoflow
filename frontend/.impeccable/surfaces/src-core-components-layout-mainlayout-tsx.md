---
version: 1
slug: "src-core-components-layout-mainlayout-tsx"
primary_target: "src/core/components/layout/MainLayout.tsx"
related_targets: ["src/core/components/layout/Sidebar.tsx","src/core/components/layout/Navbar.tsx"]
---

## Scope

Shell autenticado de la app (sidebar + navbar) y las páginas de trabajo que contiene. Modo: Operate.

## Job

Usuarios en sesiones largas de escritorio: ver lo pendiente, gestionar tareas, notas y tags; administradores gestionan usuarios y roles. El menú debe crecer (organizaciones, equipos, proyectos) sin rediseñar la navegación y ocultar lo que el usuario no puede usar.

## Direction contract

THESIS: El estándar de la categoría (Linear, Notion, Todoist) ejecutado con oficio: sidebar agrupado y colapsable + barra superior delgada con migas. Rechaza el navbar horizontal que no escala y cualquier rareza de mundo propio.

OWN-WORLD: Neutros zinc fríos sin tinte, contenido blanco y sidebar un paso más gris (`bg-lateral`); en oscuro grafito con el sidebar más hundido. Un solo acento índigo (botón primario, icono activo, foco, selección). Filetes de 1px en lugar de sombras; sombra solo en lo que flota (menú, diálogo). Inter variable, controles de 36px, radios 6/8px.

STORY: El usuario sabe dónde está (ítem activo + migas), ve solo lo que puede usar y llega a sus pendientes sin ruido.

FIRST VIEWPORT: Sidebar de 240px a la izquierda: marca arriba, grupos «Personal» y «Administración» con ítems de 32px, botón de colapsar al pie. Navbar de 56px: migas a la izquierda, tema y avatar a la derecha. Contenido en max-w-6xl: título 20px semibold con descripción, acción primaria índigo a la derecha, tabla con filetes debajo.

FORM: Estándar de la categoría (canon), elegido por el usuario frente a la tirada; referentes Linear, Notion y Todoist. seed:dd777caf5eefb32e

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Rutas protegidas solo en interfaz: una URL directa sin permiso muestra el 403 del backend en la página.
