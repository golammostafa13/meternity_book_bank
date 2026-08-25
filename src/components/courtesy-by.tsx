import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The sponsor's mark, under the words "Courtesy by".
 *
 * Separate from `ExiumAd` because it answers a different question. The advert
 * says *here is a product*; this says *here is who paid for the book in your
 * hands*, which belongs in the quiet furniture of the site (the footer, the
 * foot of the sign-in card, the About page), and should never animate, never
 * ask for a drag, and never compete with a heading.
 *
 * The mark is a self-hosted PNG. It has to be: `next.config.ts` ships a CSP
 * with `img-src 'self' data: blob:`, so a hotlink to the company's own site
 * would simply not render.
 */
export function CourtesyBy({
  label,
  company,
  align = "start",
  className,
  bnClass,
}: {
  /** "Courtesy by" / "সৌজন্যে". */
  label: string;
  company: string;
  align?: "start" | "center";
  className?: string;
  bnClass?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <p
        className={cn(
          "text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-ink-faint",
          bnClass,
        )}
      >
        {label}
      </p>
      <Image
        src="/courtesy-by.png"
        // The company name is the alt text, not "logo": someone hearing this
        // page read out needs to know who sponsored it, not that a picture of
        // a logo is present.
        alt={company}
        width={403}
        height={157}
        className="h-9 w-auto opacity-90 dark:opacity-100 dark:brightness-0 dark:invert"
      />
    </div>
  );
}
