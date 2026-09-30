import { verifyPassword } from "@/lib/password";

/** Who may edit the bank right now: password prompt, unlock and edit-mode transitions. */
export interface EditAccess {
	isUnlocked: boolean;
	isEditMode: boolean;
	showPasswordPrompt: boolean;
	unlockError: string;
}

export const initialAccess: EditAccess = {
	isUnlocked: false,
	isEditMode: false,
	showPasswordPrompt: false,
	unlockError: "",
};

export const canEdit = (access: EditAccess) =>
	access.isEditMode && access.isUnlocked;

/** Edit button: prompt for the password when locked, otherwise flip edit mode. */
export function toggleEditMode(access: EditAccess): EditAccess {
	if (!access.isEditMode && !access.isUnlocked) {
		return { ...access, showPasswordPrompt: true, unlockError: "" };
	}
	return { ...access, isEditMode: !access.isEditMode };
}

export function unlock(
	access: EditAccess,
	password: string,
	passwordHash: string,
): EditAccess {
	if (verifyPassword(password, passwordHash)) {
		return {
			isUnlocked: true,
			isEditMode: true,
			showPasswordPrompt: false,
			unlockError: "",
		};
	}
	return { ...access, unlockError: "Incorrect password" };
}

export function cancelUnlock(access: EditAccess): EditAccess {
	return { ...access, showPasswordPrompt: false, unlockError: "" };
}

export function clearUnlockError(access: EditAccess): EditAccess {
	return { ...access, unlockError: "" };
}

export function exitEditMode(access: EditAccess): EditAccess {
	return { ...access, isEditMode: false };
}
