/**
 * Sets up your local environment in a single step.
 */

import fs from "node:fs";
import path from "node:path";
import { $ } from "bun";
import pg from "pg";

/**
 ***************************************************************************************************
 * Check environment pre-requisites:
 ***************************************************************************************************
 */
console.log("Setting up your local environment...");

// Check that this command is being run from the root of the project:
const projectRoot = fs.existsSync("server") && fs.existsSync("client");
if (!projectRoot) {
	panic(
		"setup.ts is intended to be run in the root of the project. Please navigate to the root of the project and try again.",
	);
}

// Check for the existence of docker:
const dockerExists = await checkBinExists("docker");
if (!dockerExists) {
	panic(
		"Docker is required to run this project. Please install Docker and try again.",
	);
}

console.log("✅ Docker is installed.");

/**
 ***************************************************************************************************
 * Install dependencies and set up local environment:
 ***************************************************************************************************
 */

console.log("Setting up local environment file...");
await $`cp .env.sample .env`;
const absoluteEnvPath = path.resolve(process.cwd(), ".env");
const packageEnvPath = (pkg: string) =>
	path.resolve(process.cwd(), pkg, ".env");
await $`ln -sf ${absoluteEnvPath} ${packageEnvPath("server")}`;
await $`ln -sf ${absoluteEnvPath} ${packageEnvPath("client")}`;

console.log("Installing dependencies...");

await $`bun install`;
await $`bunx playwright install`;
await $`bunx lefthook install`;

/**
 ***************************************************************************************************
 * Create containers & seed database:
 ***************************************************************************************************
 */

console.log("Setting up local database");
await $`docker compose up --wait`;

console.log("Migrating and seeding local database...");
await dropAndCreateDatabase();
await $`bun --filter ./server db:push`;
await $`bun --filter ./server db:seed`;

console.log("✅ All setup.  Run `bun dev` to start the project.");
process.exit(0);

/**
 ***************************************************************************************************
 * Utilities
 ***************************************************************************************************
 */

async function checkBinExists(command: string) {
	try {
		await $`which ${command}`.quiet();
		return true;
	} catch {
		return false;
	}
}

function panic(msg: string) {
	console.error(msg);
	process.exit(1);
}

async function dropAndCreateDatabase() {
	const client = new pg.Client({
		user: "postgres",
		password: "postgres",
		host: "localhost",
		port: 5432,
		database: "postgres",
	});
	await client.connect();
	await client.query("drop database if exists imp;");
	await client.query("create database imp;");
}
