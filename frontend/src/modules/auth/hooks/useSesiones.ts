import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { useAuthStore } from "@/core/auth/store";
import { authApi, type SesionDto } from "../api/authApi";

const SESIONES_KEY = ["auth", "sesiones"] as const;

export function useSesionesQuery() {
	return useQuery({
		queryKey: SESIONES_KEY,
		queryFn: authApi.sesiones,
	});
}

export function useRevocarSesionMutation() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const logout = useAuthStore((state) => state.logout);

	return useMutation({
		mutationFn: (sesion: SesionDto) => authApi.revocarSesion(sesion.id),
		onSuccess: (_data, sesion) => {
			toast.success("Sesión cerrada");
			if (sesion.isActual) {
				logout();
				navigate({ to: "/login" });
				return;
			}
			return queryClient.invalidateQueries({ queryKey: SESIONES_KEY });
		},
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
