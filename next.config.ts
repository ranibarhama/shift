import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  // Phase 2 steps that were merged or renamed — old links keep working.
  async redirects() {
    return [
      { source: "/stage-2/detailed-definition", destination: "/stage-2/architecture", permanent: false },
      { source: "/stage-2/technical-architecture", destination: "/stage-2/architecture", permanent: false },
      { source: "/stage-2/work-plan", destination: "/stage-2/tasks-resources", permanent: false },
    ];
  },
};

export default nextConfig;
