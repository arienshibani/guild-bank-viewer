import { describe, expect, it } from "vitest";
import {
	canEdit,
	cancelUnlock,
	clearUnlockError,
	exitEditMode,
	initialAccess,
	toggleEditMode,
	unlock,
} from "./edit-access";
import { hashPassword } from "./password";

const hash = hashPassword("secret");

describe("edit access", () => {
	it("starts locked and not editable", () => {
		expect(canEdit(initialAccess)).toBe(false);
	});
	it("asks for the password instead of entering edit mode when locked", () => {
		const a = toggleEditMode(initialAccess);
		expect(a).toMatchObject({ showPasswordPrompt: true, isEditMode: false });
	});
	it("enters edit mode in one step after a correct password", () => {
		const a = unlock(toggleEditMode(initialAccess), "secret", hash);
		expect(a).toEqual({
			isUnlocked: true,
			isEditMode: true,
			showPasswordPrompt: false,
			unlockError: "",
		});
		expect(canEdit(a)).toBe(true);
	});
	it("keeps the prompt open with an error after a wrong password", () => {
		const a = unlock(toggleEditMode(initialAccess), "nope", hash);
		expect(a).toMatchObject({
			isUnlocked: false,
			showPasswordPrompt: true,
			unlockError: "Incorrect password",
		});
		expect(canEdit(a)).toBe(false);
		expect(clearUnlockError(a).unlockError).toBe("");
	});
	it("cancelling closes the prompt and clears the error", () => {
		const a = cancelUnlock(unlock(toggleEditMode(initialAccess), "nope", hash));
		expect(a).toMatchObject({ showPasswordPrompt: false, unlockError: "" });
	});
	it("toggles edit mode without re-prompting once unlocked", () => {
		const unlocked = unlock(toggleEditMode(initialAccess), "secret", hash);
		const off = toggleEditMode(unlocked);
		expect(off).toMatchObject({ isEditMode: false, isUnlocked: true, showPasswordPrompt: false });
		expect(toggleEditMode(off).isEditMode).toBe(true);
		expect(exitEditMode(unlocked).isEditMode).toBe(false);
	});
});
