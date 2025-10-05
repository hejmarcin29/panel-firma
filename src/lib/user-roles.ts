export const userRoles = ["ADMIN", "MONTER", "PARTNER"] as const;

export type UserRole = (typeof userRoles)[number];

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MONTER: "Monter",
  PARTNER: "Partner biznesowy",
};

export const userRoleOptions = userRoles.map((role) => ({
  value: role,
  label: userRoleLabels[role],
}));
