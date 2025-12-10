const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL || 'postgresql://panel_user:panel_password@localhost:5432/panel_db';
const sql = postgres(connectionString);

async function createUser(email, password, name) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();
        
        await sql`
            INSERT INTO users (id, email, password_hash, name, roles, is_active)
            VALUES (${id}, ${email}, ${hashedPassword}, ${name}, ${JSON.stringify(['admin'])}, true)
        `;
        
        console.log(`User ${email} created successfully.`);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await sql.end();
    }
}

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin';

if (!email || !password) {
    console.log('Usage: node create_user.js <email> <password> [name]');
    process.exit(1);
}

createUser(email, password, name);
