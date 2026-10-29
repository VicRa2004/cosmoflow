import type { ReactNode } from "react";
import { Marca } from "./Marca";
import { SelectorTema } from "./SelectorTema";

interface AuthLayoutProps {
	children: ReactNode;
	title: string;
	subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
	return (
		<div className="relative flex min-h-screen items-center justify-center bg-lateral px-4 py-12">
			<div className="absolute top-4 right-4">
				<SelectorTema />
			</div>
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<Marca className="mx-auto mb-5 size-10 rounded-lg [&_svg]:size-6" />
					<h1 className="text-xl font-semibold tracking-tight text-balance text-tinta">
						{title}
					</h1>
					<p className="mt-1.5 text-sm text-tinta-tenue">{subtitle}</p>
				</div>

				<div className="rounded-lg border border-borde bg-superficie p-6 shadow-flotante sm:p-8">
					{children}
				</div>
			</div>
		</div>
	);
}
