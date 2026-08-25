import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthAside, AuthCard, AuthLayoutGrid } from "@/components/auth/auth-aside";
import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import { textClass } from "@/lib/i18n/content";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/[lang]/signup">,
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return {
    title: getDictionary(lang).auth.metaSignUp,
    robots: { index: false, follow: false },
  };
}

/**
 * The register.
 *
 * Note what this page does *not* do: it does not redirect a reader who is
 * already in. Registering is not signing in: someone can perfectly well be
 * reading the library and then decide to be counted, and bouncing them to the
 * catalogue for asking would make the link in the footer a dead end.
 *
 * `force-dynamic` because the form is a Server Action with per-request state.
 */
export const dynamic = "force-dynamic";

export default async function RegisterPage(props: PageProps<"/[lang]/signup">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const bn = textClass(lang);

  return (
    <AuthLayoutGrid>
      <AuthAside lang={lang} lead={dict.auth.sideLeadSignUp} />

      <AuthCard
        lang={lang}
        title={dict.auth.signUpTitle}
        lead={dict.auth.signUpLead}
        footer={
          <Link
            href={localePath(lang, "/signin")}
            className={cn(
              "mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-ink-mute transition-colors hover:text-ink",
              bn,
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {dict.auth.backToDoor}
          </Link>
        }
      >
        <RegisterForm lang={lang} />
      </AuthCard>
    </AuthLayoutGrid>
  );
}
