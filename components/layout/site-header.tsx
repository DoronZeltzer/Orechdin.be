"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { LogoWordmark } from "@/components/ui/logo-wordmark";
import { Button } from "@/components/ui/button";

/**
 * The four pages that make up the main navigation. Contact is not in this list:
 * it is the one action the site wants a visitor to take, so it is a button of
 * its own beside the language switch. Privacy is a footer link.
 */
const NAV_KEYS = [
  { href: "/" as const, key: "home" },
  { href: "/lawyers" as const, key: "lawyers" },
  { href: "/services" as const, key: "services" },
  { href: "/office" as const, key: "office" },
] as const;

const LOCALES = [
  { code: "nl" as const, label: "NL" },
  { code: "en" as const, label: "EN" },
  { code: "fr" as const, label: "FR" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const tNav = useTranslations("Nav");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const pathWithoutLocale = pathname.replace(/^\/(en|nl|fr)/, "") || "/";

  const switchLocaleHref = (target: "nl" | "en" | "fr") => {
    if (target === "nl") {
      return pathWithoutLocale === "/" ? "/" : pathWithoutLocale;
    }
    return `/${target}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
  };

  const isActive = (href: string) => (href === "/" ? pathWithoutLocale === "/" : pathWithoutLocale.startsWith(href));

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const localeSwitch = (onClick?: () => void) =>
    LOCALES.map((l, i) => (
      <span key={l.code} className="flex items-center gap-2">
        <a
          href={switchLocaleHref(l.code)}
          hrefLang={l.code}
          translate="no"
          onClick={onClick}
          className={`transition-colors ${l.code === locale ? "font-bold text-brand-black" : "text-brand-black-60 hover:text-brand-black"}`}
          aria-current={l.code === locale ? "true" : undefined}
        >
          {l.label}
        </a>
        {i < LOCALES.length - 1 && (
          <span aria-hidden className="text-brand-black-40">
            ·
          </span>
        )}
      </span>
    ));

  return (
    <header
      data-site-header
      className="sticky top-0 z-50 border-b border-brand-black/10 bg-brand-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-6 py-3 md:py-4 lg:px-10">
        {/* The logo is about a quarter larger than before (h-11/12 -> h-12/14). */}
        <Link
          href="/"
          className="flex items-center"
          aria-label={`${SITE.title}, ${tNav("home")}`}
        >
          <span className="relative flex h-12 items-center sm:h-14">
            <LogoWordmark className="h-full w-auto object-contain object-left" />
            <span className="sr-only">{tCommon("officeLogoAlt", { title: SITE.title, short: SITE.shortName })}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={tCommon("primarySections")}>
          {NAV_KEYS.map((item) => {
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
          <div className="flex items-center gap-2 text-[0.75rem] tracking-wider" aria-label={tNav("localeSwitcher")}>
            {localeSwitch()}
          </div>
          <Button
            href="/contact"
            variant={isActive("/contact") ? "dark" : "primary"}
            className="min-h-10 px-5 py-2 text-[0.75rem]"
            aria-current={isActive("/contact") ? "page" : undefined}
          >
            {tNav("contact")}
          </Button>
        </div>

        <button
          type="button"
          className="flex h-12 w-12 flex-col items-center justify-center gap-[5px] border-2 border-brand-black md:hidden"
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
          {NAV_KEYS.map((item) => (
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
          <li className="flex items-center gap-2 pt-6 text-sm tracking-wider" aria-label={tNav("localeSwitcher")}>
            {localeSwitch(() => setMenuOpen(false))}
          </li>
        </ul>
      </div>
    </header>
  );
}
