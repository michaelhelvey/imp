import { useToast } from "@/hooks/use-toast.js";
import { type TRPCClientErrorLike, createTRPCReact } from "@trpc/react-query";
import type { UseTRPCMutationOptions } from "@trpc/react-query/shared";
import type { AppRouter } from "server";

export const trpc = createTRPCReact<AppRouter>();

export function useDefaultMutationOptions() {
	const { toast } = useToast();
	return {
		onError: (error: TRPCClientErrorLike<AppRouter>) => {
			toast({
				title: "Unexpected error",
				description: error.message,
				variant: "destructive",
			});
		},
	};
}
