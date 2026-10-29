import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/core/utils/cn";
import { Spinner } from "./Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			children,
			className,
			variant = "primary",
			size = "md",
			isLoading = false,
			disabled,
			type = "button",
			...props
		},
		ref,
	) => {
		const baseStyles =
			"inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none [&_svg]:shrink-0";

		const variants = {
			primary: "bg-indigo-600 text-white hover:bg-indigo-700",
			secondary: "bg-elevada text-tinta hover:bg-borde",
			outline: "border border-borde bg-superficie text-tinta hover:bg-elevada",
			danger: "bg-rose-600 text-white hover:bg-rose-700",
			ghost:
				"bg-transparent text-tinta-suave hover:bg-elevada hover:text-tinta",
		};

		const sizes = {
			sm: "h-8 text-[13px] px-2.5 gap-1.5",
			md: "h-9 text-sm px-3.5 gap-2",
			lg: "h-10 text-sm px-4 gap-2",
		};

		return (
			<button
				ref={ref}
				type={type}
				disabled={disabled || isLoading}
				className={cn(baseStyles, variants[variant], sizes[size], className)}
				{...props}
			>
				{isLoading && <Spinner size="sm" className="mr-1 text-current" />}
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";
