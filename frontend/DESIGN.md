---
name: Cosmoflow
description: Productividad personal y de equipo con el oficio del estándar de la categoría (Linear, Notion, Todoist).
colors:
  indigo-marca: "oklch(55.5% 0.16 277)"
  indigo-marca-hover: "oklch(50% 0.16 277)"
  indigo-foco: "oklch(62% 0.15 277)"
  rose-peligro: "oklch(58.6% 0.253 17.585)"
  rose-peligro-hover: "oklch(51.4% 0.222 16.935)"
  fondo: "#ffffff"
  lateral: "oklch(98.2% 0.002 286)"
  superficie: "#ffffff"
  elevada: "oklch(95.6% 0.003 286)"
  borde: "oklch(91.6% 0.004 286)"
  borde-fuerte: "oklch(86.5% 0.006 286)"
  tinta: "oklch(21% 0.006 285.885)"
  tinta-suave: "oklch(37% 0.013 285.805)"
  tinta-tenue: "oklch(55.2% 0.016 285.938)"
  fondo-oscuro: "oklch(17.5% 0.004 286)"
  lateral-oscuro: "oklch(15% 0.004 286)"
  superficie-oscuro: "oklch(20% 0.005 286)"
  elevada-oscuro: "oklch(24.5% 0.006 286)"
  borde-oscuro: "oklch(26.5% 0.006 286)"
  borde-fuerte-oscuro: "oklch(33% 0.008 286)"
  tinta-oscuro: "oklch(96.7% 0.001 286.375)"
  tinta-suave-oscuro: "oklch(87.1% 0.006 286.286)"
  tinta-tenue-oscuro: "oklch(70.5% 0.015 286.067)"
typography:
  headline:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
    fontFeature: "'cv11', 'ss03'"
  title:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "'cv11', 'ss03'"
  label:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  meta:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  control-sm: "32px"
  control: "36px"
  control-lg: "40px"
  barra: "56px"
  lateral: "240px"
  lateral-colapsado: "56px"
  celda: "12px 16px"
  tarjeta: "24px"
  contenido-max: "1152px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-marca}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "{spacing.control}"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.indigo-marca-hover}"
  button-secondary:
    backgroundColor: "{colors.elevada}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "{spacing.control}"
  button-secondary-hover:
    backgroundColor: "{colors.borde}"
  button-outline:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "{spacing.control}"
  button-outline-hover:
    backgroundColor: "{colors.elevada}"
  button-ghost:
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.md}"
    height: "{spacing.control}"
  button-ghost-hover:
    backgroundColor: "{colors.elevada}"
    textColor: "{colors.tinta}"
  button-danger:
    backgroundColor: "{colors.rose-peligro}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.md}"
    height: "{spacing.control}"
  button-danger-hover:
    backgroundColor: "{colors.rose-peligro-hover}"
  button-sm:
    height: "{spacing.control-sm}"
    padding: "0 10px"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "{spacing.control}"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
    padding: "{spacing.tarjeta}"
  badge:
    backgroundColor: "{colors.elevada}"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
    typography: "{typography.meta}"
  nav-item:
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "{spacing.control-sm}"
  nav-item-active:
    backgroundColor: "{colors.elevada}"
    textColor: "{colors.tinta}"
  avatar:
    backgroundColor: "{colors.elevada}"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.full}"
    size: "32px"
---

# Design System: Cosmoflow

## Overview

**Creative North Star: "El escritorio en calma"**

Cosmoflow es una herramienta en la que se pasan horas, así que la interfaz se retira y el contenido del usuario manda. El sistema es el estándar de la categoría ejecutado con oficio, a la altura de Linear, Notion y Todoist: un sidebar agrupado y colapsable, una barra superior delgada con migas y páginas de trabajo con título, acción primaria y tabla. No hay rarezas de mundo propio; la calidad está en la precisión de los detalles, no en la novedad.

