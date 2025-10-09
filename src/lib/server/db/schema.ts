import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const clusters = sqliteTable('clusters', {
	id: integer('id').primaryKey().notNull(),
	clusterUuid: text('cluster_uuid').notNull().unique(),
	name: text('name').notNull(),
	indexUrl: text('index_url').notNull(),
	queryUrl: text('query_url').notNull(),
	centerLat: real('center_lat').default(46.603354).notNull(),
	centerLon: real('center_lon').default(1.888334).notNull(),
	scale: integer('scale').default(5).notNull(),
	lastUpdated: integer('last_updated', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const clusterSchemas = sqliteTable('cluster_schemas', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	clusterUuid: text('cluster_uuid')
		.notNull()
		.references(() => clusters.clusterUuid, { onDelete: 'cascade' }),
	schemaJson: text('schema_json').notNull(),
	fetchedAt: integer('fetched_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const nodes = sqliteTable('nodes', {
	id: integer('id').primaryKey().notNull(),
	clusterUuid: text('cluster_uuid').notNull(),
	profileUrl: text('profile_url').notNull(),
	status: text('status').notNull().default('ignore'),
	isAvailable: integer('is_available').notNull().default(0),
	unavailableMessage: text('unavailable_message').default(''),
	hasAuthority: integer('has_authority').notNull().default(1),
	lastUpdated: integer('last_updated', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	data: text('data').notNull(),
	updatedData: text('updated_data'),
	hasUpdated: integer('has_updated', { mode: 'boolean' }).notNull().default(false)
});

// Table for users
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').unique().notNull(),
	normalizedName: text('normalized_name').unique().notNull(),
	emailReset: integer('email_reset', { mode: 'boolean' }).notNull().default(false),
	enableSiteHints: integer('enable_site_hints', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const publicKeys = sqliteTable('public_keys', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	publicKey: text('public_key').unique().notNull(),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const emails = sqliteTable('emails', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	email: text('email').unique().notNull(),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const loginTokens = sqliteTable('login_tokens', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').unique().notNull(),
	expiresAt: integer('expires_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const sourceIndexes = sqliteTable('source_indexes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	url: text('url').unique().notNull(),
	label: text('label').notNull(),
	libraryUrl: text('library_url').notNull(),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const profiles = sqliteTable('profiles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	cuid: text('cuid').notNull().unique(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	linkedSchemas: text('linked_schemas'),
	title: text('title'),
	profile: text('profile'),
	nodeId: text('node_id'),
	lastUpdated: integer('last_updated', { mode: 'number' }).notNull(),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const roles = sqliteTable('roles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const userRoles = sqliteTable('user_roles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	roleId: integer('role_id')
		.notNull()
		.references(() => roles.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const capabilities = sqliteTable('capabilities', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	scheme: text('scheme').notNull(),
	hierPart: text('hier_part').notNull(),
	namespace: text('namespace').notNull(),
	segments: text('segments').notNull(),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const roleCapabilities = sqliteTable('role_capabilities', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	roleId: integer('role_id')
		.notNull()
		.references(() => roles.id, { onDelete: 'cascade' }),
	capabilityId: integer('capability_id')
		.notNull()
		.references(() => capabilities.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updated_at', { mode: 'number' })
		.notNull()
		.default(sql`(unixepoch())`)
});

// Relations
export const clusterSchemasRelations = relations(clusterSchemas, ({ one }) => ({
	cluster: one(clusters, {
		fields: [clusterSchemas.clusterUuid],
		references: [clusters.clusterUuid]
	})
}));

export const usersRelations = relations(users, ({ many }) => ({
	publicKeys: many(publicKeys),
	emails: many(emails),
	loginTokens: many(loginTokens),
	roles: many(userRoles)
}));

export const publicKeysRelations = relations(publicKeys, ({ one }) => ({
	user: one(users, {
		fields: [publicKeys.userId],
		references: [users.id]
	})
}));

export const emailsRelations = relations(emails, ({ one }) => ({
	user: one(users, {
		fields: [emails.userId],
		references: [users.id]
	})
}));

export const loginTokensRelations = relations(loginTokens, ({ one }) => ({
	user: one(users, {
		fields: [loginTokens.userId],
		references: [users.id]
	})
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	userRoles: many(userRoles),
	roleCapabilities: many(roleCapabilities)
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	})
}));

export const capabilitiesRelations = relations(capabilities, ({ many }) => ({
	roleCapabilities: many(roleCapabilities)
}));

export const roleCapabilitiesRelations = relations(roleCapabilities, ({ one }) => ({
	role: one(roles, {
		fields: [roleCapabilities.roleId],
		references: [roles.id]
	}),
	capability: one(capabilities, {
		fields: [roleCapabilities.capabilityId],
		references: [capabilities.id]
	})
}));
