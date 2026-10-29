---
name: Cosmoflow
description: Productividad personal y de equipo con el oficio del estándar de la categoría (Linear, Notion, Todoist).
colors:
  indigo-marca: "oklch(53% 0.22 277)"
  indigo-marca-hover: "oklch(47% 0.21 277)"
  indigo-foco: "oklch(61% 0.2 277)"
  rose-peligro: "oklch(58.6% 0.253 17.585)"
  rose-peligro-hover: "oklch(51.4% 0.222 16.935)"
  fondo: "oklch(99.2% 0.003 270)"
  superficie: "#ffffff"
  elevada: "oklch(96.4% 0.007 270)"
  borde: "oklch(92.4% 0.009 270)"
  borde-fuerte: "oklch(86.5% 0.012 270)"
  tinta: "oklch(22% 0.025 270)"
  tinta-suave: "oklch(38% 0.025 270)"
  tinta-tenue: "oklch(53% 0.025 270)"
  lateral: "oklch(23% 0.055 274)"
  lateral-elevada: "oklch(30% 0.06 274)"
  lateral-borde: "oklch(31% 0.05 274)"
  lateral-tinta: "oklch(97% 0.01 274)"
  lateral-suave: "oklch(84% 0.03 274)"
  lateral-tenue: "oklch(68% 0.04 274)"
  lateral-acento: "oklch(78% 0.13 277)"
  lateral-alerta: "oklch(78% 0.12 15)"
  fondo-oscuro: "oklch(17.5% 0.016 272)"
  superficie-oscuro: "oklch(20.5% 0.018 272)"
  elevada-oscuro: "oklch(25% 0.02 272)"
  borde-oscuro: "oklch(27.5% 0.02 272)"
  borde-fuerte-oscuro: "oklch(34% 0.022 272)"
  tinta-oscuro: "oklch(96.5% 0.006 272)"
  tinta-suave-oscuro: "oklch(85% 0.014 272)"
  tinta-tenue-oscuro: "oklch(70% 0.02 272)"
  lateral-oscuro: "oklch(14.5% 0.035 274)"
  lateral-elevada-oscuro: "oklch(22% 0.045 274)"
  lateral-borde-oscuro: "oklch(23% 0.035 274)"
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
    textColor: "{colors.lateral-suave}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "{spacing.control-sm}"
  nav-item-active:
    backgroundColor: "{colors.lateral-elevada}"
    textColor: "{colors.lateral-tinta}"
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

La paleta es «Noche índigo»: neutros con un leve tinte azul y un único acento índigo vivo. El contenido vive sobre un blanco apenas azulado; el sidebar es un raíl azul noche en los dos temas, con su propia tinta, y es lo único oscuro de la vista en claro. En oscuro el contenido pasa a un grafito azulado y el raíl queda aún más hundido. La profundidad la dan filetes de 1px, no sombras: solo lo que flota (menús, diálogos) proyecta sombra. La densidad es de herramienta de escritorio: controles de 36px, ítems de menú de 32px, cuerpo a 14px.

El tema (claro, oscuro, sistema) lo decide `data-tema` en `<html>`. Los componentes nunca nombran neutros concretos: usan tokens semánticos que cambian con el tema, y los acentos se escriben para oscuro y se invierten en claro desde la hoja global.

**Key Characteristics:**
- Neutros con tinte azul vía tokens semánticos; un solo acento índigo.
- Sidebar y panel de acceso azul noche en ambos temas, con tokens `lateral-*` propios.
- Filetes de 1px como estructura; sombra solo en lo flotante.
- Inter variable a 14px, títulos de página a 20px semibold, todo en sentence case.
- Controles de 36px, radios de 6px (controles) y 8px (tarjetas).
- Menú declarativo filtrado por permisos: se oculta lo que no se puede usar.

## Colors

«Noche índigo»: neutros con un leve tinte azul (tono 270 en el contenido, 274 en el raíl lateral) y un único acento índigo vivo (tono 277); los semánticos (rose, amber, emerald) solo comunican estado.

### Primary
- **Índigo de marca** (indigo-marca): relleno del botón primario y del isotipo (la escala índigo 500/600/700 está redefinida en la hoja global); su hover baja a indigo-marca-hover. Blanco encima con contraste de 4.5:1 o más.
- **Índigo de foco** (indigo-foco): anillo de foco (`outline` de 2px con 2px de separación), borde de input enfocado con halo al 20%, casillas, cursor de texto, selección de texto al 25%, spinner de carga y enlaces del markdown. Los títulos de fila que abren la lectura pasan a índigo (con subrayado) solo al pasar.

