import { describe, expect, it } from "bun:test";

/**
 * RN-91: soft-delete en todas las entidades. Un modelo nuevo debe tener
 * `deletedAt` o estar aquí con el motivo; así no se cuela uno con borrado físico.
 */
const EXENTOS: Record<string, string> = {
	// Tablas de relación: se reemplazan enteras al editar la entidad dueña.
	UsuarioRol: "relación",
	RolPermiso: "relación",
	UsuarioPermiso: "relación",
	TareaTag: "relación",
	NotaTag: "relación",
	// Salir o ser expulsado borra la fila; quién lo hizo queda en auditoría.
	MiembroOrganizacion: "relación",
	// Técnicas: no son datos del usuario y caducan o se purgan solas.
	RefreshToken: "técnica",
	TokenCuenta: "técnica",
	EventoOutbox: "técnica",
	Auditoria: "registro histórico, nunca se borra",
	Adjunto: "inmutable y sin endpoint de borrado",
	Invitacion: "cancelarla cambia su estado; nunca se borra",
	// Catálogo global de la plantilla; los roles por organización (Fase 2) sí lo llevarán.
	Rol: "catálogo global de la plantilla",
	Permiso: "catálogo global de la plantilla",
};

const schema = await Bun.file(`${import.meta.dir}/schema.prisma`).text();
const modelos = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)].map(
	([, nombre, cuerpo]) => ({ nombre, cuerpo }),
);

describe("Borrado lógico (RN-91)", () => {
	it("todo modelo tiene deletedAt o una exención justificada", () => {
		const sinBorradoLogico = modelos
			.filter(
				({ nombre, cuerpo }) =>
					!/^\s*deletedAt\s/m.test(cuerpo) && !EXENTOS[nombre],
			)
			.map(({ nombre }) => nombre);

		expect(modelos.length).toBeGreaterThan(10);
		expect(sinBorradoLogico).toEqual([]);
	});

	it("las exenciones siguen existiendo en el schema", () => {
		const nombres = modelos.map((m) => m.nombre);
		expect(Object.keys(EXENTOS).filter((n) => !nombres.includes(n))).toEqual(
			[],
		);
	});
});
