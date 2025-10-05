import { userRoles, type UserRole } from "@db/schema";

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MONTER: "Monter",
  PARTNER: "Partner biznesowy",
};

export const userRoleOptions = userRoles.map((role) => ({
  value: role,
  label: userRoleLabels[role],
}));
