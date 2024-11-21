import { expect, test } from "bun:test";
import {
	Permission,
	PermissionsRepository,
	RolesRepository,
	UsersRepository,
} from "../db/authz.js";
import { withTx } from "./utils.js";

test("given a user with roles and permissions, authorization checks work as expected", async () => {
	await withTx(async (tx) => {
		const user = await UsersRepository.createUser(tx, {
			email: "john.doe@example.com",
			first_name: "John",
			last_name: "Doe",
		});

		await PermissionsRepository.createPermission(tx, Permission.READ_INCIDENTS);
		const role = await RolesRepository.createRole(tx, {
			roleName: "something-role",
			permissions: [Permission.READ_INCIDENTS],
		});

		await RolesRepository.attachRoleToUser(tx, user.id, role.id);

		expect(
			await PermissionsRepository.userHasPermission(
				tx,
				user.id,
				Permission.READ_INCIDENTS,
			),
		).toBeTruthy();
		expect(
			await PermissionsRepository.userHasPermission(
				tx,
				user.id,
				Permission.WRITE_INCIDENTS,
			),
		).toBeFalsy();
	});
});
