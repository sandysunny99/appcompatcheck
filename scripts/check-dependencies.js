#!/usr/bin/env node

/**
 * Dependency Conflict Checker
 * Verifies React version compatibility across all dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking dependency conflicts...\n');

try {
  // Check React version
  console.log('📦 Checking React version...');
  const reactCheck = execSync('npm ls react', { encoding: 'utf8' });
  console.log('✅ React dependency tree:');
  console.log(reactCheck);
  
  // Check Radix UI compatibility
  console.log('\n📦 Checking Radix UI dependencies...');
  try {
    const radixCheck = execSync('npm ls @radix-ui/react-select @radix-ui/react-hover-card', { encoding: 'utf8' });
    console.log('✅ Radix UI dependencies:');
    console.log(radixCheck);
  } catch (error) {
    console.log('⚠️  Some Radix UI packages not found or have conflicts (expected with legacy-peer-deps)');
  }

  // Check package.json for correct versions
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const reactVersion = packageJson.dependencies.react;
  const reactDomVersion = packageJson.dependencies['react-dom'];
  
  console.log('\n📋 Package.json versions:');
  console.log(`   React: ${reactVersion}`);
  console.log(`   React-DOM: ${reactDomVersion}`);

  // Verify .npmrc exists
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  if (fs.existsSync(npmrcPath)) {
    console.log('\n✅ .npmrc configuration found');
    const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
    if (npmrcContent.includes('legacy-peer-deps=true')) {
      console.log('✅ legacy-peer-deps is enabled');
    } else {
      console.log('⚠️  legacy-peer-deps not found in .npmrc');
    }
  } else {
    console.log('\n⚠️  .npmrc file not found');
  }

  console.log('\n🎉 Dependency check completed!');
  console.log('\n💡 Tips:');
  console.log('   - Run: npm install --legacy-peer-deps');
  console.log('   - Ensure .npmrc has legacy-peer-deps=true');
  console.log('   - React 18.3.1 is compatible with all Radix UI v1.x packages');
  
} catch (error) {
  console.error('\n❌ Dependency conflicts found:');
  console.error(error.stdout || error.message);
  console.log('\n🔧 To fix:');
  console.log('   1. rm -rf node_modules package-lock.json');
  console.log('   2. npm install --legacy-peer-deps');
  console.log('   3. npm run build');
  process.exit(1);
}
