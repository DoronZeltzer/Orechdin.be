import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import en from "../messages/en.json";

type Messages = { [key: string]: unknown };

/** Deep merge: values in `over` replace those in `base`, everything else is kept. */
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(over)) {
    const current = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object" && !Array.isArray(current)
        ? merge(current as Messages, value as Messages)
        : value;
  }
  return out;
}

/**
 * English is always loaded and is the master. A Dutch or Hebrew catalogue only
 * has to contain the strings that have been translated and approved: anything
 * it lacks falls back to the English text, so a language can never show a
 * missing-message error or an out-of-date translation of changed copy.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  let overlay: Messages = {};
  if (locale !== "en") {
    try {
      overlay = (await import(`../messages/${locale}.json`)).default as Messages;
    } catch {
      overlay = {};
    }
  }

  return { locale: locale as string, messages: merge(en as Messages, overlay) as typeof en };
});
