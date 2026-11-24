import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { useAuthStore } from "@/core/auth/store";
import { descargarZip } from "@/modules/notas/utils/exportar";
import { authApi } from "../api/authApi";
import { archivosExportacion } from "../utils/exportarCuenta";

const onError = (error: unknown) => toast.error(getErrorMessage(error));

export function useRecuperarPasswordMutation() {
	return useMutation({ mutationFn: authApi.recuperarPassword, onError });
}

export function useRestablecerPasswordMutation() {
	const navigate = useNavigate();
	return useMutation({
		mutationFn: authApi.restablecerPassword,
		onSuccess: ({ mensaje }) => {
			toast.success(mensaje);
			navigate({ to: "/login" });
		},
		onError,
	});
}

export function useVerificarEmailMutation() {
	return useMutation({
		mutationFn: authApi.verificarEmail,
		onSuccess: () => {
			// shortcut: marca la sesión abierta aunque el enlace fuera de otra cuenta; solo afecta al aviso del perfil.
			const { isAuthenticated, actualizarUsuario } = useAuthStore.getState();
			if (isAuthenticated) actualizarUsuario({ emailVerificado: true });
		},
		onError,
	});
}

export function useReenviarVerificacionMutation() {
	return useMutation({
		mutationFn: authApi.reenviarVerificacion,
		onSuccess: ({ mensaje }) => toast.success(mensaje),
		onError,
	});
}

export function useCambiarPasswordMutation() {
	const setTokens = useAuthStore((state) => state.setTokens);
	return useMutation({
		mutationFn: authApi.cambiarPassword,
		onSuccess: (tokens) => {
			setTokens(tokens);
			toast.success("Contraseña cambiada. Se cerraron tus otras sesiones.");
		},
		onError,
	});
}

export function useCerrarSesionesMutation() {
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);
	return useMutation({
		mutationFn: authApi.cerrarSesiones,
		onSuccess: ({ mensaje }) => {
			logout();
			toast.success(mensaje);
			navigate({ to: "/login" });
		},
		onError,
	});
}

export function useExportarDatosMutation() {
	return useMutation({
		mutationFn: async () => {
			const archivos = archivosExportacion(await authApi.exportarDatos());
			descargarZip(
				archivos,
				`cosmoflow-mis-datos-${new Date().toISOString().slice(0, 10)}`,
			);
		},
		onError,
	});
}

export function useEliminarCuentaMutation() {
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);
	return useMutation({
		mutationFn: authApi.eliminarCuenta,
		onSuccess: () => {
			logout();
			toast.success("Tu cuenta se ha eliminado");
			navigate({ to: "/login" });
		},
		onError,
	});
}
