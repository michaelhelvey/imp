import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/**
 ***************************************************************************************************
 * Users & Permissions
 *
 * Users are individual people.  Users can have one or more roles assigned to them.  Roles are
 * collections of permissions, where permissions specify specific actions that they can take: for
 * example, "create user", "delete user", "update user", etc.
 ***************************************************************************************************
 */

const defaultFields = {
	updated_at: timestamp()
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	created_at: timestamp().notNull().defaultNow(),
} as const;

const defaultFieldsWithId = {
	id: integer().primaryKey().generatedByDefaultAsIdentity(),
	...defaultFields,
} as const;

export const usersTable = pgTable("users", {
	id: uuid().primaryKey().defaultRandom(),
	first_name: varchar({ length: 255 }).notNull(),
	last_name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	...defaultFields,
});

export const usersToRoles = pgTable(
	"users_to_roles",
	{
		user_id: uuid()
			.notNull()
			.references(() => usersTable.id),
		role_id: integer()
			.notNull()
			.references(() => rolesTable.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.user_id, t.role_id] }),
	}),
);

export const usersRelations = relations(usersTable, ({ many }) => ({
	roles: many(usersToRoles),
}));

export const rolesTable = pgTable("roles", {
	...defaultFieldsWithId,
	name: varchar({ length: 255 }).notNull().unique(),
});

export const rolesToPermissions = pgTable(
	"roles_to_permissions",
	{
		role_id: integer()
			.notNull()
			.references(() => rolesTable.id),
		permission_id: integer()
			.notNull()
			.references(() => permissionsTable.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.role_id, t.permission_id] }),
	}),
);

export const rolesRelations = relations(rolesTable, ({ many }) => ({
	permissions: many(rolesToPermissions),
}));

export const permissionsTable = pgTable("permissions", {
	...defaultFieldsWithId,
	permission: varchar({ length: 255 }).notNull().unique(),
});
