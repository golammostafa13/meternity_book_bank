import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { getDictionary, hasLocale } from "@/lib/i18n";

/**
 * Door chrome: deliberately not the public header and footer. There is one
 * thing to do on these pages, plus the language switch, because a reader
 * should be able to get an account in their own language.
 *
 * There is no way past this page any more. The brand used to link to the
 * catalogue and a second link offered to skip the form entirely; both are gone
 * now that the shelves need an account, because a link that lands on a
 * redirect straight back here is worse than no link at all.
 */
export default async function AuthLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="paper-grain relative flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-6 sm:gap-4 sm:px-5 lg:px-8">
        <div className="min-w-0 shrink">
          <Brand />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitch lang={lang} label={dict.common.switchLanguage} />
        </div>
      </header>

      <main className="flex flex-1 items-center">{props.children}</main>
    </div>
  );
}
