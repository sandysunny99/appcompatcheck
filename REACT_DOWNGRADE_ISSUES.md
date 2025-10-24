# React 19 → React 18 Downgrade Issues

## Current Status: Build Failures Persist

### Problem Summary
After downgrading from React 19 to React 18.3.1 to fix Radix UI compatibility issues, the Next.js build now fails with module resolution errors for `react/jsx-runtime`.

### Build Errors
```
Module not found: Can't resolve 'react/jsx-runtime'
```

This error occurs across multiple files:
- `app/(login)/login.tsx`
- `app/docs/page.tsx`
- `components/admin/AdminDashboard.tsx`

### Root Cause Analysis

The issue stems from an incompatibility between:
- **Next.js 15.x**: Requires React 19
- **Next.js 14.x**: Better support for React 18, but still showing issues
- **React 18.3.1**: Installed correctly with `jsx-runtime.js` present
- **Radix UI v1.x**: Only supports React 16.8, 17, or 18
- **Webpack Module Resolution**: Failing to locate `react/jsx-runtime` despite it existing

### Verification Steps Taken

1. ✅ React 18.3.1 is correctly installed:
   ```bash
   $ npm list react --depth=0
   appcompatcheck@1.0.0 /home/runner/app
   └── react@18.3.1 overridden
   ```

2. ✅ jsx-runtime files exist:
   ```bash
   $ ls node_modules/react/jsx-runtime.js
   -rw-r--r-- 1 runner runner 214 Oct 24 01:12 node_modules/react/jsx-runtime.js
   ```

3. ✅ package.json overrides are working
4. ✅ .npmrc configured with `legacy-peer-deps=true`
5. ✅ Next.js downgraded from 15.5.6 to 14.2.33
6. ✅ next.config.ts converted to next.config.js
7. ✅ tsconfig.json moduleResolution changed from "bundler" to "node"
8. ❌ Build still fails with jsx-runtime resolution error

### Additional Missing Dependencies
- `swagger-ui-react` - Added successfully
- `@/components/ui/tabs` - Missing component
- `./SystemConfiguration` in admin - Missing component

## Recommended Solutions

### Option 1: Upgrade Radix UI to React 19 Compatible Versions (RECOMMENDED)
**Status**: Some Radix UI packages now support React 19 in v2.x

**Radix UI React 19 Compatibility**:
- `@radix-ui/react-*@2.x` - Most v2 packages support React 19
- Check each package at: https://www.radix-ui.com/

**Implementation**:
```bash
# Upgrade to Radix UI v2 packages
npm install @radix-ui/react-accordion@2 @radix-ui/react-dialog@2 @radix-ui/react-dropdown-menu@2 # ... etc
# Revert to React 19
npm install react@19 react-dom@19 @types/react@19 --save
# Revert Next.js to 15
npm install next@15 --save
```

**Pros**:
- Uses latest versions
- Better Next.js 15 support
- Future-proof

**Cons**:
- May require code changes for breaking changes in Radix UI v2
- Need to check compatibility of ALL Radix UI packages

### Option 2: Use Shadcn/UI Alternative Components
**Status**: Feasible but requires component replacement

Replace Radix UI components with:
- React Aria Components
- Headless UI
- Custom components

**Pros**:
- Can use React 19 + Next.js 15
- More control

**Cons**:
- Significant refactoring required
- Time-consuming

### Option 3: Fix Current Setup with Additional Configuration
**Status**: Attempted, needs more investigation

Try adding explicit webpack configuration for React resolution:

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    // Ensure React is resolved correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
    };
    return config;
  },
};
```

**Pros**:
- Minimal code changes
- Uses stable versions

**Cons**:
- Still encountering issues
- May not fully resolve the problem

### Option 4: Wait for Vercel Build Environment Update
**Status**: Not reliable, timing unknown

The Vercel build environment may need specific React/Next.js combinations that differ from local development.

## Immediate Action Items

1. **Verify Radix UI v2 Compatibility**
   - Check which packages have v2 with React 19 support
   - Create compatibility matrix

2. **Test Radix UI v2 Upgrade**
   - Upgrade one package at a time
   - Test each upgrade

3. **Add Missing Components**
   - Create `components/ui/tabs.tsx`
   - Create `components/admin/SystemConfiguration.tsx`

4. **Document Breaking Changes**
   - Note any API changes in Radix UI v2
   - Update component usage

## Current Configuration Files

### package.json
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "@types/react": "^18.3.11",
  "next": "14.2.33",
  "overrides": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@types/react": "^18.3.11"
  }
}
```

### .npmrc
```ini
legacy-peer-deps=true
strict-peer-dependencies=false
engine-strict=false
auto-install-peers=true
```

### vercel.json
```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "env": {
    "NPM_CONFIG_LEGACY_PEER_DEPS": "true"
  }
}
```

## Conclusion

The React 18 downgrade has successfully resolved Radix UI peer dependency conflicts, but introduced new webpack module resolution issues. The most viable path forward is **Option 1: Upgrade to Radix UI v2** with React 19 support, which would allow us to use:
- React 19 (latest)
- Next.js 15 (latest)
- Radix UI v2 (React 19 compatible)

This requires verification of v2 availability for all used Radix UI packages and potential code updates for breaking changes.
