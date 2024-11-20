import { Button } from "@/components/ui/button.js";
import { useState } from "react";
import { trpc } from "./lib/trpc.js";

function App() {
	const userQuery = trpc.hello.useQuery();
	const userMutation = trpc.helloMutation.useMutation();

	return (
		<div>
			<p>The user is {userQuery.data}</p>
			<Button onClick={() => userMutation.mutate({ name: "Frodo Baggins" })}>
				Click me
			</Button>
		</div>
	);
}

export default App;