### Neutral
- **Fondo** (fondo): lienzo de la página y de la barra superior.
- **Superficie** (superficie): tarjetas, inputs, tablas, diálogos y menús.
- **Elevada** (elevada): hover, ítem activo del menú, chips y badges neutros, avatar sin foto, bloques de código.
- **Borde** (borde): el filete por defecto de todo elemento (lo aplica la capa base) y las divisiones entre filas.
- **Borde fuerte** (borde-fuerte): hover de inputs, borde discontinuo de los estados vacíos, barra de scroll, citas.
- **Tinta** (tinta): títulos y texto principal.
- **Tinta suave** (tinta-suave): etiquetas de campo, celdas de tabla, ítems de menú en reposo.
- **Tinta tenue** (tinta-tenue): descripciones, ayuda, metadatos, cabeceras de tabla, iconos en reposo, títulos de grupo del menú.

### Raíl lateral (azul noche)
Familia propia para el sidebar, el cajón móvil y el panel de marca del acceso. Es oscura en los dos temas y declara `color-scheme: dark`; en oscuro solo cambian `lateral`, `lateral-elevada` y `lateral-borde`, más hundidos.
- **Lateral** (lateral): fondo del raíl.
- **Lateral elevada** (lateral-elevada): hover e ítem activo del menú, chips del panel de marca.
- **Lateral borde** (lateral-borde): filetes del raíl (separador de grupos colapsados, pie del sidebar).
- **Lateral tinta / suave / tenue** (lateral-tinta, lateral-suave, lateral-tenue): marca e ítem activo; ítems en reposo y texto del panel; títulos de grupo e iconos en reposo.
- **Lateral acento** (lateral-acento): el índigo claro del icono del ítem activo.
- **Lateral alerta** (lateral-alerta): rose claro para lo vencido sobre azul noche.

Los valores `-oscuro` del frontmatter son los mismos tokens bajo `data-tema="oscuro"`.

### Semánticos de estado
Rose (error, peligro, vencido), amber (aviso), emerald (éxito) e índigo suave (badge `purple`). Se escriben para oscuro (texto `-300/-400`, fondos `-950` y bordes `-800` con transparencia) y la hoja global invierte esos tonos en claro para mantener el contraste sin clases `dark:`.

### Named Rules
**The One Accent Rule.** Índigo es el único color de marca: botón primario, isotipo, icono activo (lateral-acento), foco, selección, casillas y enlaces. Nada más se pinta de índigo para decorar.

**The Semantic Neutral Rule.** Los neutros se escriben solo con tokens semánticos (`bg-superficie`, `text-tinta`…). Prohibido `zinc-*`, `slate-*`, `text-white` o `bg-black` para neutros; `text-white` solo sobre un acento sólido. La única excepción es el velo de los `<dialog>` (`zinc-950` al 50%), igual en ambos temas.

**The Night Rail Rule.** Sobre `lateral` solo se usan los tokens `lateral-*`; nunca `tinta-*`, `elevada` ni `borde`, que siguen al tema y desaparecerían sobre azul noche.

**The Both Themes Rule.** Un acento en un tono distinto de los invertidos en la hoja global se comprueba en claro y en oscuro antes de usarse.

## Typography

**Body Font:** Inter Variable (con ui-sans-serif, system-ui, sans-serif), con `cv11` y `ss03` activos.

**Character:** Una sola familia neutra y legible en sesiones largas; la jerarquía sale de tamaño y peso, nunca de mayúsculas ni de color de acento.

### Hierarchy
- **Headline** (600, 20px, interlineado 1.4, tracking ajustado): título de página en el encabezado. Uno por página. Las pantallas de acceso suben su título a 24px y el titular del panel de marca a 30px, ambos semibold con tracking ajustado.
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

Las pantallas de acceso son una pantalla dividida: desde 1024px, a la izquierda un panel de marca azul noche (46% del ancho, máx. 672px, 48px de relleno) con la marca arriba y, centrados, el titular, un texto y una muestra ilustrativa de pendientes; a la derecha el formulario (máx. 384px) centrado sobre fondo, con el selector de tema arriba a la derecha. Por debajo de 1024px solo queda el formulario, encabezado por el isotipo a 36px.

Ritmo: tarjetas con 24px de relleno, celdas de 12px × 16px, separaciones de 8px entre acciones y de 16px entre bloques de formulario.

### Named Rules
**The Declared Menu Rule.** Cada sección se declara en `navegacion.ts` (grupo, ruta, icono Lucide y permiso `recurso:leer`) y el sidebar la filtra con `usePermisos`. Los grupos sin ítems visibles no se muestran y las acciones sin permiso no se pintan. El menú crece añadiendo entradas, nunca rediseñando la navegación.

## Elevation & Depth

Sistema plano con filetes: toda superficie en reposo se separa por un borde de 1px y por el paso tonal fondo › superficie › elevada; el raíl azul noche se separa por contraste, sin filete. La sombra existe solo para lo que flota sobre el resto.

