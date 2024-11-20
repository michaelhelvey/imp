/**
 * Starts the server and client in separate processes and handles signals, etc, to provide a
 * consistent development experience.
 */

import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

Bun.spawn(["bun", "dev"], {
	cwd: path.resolve(projectRoot, "server"),
	stdout: "inherit",
});

Bun.spawn(["bun", "dev"], {
	cwd: path.resolve(projectRoot, "client"),
	stdout: "inherit",
});
