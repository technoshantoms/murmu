import { sourceIndexes } from '$lib/server/db/schema';
import type { SourceIndexDbUpdateInput, SourceIndexInsert } from '$lib/types/source-index';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export async function getSourceIndexes(db: DrizzleD1Database) {
	return await db.select().from(sourceIndexes).all();
}

export async function getSourceIndexById(db: DrizzleD1Database, id: number) {
	return await db.select().from(sourceIndexes).where(eq(sourceIndexes.id, id)).get();
}

export async function getSourceIndexByUrl(db: DrizzleD1Database, url: string) {
	return await db.select().from(sourceIndexes).where(eq(sourceIndexes.url, url)).get();
}

export async function createSourceIndex(db: DrizzleD1Database, data: SourceIndexInsert) {
	return await db.insert(sourceIndexes).values(data).run();
}

export async function updateSourceIndex(
	db: DrizzleD1Database,
	id: number,
	data: SourceIndexDbUpdateInput
) {
	return await db.update(sourceIndexes).set(data).where(eq(sourceIndexes.id, id)).run();
}

export async function deleteSourceIndex(db: DrizzleD1Database, id: number) {
	return await db.delete(sourceIndexes).where(eq(sourceIndexes.id, id)).run();
}
