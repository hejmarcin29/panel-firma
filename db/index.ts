import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const defaultDatabasePath = path.resolve(process.cwd(), "data/panel.db");
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabasePath;

const resolveSqlitePath = (urlOrPath: string): string => {
	if (urlOrPath === ":memory:") {
		return urlOrPath;
	}

	if (urlOrPath.startsWith("sqlite:")) {
		return fileURLToPath(new URL(urlOrPath));
	}

	if (urlOrPath.startsWith("file:")) {
		return fileURLToPath(urlOrPath);
	}

	return path.isAbsolute(urlOrPath)
		? urlOrPath
		: path.resolve(process.cwd(), urlOrPath);
};

const sqlitePath = resolveSqlitePath(databaseUrl);

if (sqlitePath !== ":memory:") {
	const directory = path.dirname(sqlitePath);
	fs.mkdirSync(directory, { recursive: true });
}

const sqlite = new Database(sqlitePath);

export const db = drizzle(sqlite, { schema });

export { schema };
