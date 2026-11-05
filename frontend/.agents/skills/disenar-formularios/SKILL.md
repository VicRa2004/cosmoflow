---
name: disenar-formularios
description: Decide cómo presentar un formulario en el frontend de Cosmoflow según su tamaño — modal (Dialog) para pocos campos, página completa para formularios medianos o con editor, y asistente de varios pasos para formularios muy largos. Úsala al crear o ampliar cualquier formulario.
---

# Diseñar formularios: modal, página o pasos

Cuenta los **campos que el usuario rellena** (no los ocultos) y mira su peso.

| Tamaño | Formato | Ejemplos en el repo |
| --- | --- | --- |
| 1–4 campos simples | **Modal** (`Dialog`) | `OrganizacionForm` en `OrganizacionesPage`, `AsignarTareaDialog`, `MoverTareaDialog` |
| 5–12 campos, o cualquier editor markdown/archivo | **Página completa** | `TareaEditorPage`, `NotaEditorPage` (`/tareas/nueva`, `/tareas/$id/editar`) |
| Más de ~12 campos, o grupos que dependen de respuestas previas | **Varios pasos** en una página | — (seguir el patrón de abajo) |

Fuerzan **página** aunque haya pocos campos: un editor de texto largo (`EditorMarkdown`), subida de archivos, o que el usuario necesite consultar otra cosa mientras escribe. Fuerzan **modal** aunque haya 5 campos: acción rápida que no saca al usuario de su contexto (asignar, mover, renombrar).

En todos los casos: `useAppForm` + esquema Zod en `schemas/` + mutación en `hooks/` (ver `frontend/AGENTS.md`, sección Formularios). El componente `<Feature>Form.tsx` no sabe si vive en un modal o en una página: recibe `onExito`/`onCancelar`.

## Modal

```tsx
<Dialog abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nuevo tag">
  <TagForm onExito={() => setAbierto(false)} />
</Dialog>
```

- Botones al final: secundario «Cancelar» + `form.BotonEnviar`.
- Sin scroll interno: si el modal necesita scroll, pásalo a página.

## Página completa

- Ruta propia (`<recurso>/nueva`, `<recurso>/$id_.editar`) con `EncabezadoPagina`; al guardar, `navigate` a la lectura o la lista.
- Agrupa campos relacionados con un subtítulo o `Card` por grupo; ancho máximo `max-w-2xl` (o `max-w-3xl` con editor).
- La página solo compone: el formulario va en `components/`.

## Varios pasos

Un **solo** `useAppForm` para todo el asistente (los valores se conservan al ir y volver), con el paso actual en estado local:

```tsx
const PASOS = [
  { titulo: "Datos básicos", campos: ["nombre", "descripcion"] },
  { titulo: "Miembros", campos: ["miembros"] },
  { titulo: "Revisión", campos: [] },
] as const;

const [paso, setPaso] = useState(0);

async function siguiente() {
  const errores = await Promise.all(
    PASOS[paso].campos.map((c) => form.validateField(c, "submit")),
  );
  if (errores.flat().length === 0) setPaso((p) => p + 1);
}
```

- Indicador «Paso 2 de 3 · Miembros» arriba (`aria-current="step"` en el activo).
- «Atrás» nunca valida; «Siguiente» valida solo los campos del paso; el último paso es una **revisión** con resumen y `form.BotonEnviar`.
- 3–5 pasos, cada uno con un tema. El esquema Zod es uno solo (el backend valida el conjunto).
- Si el paso viaja en la URL (`?paso=2`), valida el search con Zod y no dejes saltar a un paso sin completar los anteriores.

## Checklist

- [ ] Campos contados y formato elegido según la tabla.
- [ ] Esquema Zod en `schemas/`, mutación en `hooks/`, toasts en la mutación.
- [ ] Usable con teclado: Esc cierra el modal; Enter envía; foco en el primer campo.
- [ ] En móvil (≤ 375 px) no hay scroll horizontal.
