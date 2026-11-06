import { Pipette } from "lucide-react";
import { type FormHTMLAttributes, type ReactNode, useId } from "react";
import { Button, type ButtonProps } from "@/core/components/ui/Button";
import { Checkbox, type CheckboxProps } from "@/core/components/ui/Checkbox";
import { cn } from "@/core/utils/cn";
import { COLORES_ACENTO } from "@/core/components/ui/PuntoColor";
import { Input, type InputProps } from "@/core/components/ui/Input";
import { Select, type SelectProps } from "@/core/components/ui/Select";
import { useFieldContext, useFormContext } from "./contextos";

/** Lo que el campo pone solo: valor, cambios, blur, error e id. */
type Cableado = "value" | "checked" | "onChange" | "onBlur" | "error" | "name";

/** Primer error del campo (issue de Zod o texto), solo tras tocarlo o enviar. */
function useError(): string | undefined {
	const { state } = useFieldContext<unknown>();
	if (!state.meta.isTouched) return undefined;
	const error: unknown = state.meta.errors[0];
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		return String(error.message);
	}
	return undefined;
}

export function CampoTexto(props: Omit<InputProps, Cableado>) {
	const campo = useFieldContext<string>();
	const id = useId();
	return (
		<Input
			id={id}
			name={campo.name}
			value={campo.state.value}
			onChange={(e) => campo.handleChange(e.target.value)}
			onBlur={campo.handleBlur}
			error={useError()}
			{...props}
		/>
	);
}

export function CampoSelect(props: Omit<SelectProps, Cableado>) {
	const campo = useFieldContext<string>();
	const id = useId();
	return (
		<Select
			id={id}
			name={campo.name}
			value={campo.state.value}
			onChange={(e) => campo.handleChange(e.target.value)}
			onBlur={campo.handleBlur}
			error={useError()}
			{...props}
		/>
	);
}

export function CampoCheckbox(props: Omit<CheckboxProps, Cableado>) {
	const campo = useFieldContext<boolean>();
	return (
		<Checkbox
			name={campo.name}
			checked={campo.state.value}
			onChange={(e) => campo.handleChange(e.target.checked)}
			onBlur={campo.handleBlur}
			error={useError()}
			{...props}
		/>
	);
}

/** Color de acento opcional: una muestra de la paleta o "" (sin color). */
export function CampoColorAcento({ label = "Color" }: { label?: string }) {
	const campo = useFieldContext<string>();
	const opciones = [{ valor: "", nombre: "Sin color" }, ...COLORES_ACENTO];
	const valor = campo.state.value;
	// Un color fuera de la paleta (elegido con el selector nativo).
	const personalizado =
		valor !== "" && !COLORES_ACENTO.some((c) => c.valor === valor);
	return (
		<fieldset className="space-y-1.5">
			<legend className="mb-1.5 text-[13px] font-medium text-tinta-suave">
				{label}
			</legend>
			<div className="flex flex-wrap gap-2">
				{opciones.map(({ valor, nombre }) => (
					<label
						key={nombre}
						title={nombre}
						className={cn(
							"flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-borde-fuerte ring-offset-2 ring-offset-superficie has-checked:ring-2 has-checked:ring-indigo-500 has-focus-visible:ring-2 has-focus-visible:ring-indigo-400",
							!valor && "bg-superficie text-tinta-tenue",
						)}
						style={valor ? { backgroundColor: valor } : undefined}
					>
						<input
							type="radio"
							name={campo.name}
							value={valor}
							checked={campo.state.value === valor}
							onChange={() => campo.handleChange(valor)}
							onBlur={campo.handleBlur}
							className="sr-only"
						/>
						<span className="sr-only">{nombre}</span>
						{!valor && (
							<span aria-hidden className="h-px w-4 rotate-45 bg-current" />
						)}
					</label>
				))}
				<label
					title="Personalizado"
					className={cn(
						"relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-borde-fuerte ring-offset-2 ring-offset-superficie has-focus-visible:ring-2 has-focus-visible:ring-indigo-400",
						personalizado
							? "text-white ring-2 ring-indigo-500"
							: "bg-superficie text-tinta-tenue",
					)}
					style={personalizado ? { backgroundColor: valor } : undefined}
				>
					<input
						type="color"
						value={personalizado ? valor : "#888888"}
						onChange={(e) => campo.handleChange(e.target.value)}
						onBlur={campo.handleBlur}
						className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					/>
					<span className="sr-only">Color personalizado</span>
					<Pipette aria-hidden className="h-3.5 w-3.5 drop-shadow" />
				</label>
			</div>
		</fieldset>
	);
}

/** `<form>` que llama a `handleSubmit`; los errores del envío los notifica la mutación. */
export function Formulario({
	children,
	...props
}: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
	children: ReactNode;
}) {
	const form = useFormContext();
	return (
		<form
			noValidate
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit().catch(() => {});
			}}
			{...props}
		>
			{children}
		</form>
	);
}

/** Botón de envío que se bloquea mientras `onSubmit` está en curso. */
export function BotonEnviar(props: Omit<ButtonProps, "type">) {
	const form = useFormContext();
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(enviando) => <Button type="submit" isLoading={enviando} {...props} />}
		</form.Subscribe>
	);
}
