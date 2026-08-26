import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AuthAside, AuthCard, AuthLayoutGrid } from "@/components/auth/auth-aside";
import { DoorForm } from "@/components/auth/door-form";
import { IntroCurtain } from "@/components/intro-curtain";
import { isEmailShaped, normaliseEmail } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/current";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { textClass } from "@/lib/i18n/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/[lang]/signin">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return {
    title: getDictionary(lang).auth.metaSignIn,
    // Indexed, unlike everything behind it: this is the only page a crawler can
    // reach, and it is the page that explains what the site is.
    robots: { index: true, follow: false },
  };
}

/** Session state is per-request; nothing here may be prerendered. */
export const dynamic = "force-dynamic";

export default async function SignInPage(props: PageProps<"/[lang]/signin">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  const registered = sp.registered === "1";

  /**
   * The address `registerAction` carried over, so a reader who has just been
   * counted types the password and nothing else.
   *
   * Shape-checked rather than trusted. It arrives in a query string, so it can
   * be anything at all, and while the worst a bad one can do is sit in a text
   * input, a door that opens with rubbish already in the field is a door that
   * looks broken. Anything that is not an address is dropped and the reader
   * gets an empty field, which is what they would have had anyway.
   */
  const prefill =
    typeof sp.email === "string" && isEmailShaped(normaliseEmail(sp.email))
      ? normaliseEmail(sp.email)
      : "";

  // Already in: the door has nothing to show them. Same destination as the
  // form's own, so arriving here with a live session and signing in properly
  // cannot land in two different places.
  const session = await getSession();
  if (session) {
    redirect(next.startsWith("/") ? next : localePath(lang, "/"));
  }

  const bn = textClass(lang);

  return (
    <>
      <IntroCurtain
        name={lang === "bn" ? site.nameBn : site.name}
        tagline={lang === "bn" ? site.taglineBn : site.tagline}
        bnClass={lang === "bn" ? "bn" : undefined}
      />

      <AuthLayoutGrid>
        <AuthAside lang={lang} lead={dict.auth.sideLead} />

        <AuthCard
          lang={lang}
          title={dict.auth.title}
          footer={
            <Link
              href={localePath(lang, "/signup")}
              className={cn(
                "mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-ink-mute transition-colors hover:text-ink",
                bn,
              )}
            >
              {dict.auth.registerLink}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          }
        >
          {registered && (
            <p
              role="status"
              className={cn(
                "mb-5 rounded-xl border border-ok/30 bg-ok-soft px-4 py-3 text-sm text-ok",
                bn,
              )}
            >
              {dict.auth.registered}
            </p>
          )}

          <DoorForm lang={lang} next={next} email={prefill} />
        </AuthCard>
      </AuthLayoutGrid>
    </>
  );
}
