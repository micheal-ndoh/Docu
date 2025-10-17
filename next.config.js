// @ts-check

/**
 * Minimal Next.js config. Removed the `@nx/next` plugin import because this
 * repository does not include the `@nx/next` package in dependencies and
 * causing builds to fail on platforms (for example, Vercel) where that
 * package isn't available.
 *
 * If you intentionally use Nx in your workspace, re-install `@nx/next` and
 * restore the previous config. Otherwise this plain config works for
 * standard Next.js setups.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Any Next.js config options can go here.
  transpilePackages: [],
};

module.exports = nextConfig;
