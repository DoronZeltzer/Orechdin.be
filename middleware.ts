import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames.
  //
  // The generated share images and the touch icon live at fixed addresses with no
  // language (/opengraph-image, /twitter-image, /apple-icon), so they are left out.
  // With a language prefix on every address they would otherwise be redirected to
  // /en/opengraph-image and so on, where they do not exist, and link previews and
  // the iPhone home-screen icon would break.
  matcher: ["/", "/(en|nl|he)/:path*", "/((?!api|_next|_vercel|opengraph-image|twitter-image|apple-icon|.*\\..*).*)"],
};
