import { Entity } from "@/core/shared/domain/Entity";
import { EntityId } from "@/core/shared/domain/EntityId";
import type { ProyectoNota } from "./Nota";

export interface DatosCarpeta {
	nombre: string;
	/** Emoji o `null`. */
	icono: string | null;
	/** Color de acento (#rrggbb) o `null`. */
	color: string | null;
	/** Carpeta padre del mismo ámbito, o `null` en la raíz. */
	padreId: number | null;
}

/** Ordena notas; mismo ámbito que ellas: personal o de un proyecto (RN-33, RN-50). */
export class CarpetaNota extends Entity {
	private constructor(
		id: EntityId,
		private readonly usuarioId: number,
		private datos: DatosCarpeta,
		private readonly proyecto: ProyectoNota | null,
	) {
		super(id);
	}

	public static crear(
		usuarioId: number,
		datos: {
			nombre: string;
			icono?: string | null;
			color?: string | null;
			padreId?: number | null;
		},
		proyecto: ProyectoNota | null = null,
	): CarpetaNota {
		return new CarpetaNota(
			new EntityId(),
			usuarioId,
			{
				nombre: datos.nombre,
				icono: datos.icono ?? null,
				color: datos.color ?? null,
				padreId: datos.padreId ?? null,
			},
			proyecto,
		);
	}

	public static reconstituir(
		id: number,
		usuarioId: number,
		datos: DatosCarpeta,
		proyecto: ProyectoNota | null = null,
	): CarpetaNota {
		return new CarpetaNota(new EntityId(id), usuarioId, datos, proyecto);
	}

	esNueva() {
		return this.id.isNew();
	}

	/** Quien la creó; en las personales, su dueño. */
	getUsuarioId() {
		return this.usuarioId;
	}

	getProyecto(): ProyectoNota | null {
		return this.proyecto && { ...this.proyecto };
	}

	getDatos(): DatosCarpeta {
		return { ...this.datos };
	}

	/** `undefined` deja el campo como está; `null` lo quita (o la sube a la raíz). */
	public actualizar(cambios: Partial<DatosCarpeta>): void {
		const valor = <K extends keyof DatosCarpeta>(k: K) =>
			cambios[k] === undefined ? this.datos[k] : cambios[k];
		this.datos = {
			nombre: cambios.nombre ?? this.datos.nombre,
			icono: valor("icono"),
			color: valor("color"),
			padreId: valor("padreId"),
		};
	}
}