La paleta es zinc fría sin tinte con un único acento índigo. El contenido vive sobre blanco y el sidebar queda un paso más gris; en oscuro todo pasa a grafito, con el sidebar más hundido que el contenido. La profundidad la dan filetes de 1px, no sombras: solo lo que flota (menús, diálogos, la caja de acceso) proyecta sombra. La densidad es de herramienta de escritorio: controles de 36px, ítems de menú de 32px, cuerpo a 14px.

El tema (claro, oscuro, sistema) lo decide `data-tema` en `<html>`. Los componentes nunca nombran neutros concretos: usan tokens semánticos que cambian con el tema, y los acentos se escriben para oscuro y se invierten en claro desde la hoja global.

**Key Characteristics:**
- Neutros zinc fríos vía tokens semánticos; un solo acento índigo.
- Filetes de 1px como estructura; sombra solo en lo flotante.
- Inter variable a 14px, títulos de página a 20px semibold, todo en sentence case.
- Controles de 36px, radios de 6px (controles) y 8px (tarjetas).
- Menú declarativo filtrado por permisos: se oculta lo que no se puede usar.

## Colors

Zinc fría y sin tinte con un único acento índigo; los semánticos (rose, amber, emerald) solo comunican estado.

### Primary
- **Índigo de marca** (indigo-marca): relleno del botón primario y del isotipo; su hover baja a indigo-marca-hover. Blanco encima con contraste de 4.5:1 o más.
- **Índigo de foco** (indigo-foco): anillo de foco (`outline` de 2px con 2px de separación), borde de input enfocado con halo al 20%, icono del ítem activo del menú, casillas (`accent-color`), cursor de texto, selección de texto al 28% y enlaces del markdown.

### Neutral
- **Fondo** (fondo): lienzo de la página y de la barra superior.
- **Lateral** (lateral): sidebar, cajón móvil y fondo de las pantallas de acceso; un paso más gris que el contenido (más hundido en oscuro).
- **Superficie** (superficie): tarjetas, inputs, tablas, diálogos y menús.
- **Elevada** (elevada): hover, ítem activo del menú, chips y badges neutros, avatar sin foto, bloques de código.
- **Borde** (borde): el filete por defecto de todo elemento (lo aplica la capa base) y las divisiones entre filas.
- **Borde fuerte** (borde-fuerte): hover de inputs, borde discontinuo de los estados vacíos, barra de scroll, citas.
- **Tinta** (tinta): títulos y texto principal.
- **Tinta suave** (tinta-suave): etiquetas de campo, celdas de tabla, ítems de menú en reposo.
- **Tinta tenue** (tinta-tenue): descripciones, ayuda, metadatos, cabeceras de tabla, iconos en reposo, títulos de grupo del menú.

Los valores `-oscuro` del frontmatter son los mismos tokens bajo `data-tema="oscuro"`.

### Semánticos de estado
Rose (error, peligro, vencido), amber (aviso), emerald (éxito) e índigo suave (badge `purple`). Se escriben para oscuro (texto `-300/-400`, fondos `-950` y bordes `-800` con transparencia) y la hoja global invierte esos tonos en claro para mantener el contraste sin clases `dark:`.

### Named Rules
**The One Accent Rule.** Índigo es el único color de marca: botón primario, icono activo, foco, selección y casillas. Nada más se pinta de índigo para decorar.

**The Semantic Neutral Rule.** Los neutros se escriben solo con tokens semánticos (`bg-superficie`, `text-tinta`…). Prohibido `zinc-*`, `slate-*`, `text-white` o `bg-black` para neutros; `text-white` solo sobre un acento sólido. La única excepción es el velo de los `<dialog>` (zinc-950 al 50%), igual en ambos temas.

**The Both Themes Rule.** Un acento en un tono distinto de los invertidos en la hoja global se comprueba en claro y en oscuro antes de usarse.

## Typography

**Body Font:** Inter Variable (con ui-sans-serif, system-ui, sans-serif), con `cv11` y `ss03` activos.

**Character:** Una sola familia neutra y legible en sesiones largas; la jerarquía sale de tamaño y peso, nunca de mayúsculas ni de color de acento.

