/**
 * Site constants.
 *
 * Anything with a Bengali counterpart carries it here rather than in the
 * dictionaries: these are facts about the library, not interface strings, and
 * the sitemap and metadata builders need them without a locale in hand.
 */
export const site = {
  name: "Maternity Book Bank",
  /**
   * The short form, for places the full name will not fit: the imprint line on
   * a grid-size cover, mostly. Not an abbreviation to use in prose.
   */
  nameLead: "Exium MUPS",
  nameBn: "মাতৃত্ব বুক ব্যাংক",
  tagline: "Every page a safer birth",
  taglineBn: "প্রতিটি পৃষ্ঠা নিরাপদ জন্মের পথ",
  /**
   * This is the description a search engine sees, and the only page it can
   * reach is the sign-in form, so it describes what the password opens rather
   * than promising shelves a visitor cannot get to yet.
   */
  description:
    "Maternity Book Bank is a digital library on pregnancy, birth and newborn care for mothers, midwives and health workers in Bangladesh. Enter the password printed in your copy, then read or download every title, free, in your browser, in Bengali or English.",
  descriptionBn:
    "মাতৃত্ব বুক ব্যাংক গর্ভাবস্থা, প্রসব ও নবজাতক পরিচর্যা বিষয়ে একটি ডিজিটাল গ্রন্থাগার, বাংলাদেশের মা, ধাত্রী ও স্বাস্থ্যকর্মীদের জন্য। আপনার কপিতে ছাপা পাসওয়ার্ড দিন, তারপর সব বই পড়ুন বা ডাউনলোড করুন: বিনামূল্যে, ব্রাউজারেই, বাংলা বা ইংরেজিতে।",
  url: "https://maternitybookbank.example.org",
  email: "info@radiantpharmabd.com",
  /**
   * The sponsor. Named here rather than in the dictionaries for the same
   * reason as the library's own name: it is a fact, not a translatable
   * string, and the courtesy credit needs it without a locale in hand.
   */
  sponsor: {
    product: "Exium MUPS 20",
    productBn: "এক্সিয়াম মিউপস ২০",
    generic: "Esomeprazole 20 mg",
    genericBn: "ইসোমিপ্রাজল ২০ মি.গ্রা.",
    company: "Radiant Pharmaceuticals Ltd.",
    companyBn: "রেডিয়েন্ট ফার্মাসিউটিক্যালস লিমিটেড",
    /** The company mark, shown under the "Courtesy by" label. */
    logo: "/courtesy-by.png",
    /** The pack shot, alpha-cut. Also the texture source for the 3D pack. */
    pack: "/exium-mups-20.png",
  },
  /**
   * Navigation is defined by route and dictionary key; the labels themselves
   * live in the dictionaries so a new language does not have to edit this file.
   */
  nav: [
    { href: "/books", key: "discover" },
    { href: "/categories", key: "categories" },
    { href: "/subjects", key: "subjects" },
    { href: "/authors", key: "authors" },
    { href: "/about", key: "about" },
    { href: "/contact", key: "contact" },
  ],
  social: {
    facebook: "https://facebook.com",
    x: "https://x.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
  },
} as const;

export type NavKey = (typeof site.nav)[number]["key"];
