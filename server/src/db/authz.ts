/*
 * This module contains functions for working with the authorization system: CRUD over roles
 * and permissions, and functions for checking whether a given permission is allowed for a given
 * user.
 */

import { ok } from "node:assert";
import { and, count, eq, inArray } from "drizzle-orm";
import type { TransactionLike } from "./db.js";
import {
	permissionsTable,
	rolesTable,
	rolesToPermissions,
	usersTable,
	usersToRoles,
} from "./schema.js";

export async function createUser(
	tx: TransactionLike,
	user: typeof usersTable.$inferInsert,
) {
	const results = await tx.insert(usersTable).values(user).returning();
	ok(results.length === 1, "expected to insert a user");
	return results[0];
}

export async function createPermission(
	tx: TransactionLike,
	permission: string,
) {
	const results = await tx
		.insert(permissionsTable)
		.values({ permission })
		.returning();
	ok(results.length === 1, "expected to insert a permission");
	return results[0];
}

interface RoleCreateDTO {
	roleName: string;
	permissions: string[];
}

export async function createRole(tx: TransactionLike, role: RoleCreateDTO) {
	return await tx.transaction(async (tx) => {
		const results = await tx
			.insert(rolesTable)
			.values({ name: role.roleName })
			.returning();

		ok(results.length === 1, "expected to insert a role");
		const { id: roleId } = results[0];

		// Note: if you pass in permissions that don't exist, this will simply ignore them.  You
		// should be validating that the permissions exist before calling this function.
		const permissions = await tx
			.select()
			.from(permissionsTable)
			.where(inArray(permissionsTable.permission, role.permissions));

		await tx
			.insert(rolesToPermissions)
			.values(
				permissions.map((p) => ({ role_id: roleId, permission_id: p.id })),
			);

		return results[0];
	});
}

export async function getPermissionByNameOrThrow(
	tx: TransactionLike,
	name: string,
) {
	const results = await tx
		.select()
		.from(permissionsTable)
		.where(eq(permissionsTable.permission, name));

	if (results.length === 0) {
		throw new Error(`No permission found with name '${name}')`);
	}

	return results[0];
}

export async function userHasPermission(
	tx: TransactionLike,
	userId: string,
	permission: string,
): Promise<boolean> {
	const results = await tx
		.select({ count: count() })
		.from(usersTable)
		.innerJoin(usersToRoles, eq(usersTable.id, usersToRoles.user_id))
		.innerJoin(
			rolesToPermissions,
			eq(rolesToPermissions.role_id, usersToRoles.role_id),
		)
		.innerJoin(
			permissionsTable,
			eq(permissionsTable.id, rolesToPermissions.permission_id),
		)
		.where(
			and(
				eq(usersTable.id, userId),
				eq(permissionsTable.permission, permission),
			),
		);

	ok(results.length === 1, "expected exactly one result");
	const hasPermission = results[0].count > 0;

	return hasPermission;
}

export async function attachRoleToUser(
	tx: TransactionLike,
	userId: string,
	roleId: number,
) {
	await tx.insert(usersToRoles).values({ user_id: userId, role_id: roleId });
}
