import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Atom,
  Baby,
  BookOpen,
  ExternalLink,
  Feather,
  Landmark,
  Library,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryForm } from "@/components/admin/category-form";
import { Shelf3D } from "@/components/shelf-3d";
import { getCategoryShelves } from "@/lib/data/books";
import { getDictionary, hasLocale, localePath } from "@/lib/i18n";
import {
  categoryDescription,
  categoryName,
  textClass,
} from "@/lib/i18n/content";
import { cn } from "@/lib/utils";
import { fill, titlesCount } from "@/lib/i18n/format";

export async function generateMetadata(
  props: PageProps<"/[lang]/admin/categories">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).admin.categories };
}

const icons: Record<string, typeof BookOpen> = {
  BookOpen,
  Feather,
  Landmark,
  Atom,
  Baby,
  Library,
};

export default async function AdminCategoriesPage(
  props: PageProps<"/[lang]/admin/categories">,
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const href = (path: string) => localePath(lang, path);
  const bn = textClass(lang);

  const [categories] = await Promise.all([
    getCategoryShelves(14),
  ]);

  return (
    <AdminShell
      title={dict.admin.categories}
      breadcrumb={fill(lang, dict.admin.breadcrumbShelves, {
        n: categories.length,
      })}
      lang={lang}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          {categories.map((cat) => {
            const Icon = icons[cat.icon] ?? BookOpen;
            return (
              <section
                key={cat.id}
                className="rounded-2xl border border-line bg-surface p-6 shadow-e1"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className={cn("font-semibold text-ink", bn)}>
                      {categoryName(cat, lang)}
                    </h2>
                    <p
                      className={cn(
                        "mt-1 text-sm leading-relaxed text-ink-mute",
                        bn,
                      )}
                    >
                      {categoryDescription(cat, lang)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={href(`/admin/books?category=${cat.id}`)}
                      className={cn(
                        "text-sm font-medium text-ink hover:text-accent",
                        bn,
                      )}
                    >
                      {titlesCount(dict, lang, cat.bookCount)}
                    </Link>
                    <Link
                      href={href(`/categories/${cat.slug}`)}
                      target="_blank"
                      aria-label={fill(lang, dict.admin.openPublicPage, {
                        name: categoryName(cat, lang),
                      })}
                      className="inline-flex text-ink-faint hover:text-accent"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {cat.shelf.length > 0 && (
                  <div className="mt-6 rounded-xl bg-bg-deep px-5 pb-4 pt-7">
                    <Shelf3D books={cat.shelf} lang={lang} height={72} />
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <CategoryForm lang={lang} />
      </div>
    </AdminShell>
  );
}
