import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "@/app.js";
import { trpc } from "@/lib/trpc.js";
import { assert } from "@/lib/utils.js";

const root = document.getElementById("root");
assert(root, "Expected document to contain #root element");

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: import.meta.env.VITE_TRPC_SERVER_URL,
			async headers() {
				// FIXME: normally this would not be hard-coded, and would come from an HTTP only cookie
				// in the wrapping hosting provider. I'm just doing this for now so I don't have to implement
				// a auth skeleton in the hosting provider.  More on the auth/hosting/multi-tenancy design
				// later.
				return { "x-user-id": "1234" };
			},
		}),
	],
});

createRoot(root).render(
	<StrictMode>
		<trpc.Provider client={trpcClient} queryClient={queryClient as any}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</trpc.Provider>
	</StrictMode>,
);
