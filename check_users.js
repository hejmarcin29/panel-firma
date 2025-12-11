
require('dotenv').config({ path: './.env' });
const { db } = require('./src/lib/db');
const { users } = require('./src/lib/db/schema');

async function checkUsers() {
    const allUsers = await db.select({ id: users.id, name: users.name, email: users.email, roles: users.roles }).from(users);
    console.log('All users:', JSON.stringify(allUsers, null, 2));
    
    const installers = allUsers.filter(u => u.roles.includes('installer') || u.roles.includes('admin'));
    console.log('Installers count:', installers.length);
    console.log('Installers:', installers.map(u => u.email));
}

checkUsers().catch(console.error).finally(() => process.exit());
