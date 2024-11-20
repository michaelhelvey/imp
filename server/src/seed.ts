import "./config.js";
import { eq } from "drizzle-orm";
import { db } from "./db/db.js";
import { usersTable } from "./db/schema.js";

async function main() {
	const user: typeof usersTable.$inferInsert = {
		first_name: "John",
		last_name: "Doe",
		email: "john.doe@example.com",
		updated_at: new Date(),
	};

	await db.insert(usersTable).values(user);
	console.log("New user created!");
	const users = await db.select().from(usersTable);
	console.log("Getting all users from the database: ", users);

	await db.delete(usersTable).where(eq(usersTable.email, user.email));
	console.log("User deleted!");
}

await main();
process.exit(0);
