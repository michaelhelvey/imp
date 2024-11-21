import "./config.js";
import {
	Permission,
	PermissionsRepository,
	RolesRepository,
	UsersRepository,
} from "./db/authz.js";
import { type TransactionLike, db } from "./db/db.js";

// This function is called every time we deploy the database. It ensures that the database's "master
// data" (such as permissions) is in sync with the code.
async function syncMasterData(tx: TransactionLike) {
	for (const perm of PermissionsRepository.listPermissions()) {
		await PermissionsRepository.createPermission(tx, perm);
	}
}

async function createTestData(tx: TransactionLike) {
	// ---------------------- Roles ---------------------------
	const adminRole = await RolesRepository.createRole(tx, {
		roleName: "admin",
		permissions: Object.values(Permission),
	});

	await RolesRepository.createRole(tx, {
		roleName: "read-only",
		permissions: Object.values(Permission).filter((perm) =>
			perm.startsWith("read:"),
		),
	});

	// ------------------- Default User ------------------------
	const defaultUser = await UsersRepository.createUser(tx, {
		id: process.env.VITE_DEFAULT_USER_UUID,
		email: "admin@admin.com",
		first_name: "Admin",
		last_name: "Admin",
	});

	await RolesRepository.attachRoleToUser(tx, defaultUser.id, adminRole.id);
}

async function main() {
	await db.transaction(async (tx) => {
		await syncMasterData(tx);
		// TODO: conditionally create this based on a flag so that this does run locally, but not
		// when we deploy
		await createTestData(tx);
	});
}

await main();
process.exit(0);
