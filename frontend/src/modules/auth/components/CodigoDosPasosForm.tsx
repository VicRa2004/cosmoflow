import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import type { AuthResponse } from "@/core/auth/types";
import { Button } from "@/core/components/ui/Button";
import { Input } from "@/core/components/ui/Input";
import { authApi } from "../api/authApi";

/** Segundo paso del login: código de la app autenticadora o de recuperación. */
export function CodigoDosPasosForm({
	tokenDosPasos,
	onEntrar,
	onVolver,
}: {
	tokenDosPasos: string;
	onEntrar: (response: AuthResponse) => void;
	onVolver: () => void;
}) {
	const [codigo, setCodigo] = useState("");
	const [enviando, setEnviando] = useState(false);
	const [conRecuperacion, setConRecuperacion] = useState(false);

	const enviar = async (evento: React.FormEvent) => {
		evento.preventDefault();
		setEnviando(true);
		try {
			onEntrar(await authApi.loginDosPasos({ tokenDosPasos, codigo }));
		} catch (error: unknown) {
			toast.error(getErrorMessage(error));
			setCodigo("");
		} finally {
			setEnviando(false);
		}
	};

	return (
		<form onSubmit={enviar} className="space-y-4">
			<p className="text-sm text-tinta-suave">
				{conRecuperacion
					? "Escribe uno de tus códigos de recuperación. Cada uno sirve una sola vez."
					: "Escribe el código de 6 dígitos de tu app autenticadora."}
			</p>
			<Input
				label={conRecuperacion ? "Código de recuperación" : "Código"}
				value={codigo}
				onChange={(e) => setCodigo(e.target.value)}
				autoComplete="one-time-code"
				inputMode={conRecuperacion ? "text" : "numeric"}
				placeholder={conRecuperacion ? "xxxxx-xxxxx" : "123456"}
				maxLength={conRecuperacion ? 20 : 6}
				autoFocus
				required
			/>
			<Button
				type="submit"
				size="lg"
				className="w-full"
				isLoading={enviando}
				disabled={codigo.trim().length < 6}
			>
				Verificar
			</Button>
			<div className="flex justify-between text-[13px]">
				<Button variant="ghost" size="sm" onClick={onVolver}>
					Volver
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						setConRecuperacion(!conRecuperacion);
						setCodigo("");
					}}
				>
					{conRecuperacion
						? "Usar la app autenticadora"
						: "Usar un código de recuperación"}
				</Button>
			</div>
		</form>
	);
}
