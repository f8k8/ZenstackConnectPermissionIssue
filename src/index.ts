import Database from "better-sqlite3";
import { ZenStackClient } from "@zenstackhq/orm";
import { SqliteDialect } from "@zenstackhq/orm/dialects/sqlite";
import { PolicyPlugin } from "@zenstackhq/plugin-policy";
import { schema } from "../zenstack/schema";
import path from "path";

async function main() {
  const dbPath = path.join(__dirname, "..", "zenstack", "dev.db");
  const db = new Database(dbPath);
  const dialect = new SqliteDialect({ database: db });

  // 1) Using a non-authed DB, get the userID
  const nonAuthedClient = new ZenStackClient(schema, { dialect });
  const user = await nonAuthedClient.user.findFirst({
    select: { id: true },
  });
  if (!user) {
    throw new Error(
      'No user found. Run "npm install" to build the project and seed the database.',
    );
  }
  const userId = user.id;
  console.log("Found user ID:", userId);

  // 2) Create an authed client using the user
  const authedClient = new ZenStackClient(schema, {
    dialect,
    plugins: [new PolicyPlugin()],
  }).$setAuth(user);

  // 3) Call createChild with the following data using the authed client
  const child = await authedClient.child.create({
    data: {
      name: "Child",
      dob: new Date(),
      parents: {
        connect: { id: userId },
      },
    },
  });

  console.log("Created child:", child);
  await nonAuthedClient.$disconnect();
}

main().catch(console.error);
