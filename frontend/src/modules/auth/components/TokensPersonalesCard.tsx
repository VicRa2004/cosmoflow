import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useAppForm } from "@/core/components/form/useAppForm";
import { BotonCopiar } from "@/core/components/ui/BotonCopiar";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { ConfirmDialog } from "@/core/components/ui/ConfirmDialog";
import { Spinner } from "@/core/components/ui/Spinner";
import type { TokenPersonal } from "../api/authApi";
import {
	useCrearTokenPersonalMutation,
	useRevocarTokenPersonalMutation,
	useTokensPersonalesQuery,
} from "../hooks/useTokensPersonales";
import { tokenPersonalSchema } from "../schemas/authSchemas";

/** El valor se pierde al cerrar o recargar: en el servidor solo queda su hash. */
function TokenRecienCreado({
	token,
	onCerrar,
}: {
	token: string;
	onCerrar: () => void;
}) {
	return (
		<div className="space-y-3 rounded-lg border border-borde p-4">
			<p className="text-sm font-medium text-tinta-suave" role="status">
				Copia el token ahora: no se volverá a mostrar.
			</p>
			<code className="block break-all rounded-md bg-elevada p-3 font-mono text-xs select-all">
				{token}
			</code>
			<div className="flex gap-2">
				<BotonCopiar texto={token} />
				<Button variant="ghost" size="sm" onClick={onCerrar}>
					Ya lo he guardado
				</Button>
			</div>
		</div>
	);
}

/** Tokens para clientes de la API; las conexiones con Claude también aparecen aquí. */
export function TokensPersonalesCard() {
	const { data: tokens, error } = useTokensPersonalesQuery();
	const crear = useCrearTokenPersonalMutation();
	const revocar = useRevocarTokenPersonalMutation();
	const [aRevocar, setARevocar] = useState<TokenPersonal | null>(null);

	const form = useAppForm({
		defaultValues: { nombre: "" },
		validators: { onSubmit: tokenPersonalSchema },
		onSubmit: async ({ value, formApi }) => {
			await crear.mutateAsync(value);
			formApi.reset();
		},
	});

	return (
		<Card className="space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">Tokens personales</CardTitle>
				<CardDescription>
					Dan acceso a tu cuenta con tus mismos permisos y no caducan. Aquí
					también aparecen las conexiones con Claude: revoca las que ya no uses.
				</CardDescription>
			</CardHeader>

			{crear.data && (
				<TokenRecienCreado token={crear.data.token} onCerrar={crear.reset} />
			)}

			<form.AppForm>
				<form.Formulario className="flex items-start gap-2">
					<div className="min-w-0 flex-1">
						<form.AppField name="nombre">
							{(campo) => (
								<campo.CampoTexto
									label="Nombre"
									placeholder="Ej.: Claude Code"
									autoComplete="off"
								/>
							)}
						</form.AppField>
					</div>
					<form.BotonEnviar className="mt-6 shrink-0">
						<KeyRound className="h-4 w-4" />
						Crear token
					</form.BotonEnviar>
				</form.Formulario>
			</form.AppForm>

			{error ? (
				<p className="text-sm text-rose-400">
					No se pudieron cargar tus tokens.
				</p>
			) : !tokens ? (
				<div className="flex justify-center py-4 text-tinta-tenue">
					<Spinner />
				</div>
			) : tokens.length === 0 ? (
				<p className="text-sm text-tinta-tenue">Aún no tienes tokens.</p>
			) : (
				<ul className="divide-y divide-borde">
					{tokens.map((token) => (
						<li
							key={token.id}
							className="flex items-center justify-between gap-3 py-3"
						>
							<div className="min-w-0">
								<p className="truncate text-sm text-tinta-suave">
									{token.nombre}
								</p>
								<p className="text-xs text-tinta-tenue">
									<span className="font-mono">…{token.pista}</span> · creado el{" "}
									{new Date(token.createdAt).toLocaleDateString()}
								</p>
							</div>
							<Button
								variant="dangerGhost"
								size="sm"
								onClick={() => setARevocar(token)}
							>
								Revocar
							</Button>
						</li>
					))}
				</ul>
			)}

			<ConfirmDialog
				abierto={aRevocar !== null}
				titulo="Revocar token"
				mensaje={`«${aRevocar?.nombre}» dejará de funcionar al instante. Esta acción no se puede deshacer.`}
				textoConfirmar="Revocar"
				peligroso
				isLoading={revocar.isPending}
				onConfirmar={() => {
					if (!aRevocar) return;
					revocar.mutate(aRevocar.id, {
						onSettled: () => setARevocar(null),
					});
				}}
				onCancelar={() => setARevocar(null)}
			/>
		</Card>
	);
}
