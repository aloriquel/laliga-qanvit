import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // pdf-to-png-converter and sharp use native .node binaries — must NOT be
  // webpack-bundled. Next.js loads them at runtime via require() instead.
  serverExternalPackages: ["pdf-to-png-converter", "@napi-rs/canvas", "sharp"],
  webpack(config) {
    // Handle native .node binaries (e.g. @napi-rs/canvas used by pdf-to-png-converter).
    // node-loader emits a require() call instead of trying to parse the binary.
    config.module.rules.push({
      test: /\.node$/,
      use: [{ loader: "node-loader" }],
    });
    return config;
  },
};

const intlConfig = withNextIntl(nextConfig);

export default withSentryConfig(intlConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
