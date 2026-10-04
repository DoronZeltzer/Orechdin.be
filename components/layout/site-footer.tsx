import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { LanguageSwitch } from "@/components/layout/language-switch";

/**
 * `SiteFooter`: compact. The firm, its address and how to reach it; the same
 * five pages as the header; the languages; the legal pages.
 *
 * There is no promotional paragraph and no disclaimer here. The legal notice and
 * disclaimer are still being finalised and will live on their own page.
 *
 * The soft fade from the white page into the footer's blue is kept.
 */
export function SiteFooter() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");

  const link = "transition-colors hover:underline hover:decoration-1 hover:underline-offset-4";

  return (
    <footer data-site-footer className="bg-brand-wash text-brand-black">
      <div aria-hidden className="h-14 bg-gradient-to-b from-brand-white to-brand-wash" />

      <div className="mx-auto max-w-wide px-6 pb-10 lg:px-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">{SITE.title}</p>
            <p className="mt-1 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-black-80">{SITE.shortName}</p>
            <address className="mt-5 not-italic text-[0.95rem] leading-relaxed">
              {SITE.address.street}
              <br />
              {SITE.address.postal} {SITE.address.city}, {SITE.address.country}
            </address>
            <div className="mt-3 space-y-1 text-[0.95rem]">
              <p>
                <span className="font-bold">{t("phoneLetter")}</span>{" "}
                <a className={link} href={`tel:${SITE.phoneTel}`}>
                  {SITE.phoneDisplay}
                </a>
              </p>
              <p>
                <span className="font-bold">{t("emailLetter")}</span>{" "}
                <a className={link} href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <p className="eyebrow">{t("navHeading")}</p>
            <ul className="mt-4 space-y-2 text-[0.95rem]">
              <li><Link href="/" className={link}>{tNav("home")}</Link></li>
              <li><Link href="/services" className={link}>{tNav("services")}</Link></li>
              <li><Link href="/lawyers" className={link}>{tNav("lawyers")}</Link></li>
              <li><Link href="/office" className={link}>{tNav("office")}</Link></li>
              <li><Link href="/contact" className={link}>{tNav("contact")}</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">{t("legalHeading")}</p>
            <ul className="mt-4 space-y-2 text-[0.95rem]">
              <li><Link href="/privacy" className={link}>{t("privacy")}</Link></li>
              <li><Link href="/cookies" className={link}>{t("cookies")}</Link></li>
              <li><Link href="/legal-notice" className={link}>{t("legalNotice")}</Link></li>
              <li>
                {/* Withdrawal has to be as easy as consent was, so the way back
                    into the dialog sits on every page. */}
                <CookieSettingsButton />
              </li>
            </ul>
            <p className="eyebrow mt-7">{t("languagesHeading")}</p>
            <LanguageSwitch className="mt-3 flex items-center gap-2 text-[0.95rem]" />
          </div>
        </div>

        <p className="mt-10 border-t border-brand-black/15 pt-6 text-[0.82rem] text-brand-black-80">
          © {new Date().getFullYear()} <span className="font-bold text-brand-black">{SITE.copyrightEntity}</span>
        </p>
      </div>
    </footer>
  );
}
