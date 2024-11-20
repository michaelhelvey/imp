import "./config.js";
import { initTRPC } from "@trpc/server";
import {
	type FetchCreateContextFnOptions,
	fetchRequestHandler,
} from "@trpc/server/adapters/fetch";
import { z } from "zod";
import { logger } from "./logger.js";

/**
 ***************************************************************************************************
 * TRPC Router Setup
 ***************************************************************************************************
 */

const t = initTRPC.create();

const router = t.router({
	hello: t.procedure.query(async () => {
		return "Hello, world";
	}),
	helloMutation: t.procedure
		.input(z.object({ name: z.string() }))
		.mutation(async ({ input }) => {
			logger.debug({ msg: `helloMutation: ${input.name}` });
			return `Hello, ${input.name}`;
		}),
});

// AppRouter exported for consumption by client
export type AppRouter = typeof router;

/**
 ***************************************************************************************************
 * Bun TRPC Fetch Adapter Integration
 ***************************************************************************************************
 */

const corsSettings = {
	allowedOrigins: ["*"],
	allowedMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["*"],
} as const;

function createContext({ req, resHeaders }: FetchCreateContextFnOptions) {
	resHeaders.set(
		"Access-Control-Allow-Origin",
		corsSettings.allowedOrigins.join(","),
	);
	resHeaders.set(
		"Access-Control-Allow-Methods",
		corsSettings.allowedMethods.join(","),
	);
	resHeaders.set(
		"Access-Control-Allow-Headers",
		corsSettings.allowedHeaders.join(","),
	);
	return { request: req, headers: resHeaders };
}

const server = Bun.serve({
	port: 3000,
	websocket: {
		message(ws, message) {},
	},
	fetch(request) {
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": corsSettings.allowedOrigins.join(","),
					"Access-Control-Allow-Methods": corsSettings.allowedMethods.join(","),
					"Access-Control-Allow-Headers": corsSettings.allowedHeaders.join(","),
				},
			});
		}

		const url = new URL(request.url);
		logger.info(`${request.method} ${url.pathname}`);

		if (url.pathname.startsWith("/trpc")) {
			return fetchRequestHandler({
				endpoint: "/trpc",
				req: request,
				router,
				createContext,
			});
		}

		if (url.pathname === "/") {
			// health check
			return new Response("OK");
		}

		return new Response("Not found", { status: 404 });
	},
});

logger.info({ msg: `server listening at ${server.url}` });
