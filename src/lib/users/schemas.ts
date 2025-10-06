import { z } from "zod";

import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { userRoles } from "@/lib/user-roles";

const looseNullableString = z.union([z.string(), z.literal(null)]).optional();

const usernameSchema = z
  .string()
  .min(3, "Login musi mieć co najmniej 3 znaki.")
  .max(50, "Login może mieć maksymalnie 50 znaków.")
  .regex(/^[a-z0-9._-]+$/i, "Login może zawierać litery, cyfry, kropki, myślniki i podkreślenia.");

const emailSchema = z
  .string()
  .min(1, "Podaj adres e-mail.")
  .email("Podaj poprawny adres e-mail.");

export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  name: looseNullableString,
  phone: looseNullableString,
  role: z.enum(userRoles),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`),
});

export const updateUserSchema = z.object({
  id: z.string().min(1, "Brakuje identyfikatora użytkownika."),
  username: usernameSchema,
  email: emailSchema,
  name: looseNullableString,
  phone: looseNullableString,
  role: z.enum(userRoles),
  password: z
    .union([
      z.string().min(MIN_PASSWORD_LENGTH, `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`),
      z.literal(null),
    ])
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type CreateUserFormErrors = Partial<
  Record<keyof CreateUserInput | "confirmPassword", string>
>;

export type CreateUserFormState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message?: string; errors?: CreateUserFormErrors };

export type UpdateUserFormErrors = Partial<
  Record<
    | "username"
    | "email"
    | "name"
    | "phone"
    | "role"
    | "password"
    | "confirmPassword",
    string
  >
> & { id?: string };

export type UpdateUserFormState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message?: string; errors?: UpdateUserFormErrors };
