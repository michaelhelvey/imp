import { ok } from "node:assert";
/**
 ***************************************************************************************************
 * Database Utilities
 ***************************************************************************************************
 */

export function selectFirstOrThrow<T>(results: T[]): T {
	ok(
		results.length === 1,
		`expected exactly one result, received ${results.length}`,
	);
	return results[0];
}
