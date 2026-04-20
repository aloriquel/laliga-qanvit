#!/usr/bin/env ts-node
/**
 * Pre-deploy checks for La Liga Qanvit.
 * Run with: npx ts-node scripts/pre-deploy-check.ts
 */

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "NEXT_PUBLIC_APP_URL",
];

const OPTIONAL_ENV = [
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "EVALUATOR_FN_SECRET",
];

let errors = 0;
let warnings = 0;

console.log("\n🔍 La Liga Qanvit — Pre-deploy checks\n");

// 1. Required env vars
console.log("1. Checking required environment variables...");
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`   ❌ Missing: ${key}`);
    errors++;
  } else {
    console.log(`   ✅ ${key}`);
  }
}

// 2. Optional env vars
console.log("\n2. Checking optional environment variables...");
for (const key of OPTIONAL_ENV) {
  if (!process.env[key]) {
    console.warn(`   ⚠️  Not set: ${key}`);
    warnings++;
  } else {
    console.log(`   ✅ ${key}`);
  }
}

// 3. APP_URL must be production domain
console.log("\n3. Checking APP_URL...");
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
  console.error("   ❌ NEXT_PUBLIC_APP_URL still points to localhost in production build");
  errors++;
} else if (!appUrl.startsWith("https://")) {
  console.error("   ❌ NEXT_PUBLIC_APP_URL must use HTTPS");
  errors++;
} else {
  console.log(`   ✅ ${appUrl}`);
}

// 4. Supabase URL format
console.log("\n4. Checking Supabase URL format...");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!supabaseUrl.includes("supabase.co")) {
  console.warn("   ⚠️  NEXT_PUBLIC_SUPABASE_URL doesn't look like a cloud Supabase URL");
  warnings++;
} else {
  console.log(`   ✅ ${supabaseUrl}`);
}

// Summary
console.log("\n" + "─".repeat(50));
if (errors > 0) {
  console.error(`\n❌ ${errors} error(s) found. Fix before deploying.\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠️  ${warnings} warning(s). Deploy possible but some features may not work.\n`);
  process.exit(0);
} else {
  console.log("\n✅ All checks passed. Ready to deploy.\n");
  process.exit(0);
}
