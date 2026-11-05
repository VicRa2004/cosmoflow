---
name: disenar-paginas
description: Decide si una vista del frontend de Cosmoflow va en una sola página o se divide en secciones con pestañas (cada una su propia ruta), como la organización o el perfil. Úsala al crear una página nueva, al añadir tarjetas o bloques a una existente, o cuando una página se sienta saturada.
---

# Diseñar páginas: una o varias

Regla: **una página, un propósito**. Si al usuario le cuesta encontrar algo haciendo scroll, la página debe dividirse.

## Cuándo una sola página

- 1–3 bloques (tarjetas, tablas, formularios) que se usan juntos.
- Cabe en una o dos pantallas sin scroll largo.
- Todo responde a la misma pregunta (p. ej. «mis tags», «las tareas de hoy»).

Estructura: `EncabezadoPagina` + bloques con `space-y-6`.

## Cuándo dividir en secciones

Divide si se cumple **cualquiera**:

- 4 o más bloques, o más de ~2 pantallas de scroll.
- Hay bloques de temas distintos (datos de cuenta vs. seguridad vs. integraciones).
- Parte del contenido depende de permisos (ocultas una pestaña entera en vez de huecos sueltos).
- Algún bloque es pesado (tabla paginada, editor) y no hace falta cargarlo siempre.

Agrupa por tarea del usuario, no por entidad técnica. Entre 2 y 6 pestañas; con más, revisa si hay que crear otra página.

## Cómo dividir (patrón del repo)

Ejemplos vivos: `modules/organizaciones/pages/OrganizacionLayout.tsx` y `modules/usuarios/pages/PerfilLayout.tsx`.

1. **Layout** en `modules/<modulo>/pages/<Nombre>Layout.tsx`: cabecera (`EncabezadoPagina` o la cabecera propia de la entidad) + `Pestanas` + `<Outlet />`.
   ```tsx
   <Pestanas etiqueta="Secciones del perfil">
     {SECCIONES.map(({ to, etiqueta }) => (
       <Link key={to} to={to} {...pestanaProps}>{etiqueta}</Link>
     ))}
   </Pestanas>
   <Outlet />
   ```
   `Pestanas` y `pestanaProps` viven en `core/components/ui/Pestanas.tsx`; no copies las clases a mano.
2. **Rutas**: `routes/_authenticated/<ruta>.tsx` monta el layout y `routes/_authenticated/<ruta>/<seccion>.tsx` cada sección. La ruta de sección solo compone tarjetas existentes (sin lógica ni peticiones).
3. **Índice**: `<ruta>/index.tsx` redirige a la primera sección con `throw redirect({ to, replace: true })` en `beforeLoad`, así los enlaces antiguos a `/<ruta>` siguen funcionando.
4. **Datos compartidos** del layout (la entidad) se pasan por contexto (`OrganizacionContext`), no se vuelven a pedir en cada sección.
5. **Permisos**: la pestaña se omite del array si no se puede ver (`puede(...)` / `puedeEn(...)`); la ruta muestra `SinAccesoSeccion` si se entra por URL.
6. **Migas**: si la ruta está fuera del menú, añade su prefijo a `FUERA_DEL_MENU` en `core/components/layout/Navbar.tsx`.

## Checklist

- [ ] ¿Cuántos bloques y temas tiene? → una página o secciones.
- [ ] Cada sección tiene nombre corto (1–2 palabras) y una URL propia.
- [ ] `/<ruta>` redirige a la primera sección.
- [ ] Textos que mandaban a «tu perfil, en X» apuntan a la sección nueva.
- [ ] `pnpm verify` (knip detecta páginas que se quedaron sin uso).
