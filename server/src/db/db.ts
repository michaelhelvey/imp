import { drizzle } from "drizzle-orm/node-postgres";

type FirstArgument<T> = T extends (arg: infer U) => any ? U : never;

export const db = drizzle(process.env.DATABASE_URL, {
	logger: !(process.env.NODE_ENV === "test"),
});

export type Transaction = FirstArgument<FirstArgument<typeof db.transaction>>;
export type TransactionLike = Transaction | typeof db;
