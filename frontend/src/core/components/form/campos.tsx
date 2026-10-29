import {
	type FormHTMLAttributes,
	type ReactNode,
	type TextareaHTMLAttributes,
	useId,
} from "react";
import { Button, type ButtonProps } from "@/core/components/ui/Button";
import { Checkbox, type CheckboxProps } from "@/core/components/ui/Checkbox";
import { Input, type InputProps } from "@/core/components/ui/Input";
import { Select, type SelectProps } from "@/core/components/ui/Select";
import { cn } from "@/core/utils/cn";
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

/** Texto de varias líneas (lo usa `EditorMarkdown` de `adjuntos`). */
export function CampoAreaTexto({
	label,
	className,
	...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, Cableado> & {
	label: string;
}) {
	const campo = useFieldContext<string>();
	const id = useId();
	const error = useError();
	return (
		<div className="w-full space-y-1.5">
			<label
				htmlFor={id}
				className="block text-xs font-semibold uppercase tracking-wider text-tinta-suave"
			>
				{label}
			</label>
			<textarea
				id={id}
				name={campo.name}
				value={campo.state.value}
				onChange={(e) => campo.handleChange(e.target.value)}
				onBlur={campo.handleBlur}
				aria-invalid={!!error}
				aria-describedby={error ? `${id}-error` : undefined}
				className={cn(
					"min-h-28 w-full rounded-lg border bg-superficie/80 px-3.5 py-2 font-mono text-sm text-tinta placeholder-tinta-tenue shadow-sm transition-colors",
					"focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500",
					error
						? "border-rose-500/80"
						: "border-borde hover:border-borde-fuerte",
					className,
				)}
				{...props}
			/>
			{error && (
				<p id={`${id}-error`} className="text-xs font-medium text-rose-400">
					{error}
				</p>
			)}
		</div>
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