### Hierarchy
- **Headline** (600, 20px, interlineado 1.4, tracking ajustado): título de página en el encabezado y en las pantallas de acceso. Uno por página.
- **Title** (600, 16px): título de tarjeta y de diálogo. La marca del sidebar usa 15px semibold.
- **Body** (400, 14px): cuerpo, celdas, ítems de menú, inputs, botones. El markdown usa este tamaño con interlineado relajado.
- **Label** (500, 13px): etiquetas de campo en sentence case y botones pequeños.
- **Meta** (400 o 500, 12px): cabeceras de tabla, badges, mensajes de error y ayuda, títulos de grupo del menú, paginación.

Las cifras de tablas usan numerales tabulares.

### Named Rules
**The Sentence Case Rule.** Todo texto de interfaz va en sentence case. Nada de etiquetas en mayúsculas espaciadas ni eyebrows sobre los títulos: el encabezado de página es título y descripción, sin icono decorativo ni texto encima.

## Layout

Shell de dos columnas. A la izquierda el sidebar de 240px (56px colapsado a iconos, recordado en `localStorage`; transición de anchura de 200ms que se anula con movimiento reducido). Por debajo de 768px el sidebar desaparece y el mismo menú se abre en un cajón `<dialog>` de 288px (máx. 85vw) desde la izquierda. A la derecha, una barra superior fija de 56px con migas grupo › sección a la izquierda y tema y avatar a la derecha.

El contenido se centra en un máximo de 1152px con márgenes de 16/24/32px según ancho y 24–32px de aire vertical. Cada página abre con su encabezado: título y descripción a la izquierda, acciones y filtros a la derecha (apilados por debajo de 1024px). Debajo, tablas o listas.

Ritmo: tarjetas con 24px de relleno, celdas de 12px × 16px, separaciones de 8px entre acciones y de 16px entre bloques de formulario.

### Named Rules
**The Declared Menu Rule.** Cada sección se declara en `navegacion.ts` (grupo, ruta, icono Lucide y permiso `recurso:leer`) y el sidebar la filtra con `usePermisos`. Los grupos sin ítems visibles no se muestran y las acciones sin permiso no se pintan. El menú crece añadiendo entradas, nunca rediseñando la navegación.

## Elevation & Depth

Sistema plano con filetes: toda superficie en reposo se separa por un borde de 1px y por el paso tonal fondo › lateral › superficie › elevada. La sombra existe solo para lo que flota sobre el resto.

### Shadow Vocabulary
- **Flotante** (`box-shadow: 0 1px 2px oklch(0% 0 0 / 0.06), 0 8px 24px -4px oklch(0% 0 0 / 0.12)`; en oscuro `0 1px 2px oklch(0% 0 0 / 0.4), 0 12px 32px -4px oklch(0% 0 0 / 0.6)`): menú de usuario, diálogos y la caja de las pantallas de acceso.

### Named Rules
**The Rule Over Shadow Rule.** Filetes de 1px en lugar de sombras. Si no flota, no tiene sombra.

## Shapes

Esquinas suavemente redondeadas y consistentes: 6px (md) para controles, badges, ítems de menú y el isotipo; 8px (lg) para tarjetas, tablas, diálogos, menús y estados vacíos; círculo para avatares y spinners. Bordes siempre de 1px; el discontinuo queda reservado al estado vacío.

## Components

### Buttons
Discretos y precisos; el índigo se gana su sitio.
- **Shape:** md (6px), alto de 36px (32px en `sm`, 40px en `lg`), peso 500.
- **Primary:** relleno índigo de marca, texto blanco. Una acción primaria por zona, a la derecha del encabezado o al final del formulario.
- **Secondary / Outline / Ghost:** relleno elevada; borde y superficie; transparente con tinta suave. El ghost se usa para iconos de barra y acciones de fila.
- **Danger:** relleno rose sólido, solo para confirmar dentro de `ConfirmDialog`.
- **DangerGhost:** transparente con texto rose y fondo rose tenue al pasar. Es el único estilo para iniciar un borrado (papeleras de fila, «Eliminar» rol, «Quitar avatar», «Cerrar todas las sesiones»).
- **Hover / Focus:** transición de color; foco con el anillo índigo global. Deshabilitado al 50% de opacidad; cargando muestra el spinner y bloquea.

