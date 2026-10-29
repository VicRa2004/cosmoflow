import type { AppModule } from "@/core/shared/infrastructure/di/AppModule";
import { usuarioModule } from "@/core/usuario/module";
import { authModule } from "@/modules/auth/module";
import { autorizacionModule } from "@/modules/autorizacion/module";
import { auditoriaModule } from "@/modules/auditoria/module";
import { eventosModule } from "@/modules/eventos/module";
import { tagModule } from "@/modules/tag/module";
import { tareaModule } from "@/modules/tarea/module";
import { notaModule } from "@/modules/nota/module";
import { adjuntoModule } from "@/modules/adjunto/module";
import { organizacionModule } from "@/modules/organizacion/module";
import { equipoModule } from "@/modules/equipo/module";
import { proyectoModule } from "@/modules/proyecto/module";

/**
 * Módulos activos, en orden de registro. Añadir o quitar un módulo = tocar esta lista
 * (checklist completa en `backend/AGENTS.md`, "Cómo quitar un módulo").
 */
export const modules: AppModule[] = [
	usuarioModule,
	authModule,
	autorizacionModule,
	eventosModule,
	auditoriaModule,
	tagModule,
	tareaModule,
	notaModule,
	adjuntoModule,
	organizacionModule,
	// Después de `organizacion`: sustituye su `SalidaMiembro`.
	equipoModule,
	// Después de `equipo`: sustituye su `BajaEquipo`.
	proyectoModule,
];
