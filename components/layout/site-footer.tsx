import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SITE } from "@/lib/site";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";

/**
 * `SiteFooter`: the close of every page, in three steps.
 *
 *   1. A soft fade from the white page into the footer's blue, so the page does
 *      not end on a hard edge.
 *   2. The disclaimer, on that blue, as a band of its own. It used to appear as
 *      a white strip on four pages and again inside the footer; it now appears
 *      once, in the same place on every page, which is where it works as the
 *      hand-over from the content to the footer.
 *   3. The footer proper, on the same blue: contact, legal links, colophon.
 *
 * The surface is the brand's wash blue (#d0e1ee). Text on it is black or black
 * at 80%: the 60% tint used elsewhere is only 4.3:1 on this blue, under the
 * 4.5:1 body text needs. Links change by underline on hover, not by colour, as
 * the accent blue would vanish against this background.
 */
export function SiteFooter() {
  const t = useTranslations("Footer");
  const tDisclaimer = useTranslations("Disclaimer");

  const link =
    "transition-colors hover:underline hover:decoration-1 hover:underline-offset-4";

  return (
    <footer data-site-footer className="bg-brand-wash text-brand-black">
      <div aria-hidden className="h-16 bg-gradient-to-b from-brand-white to-brand-wash" />

      <div className="mx-auto max-w-wide px-6 pb-14 lg:px-10">
        <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-brand-black-80 sm:text-[0.95rem]">
          {tDisclaimer("body")}
        </p>
      </div>

      <div className="border-t border-brand-black/15">
        <div className="mx-auto max-w-wide space-y-12 px-6 py-14 lg:px-10">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <p className="text-2xl font-extrabold tracking-tight">{SITE.title}</p>
              <p className="mt-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-brand-black-80">
                {SITE.shortName}
              </p>
            </div>

            <div>
              <p className="eyebrow">{t("contactHeading")}</p>
              <address className="mt-4 not-italic text-[0.95rem] leading-relaxed">
                {SITE.address.singleLine}
              </address>
              <div className="mt-3 space-y-1 text-[0.95rem]">
                <a className={`block ${link}`} href={`tel:${SITE.phoneTel}`}>
                  {SITE.phoneDisplay}
                </a>
                <a className={`block ${link}`} href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </div>
            </div>

            <div>
              <p className="eyebrow">{t("legalHeading")}</p>
              <ul className="mt-4 space-y-2 text-[0.95rem]">
                <li>
                  <Link href="/privacy" className={link}>
                    {t("privacyPolicy")}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className={link}>
                    {t("cookiePolicy")}
                  </Link>
                </li>
                <li>
                  {/* Withdrawal has to be as easy as consent was, so the way
                      back into the dialog sits on every page, not just the
                      policy. */}
                  <CookieSettingsButton />
                </li>
                <li>
                  <a
                    href={SITE.livePrivacyUrl}
                    className={`text-brand-black-80 ${link}`}
                    rel="noopener noreferrer"
                  >
                    {t("officialPrivacyLive")}
                  </a>
                </li>
              </ul>
              <p className="mt-5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-black-80">
                KBO {SITE.kbo} · {SITE.court}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-brand-black/15 pt-8 text-[0.82rem] text-brand-black-80 md:flex-row md:items-center">
            <p>
              © {new Date().getFullYear()}{" "}
              <span className="font-bold text-brand-black">{SITE.copyrightEntity}</span>
            </p>
            <p className="uppercase tracking-[0.16em]">
              {t("builtFor")}{" "}
              <a
                href="https://vertogroup.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-black underline underline-offset-4 hover:bg-brand-blue"
              >
                Vertogroup.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
