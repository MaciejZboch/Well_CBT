import * as SQLite from "expo-sqlite";

export const DB_NAME = "worryfree-db";
export const dbPromise = SQLite.openDatabaseAsync(DB_NAME);
