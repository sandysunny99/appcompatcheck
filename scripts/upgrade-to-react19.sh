#!/bin/bash

echo "🚀 Upgrading AppCompatCheck to React 19 + Radix UI v2 + Next.js 15"
echo "================================================================="

# Step 1: Clean up existing installation
echo ""
echo "Step 1: Cleaning up existing installation..."
rm -rf node_modules package-lock.json .next
echo "✅ Cleanup completed"

# Step 2: Upgrade to React 19
echo ""
echo "Step 2: Upgrading to React 19..."
npm install react@^19 react-dom@^19 @types/react@^19 --save --legacy-peer-deps

# Step 3: Upgrade Next.js to 15
echo ""
echo "Step 3: Upgrading Next.js to 15..."
npm install next@^15 --save --legacy-peer-deps

# Step 4: Upgrade all Radix UI packages to v2 (React 19 compatible)
echo ""
echo "Step 4: Upgrading Radix UI packages to v2..."
npm install \
  @radix-ui/react-accordion@latest \
  @radix-ui/react-alert-dialog@latest \
  @radix-ui/react-aspect-ratio@latest \
  @radix-ui/react-avatar@latest \
  @radix-ui/react-checkbox@latest \
  @radix-ui/react-collapsible@latest \
  @radix-ui/react-context-menu@latest \
  @radix-ui/react-dialog@latest \
  @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-hover-card@latest \
  @radix-ui/react-label@latest \
  @radix-ui/react-menubar@latest \
  @radix-ui/react-navigation-menu@latest \
  @radix-ui/react-popover@latest \
  @radix-ui/react-progress@latest \
  @radix-ui/react-radio-group@latest \
  @radix-ui/react-scroll-area@latest \
  @radix-ui/react-select@latest \
  @radix-ui/react-separator@latest \
  @radix-ui/react-slider@latest \
  @radix-ui/react-slot@latest \
  @radix-ui/react-switch@latest \
  @radix-ui/react-tabs@latest \
  @radix-ui/react-toast@latest \
  @radix-ui/react-toggle@latest \
  @radix-ui/react-toggle-group@latest \
  @radix-ui/react-tooltip@latest \
  --save --legacy-peer-deps

echo "✅ All Radix UI packages upgraded to v2"

# Step 5: Install all remaining dependencies
echo ""
echo "Step 5: Installing all remaining dependencies..."
npm install --legacy-peer-deps

echo ""
echo "✅ All dependencies installed successfully"

# Step 6: Verify versions
echo ""
echo "Step 6: Verifying versions..."
echo "React version:"
npm list react --depth=0
echo ""
echo "Next.js version:"
npm list next --depth=0
echo ""
echo "Sample Radix UI versions:"
npm list @radix-ui/react-select @radix-ui/react-dialog --depth=0

# Step 7: Test build
echo ""
echo "Step 7: Testing build..."
npm run build

echo ""
echo "🎉 Upgrade completed!"
echo ""
echo "Next steps:"
echo "1. Test the application locally: npm run dev"
echo "2. Test all UI components for breaking changes"
echo "3. Deploy to Vercel"
