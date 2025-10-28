import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/auth/session';
import crypto from 'crypto';

async function createAdminUser() {
  console.log('🔐 Creating Admin User...\n');

  // Generate strong random password
  const password = crypto.randomBytes(16).toString('base64').slice(0, 20);
  const email = 'admin@appcompatcheck.com';
  const name = 'Admin User';

  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${email}`);
      console.log('\n💡 To reset password, use the forgot password feature or delete the user and run this script again.\n');
      process.exit(0);
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

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
    const fs = require('fs');
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

    fs.writeFileSync(credentialsFile, credentials);
    console.log(`📄 Credentials saved to: ${credentialsFile}`);
    console.log('   (Remember to delete this file after saving the credentials!)\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
createAdminUser();
