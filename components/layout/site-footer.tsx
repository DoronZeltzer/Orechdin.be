"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SITE } from "@/lib/site";

/**
 * `SiteFooter` — editorial close to every marketing page.
 *
 * Geometry: a single hairline above, three columns of short paragraphs, and
 * a colophon line at the foot. The firm's name is set in the italic display
 * face (Cormorant Garamond) so the footer reads like the colophon page of
 * a printed monograph.
 */
export function SiteFooter() {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/(en|nl|fr)/, "") || "/";
  const t = useTranslations("Footer");
  const tDisclaimer = useTranslations("Disclaimer");

  if (pathWithoutLocale === "/case" || pathWithoutLocale.startsWith("/case/")) {
    return null;
  }

  return (
    <footer
      data-site-footer
      className="border-t border-orech-line/70 bg-orech-slate/60 text-orech-ink"
    >
      <div className="mx-auto max-w-wide space-y-12 px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="italic-display text-2xl tracking-tight">
              {SITE.title}
            </p>
            <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-orech-mist">
              {SITE.shortName}
            </p>
            <p className="mt-5 max-w-xs text-[0.85rem] leading-relaxed text-orech-mist">
              {tDisclaimer("body")}
            </p>
          </div>

          <div>
            <p className="eyebrow">{t("contactHeading")}</p>
            <address className="mt-4 not-italic text-[0.92rem] leading-relaxed text-orech-ink/90">
              {SITE.address.singleLine}
            </address>
            <div className="mt-3 space-y-1 text-[0.92rem]">
              <a
                className="block hover:text-orech-bronze transition-colors"
                href={`tel:${SITE.phoneTel}`}
              >
                {SITE.phoneDisplay}
              </a>
              <a
                className="block hover:text-orech-bronze transition-colors"
                href={`mailto:${SITE.email}`}
              >
                {SITE.email}
              </a>
            </div>
          </div>

          <div>
            <p className="eyebrow">{t("legalHeading")}</p>
            <ul className="mt-4 space-y-2 text-[0.92rem]">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-orech-bronze transition-colors"
                >
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <a
                  href={SITE.livePrivacyUrl}
                  className="text-orech-mist hover:text-orech-bronze transition-colors"
                  rel="noopener noreferrer"
                >
                  {t("officialPrivacyLive")}
                </a>
              </li>
            </ul>
            <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-orech-mist">
              KBO {SITE.kbo} · {SITE.court}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-orech-line/70 pt-8 text-[0.78rem] text-orech-mist md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="italic-display text-orech-ink">
              {SITE.copyrightEntity}
            </span>
          </p>
          <p className="font-mono uppercase tracking-[0.16em]">
            {t("builtFor")}{" "}
            <a
              href="https://vertogroup.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orech-bronze hover:text-orech-bronzeMuted transition-colors"
            >
              Vertogroup.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
