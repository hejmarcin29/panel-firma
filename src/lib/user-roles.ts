import { userRoles } from "@db/schema";

export const USER_ROLES = userRoles;
export type UserRole = (typeof USER_ROLES)[number];

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MONTER: "Monter",
  SPRZEDAZ: "Sprzedaż",
};
