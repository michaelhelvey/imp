import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	json,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { getDefaultLibFileName } from "typescript";

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
	profile_picture: text(),
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
	teams: many(usersToTeams),
}));

export const rolesTable = pgTable("roles", {
	...defaultFieldsWithId,
	name: varchar({ length: 255 }).notNull().unique(),
	is_default: boolean().notNull().default(false),
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

/**
 ***************************************************************************************************
 * Incident Management
 *
 * An incident contains a timeline of events that occurred, such as the original event that caused
 * it, any user interactions with the event, etc, along with basic properties like the incident
 * title, comments, etc.
 *
 * Incidents are de-duplicated based on some key -- for example, a Cloudwatch alarm name -- so that
 * if a given alert is received multiple times, only one incident is created.  Once an incident is
 * marked as "closed," it is no longer elegible for de-duplication: if the same alert is received
 * again, a new incident will be created.
 *
 * Incidents belong to services.  A "service" is any collection of things that should logically be
 * assigned incidents.  Services own escalation policies, which define who should be notified and
 * when, when an incident is created for that service.  "Who" in this scenario is "any notifiable
 * entity" -- including a user, a Teams or Slack channel, an email address, an HTTP endpoint, etc.
 *
 * Users belong to teams.  Teams are collections of users that are responsible for a service.  What
 * team you are on doesn't have any affect on your permissions or whether you get alerts, but simply
 * helps you see what incidents are relevant to you when you sign into the app.
 */

export const teamsTable = pgTable("teams", {
	...defaultFieldsWithId,
	name: varchar({ length: 255 }).notNull().unique(),
});

export const usersToTeams = pgTable(
	"users_to_teams",
	{
		user_id: uuid()
			.notNull()
			.references(() => usersTable.id),
		team_id: integer()
			.notNull()
			.references(() => teamsTable.id),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.user_id, t.team_id] }),
	}),
);

export const servicesTable = pgTable("services", {
	...defaultFieldsWithId,
	name: varchar({ length: 255 }).notNull().unique(),
	team_id: integer()
		.notNull()
		.references(() => teamsTable.id),
});

export const servicesRelations = relations(servicesTable, ({ one }) => ({
	team: one(teamsTable, {
		fields: [servicesTable.team_id],
		references: [teamsTable.id],
	}),
}));

export const incidents = pgTable("incidents", {
	id: uuid().primaryKey().defaultRandom(),
	deduplication_id: integer(), // usually some sort of hash
	title: varchar({ length: 255 }).notNull(),
	body: text(),
	assigned_to: uuid().references(() => usersTable.id),
	service_id: integer()
		.notNull()
		.references(() => servicesTable.id),
	...defaultFields,
});

export const incidentRelations = relations(incidents, ({ one, many }) => ({
	service: one(servicesTable, {
		fields: [incidents.service_id],
		references: [servicesTable.id],
	}),
	events: many(incidentEvents),
}));

export const incidentEvents = pgTable("incident_events", {
	...defaultFieldsWithId,
	incident_id: uuid()
		.notNull()
		.references(() => incidents.id),
	// expected to be in the format { type: "event_type", data: { ... } }
	event: json().notNull(),
});

export const incidentEventsRelations = relations(incidentEvents, ({ one }) => ({
	incident: one(incidents, {
		fields: [incidentEvents.incident_id],
		references: [incidents.id],
	}),
}));
