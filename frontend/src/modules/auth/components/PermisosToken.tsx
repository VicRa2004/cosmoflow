import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { Checkbox } from "@/core/components/ui/Checkbox";
import { Select } from "@/core/components/ui/Select";
import type { AlcanceToken, TokenPersonal } from "../api/authApi";
import { useCambiarAlcancesTokenMutation } from "../hooks/useTokensPersonales";

const AREAS = [
	["tareas", "Tareas, tags y plantillas"],
	["notas", "Notas y carpetas"],
	["notificaciones", "Notificaciones"],
	["organizaciones", "Organizaciones, equipos y proyectos"],
] as const;

type Area = (typeof AREAS)[number][0];
type Nivel = "" | "leer" | "escribir";

/** Escribir incluye leer (así lo comprueba el backend). */
function nivelDe(alcances: AlcanceToken[], area: Area): Nivel {
	if (alcances.includes(`${area}:escribir`)) return "escribir";
	if (alcances.includes(`${area}:leer`)) return "leer";
	return "";
}

/** Limita lo que puede hacer un token o una conexión con Claude, por área. */
export function PermisosToken({
	token,
	onCerrar,
}: {
	token: TokenPersonal;
	onCerrar: () => void;
}) {
	const cambiar = useCambiarAlcancesTokenMutation();
	const [completo, setCompleto] = useState(token.alcances === null);
	const [niveles, setNiveles] = useState(
		() =>
			Object.fromEntries(
				AREAS.map(([area]) => [area, nivelDe(token.alcances ?? [], area)]),
			) as Record<Area, Nivel>,
	);

	const alcances = AREAS.flatMap(([area]) =>
		niveles[area] ? [`${area}:${niveles[area]}` as AlcanceToken] : [],
	);
	const sinNada = !completo && alcances.length === 0;

	return (
		<div className="mt-3 space-y-3 rounded-lg border border-borde p-3">
			<Checkbox
				label="Acceso completo (los mismos permisos que tu cuenta)"
				checked={completo}
				onChange={(e) => setCompleto(e.target.checked)}
			/>
			{!completo && (
				<div className="grid gap-3 sm:grid-cols-2">
					{AREAS.map(([area, nombre]) => (
						<Select
							key={area}
							label={nombre}
							value={niveles[area]}
							onChange={(e) =>
								setNiveles({ ...niveles, [area]: e.target.value as Nivel })
							}
						>
							<option value="">Sin acceso</option>
							<option value="leer">Solo leer</option>
							<option value="escribir">Leer y modificar</option>
						</Select>
					))}
				</div>
			)}
			{sinNada && (
				<p className="text-xs text-rose-400">Elige al menos un permiso.</p>
			)}
			<p className="text-xs text-tinta-tenue">
				Nunca dan más de lo que tu cuenta puede hacer. El cambio se aplica en la
				siguiente petición.
			</p>
			<div className="flex gap-2">
				<Button
					size="sm"
					disabled={sinNada}
					isLoading={cambiar.isPending}
					onClick={() =>
						cambiar.mutate(
							{ id: token.id, alcances: completo ? null : alcances },
							{ onSuccess: onCerrar },
						)
					}
				>
					Guardar permisos
				</Button>
				<Button variant="ghost" size="sm" onClick={onCerrar}>
					Cancelar
				</Button>
			</div>
		</div>
	);
}
