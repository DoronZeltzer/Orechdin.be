"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useNeo } from "@/components/neo/neo-context";
import { MEDIA, SITE } from "@/lib/site";
import { LogoWordmark } from "@/components/ui/logo-wordmark";

const NAV_KEYS = [
  { href: "/" as const, key: "home" },
  { href: "/lawyers" as const, key: "lawyers" },
  { href: "/services" as const, key: "services" },
  { href: "/office" as const, key: "office" },
  { href: "/contact" as const, key: "contact" },
  { href: "/privacy" as const, key: "privacy" },
] as const;

const LOCALES = [
  { code: "nl" as const, label: "NL" },
  { code: "en" as const, label: "EN" },
  { code: "fr" as const, label: "FR" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { setOpen: setNeoOpen } = useNeo();
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

  return (
    <header
      data-site-header
      className="sticky top-0 z-50 border-b border-orech-line/70 bg-orech-paper/85 backdrop-blur-xl backdrop-saturate-150"
    >
      <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-3 outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-orech-bronze focus-visible:ring-offset-4 focus-visible:ring-offset-orech-paper"
          aria-label={`${SITE.title} — ${tNav("home")}`}
        >
          <span className="relative h-9 w-44 sm:h-10 sm:w-52 text-orech-ink flex items-center">
            <LogoWordmark className="h-full w-full object-contain object-left" />
            <span className="sr-only">{tCommon("officeLogoAlt", { title: SITE.title, short: SITE.shortName })}</span>
          </span>
        </Link>

        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-md border border-orech-line/80 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? tNav("closeMenu") : tNav("openMenu")}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="h-px w-5 bg-orech-ink" />
          <span className="h-px w-5 bg-orech-ink" />
          <span className="h-px w-5 bg-orech-ink" />
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label={tCommon("primarySections")}>
          {NAV_KEYS.map((item) => {
            const active =
              item.href === "/"
                ? pathWithoutLocale === "/"
                : pathWithoutLocale.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-md px-3 py-2 text-[0.82rem] font-medium tracking-wide transition hover:text-orech-ink focus-visible:outline-none focus-visible:bg-orech-bronze/10 ${
                  active ? "text-orech-ink" : "text-orech-mist"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="font-sans">{tNav(item.key)}</span>
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-1 left-3 right-3 h-px bg-orech-bronze"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <div
            className="flex items-center gap-2 font-mono text-[0.7rem] font-medium tracking-wider"
            aria-label={tNav("localeSwitcher")}
          >
            {LOCALES.map((l, i) => (
              <span key={l.code} className="flex items-center gap-2">
                <a
                  href={switchLocaleHref(l.code)}
                  hrefLang={l.code}
                  translate="no"
                  className={`transition-colors ${
                    l.code === locale
                      ? "text-orech-ink underline decoration-orech-bronze underline-offset-4"
                      : "text-orech-mist hover:text-orech-bronze"
                  }`}
                  aria-current={l.code === locale ? "true" : undefined}
                >
                  {l.label}
                </a>
                {i < LOCALES.length - 1 && (
                  <span className="text-orech-line">·</span>
                )}
              </span>
            ))}
          </div>

          <Link
            href="/case"
            aria-label={tNav("consultNeoMobile")}
            className="group inline-flex items-center gap-2 rounded-full border border-orech-ink/80 bg-transparent px-5 py-2 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-orech-ink transition hover:border-orech-bronze hover:bg-orech-bronze hover:text-white focus-visible:ring-2 focus-visible:ring-orech-bronze/50"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-orech-bronze transition group-hover:bg-white"
            />
            {tNav("consultNeo")}{" "}
            <span className="italic-display normal-case tracking-tight text-orech-bronze group-hover:text-white">
              {tNav("consultNeoSuffix")}
            </span>
          </Link>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-orech-line/70 bg-orech-slate/95 md:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <ul className="flex flex-col px-6 py-4">
          {NAV_KEYS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-orech-ink hover:bg-orech-paper/80"
                onClick={() => setMenuOpen(false)}
              >
                {tNav(item.key)}
              </Link>
            </li>
          ))}
          <li className="mt-2 flex gap-4 border-t border-orech-line/70 pt-3 font-mono text-[0.7rem] font-medium tracking-wider text-orech-mist">
            {LOCALES.map((l) => (
              <a
                key={l.code}
                href={switchLocaleHref(l.code)}
                hrefLang={l.code}
                translate="no"
                onClick={() => setMenuOpen(false)}
                className={l.code === locale ? "text-orech-ink underline decoration-orech-bronze underline-offset-4" : ""}
              >
                {l.label}
              </a>
            ))}
          </li>
          <li className="mt-2">
            <Link
              href="/case"
              className="mt-1 block w-full rounded-full border border-orech-ink/80 bg-orech-paper px-4 py-2.5 text-left font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-orech-ink transition hover:bg-orech-ink hover:text-orech-paper"
              onClick={() => setMenuOpen(false)}
            >
              {tNav("consultNeoMobile")}
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
