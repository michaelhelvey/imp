import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import "./index.css";
import { trpc } from "@/lib/trpc.js";
import { assert } from "@/lib/utils.js";
import { ThemeProvider } from "./components/theme-provider.js";
import { Toaster } from "./components/ui/toaster.js";
import Dashboard from "./pages/dashboard.js";
import IncidentsPage from "./pages/incidents.js";

const root = document.getElementById("root");
assert(root, "Expected document to contain #root element");

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: import.meta.env.VITE_TRPC_SERVER_URL,
			async headers() {
				// Note: this would not normally be hard-coded, typically this would be provided by whatever
				// hosting system is doing the authentication
				return { "x-user-id": import.meta.env.VITE_DEFAULT_USER_UUID };
			},
		}),
	],
});

const router = createBrowserRouter([
	{
		path: "/",
		element: <Dashboard />,
		errorElement: (
			<div>
				something terrible happened, but I didn't write an error page, so good
				luck figuring out what it was
			</div>
		),
		children: [
			{
				index: true,
				element: <IncidentsPage />,
			},
			{
				path: "/services",
				element: <div>manage services</div>,
			},
			{
				path: "/escalation-policies",
				element: <div>manage escalation policies</div>,
			},
			{
				path: "/users",
				element: <div>manage users</div>,
			},
			{
				path: "/roles",
				element: <div>manage roles</div>,
			},
			{
				path: "/teams",
				element: <div>manage teams</div>,
			},
			{
				path: "/account/preferences",
				element: <div>your account preferences</div>,
			},
		],
	},
]);

createRoot(root).render(
	<StrictMode>
		<ThemeProvider defaultTheme="light" storageKey="ui-theme">
			<trpc.Provider client={trpcClient} queryClient={queryClient as any}>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
					<Toaster />
				</QueryClientProvider>
			</trpc.Provider>
		</ThemeProvider>
	</StrictMode>,
);