### Shadow Vocabulary
- **Flotante** (en claro, tintada de azul noche: `0 1px 2px oklch(20% 0.05 274 / 0.06), 0 8px 24px -4px oklch(20% 0.05 274 / 0.14)`; en oscuro `0 1px 2px oklch(0% 0 0 / 0.4), 0 12px 32px -4px oklch(0% 0 0 / 0.6)`): menú de usuario, diálogos y la muestra de pendientes que flota en el panel de marca.

El panel de marca lleva además un único resplandor radial índigo desde su esquina superior izquierda; es exclusivo de ese panel.

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
Sobre el raíl azul noche: ítems de 32px con icono de 16px en lateral-tenue y texto en lateral-suave; hover y activo pasan a lateral-elevada y lateral-tinta, y el activo además pone su icono en lateral-acento y el texto en 500. Los títulos de grupo son meta 12px medium en lateral-tenue y sentence case; colapsado, un filete sustituye al título. Migas en la barra: grupo en tinta tenue con chevron, sección en tinta medium.

### Avatar
Círculo de 32px. Sin foto, la inicial en 12px semibold tinta suave sobre elevada: neutro, nunca coloreado por usuario.

### Dialogs y menús
`<dialog>` nativo (y `popover` nativo para el menú de usuario): superficie, lg, filete y sombra flotante, velo al 50%. Esc y clic fuera cierran.

### Lectura (DialogoLectura)
Las tareas y notas se leen antes de editarse. El título de la fila es un botón (tinta medium, índigo y subrayado al pasar) que abre un `Dialog` de 672px: bajo el título, los detalles en una lista `<dl>` de dos columnas (término en tinta tenue); tras un filete, el markdown renderizado con desplazamiento propio (máx. 60vh), o «Sin contenido.» en tinta tenue; y, si hay permiso, «Editar» outline con lápiz a la derecha tras otro filete. El lápiz de la fila edita directamente.

### Pantallas de acceso
Panel de marca y formulario (ver Layout). La muestra de pendientes es ilustrativa y oculta a lectores de pantalla: caja lg con filete lateral-borde sobre lateral-elevada al 60%, filas separadas por filetes, chip de tag en lateral-elevada y fecha en numerales tabulares (lateral-alerta si vence).

### Empty State
Caja lg con borde discontinuo fuerte, icono de 32px en tinta tenue, título de 14px semibold, descripción y una acción opcional para salir del vacío.

### Named Rules
**The Quiet Row Rule.** Las acciones de fila van dentro de `AccionesFila` (`Table.tsx`): se revelan al pasar o enfocar la fila y quedan siempre visibles en dispositivos sin hover.

**The Distant Danger Rule.** Las acciones destructivas en reposo usan `variant="dangerGhost"`, apartadas de la primaria (a la izquierda cuando comparten barra). El rose sólido solo aparece al confirmar.

## Do's and Don'ts

### Do:
- **Do** limitar el índigo a botón primario, isotipo, icono activo, foco, selección, casillas y enlaces.
- **Do** escribir neutros solo con tokens semánticos (`fondo`, `superficie`, `elevada`, `borde`, `borde-fuerte`, `tinta`, `tinta-suave`, `tinta-tenue`) y, sobre el raíl azul noche, solo con `lateral-*`.
- **Do** abrir la lectura al pulsar el título de una tarea o nota y dejar el lápiz de la fila para editar.
- **Do** separar con filetes de 1px; reservar la sombra flotante a menús y diálogos.
- **Do** usar 6px de radio en controles y 8px en tarjetas; controles de 36px (32px en `sm`).
- **Do** abrir cada página con `EncabezadoPagina`: título de 20px semibold, descripción y acciones a la derecha.
- **Do** declarar cada sección en `navegacion.ts` con su permiso y ocultar con `usePermisos` lo que no se puede usar.
- **Do** revelar las acciones de fila al pasar o enfocar, siempre visibles en táctil.
- **Do** iniciar todo borrado con `dangerGhost`, lejos de la primaria; rose sólido (`danger`) solo al confirmar.

### Don't:
- **Don't** usar `zinc-*`, `slate-*`, `text-white` o `bg-black` para neutros (salvo el velo `zinc-950/50` de los `<dialog>`).
- **Don't** usar tokens que siguen al tema (`tinta-*`, `elevada`, `borde`) sobre el raíl azul noche.
- **Don't** introducir un segundo color de marca ni colorear avatares por usuario.
- **Don't** poner sombra a tarjetas, tablas o cualquier cosa que no flote.
- **Don't** escribir etiquetas en mayúsculas espaciadas ni eyebrows sobre los títulos.
- **Don't** anidar tarjetas: dentro de una tarjeta, listas `<dl>` o matrices con filetes.
- **Don't** usar `window.confirm` ni modales propios: `Dialog` y `ConfirmDialog`.
