import Database from 'better-sqlite3';
import { ZenStackClient } from '@zenstackhq/orm';
import { SqliteDialect } from '@zenstackhq/orm/dialects/sqlite';
import { schema } from '../zenstack/schema';
import path from 'path';

async function main() {
    const dbPath = path.join(__dirname, '..', 'zenstack', 'dev.db');
    const db = new Database(dbPath);
    const client = new ZenStackClient(schema, {
        dialect: new SqliteDialect({ database: db }),
    });

    // Create a user to prime the database
    const user = await client.user.create({
        data: {
            email: 'alice@example.com',
            name: 'Alice',
        },
    });

    console.log('Seeded user:', user);
    await client.$disconnect();
}

main().catch((err) => {
    if ((err as any)?.reason === 'db-query-error' && (err as any)?.dbErrorCode === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log('Seed user already exists, skipping.');
    } else {
        console.error(err);
        process.exit(1);
    }
});
