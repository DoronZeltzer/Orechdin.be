import type { MetadataRoute } from "next";
import { INDEXABLE, SITE } from "@/lib/site";

// Static file: needed so the site can also be built as plain files for ordinary web hosting.
export const dynamic = "force-static";

/**
 * While the site is not yet live on the firm's own domain, every crawler is
 * turned away (see INDEXABLE in lib/site.ts). Once it is, the API is the only
 * thing kept out.
 */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
