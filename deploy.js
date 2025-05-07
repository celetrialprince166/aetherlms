/**
 * Deployment script for AetherLMS
 * Handles build process with data collection skipping
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.blue}Starting deployment process...${colors.reset}`);

// Ensure temp env file doesn't exist
const tempEnvPath = '.env.build';
try {
  if (fs.existsSync(tempEnvPath)) {
    fs.unlinkSync(tempEnvPath);
  }
} catch (err) {
  console.error(`${colors.red}Error cleaning up temp files:${colors.reset}`, err);
}

// Create build-specific environment variables
console.log(`${colors.cyan}Setting up build environment...${colors.reset}`);
const buildEnvVars = [
  'SKIP_DB_CHECK=true',
  'BUILD_MODE=static',
  'NODE_ENV=production',
];

// Add existing env vars from .env.local if it exists
try {
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const existingVars = envContent.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );
    buildEnvVars.push(...existingVars);
  }
} catch (err) {
  console.warn(`${colors.yellow}Warning: Could not read .env.local:${colors.reset}`, err);
}

// Write to temp env file
fs.writeFileSync(tempEnvPath, buildEnvVars.join('\n'));
console.log(`${colors.green}Build environment configured${colors.reset}`);

// Clean build artifacts
console.log(`${colors.cyan}Cleaning previous build artifacts...${colors.reset}`);
try {
  if (fs.existsSync('.next')) {
    execSync('npx rimraf .next', { stdio: 'inherit' });
  }
  if (fs.existsSync('out')) {
    execSync('npx rimraf out', { stdio: 'inherit' });
  }
} catch (err) {
  console.error(`${colors.red}Error cleaning build artifacts:${colors.reset}`, err);
}

// Run build with temp env
console.log(`${colors.blue}Starting build process...${colors.reset}`);
try {
  execSync('npx cross-env-shell "node -r dotenv/config ./node_modules/.bin/next build dotenv_config_path=.env.build"', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      SKIP_DB_CHECK: 'true',
      BUILD_MODE: 'static',
      NODE_ENV: 'production',
    },
  });
  console.log(`${colors.green}Build completed successfully!${colors.reset}`);
} catch (err) {
  console.error(`${colors.red}Build failed:${colors.reset}`, err);
  process.exit(1);
} finally {
  // Clean up temp env file
  try {
    if (fs.existsSync(tempEnvPath)) {
      fs.unlinkSync(tempEnvPath);
    }
  } catch (err) {
    console.warn(`${colors.yellow}Warning: Could not clean up temp env file:${colors.reset}`, err);
  }
}

console.log(`${colors.green}Deployment ready!${colors.reset}`);
console.log(`${colors.cyan}The application has been built and is ready for deployment.${colors.reset}`);
console.log(`${colors.cyan}You can deploy the 'out' directory to your hosting provider.${colors.reset}`); 