# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas que organizan su trabajo diario: primero de forma individual (tareas y notas personales) y, en fases siguientes, dentro de organizaciones y equipos. Uso principal en escritorio, en sesiones largas.

## Product Purpose

Cosmoflow es una aplicación de productividad para gestionar tareas, notas y tags, que crecerá a organizaciones, equipos y proyectos colaborativos. Éxito: el usuario sabe en todo momento qué le queda por hacer (la portada son los pendientes ordenados por vencimiento) y encuentra lo que escribió.

## Operating Context

- Portada `/dashboard`: pendientes por vencimiento. Tareas y notas en markdown con imágenes.
- Hay módulos administrativos (usuarios, roles y permisos) que solo ve quien tiene permiso.
- El menú crecerá con Organizaciones, Equipos, Proyectos y Notificaciones (planificación en Obsidian, `03_Proyectos/Cosmoflow/`).

## Capabilities and Constraints

- Autorización por permisos `recurso:accion` (p. ej. `usuarios:leer`); la interfaz oculta lo que el usuario no puede usar. Sin el módulo `autorizacion` del backend, todo usuario autenticado tiene acceso.
- Tema claro, oscuro y del sistema.
- Interfaz y código en español.
- Pendiente: app móvil (Expo) y servidor MCP consumirán la misma API.

## Brand Commitments

- Nombre: Cosmoflow.
- Carácter: calma y foco. Es una herramienta en la que se pasan horas; nada compite con el contenido.
- Estándar de la categoría, elegido a propósito (2026-10-28): debe sentirse junto a Linear, Notion y Todoist, con su nivel de oficio. Convenciones de la categoría sin rarezas.
- Tipografía: Inter variable.

## Evidence on Hand

No hay testimonios, clientes ni métricas reales. No inventarlos.

## Product Principles

1. Lo pendiente primero: la información que obliga a actuar va arriba.
2. El contenido del usuario es el protagonista; la interfaz se retira.
3. Solo se muestra lo que el usuario puede usar.
4. Debe escalar a muchas secciones sin rediseñar la navegación.
