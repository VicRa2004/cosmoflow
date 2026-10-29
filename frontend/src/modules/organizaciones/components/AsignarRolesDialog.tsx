import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { Checkbox } from "@/core/components/ui/Checkbox";
import { Dialog } from "@/core/components/ui/Dialog";
import type { MiembroDto } from "../api/miembrosApi";
import {
	useGestionRoles,
	useRolesOrganizacionQuery,
} from "../hooks/useRolesOrganizacion";

/** Elige los roles de un miembro (RN-14: varios o ninguno). */
export function AsignarRolesDialog({
	organizacionId,
	miembro,
	onCerrar,
}: {
	organizacionId: number;
	miembro: MiembroDto;
	onCerrar: () => void;
}) {
	const { data: roles } = useRolesOrganizacionQuery(organizacionId);
	const { asignar } = useGestionRoles(organizacionId);
	const [elegidos, setElegidos] = useState(
		() => new Set(miembro.roles.map((r) => r.id)),
	);

	const alternar = (id: number) =>
		setElegidos((previos) => {
			const siguientes = new Set(previos);
			if (!siguientes.delete(id)) siguientes.add(id);
			return siguientes;
		});

	return (
		<Dialog abierto onCerrar={onCerrar} titulo={`Roles de ${miembro.nombre}`}>
			<div className="space-y-4">
				{roles?.length === 0 ? (
					<p className="text-sm text-tinta-tenue">
						Crea un rol primero en la tarjeta «Roles».
					</p>
				) : (
					<div className="space-y-2">
						{roles?.map((rol) => (
							<Checkbox
								key={rol.id}
								label={rol.nombre}
								checked={elegidos.has(rol.id)}
								onChange={() => alternar(rol.id)}
							/>
						))}
					</div>
				)}
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={onCerrar}>
						Cancelar
					</Button>
					<Button
						isLoading={asignar.isPending}
						onClick={() =>
							asignar.mutate(
								{ usuarioId: miembro.usuarioId, rolIds: [...elegidos] },
								{ onSuccess: onCerrar },
							)
						}
					>
						Guardar
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
