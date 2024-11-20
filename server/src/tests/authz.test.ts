import { expect, test } from "bun:test";
import {
	attachRoleToUser,
	createPermission,
	createRole,
	createUser,
	userHasPermission,
} from "../db/authz.js";
import { withTx } from "./utils.js";

test("given a user with roles and permissions, authorization checks work as expected", async () => {
	await withTx(async (tx) => {
		const user = await createUser(tx, {
			email: "john.doe@example.com",
			first_name: "John",
			last_name: "Doe",
		});

		await createPermission(tx, "read:incidents");
		const role = await createRole(tx, {
			roleName: "something-role",
			permissions: ["read:incidents"],
		});

		await attachRoleToUser(tx, user.id, role.id);

		expect(await userHasPermission(tx, user.id, "read:incidents")).toBeTruthy();
		expect(await userHasPermission(tx, user.id, "write:incidents")).toBeFalsy();
	});
});
