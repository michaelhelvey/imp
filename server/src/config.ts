import z from "zod";

const environmentVariables = z.object({
	DATABASE_URL: z.string(),
});

environmentVariables.parse(process.env);

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof environmentVariables> {}
	}
}
