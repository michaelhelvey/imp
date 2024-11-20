import { DrizzleError } from "drizzle-orm";
import { type TransactionLike, db } from "../db/db.js";

async function expectRollback(fn: Promise<unknown>): Promise<void> {
	try {
		await fn;
	} catch (e) {
		if (e instanceof DrizzleError && e.message === "Rollback") {
			return;
		}

		throw e;
	}
}

export async function withTx(fn: (tx: TransactionLike) => Promise<void>) {
	await expectRollback(
		db.transaction(async (tx) => {
			await fn(tx);
			tx.rollback();
		}),
	);
}