### Inputs / Fields
- **Style:** superficie, borde de 1px, md, 36px de alto, etiqueta de 13px medium encima; el borde se refuerza al pasar.
- **Focus:** borde índigo con halo de 3px al 20%.
- **Error / Disabled:** borde rose y mensaje rose de 12px debajo enlazado por `aria-describedby`; deshabilitado al 50%. `Select` y `Checkbox` son nativos con la misma etiqueta y error.

### Cards / Containers
- **Corner Style:** lg (8px). **Background:** superficie. **Border:** filete de 1px. **Shadow:** ninguna. **Internal Padding:** 24px.
- Dentro de una tarjeta los datos van en listas `<dl>` o matrices con filetes (como la de permisos), nunca en otra tarjeta.

### Tables
Contenedor lg con filete, cabecera de 36px en meta tinta tenue, filas separadas por filetes, celdas en tinta suave y hover de fila con elevada al 50%. Carga, error, vacío (`EmptyState`) y paginación vienen incluidos.

### Chips (Badges)
md, filete de 1px, 12px medium. Neutro sobre elevada; los de estado usan los semánticos invertibles.

### Navigation
Ítems de 32px con icono de 16px en tinta tenue y texto en tinta suave; hover y activo pasan a elevada y tinta, y el activo además pone su icono en índigo y el texto en 500. Los títulos de grupo son meta 12px medium en sentence case; colapsado, un filete sustituye al título. Migas en la barra: grupo en tinta tenue con chevron, sección en tinta medium.

### Avatar
Círculo de 32px. Sin foto, la inicial en 12px semibold tinta suave sobre elevada: neutro, nunca coloreado por usuario.

### Dialogs y menús
`<dialog>` nativo (y `popover` nativo para el menú de usuario): superficie, lg, filete y sombra flotante, velo al 50%. Esc y clic fuera cierran.

### Empty State
Caja lg con borde discontinuo fuerte, icono de 32px en tinta tenue, título de 14px semibold, descripción y una acción opcional para salir del vacío.

### Named Rules
**The Quiet Row Rule.** Las acciones de fila van dentro de `AccionesFila` (`Table.tsx`): se revelan al pasar o enfocar la fila y quedan siempre visibles en dispositivos sin hover.

**The Distant Danger Rule.** Las acciones destructivas en reposo usan `variant="dangerGhost"`, apartadas de la primaria (a la izquierda cuando comparten barra). El rose sólido solo aparece al confirmar.

## Do's and Don'ts

### Do:
- **Do** limitar el índigo a botón primario, icono activo, foco, selección y casillas.
- **Do** escribir neutros solo con tokens semánticos (`fondo`, `lateral`, `superficie`, `elevada`, `borde`, `borde-fuerte`, `tinta`, `tinta-suave`, `tinta-tenue`).
- **Do** separar con filetes de 1px; reservar la sombra flotante a menús y diálogos.
- **Do** usar 6px de radio en controles y 8px en tarjetas; controles de 36px (32px en `sm`).
- **Do** abrir cada página con `EncabezadoPagina`: título de 20px semibold, descripción y acciones a la derecha.
- **Do** declarar cada sección en `navegacion.ts` con su permiso y ocultar con `usePermisos` lo que no se puede usar.
- **Do** revelar las acciones de fila al pasar o enfocar, siempre visibles en táctil.
- **Do** iniciar todo borrado con `dangerGhost`, lejos de la primaria; rose sólido (`danger`) solo al confirmar.

### Don't:
- **Don't** usar `zinc-*`, `slate-*`, `text-white` o `bg-black` para neutros.
- **Don't** introducir un segundo color de marca ni colorear avatares por usuario.
- **Don't** poner sombra a tarjetas, tablas o cualquier cosa que no flote.
- **Don't** escribir etiquetas en mayúsculas espaciadas ni eyebrows sobre los títulos.
- **Don't** anidar tarjetas: dentro de una tarjeta, listas `<dl>` o matrices con filetes.
- **Don't** usar `window.confirm` ni modales propios: `Dialog` y `ConfirmDialog`.
