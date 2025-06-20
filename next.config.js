/** @type {import('next').NextConfig} */
const nextConfig = {
    swcMinify: false,
      env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
}

module.exports = nextConfig
