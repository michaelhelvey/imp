import { Button } from "@/components/ui/button.js";
import { useToast } from "@/hooks/use-toast.js";
import { trpc, useDefaultMutationOptions } from "@/lib/trpc.js";

export default function IncidentsPage() {
	const options = useDefaultMutationOptions();
	const mutation = trpc.helloMutation.useMutation(options);

	const onButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		mutation.mutate({ name: "Michael Helvey" });
	};

	return (
		<div>
			<Button onClick={onButtonClick}>
				{mutation.isPending ? "Loading..." : "Click Me"}
			</Button>
		</div>
	);
}
