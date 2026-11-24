import { useState } from "react";
import { Button } from "@/core/components/ui/Button";
import { Dialog } from "@/core/components/ui/Dialog";
import { Input } from "@/core/components/ui/Input";
import { useDesactivarDosPasosMutation } from "../hooks/useDosPasos";

/** Pide la contraseña o un código (las cuentas de Google no tienen contraseña conocida). */
export function DesactivarDosPasosDialog({
	abierto,
	onCerrar,
}: {
	abierto: boolean;
	onCerrar: () => void;
}) {
	const desactivar = useDesactivarDosPasosMutation();
	const [conCodigo, setConCodigo] = useState(false);
	const [valor, setValor] = useState("");

	const cerrar = () => {
		setValor("");
		onCerrar();
	};

	const enviar = (evento: React.FormEvent) => {
		evento.preventDefault();
		desactivar.mutate(conCodigo ? { codigo: valor } : { password: valor }, {
			onSuccess: cerrar,
		});
	};

	return (
		<Dialog
			abierto={abierto}
			onCerrar={cerrar}
			titulo="Desactivar la verificación en dos pasos"
			descripcion="Tu cuenta quedará protegida solo por la contraseña."
		>
			<form onSubmit={enviar} className="space-y-4">
				<Input
					label={
						conCodigo ? "Código de la app o de recuperación" : "Contraseña"
					}
					type={conCodigo ? "text" : "password"}
					autoComplete={conCodigo ? "one-time-code" : "current-password"}
					value={valor}
					onChange={(e) => setValor(e.target.value)}
					required
				/>
				<div className="flex items-center justify-between gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setConCodigo(!conCodigo);
							setValor("");
						}}
					>
						{conCodigo ? "Usar mi contraseña" : "Usar un código"}
					</Button>
					<Button
						type="submit"
						variant="danger"
						isLoading={desactivar.isPending}
						disabled={!valor}
					>
						Desactivar
					</Button>
				</div>
			</form>
		</Dialog>
	);
}
