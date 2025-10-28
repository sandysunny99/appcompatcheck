#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function createAdminUser() {
  console.log('🔐 Creating Admin User...\n');

  // Generate strong random password
  const password = crypto.randomBytes(16).toString('base64').slice(0, 20);
  const email = 'admin@appcompatcheck.com';
  const name = 'Admin User';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  try {
    // Check if admin already exists
    const existingAdmin = await client`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${email}`);
      console.log(`🆔 User ID: ${existingAdmin[0].id}`);
      console.log('\n💡 To reset password, use the forgot password feature or delete the user and run this script again.\n');
      await client.end();
      process.exit(0);
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await client`
      INSERT INTO users (email, name, password_hash, role, is_active, created_at, updated_at)
      VALUES (${email}, ${name}, ${passwordHash}, 'admin', true, NOW(), NOW())
      RETURNING *
    `;

    const adminUser = result[0];

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 ADMIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Name:     ${name}`);
    console.log(`🎯 Role:     admin`);
    console.log(`🆔 User ID:  ${adminUser.id}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log('💡 You can change the password after first login.\n');
    console.log(`🌐 Login at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in\n`);

    // Save credentials to file for reference
    const credentialsFile = '.admin-credentials.txt';
    const credentials = `
Admin Credentials Generated: ${new Date().toISOString()}
═══════════════════════════════════════════════════

Email:    ${email}
Password: ${password}
Name:     ${name}
Role:     admin
User ID:  ${adminUser.id}

Login URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in

⚠️  IMPORTANT: Delete this file after saving the credentials securely!
`;

    fs.writeFileSync(path.join(process.cwd(), credentialsFile), credentials);
    console.log(`📄 Credentials saved to: ${credentialsFile}`);
    console.log('   (Remember to delete this file after saving the credentials!)\n');

    await client.end();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await client.end();
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
createAdminUser();
