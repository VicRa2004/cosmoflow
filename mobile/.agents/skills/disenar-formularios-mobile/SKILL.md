---
name: disenar-formularios-mobile
description: Decide cómo presentar un formulario en la app Flutter de Cosmoflow (mobile/) — diálogo solo para confirmar o 1–2 campos, bottom sheet para acciones rápidas, pantalla completa con ruta propia para crear/editar entidades, y varios pasos cuando es largo. Úsala al crear, ampliar o revisar cualquier formulario, diálogo o bottom sheet en mobile/.
---

# Formularios en mobile

En el teléfono el teclado ocupa media pantalla: un `Dialog` con 4+ campos obliga a hacer scroll dentro de una caja flotante y es la causa número uno de que la app se vea «hecha a mano». La regla es **pantalla completa por defecto**; los modales son la excepción.

## Elegir el formato

Cuenta los campos que el usuario rellena.

| Caso | Formato | Widget |
| --- | --- | --- |
| Confirmar una acción (eliminar, cerrar sesión, descartar cambios) | **Diálogo de confirmación** | `confirmar()` (`core/widgets/confirmar.dart`) |
| 1–2 campos cortos, acción rápida sin salir de contexto (renombrar, mover a carpeta, elegir color) | **Bottom sheet** | `showModalBottomSheet` + `isScrollControlled: true` + padding de `viewInsets` |
| Crear o editar una entidad (tarea, nota, tag con más de nombre+color), o cualquier campo multilínea / markdown | **Pantalla completa** con ruta propia | `GoRoute` `/<recurso>/nueva` y `/<recurso>/:id/editar` |
| Más de ~8 campos o grupos que dependen de respuestas previas | **Varios pasos** en una pantalla | un solo `Form`, paso en estado local |

Fuerzan pantalla completa aunque haya pocos campos: texto multilínea (`maxLines > 1`), selector de fechas + otros campos, subida de archivos.
**Nunca** un `Dialog`/`AlertDialog` con `TextFormField` de más de 1 campo.

## Estructura de archivos

```text
modules/<modulo>/
├── pages/<entidad>_editor_page.dart   # Scaffold + AppBar + guardar/navegar. Solo compone.
├── widgets/<entidad>_form.dart        # El Form: campos, validación, devuelve valores. No sabe dónde vive.
└── widgets/<entidad>_form_campos_*.dart  # Si el form pasa de ~200 líneas, una sección por archivo
```

- El form recibe `valoresIniciales` y `onGuardar(Valores)`; nunca llama a la API ni a `Navigator`. La página llama a la API, muestra el `SnackBar` y hace `context.pop(true)`.
- Crear y editar usan el **mismo** form y la misma página (`tareaId == null` → crear).
- La lógica de «guardar» (mapear valores → API) vive en un solo sitio (la página editora o el `*Api`), no copiada en cada lista que abre el editor.

## Pantalla completa: anatomía

```dart
Scaffold(
  appBar: AppBar(
    leading: const CloseButton(),          // cerrar, no flecha: es una tarea modal
    title: Text(esEdicion ? 'Editar tarea' : 'Nueva tarea'),
    actions: [TextButton(onPressed: _guardando ? null : _guardar, child: const Text('Guardar'))],
  ),
  body: SafeArea(
    child: Form(
      key: _formKey,
      child: ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 32), children: [...]),
    ),
  ),
)
```

- Guardar en la `AppBar` (siempre visible con el teclado abierto). Sin botón «Cancelar» abajo: lo hace `CloseButton`.
- Usa `PaginaEditor` (`core/widgets/pagina_editor.dart`): ya trae `CloseButton`, «Guardar» en la AppBar, indicador mientras guarda y aviso de «¿Descartar cambios?». Ejemplos: `TareaEditorPage`, `NotaEditorPage`.
- Fechas con `CampoFecha` (`core/widgets/campo_fecha.dart`). Errores de guardado con `ejecutarConAviso`.
- Etiquetas con `InputDecoration(labelText: ...)`, no un `Text` encima de cada campo.
- Primer campo con `autofocus: true` solo al crear. `textInputAction: next` entre campos, `done` en el último.
- Teclado correcto: `keyboardType` (`emailAddress`, `multiline`, `number`), `textCapitalization: sentences` en títulos.
- Fechas con `showDatePicker` sobre un campo de solo lectura, **nunca** texto `AAAA-MM-DD` a mano.
- Enum de 2–4 opciones → `SegmentedButton`; 5+ → `DropdownMenu` o bottom sheet con lista.
- Agrupa con un subtítulo (`labelLarge`, color `tintaTenue`) cada 3–4 campos relacionados.

## Bottom sheet de acción rápida

```dart
showModalBottomSheet<T>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  useSafeArea: true,
  builder: (ctx) => Padding(
    padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
    child: ...,  // título, 1–2 campos, botón FilledButton a ancho completo
  ),
);
```

## Diálogo de confirmación

Solo título + una frase + dos botones. Acciones destructivas: botón en `rosePeligro` con el verbo concreto («Eliminar», no «Aceptar»). **Toda eliminación pide confirmación** (o ofrece «Deshacer» en el `SnackBar`).

## Varios pasos

- Un solo `GlobalKey<FormState>` por paso o validación por campos del paso; los valores viven en el `State` de la página y se conservan al volver.
- Indicador «Paso 2 de 3» bajo la `AppBar`; «Atrás» no valida; «Siguiente» valida solo el paso; el último paso es un resumen con «Guardar».

## Checklist

- [ ] Formato elegido según la tabla (ningún `Dialog` con 2+ campos).
- [ ] Form separado de la página; archivo < 250 líneas, si no, partido por secciones.
- [ ] Guardar visible con el teclado abierto; botón deshabilitado + indicador mientras guarda.
- [ ] Errores del servidor en `SnackBar` o bajo el campo, nunca silenciados.
- [ ] Eliminar pide confirmación.
- [ ] Probado a 360 dp de ancho con el teclado abierto: nada tapado, sin overflow.
