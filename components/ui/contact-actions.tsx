import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Which = "call" | "whatsapp" | "email" | "enquiry";

/**
 * Call us | WhatsApp | Email us | Send enquiry
 *
 * The same four actions, in the same order and wording, wherever they appear.
 * Large tap targets: each button is at least 48px tall and, on a phone, full
 * width, so none of them is a small link in a line of text.
 *
 * WhatsApp appears only once a number has been confirmed (SITE.whatsapp). Until
 * then it is simply not shown, rather than linking somewhere that is wrong.
 *
 * "Send enquiry" goes to the enquiry form on the contact page.
 */
export function ContactActions({
  include = ["call", "email", "enquiry"],
  className,
}: {
  include?: Which[];
  className?: string;
}) {
  const t = useTranslations("Actions");

  const items: Record<Which, React.ReactNode> = {
    call: (
      <Button key="call" href={`tel:${SITE.phoneTel}`} className="w-full sm:w-auto">
        <Phone className="h-4 w-4 shrink-0" aria-hidden />
        {t("call")}
      </Button>
    ),
    whatsapp: SITE.whatsapp ? (
      <Button
        key="whatsapp"
        href={`https://wa.me/${SITE.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        className="w-full sm:w-auto"
      >
        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
        {t("whatsapp")}
      </Button>
    ) : null,
    email: (
      <Button key="email" href={`mailto:${SITE.email}`} variant="outline" className="w-full sm:w-auto">
        <Mail className="h-4 w-4 shrink-0" aria-hidden />
        {t("email")}
      </Button>
    ),
    enquiry: (
      <Button key="enquiry" href="/contact#enquiry" variant="outline" className="w-full sm:w-auto">
        <Send className="h-4 w-4 shrink-0" aria-hidden />
        {t("enquiry")}
      </Button>
    ),
  };

  return <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4", className)}>{include.map((k) => items[k])}</div>;
}
