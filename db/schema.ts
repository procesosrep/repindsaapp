import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const records = sqliteTable("records", { id:text("id").primaryKey(), kind:text("kind").notNull(), payload:text("payload").notNull(), revision:integer("revision").notNull().default(1), updated:text("updated").notNull() },table=>[index("records_kind_idx").on(table.kind)]);
export const sequences=sqliteTable('sequences',{key:text('key').primaryKey(),value:integer('value').notNull().default(0)});
export const workflowLinks=sqliteTable('workflow_links',{root:text('root').primaryKey(),projectId:text('project_id').notNull()});

export const materialUserProfiles=sqliteTable("material_user_profiles",{username:text("username").primaryKey(),level:text("level").notNull(),rights:text("rights").notNull(),details:text("details").notNull()});
export const materialLevels=sqliteTable("material_levels",{name:text("name").primaryKey(),baseRole:text("base_role").notNull(),rights:text("rights").notNull()});
