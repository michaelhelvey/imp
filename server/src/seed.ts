import "./config.js";
import {
	Permission,
	attachRoleToUser,
	createPermission,
	createRole,
	createUser,
} from "./db/authz.js";
import { db } from "./db/db.js";

async function main() {
	await db.transaction(async (tx) => {
		// ---------------------- Permissions -------------------------
		for (const perm of Object.values(Permission)) {
			await createPermission(tx, perm);
		}

		// ---------------------- Roles ---------------------------
		const adminRole = await createRole(tx, {
			roleName: "admin",
			permissions: Object.values(Permission),
		});

		await createRole(tx, {
			roleName: "read-only",
			permissions: Object.values(Permission).filter((perm) =>
				perm.startsWith("read:"),
			),
		});

		// ------------------- Default User ------------------------
		const defaultUser = await createUser(tx, {
			id: process.env.VITE_DEFAULT_USER_UUID,
			email: "admin@admin.com",
			first_name: "Admin",
			last_name: "Admin",
		});

		await attachRoleToUser(tx, defaultUser.id, adminRole.id);
	});
}

await main();
process.exit(0);
