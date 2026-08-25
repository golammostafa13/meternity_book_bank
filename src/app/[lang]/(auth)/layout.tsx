import { notFound } from "next/navigation";
import { DoorFlow } from "@/components/auth/door-flow";
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
 *
 * The lit field lives here rather than on `/signin` alone, for the reason
 * `AuthAside` and `AuthCard` are shared: the password and the register are one
 * object seen twice, and a door that is a cinema on one page and blush paper on
 * the next reads as two sites. `DoorFlow` is absolutely positioned inside its
 * own clipped box (see the stylesheet) rather than clipping this element, so a
 * long register form on a short window still scrolls.
 */
export default async function AuthLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <div className="door paper-grain relative flex min-h-dvh flex-col">
      <DoorFlow />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-6 sm:gap-4 sm:px-5 lg:px-8">
        <div className="min-w-0 shrink">
          <Brand />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitch lang={lang} label={dict.common.switchLanguage} />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center">
        {props.children}
      </main>
    </div>
  );
}
