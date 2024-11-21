/*
 * This module contains functions for working with the authorization system: CRUD over roles
 * and permissions, and functions for checking whether a given permission is allowed for a given
 * user.
 *
 * Organizing these into "repository" objects is somewhat pointless, but I just wanted to namespace
 * local sets of operations over particular objects.
 *
 * Notable TODOs:
 * - lack of pagination.
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
import { selectFirstOrThrow } from "./utils.js";

/**
 ***************************************************************************************************
 * Users
 ***************************************************************************************************
 */

export const UsersRepository = {
	async createUser(tx: TransactionLike, user: typeof usersTable.$inferInsert) {
		return selectFirstOrThrow(
			await tx.insert(usersTable).values(user).returning(),
		);
	},

	updateUser(
		tx: TransactionLike,
		userId: string,
		user: Partial<typeof usersTable.$inferInsert>,
	) {
		return tx.update(usersTable).set(user).where(eq(usersTable.id, userId));
	},

	deleteUser(tx: TransactionLike, userId: string) {
		return tx.delete(usersTable).where(eq(usersTable.id, userId));
	},

	listUsers(tx: TransactionLike) {
		return tx.select().from(usersTable).orderBy(usersTable.last_name);
	},
};

/**
 ***************************************************************************************************
 * Roles
 ***************************************************************************************************
 */

interface RoleCreateDTO {
	roleName: string;
	permissions: string[];
}

export const RolesRepository = {
	async createRole(tx: TransactionLike, role: RoleCreateDTO) {
		const newRole = selectFirstOrThrow(
			await tx.insert(rolesTable).values({ name: role.roleName }).returning(),
		);

		// Note: if you pass in permissions that don't exist, this will simply ignore them.  You
		// should be validating that the permissions exist before calling this function.
		const permissions = await tx
			.select()
			.from(permissionsTable)
			.where(inArray(permissionsTable.permission, role.permissions));

		await tx.insert(rolesToPermissions).values(
			permissions.map((p) => ({
				role_id: newRole.id,
				permission_id: p.permission,
			})),
		);

		return newRole;
	},

	async getRoleById(tx: TransactionLike, roleId: number) {
		return selectFirstOrThrow(
			await tx.select().from(rolesTable).where(eq(rolesTable.id, roleId)),
		);
	},

	listRoles(tx: TransactionLike) {
		return tx.select().from(rolesTable).orderBy(rolesTable.name);
	},

	updateRoleName(tx: TransactionLike, roleId: number, newName: string) {
		return tx
			.update(rolesTable)
			.set({ name: newName })
			.where(eq(rolesTable.id, roleId));
	},

	async deleteRole(tx: TransactionLike, roleId: number) {
		const role = await RolesRepository.getRoleById(tx, roleId);
		if (role.is_default) {
			throw new Error(`Cannot delete default role '${role.name}'`);
		}

		await tx.delete(rolesTable).where(eq(rolesTable.id, roleId));
	},

	async attachPermissionToRole(
		tx: TransactionLike,
		roleId: number,
		permission: string,
	) {
		const role = await RolesRepository.getRoleById(tx, roleId);
		if (role.is_default) {
			throw new Error("Cannot edit default role");
		}

		await tx.insert(rolesToPermissions).values({
			role_id: roleId,
			permission_id: permission,
		});
	},

	async detachPermissionFromRole(
		tx: TransactionLike,
		roleId: number,
		permission: string,
	) {
		await tx
			.delete(rolesToPermissions)
			.where(
				and(
					eq(rolesToPermissions.role_id, roleId),
					eq(rolesToPermissions.permission_id, permission),
				),
			);
	},

	async attachRoleToUser(tx: TransactionLike, userId: string, roleId: number) {
		await tx.insert(usersToRoles).values({ user_id: userId, role_id: roleId });
	},

	async detachRoleFromUser(
		tx: TransactionLike,
		userId: string,
		roleId: number,
	) {
		await tx
			.delete(usersToRoles)
			.where(
				and(eq(usersToRoles.role_id, roleId), eq(usersToRoles.user_id, userId)),
			);
	},
};

/**
 ***************************************************************************************************
 * Permissions
 ***************************************************************************************************
 */

// Note: this object is _both_ in the database for referential integrity, but also in the code
// for typesafety.  The object in the database is kept in sync with the object in the code by
// the database seed script.
export enum Permission {
	READ_INCIDENTS = "read:incidents",
	WRITE_INCIDENTS = "write:incidents",
	DELETE_INCIDENTS = "delete:incidents",

	READ_SERVICES = "read:services",
	WRITE_SERVICES = "write:services",
	DELETE_SERVICES = "delete:services",

	READ_ESCALATION_POLICIES = "read:escalation_policies",
	WRITE_ESCALATION_POLICIES = "write:escalation_policies",
	DELETE_ESCALATION_POLICIES = "delete:escalation_policies",

	READ_USERS = "read:users",
	WRITE_USERS = "write:users",
	DELETE_USERS = "delete:users",

	READ_TEAMS = "read:teams",
	WRITE_TEAMS = "write:teams",
	DELETE_TEAMS = "delete:teams",

	READ_ROLES = "read:roles",
	WRITE_ROLES = "write:roles",
	DELETE_ROLES = "delete:roles",

	READ_PERMISSIONS = "read:permissions",
}

export const PermissionsRepository = {
	async createPermission(tx: TransactionLike, permission: string) {
		const exists = await PermissionsRepository.checkPermissionExists(
			tx,
			permission,
		);

		if (!exists) {
			return tx.insert(permissionsTable).values({ permission }).returning();
		}
	},

	async checkPermissionExists(tx: TransactionLike, permission: string) {
		const results = await tx
			.select()
			.from(permissionsTable)
			.where(eq(permissionsTable.permission, permission));

		return results.length > 0;
	},

	listPermissions() {
		return Object.values(Permission);
	},

	listReadPermissions() {
		return Object.values(Permission).filter((x) => x.startsWith("read:"));
	},

	async userHasPermission(
		tx: TransactionLike,
		userId: string,
		permission: string,
	) {
		const results = await tx
			.select({ count: count() })
			.from(usersTable)
			.innerJoin(usersToRoles, eq(usersTable.id, usersToRoles.user_id))
			.innerJoin(
				rolesToPermissions,
				eq(rolesToPermissions.role_id, usersToRoles.role_id),
			)
			.where(
				and(
					eq(usersTable.id, userId),
					eq(rolesToPermissions.permission_id, permission),
				),
			);

		ok(results.length === 1, "expected exactly one result");
		const hasPermission = results[0].count > 0;

		return hasPermission;
	},
};
