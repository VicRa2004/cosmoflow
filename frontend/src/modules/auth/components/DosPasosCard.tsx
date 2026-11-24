import { ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { BotonCopiar } from "@/core/components/ui/BotonCopiar";
import { Button } from "@/core/components/ui/Button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { Input } from "@/core/components/ui/Input";
import { Spinner } from "@/core/components/ui/Spinner";
import {
	useActivarDosPasosMutation,
	useDosPasosQuery,
	useIniciarDosPasosMutation,
	useRefrescarDosPasos,
} from "../hooks/useDosPasos";
import { DesactivarDosPasosDialog } from "./DesactivarDosPasosDialog";

/** Verificación en dos pasos (TOTP): activar con QR + primer código, o desactivar. */
export function DosPasosCard() {
	const estado = useDosPasosQuery();
	const iniciar = useIniciarDosPasosMutation();
	const activar = useActivarDosPasosMutation();
	const refrescar = useRefrescarDosPasos();
	const [codigo, setCodigo] = useState("");
	const [codigos, setCodigos] = useState<string[] | null>(null);
	const [desactivando, setDesactivando] = useState(false);

	const confirmar = (evento: React.FormEvent) => {
		evento.preventDefault();
		activar.mutate(codigo, {
			onSuccess: setCodigos,
			onError: () => setCodigo(""),
		});
	};

	const terminar = () => {
		setCodigos(null);
		setCodigo("");
		iniciar.reset();
		refrescar();
	};

	return (
		<Card className="space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">Verificación en dos pasos</CardTitle>
				<CardDescription>
					Al entrar con tu contraseña te pediremos además un código de tu app
					autenticadora (Google Authenticator, 1Password, Aegis…). El acceso con
					Google no lo pide: usa la verificación de tu cuenta de Google.
				</CardDescription>
			</CardHeader>

			{estado.isPending ? (
				<Spinner />
			) : codigos ? (
				<div className="space-y-3">
					<p className="text-sm text-tinta-suave">
						Guarda estos códigos de recuperación en un lugar seguro. Cada uno te
						deja entrar una vez si pierdes el móvil, y no volverás a verlos.
					</p>
					<ul className="grid grid-cols-2 gap-2 rounded-md border border-borde p-3 font-mono text-sm">
						{codigos.map((c) => (
							<li key={c}>{c}</li>
						))}
					</ul>
					<div className="flex justify-end gap-2">
						<BotonCopiar texto={codigos.join("\n")} />
						<Button size="sm" onClick={terminar}>
							Hecho
						</Button>
					</div>
				</div>
			) : estado.data?.isActivo ? (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p className="flex items-center gap-2 text-sm text-tinta-suave">
						<ShieldCheck className="h-5 w-5 text-emerald-400" />
						Activada · {estado.data.codigosRestantes} códigos de recuperación
						sin usar
					</p>
					<Button
						variant="dangerGhost"
						size="sm"
						onClick={() => setDesactivando(true)}
					>
						Desactivar
					</Button>
				</div>
			) : iniciar.data ? (
				<form onSubmit={confirmar} className="space-y-4">
					<p className="text-sm text-tinta-suave">
						1. Escanea el código con tu app autenticadora. 2. Escribe el código
						de 6 dígitos que te muestra.
					</p>
					<div className="w-fit rounded-md bg-white p-3">
						<QRCodeSVG
							value={iniciar.data.uri}
							size={176}
							title="Código QR para la app autenticadora"
						/>
					</div>
					<div className="flex items-center gap-2">
						<code className="truncate rounded bg-superficie px-2 py-1 text-xs">
							{iniciar.data.secreto}
						</code>
						<BotonCopiar texto={iniciar.data.secreto} />
					</div>
					<div className="flex items-end gap-2">
						<Input
							label="Código"
							value={codigo}
							onChange={(e) => setCodigo(e.target.value)}
							inputMode="numeric"
							autoComplete="one-time-code"
							placeholder="123456"
							maxLength={6}
						/>
						<Button
							type="submit"
							isLoading={activar.isPending}
							disabled={!/^\d{6}$/.test(codigo)}
						>
							Activar
						</Button>
					</div>
				</form>
			) : (
				<div className="flex justify-end">
					<Button
						variant="outline"
						size="sm"
						onClick={() => iniciar.mutate()}
						isLoading={iniciar.isPending}
					>
						<ShieldCheck className="h-4 w-4" />
						Activar verificación en dos pasos
					</Button>
				</div>
			)}

			<DesactivarDosPasosDialog
				abierto={desactivando}
				onCerrar={() => setDesactivando(false)}
			/>
		</Card>
	);
}
