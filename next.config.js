// next.config.js
module.exports = {
  async rewrites() {
    // read raw value
    const rawApiBase = process.env.NEXT_PUBLIC_API_URL;

    // treat "", undefined, "undefined" as not set
    const isInvalid =
      rawApiBase === undefined ||
      rawApiBase === null ||
      rawApiBase === "" ||
      rawApiBase === "undefined";

    const apiBase = isInvalid ? null : rawApiBase;

    // helpful build-time log — will appear in Vercel build logs
    // (safe: doesn't leak secrets if you only use a public URL)
    // eslint-disable-next-line no-console
    console.log("NEXT_PUBLIC_API_URL ->", apiBase);

    const rewrites = [
      // always-local rewrites
      { source: "/login", destination: "/auth/login" },
      { source: "/register", destination: "/auth/register" },
    ];

    if (apiBase) {
      // ensure apiBase starts with http/https
      const normalized =
        apiBase.startsWith("http://") || apiBase.startsWith("https://")
          ? apiBase.replace(/\/+$/, "") // strip trailing slash
          : `https://${apiBase.replace(/\/+$/, "")}`;

      rewrites.unshift(
        {
          source: "/storage/:path*",
          destination: `${normalized}/storage/:path*`,
        },
        {
          source: "/sanctum/:path*",
          destination: `${normalized}/sanctum/:path*`,
        },
        { source: "/api/:path*", destination: `${normalized}/api/:path*` }
      );
    } else {
      // build log so you can see why rewrites were skipped
      // eslint-disable-next-line no-console
      console.warn(
        "NEXT_PUBLIC_API_URL not set or invalid — skipping remote rewrites"
      );
    }

    return rewrites;
  },
};
