import { readFileSync } from "fs";
import { pool } from "../db.js";
import { dirname } from "path";

console.log("Running migrations from: ", process.cwd());

const migrationQuery = readFileSync("src/migrations/1.sql", "utf8");

async function runMigration() {
  try {
    await pool.query(migrationQuery);
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed", error);
  } finally {
    pool.end();
  }
}

runMigration();
