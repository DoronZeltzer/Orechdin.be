"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { LogoWordmark } from "@/components/ui/logo-wordmark";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/layout/language-switch";

/**
 * Home | Practice Areas | Our Lawyers | The Office | Contact
 *
 * Contact is the one action the site wants a visitor to take, so it is the
 * highlighted button at the end of the row rather than a fifth plain link.
 */
const NAV = [
  { href: "/" as const, key: "home" },
  { href: "/services" as const, key: "services" },
  { href: "/lawyers" as const, key: "lawyers" },
  { href: "/office" as const, key: "office" },
] as const;

export function SiteHeader() {
  const pathname = usePathname(); // without the language prefix
  const [menuOpen, setMenuOpen] = useState(false);
  const tNav = useTranslations("Nav");
  const tCommon = useTranslations("Common");

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      data-site-header
      className="sticky top-0 z-50 border-b border-brand-black/10 bg-brand-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-6 py-3 md:py-4 lg:px-10">
        <Link href="/" className="flex items-center" aria-label={`${SITE.title}, ${tCommon("shortName")}`}>
          <span className="relative flex h-12 items-center sm:h-14">
            <LogoWordmark className="h-full w-auto object-contain object-left" />
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3.5 py-2 text-[0.92rem] transition-colors hover:text-brand-black ${
                  active ? "font-extrabold text-brand-black" : "font-medium text-brand-black-60"
                }`}
              >
                {tNav(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <LanguageSwitch className="flex items-center gap-2 text-[0.75rem] tracking-wider" />
          <Button
            href="/contact"
            className="min-h-10 px-5 py-2 text-[0.75rem]"
            aria-current={isActive("/contact") ? "page" : undefined}
          >
            {tNav("contact")}
          </Button>
        </div>

        <button
          type="button"
          className="flex h-12 w-12 flex-col items-center justify-center gap-[5px] rounded-lg border border-brand-black-60 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? tNav("closeMenu") : tNav("openMenu")}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`h-0.5 w-5 bg-brand-black transition-transform ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-brand-black transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-brand-black transition-transform ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-brand-black/10 bg-brand-white md:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <ul className="flex flex-col px-6 pb-6 pt-2">
          {NAV.map((item) => (
            <li key={item.href} className="border-b border-brand-black/10">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`block py-4 text-xl ${isActive(item.href) ? "font-extrabold" : "font-medium"}`}
              >
                {tNav(item.key)}
              </Link>
            </li>
          ))}
          <li className="pt-6">
            <Button href="/contact" className="w-full" onClick={() => setMenuOpen(false)}>
              {tNav("contact")}
            </Button>
          </li>
          <li className="pt-6 text-sm tracking-wider">
            <LanguageSwitch className="flex items-center gap-2" onNavigate={() => setMenuOpen(false)} />
          </li>
        </ul>
      </div>
    </header>
  );
}
