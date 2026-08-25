import type { Author, Book, BookStatus, Category } from "@/types";

/**
 * Catalogue fixtures for the Maternity Book Bank.
 *
 * Sixteen real files, on pregnancy, birth and the first weeks. A compact seed
 * list is expanded into full `Book` records by `buildBook` below, so the
 * verified metadata stays readable and the derived fields (codes, shelves,
 * counts) stay internally consistent.
 *
 * Everything here is deterministic (no `Math.random`), so server and client
 * renders always agree and there are no hydration mismatches.
 *
 * **Every fact below was read off the file itself**, with `pdfinfo` for the page
 * count and `pdftotext` on the title and copyright pages for everything else.
 * Not from the file names, which are wrong or useless on most of them: the
 * supplied `BBC-7th-edition-FINAL-Nov2019.pdf` is *Baby's Best Chance*, and
 * `vut-mn-21-01-operationalguidance-…` is Vanuatu's obstetric guidelines.
 *
 * Two fields exist here that a catalogue does not usually carry. `sourceUrl` and
 * `license` are the terms these files are redistributed under: WHO publishes
 * under CC BY-NC-SA 3.0 IGO, which permits exactly this and requires the credit.
 * They are per-book data rather than a line in the footer because the licences
 * are not all the same.
 */

export const categories: Category[] = [
  {
    id: "cat-pregnancy",
    slug: "pregnancy-antenatal",
    name: "Pregnancy & Antenatal Care",
    nameBn: "গর্ভাবস্থা ও প্রসবপূর্ব সেবা",
    description:
      "The months before the birth: what to expect, what to eat, which visits matter and what the tests are for.",
    descriptionBn:
      "জন্মের আগের মাসগুলো: কী আশা করবেন, কী খাবেন, কোন পরীক্ষা কেন দরকার এবং কোন সাক্ষাৎ জরুরি।",
    icon: "HeartPulse",
    bookCount: 0,
  },
  {
    id: "cat-labour",
    slug: "labour-birth",
    name: "Labour & Birth",
    nameBn: "প্রসব ও জন্ম",
    description:
      "Labour itself: the stages, the choices, pain relief, and what a skilled attendant is watching for hour by hour.",
    descriptionBn:
      "প্রসবকাল: ধাপগুলো, সিদ্ধান্ত, ব্যথা উপশম, এবং দক্ষ সেবাদাতা ঘণ্টায় ঘণ্টায় কী লক্ষ্য রাখেন।",
    icon: "Activity",
    bookCount: 0,
  },
  {
    id: "cat-newborn",
    slug: "newborn-care",
    name: "Newborn & Neonatal Care",
    nameBn: "নবজাতক পরিচর্যা",
    description:
      "The first hours, the first days, the first weeks: warmth, breathing, cord care, and knowing when something is wrong.",
    descriptionBn:
      "প্রথম কয়েক ঘণ্টা, প্রথম কয়েক দিন: উষ্ণতা, শ্বাস, নাড়ির পরিচর্যা, এবং কখন কিছু ভুল হচ্ছে তা বোঝা।",
    icon: "Baby",
    bookCount: 0,
  },
  {
    id: "cat-feeding",
    slug: "feeding-nutrition",
    name: "Breastfeeding & Nutrition",
    nameBn: "স্তন্যদান ও পুষ্টি",
    description:
      "Feeding the baby and feeding the mother: attachment, supply, iron and folic acid, and the counselling that makes the difference.",
    descriptionBn:
      "শিশুর ও মায়ের পুষ্টি: সঠিকভাবে স্তনে লাগানো, দুধের জোগান, আয়রন ও ফলিক অ্যাসিড, এবং পরামর্শের ভূমিকা।",
    icon: "Apple",
    bookCount: 0,
  },
  {
    id: "cat-complications",
    slug: "complications",
    name: "Complications & Emergencies",
    nameBn: "জটিলতা ও আকস্মিক অবস্থা",
    description:
      "When it goes wrong: haemorrhage, eclampsia, obstructed labour, preterm birth, and what to do in the hour that matters.",
    descriptionBn:
      "যখন জটিলতা দেখা দেয়: রক্তক্ষরণ, একলাম্পসিয়া, বাধাগ্রস্ত প্রসব, অকালজন্ম, এবং সেই গুরুত্বপূর্ণ সময়ে কী করতে হবে।",
    icon: "Siren",
    bookCount: 0,
  },
  {
    id: "cat-postnatal",
    slug: "postnatal-quality",
    name: "Postnatal Care & Standards",
    nameBn: "প্রসবোত্তর সেবা ও সেবার মান",
    description:
      "After the birth: the mother's recovery, the postnatal visits, and the standards a facility is meant to be meeting.",
    descriptionBn:
      "জন্মের পরে: মায়ের সুস্থতা, প্রসবোত্তর সাক্ষাৎ, এবং একটি স্বাস্থ্যকেন্দ্রের যে মান পূরণ করা উচিত।",
    icon: "ClipboardCheck",
    bookCount: 0,
  },
];

/**
 * Authors.
 *
 * Almost every one is an institution, which the `Author` type already handles:
 * no `era`, because an organisation has no birth or death dates. That is not an
 * accident of this collection: guidance on how to keep a woman alive through
 * childbirth is written by committees and published by ministries, and pretending
 * otherwise by crediting a lead editor would misrepresent what these documents
 * are.
 */
export const authors: Author[] = [
  {
    id: "a-who",
    slug: "world-health-organization",
    name: "World Health Organization",
    nameBn: "বিশ্ব স্বাস্থ্য সংস্থা",
    bio: "The United Nations agency for international public health, whose Department of Sexual and Reproductive Health and Research publishes the guidelines most maternity services in low- and middle-income countries are built on. Its recommendations are developed by external expert groups under the GRADE framework and published open-access.",
    bioBn:
      "আন্তর্জাতিক জনস্বাস্থ্যের জন্য জাতিসংঘের সংস্থা। এর প্রজনন স্বাস্থ্য ও গবেষণা বিভাগের নির্দেশিকাগুলোর ওপর ভিত্তি করেই নিম্ন ও মধ্যম আয়ের দেশগুলোর অধিকাংশ মাতৃসেবা গড়ে উঠেছে। সুপারিশগুলো বহিরাগত বিশেষজ্ঞ দল GRADE পদ্ধতিতে তৈরি করেন এবং তা মুক্তভাবে প্রকাশিত হয়।",
    bookCount: 0,
  },
  {
    id: "a-who-unicef",
    slug: "who-and-unicef",
    name: "WHO and UNICEF",
    nameBn: "বিশ্ব স্বাস্থ্য সংস্থা ও ইউনিসেফ",
    bio: "The two agencies publish jointly on newborn care and infant feeding, where WHO's clinical guidance and UNICEF's programme reach meet. The Baby-Friendly Hospital Initiative is their longest-running joint programme, begun in 1991.",
    bioBn:
      "নবজাতক পরিচর্যা ও শিশুখাদ্য বিষয়ে দুই সংস্থা যৌথভাবে প্রকাশনা করে, যেখানে বিশ্ব স্বাস্থ্য সংস্থার চিকিৎসা নির্দেশনা ও ইউনিসেফের কর্মসূচির বিস্তার একসঙ্গে আসে। ১৯৯১ সালে শুরু হওয়া শিশুবান্ধব হাসপাতাল উদ্যোগ তাদের দীর্ঘতম যৌথ কর্মসূচি।",
    bookCount: 0,
  },
  {
    id: "a-hse",
    slug: "health-service-executive",
    name: "Health Service Executive",
    nameBn: "হেলথ সার্ভিস এক্সিকিউটিভ",
    bio: "Ireland's public health service. Its maternity and child health books, My Pregnancy and the two My Child volumes, are given to every expectant parent in the country and written with its own midwives, dietitians, physiotherapists and psychologists.",
    bioBn:
      "আয়ারল্যান্ডের সরকারি স্বাস্থ্যসেবা। এর মাতৃত্ব ও শিশুস্বাস্থ্য বইগুলো দেশের প্রত্যেক ভাবী অভিভাবককে দেওয়া হয় এবং নিজেদের ধাত্রী, পুষ্টিবিদ, ফিজিওথেরাপিস্ট ও মনোবিদদের সঙ্গে মিলে লেখা।",
    bookCount: 0,
  },
  {
    id: "a-doh-uk",
    slug: "department-of-health",
    name: "Department of Health",
    nameBn: "স্বাস্থ্য বিভাগ, যুক্তরাজ্য",
    bio: "The United Kingdom's health ministry. The Pregnancy Book was its standard handbook for first-time parents in England for three decades, compiled with the Royal Colleges of Midwives, Obstetricians and Gynaecologists, Paediatrics and General Practitioners.",
    bioBn:
      "যুক্তরাজ্যের স্বাস্থ্য মন্ত্রণালয়। তিন দশক ধরে ইংল্যান্ডে প্রথমবার বাবা-মা হতে যাওয়া মানুষদের জন্য দ্য প্রেগনেন্সি বুক ছিল এর আদর্শ হ্যান্ডবুক, ধাত্রীবিদ্যা, প্রসূতিবিদ্যা ও শিশুরোগবিদ্যার রয়্যাল কলেজগুলোর সহযোগিতায় সংকলিত।",
    bookCount: 0,
  },
  {
    id: "a-bc-health",
    slug: "bc-ministry-of-health",
    name: "BC Ministry of Health",
    nameBn: "ব্রিটিশ কলাম্বিয়া স্বাস্থ্য মন্ত্রণালয়",
    bio: "The health ministry of British Columbia, Canada. Baby's Best Chance has been given to expectant parents in the province since 1979 and is now in its seventh edition, produced with Perinatal Services BC.",
    bioBn:
      "কানাডার ব্রিটিশ কলাম্বিয়া প্রদেশের স্বাস্থ্য মন্ত্রণালয়। ১৯৭৯ সাল থেকে প্রদেশের ভাবী অভিভাবকদের বেবি'জ বেস্ট চান্স দেওয়া হচ্ছে; বর্তমানে এটি সপ্তম সংস্করণে, পেরিনেটাল সার্ভিসেস বিসি-র সঙ্গে যৌথভাবে প্রকাশিত।",
    bookCount: 0,
  },
  {
    id: "a-moh-vanuatu",
    slug: "ministry-of-health-vanuatu",
    name: "Ministry of Health, Vanuatu",
    nameBn: "স্বাস্থ্য মন্ত্রণালয়, ভানুয়াতু",
    bio: "Vanuatu's health ministry, whose standard guidelines are written for the nurse practitioner or midwife who is the only skilled attendant on an island, which is what makes them unusually practical reading well outside the Pacific.",
    bioBn:
      "ভানুয়াতুর স্বাস্থ্য মন্ত্রণালয়। এর আদর্শ নির্দেশিকাগুলো এমন নার্স বা ধাত্রীর জন্য লেখা, যিনি কোনো দ্বীপের একমাত্র দক্ষ সেবাদাতা, আর সেই কারণেই প্রশান্ত মহাসাগরীয় অঞ্চলের বাইরেও এগুলো অসাধারণ কার্যকর।",
    bookCount: 0,
  },
];

/**
 * A book that has a real file behind it.
 *
 * `isbn` is optional: several of these are ministry publications with no ISBN
 * at all, and a fabricated one on a downloadable file is worse than none.
 */
interface SeedFile {
  /**
   * The file's name in private storage: `private/books/<slug>.pdf`. Never a URL
   * a browser could ask for: the file is reached only through
   * `/api/file/[slug]`, which checks for a session first.
   */
  url: string;
  sizeMb: number;
  isbn?: string;
  /** ISO date. Real uploads sort by when they actually landed. */
  addedAt: string;
  uploadedBy?: string;
}

/** Seed record: keeps the fixture list scannable. */
interface Seed {
  title: string;
  titleBn?: string;
  subtitle?: string;
  /**
   * Declared rather than derived from the title.
   *
   * The ancestor of this file slugged the title, which works for *Nelson
   * Textbook of Pediatrics* and produces
   * `who-recommendations-on-antenatal-care-for-a-positive-pregnancy-experience`
   * here. The slug is also the join to `private/books/<slug>.pdf` and
   * `public/covers/<slug>.webp`, so it wants to be short, stable, and immune to
   * someone tidying up a title.
   */
  slug: string;
  authorId: string;
  categoryId: string;
  year: number;
  publisher: string;
  pages: number;
  description: string;
  descriptionBn?: string;
  featured?: boolean;
  status?: BookStatus;
  /** Cover hue in degrees; drives the 3D spine and fallback generated art. */
  hue: number;
  /** Edition label as printed on the copyright page. */
  edition?: string;
  /**
   * Served path to the real cover WebP built by `scripts/build-covers.mjs`:
   * page one of the file itself. Present for all sixteen, so the generated
   * art in `lib/cover-theme` never actually shows on this catalogue; it is
   * there for whatever the admin catalogues next.
   */
  coverImage?: string;
  /** Where the file came from, and the licence that permits redistributing it. */
  sourceUrl?: string;
  license?: string;
  /**
   * Language is always explicit; `buildBook` never infers it from `titleBn`.
   * These are English-language books that carry Bengali display titles, so the
   * `?language=bn` filter legitimately returns nothing.
   */
  language: "bn" | "en";
  file: SeedFile;
}

/** WHO's licence, on every one of its publications here. Written once. */
const WHO_LICENSE = "CC BY-NC-SA 3.0 IGO";

const seeds: Seed[] = [
  // ── 01 The Pregnancy Book ────────────────────────────────────────────────
  {
    title: "The Pregnancy Book",
    titleBn: "দ্য প্রেগনেন্সি বুক",
    subtitle:
      "Your complete guide to a healthy pregnancy, labour and childbirth, and the first weeks with your new baby",
    slug: "the-pregnancy-book",
    authorId: "a-doh-uk",
    categoryId: "cat-pregnancy",
    year: 2009,
    publisher: "Department of Health",
    pages: 196,
    coverImage: "/covers/the-pregnancy-book.webp",
    language: "en",
    description:
      "For three decades this was the book handed to every first-time mother in England, and it is still the clearest general introduction in the collection. Week by week through the pregnancy, then labour, then the first weeks at home, written plainly, with the Royal Colleges of Midwives, Obstetricians and Gynaecologists, Paediatrics and General Practitioners.",
    descriptionBn:
      "তিন দশক ধরে ইংল্যান্ডে প্রথমবার মা হতে যাওয়া প্রত্যেককে এই বইটি দেওয়া হত, আর এই সংগ্রহে সাধারণ পরিচিতির জন্য এটিই সবচেয়ে সহজবোধ্য। সপ্তাহে সপ্তাহে গর্ভাবস্থা, তারপর প্রসব, তারপর বাড়িতে প্রথম কয়েক সপ্তাহ, সহজ ভাষায় লেখা।",
    featured: true,
    hue: 20,
    license: "Crown copyright, reproduction permitted",
    file: {
      url: "/books/the-pregnancy-book.pdf",
      sizeMb: 7.3,
      addedAt: "2026-08-24",
    },
  },

  // ── 02 My Pregnancy (HSE) ───────────────────────────────────────────────
  {
    title: "My Pregnancy",
    titleBn: "মাই প্রেগনেন্সি",
    subtitle: "Expert advice for every step",
    slug: "my-pregnancy-hse",
    authorId: "a-hse",
    categoryId: "cat-pregnancy",
    year: 2026,
    publisher: "Health Service Executive",
    pages: 228,
    edition: "Third edition (version 3.0)",
    coverImage: "/covers/my-pregnancy-hse.webp",
    language: "en",
    description:
      "The most current book here, and the most practical: Ireland's public health service gives this to every expectant parent in the country. Written by its own midwives, dietitians, physiotherapists and psychologists, and it covers the things clinical guidelines leave out: money, work, mood, and who to ring.",
    descriptionBn:
      "এই সংগ্রহে সবচেয়ে নতুন এবং সবচেয়ে ব্যবহারিক বই। আয়ারল্যান্ডের সরকারি স্বাস্থ্যসেবা দেশের প্রত্যেক ভাবী অভিভাবককে এটি দেয়। নিজেদের ধাত্রী, পুষ্টিবিদ ও মনোবিদদের লেখা, আর এতে সেই বিষয়গুলোও আছে যা চিকিৎসা নির্দেশিকা বাদ দিয়ে যায়: খরচ, কাজ, মন, আর কাকে ফোন করবেন।",
    featured: true,
    hue: 65,
    sourceUrl: "https://www2.hse.ie/pregnancy-birth/",
    license: "© Health Service Executive, free to reproduce",
    file: {
      url: "/books/my-pregnancy-hse.pdf",
      sizeMb: 6.5,
      addedAt: "2026-08-24",
    },
  },

  // ── 03 Baby's Best Chance ───────────────────────────────────────────────
  {
    title: "Baby's Best Chance",
    titleBn: "বেবি'জ বেস্ট চান্স",
    subtitle: "Parents' handbook of pregnancy and baby care",
    slug: "babys-best-chance",
    authorId: "a-bc-health",
    categoryId: "cat-pregnancy",
    year: 2019,
    publisher: "BC Ministry of Health with Perinatal Services BC",
    pages: 140,
    edition: "7th",
    coverImage: "/covers/babys-best-chance.webp",
    language: "en",
    description:
      "Given to expectant parents in British Columbia since 1979, and the friendliest thing in this library. It carries the pregnancy and the first months of the baby's life in one volume, which is how most parents actually experience them, and it is unusually good on the emotional part.",
    descriptionBn:
      "১৯৭৯ সাল থেকে ব্রিটিশ কলাম্বিয়ার ভাবী অভিভাবকদের দেওয়া হচ্ছে, আর এই গ্রন্থাগারে এটিই সবচেয়ে আন্তরিক বই। এক খণ্ডেই গর্ভাবস্থা ও শিশুর প্রথম কয়েক মাস, বেশিরভাগ অভিভাবক যেভাবে সময়টা কাটান, ঠিক সেভাবেই।",
    hue: 340,
    sourceUrl: "https://www.healthlinkbc.ca/pregnancy-parenting/babys-best-chance",
    license: "© Province of British Columbia, reproduction permitted",
    file: {
      url: "/books/babys-best-chance.pdf",
      sizeMb: 14.9,
      isbn: "978-0-7726-5371-0",
      addedAt: "2026-08-24",
    },
  },

  // ── 04 WHO antenatal care recommendations ───────────────────────────────
  {
    title: "WHO Recommendations on Antenatal Care",
    titleBn: "প্রসবপূর্ব সেবা বিষয়ে বিশ্ব স্বাস্থ্য সংস্থার সুপারিশ",
    subtitle: "For a positive pregnancy experience",
    slug: "who-antenatal-care-recommendations",
    authorId: "a-who",
    categoryId: "cat-pregnancy",
    year: 2016,
    publisher: "World Health Organization",
    pages: 172,
    coverImage: "/covers/who-antenatal-care-recommendations.webp",
    language: "en",
    description:
      "The guideline that replaced four antenatal visits with eight contacts, and the evidence for why. Forty-nine recommendations across nutrition, maternal and fetal assessment, preventive measures and health-system interventions, each graded, each with the trial data behind it stated.",
    descriptionBn:
      "এই নির্দেশিকাই চারটি প্রসবপূর্ব সাক্ষাতের বদলে আটটি সংযোগের সুপারিশ করে, আর তার পক্ষে প্রমাণ হাজির করে। পুষ্টি, মা ও ভ্রূণের মূল্যায়ন, প্রতিরোধমূলক ব্যবস্থা ও স্বাস্থ্যব্যবস্থার হস্তক্ষেপ নিয়ে ঊনপঞ্চাশটি সুপারিশ।",
    featured: true,
    hue: 185,
    sourceUrl: "https://iris.who.int/handle/10665/250796",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-antenatal-care-recommendations.pdf",
      sizeMb: 3.7,
      isbn: "978-92-4-154991-2",
      addedAt: "2026-08-24",
    },
  },

  // ── 05 WHO intrapartum care recommendations ─────────────────────────────
  {
    title: "WHO Recommendations: Intrapartum Care",
    titleBn: "প্রসবকালীন সেবা বিষয়ে বিশ্ব স্বাস্থ্য সংস্থার সুপারিশ",
    subtitle: "For a positive childbirth experience",
    slug: "who-intrapartum-care-recommendations",
    authorId: "a-who",
    categoryId: "cat-labour",
    year: 2018,
    publisher: "World Health Organization",
    pages: 210,
    coverImage: "/covers/who-intrapartum-care-recommendations.webp",
    language: "en",
    description:
      "Fifty-six recommendations on labour and birth, and the guideline that finally said in plain terms that a labour is not late because it is slower than one centimetre an hour. Respectful care, a companion of choice, and freedom of movement are in here as recommendations rather than as courtesies.",
    descriptionBn:
      "প্রসব ও জন্ম নিয়ে ছাপ্পান্নটি সুপারিশ। এই নির্দেশিকাই স্পষ্ট ভাষায় বলেছে, ঘণ্টায় এক সেন্টিমিটারের চেয়ে ধীর হলেই প্রসব বিলম্বিত নয়। সম্মানজনক সেবা, পছন্দের সঙ্গী ও চলাফেরার স্বাধীনতা এখানে সৌজন্য নয়, সুপারিশ।",
    featured: true,
    hue: 195,
    sourceUrl: "https://iris.who.int/handle/10665/260178",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-intrapartum-care-recommendations.pdf",
      sizeMb: 3.0,
      isbn: "978-92-4-155021-5",
      addedAt: "2026-08-24",
    },
  },

  // ── 06 WHO Labour Care Guide ────────────────────────────────────────────
  {
    title: "WHO Labour Care Guide",
    titleBn: "বিশ্ব স্বাস্থ্য সংস্থার প্রসবকালীন সেবা নির্দেশিকা",
    subtitle: "User's manual",
    slug: "who-labour-care-guide",
    authorId: "a-who",
    categoryId: "cat-labour",
    year: 2020,
    publisher: "World Health Organization",
    pages: 42,
    coverImage: "/covers/who-labour-care-guide.webp",
    language: "en",
    description:
      "The partograph's replacement, and the manual for filling it in. One sheet that tracks the woman and the baby together against reference thresholds, with a column for what was done about each, designed so that the act of recording is also the act of noticing.",
    descriptionBn:
      "পার্টোগ্রামের উত্তরসূরি, আর তা পূরণ করার নির্দেশিকা। একটি পাতায় মা ও শিশুকে একসঙ্গে নির্দেশক সীমার বিপরীতে অনুসরণ করা হয়, প্রতিটির বিপরীতে কী করা হল তার ঘরও থাকে, যাতে লিখে রাখার কাজটিই লক্ষ্য করার কাজ হয়।",
    hue: 200,
    sourceUrl: "https://iris.who.int/handle/10665/337693",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-labour-care-guide.pdf",
      sizeMb: 0.8,
      isbn: "978-92-4-001756-6",
      addedAt: "2026-08-24",
    },
  },

  // ── 07 Standard guidelines, Vanuatu ─────────────────────────────────────
  {
    title: "Standard Guidelines for Obstetrics, Gynaecology and Newborn Care",
    titleBn: "প্রসূতি, স্ত্রীরোগ ও নবজাতক সেবার আদর্শ নির্দেশিকা",
    subtitle: "A health worker's guide",
    slug: "obstetrics-gynaecology-newborn-care-guide",
    authorId: "a-moh-vanuatu",
    categoryId: "cat-labour",
    year: 2017,
    publisher: "Ministry of Health, Vanuatu",
    pages: 148,
    edition: "2nd",
    coverImage: "/covers/obstetrics-gynaecology-newborn-care-guide.webp",
    language: "en",
    description:
      "Written for the nurse or midwife who is the only skilled attendant for a long way in any direction, which is why it is the most usable protocol book in the collection. Each condition gets a page: what you will see, what to do first, what to do if that does not work, and when to refer.",
    descriptionBn:
      "এমন নার্স বা ধাত্রীর জন্য লেখা, যিনি বহুদূর পর্যন্ত একমাত্র দক্ষ সেবাদাতা, সেই কারণেই এই সংগ্রহে এটিই সবচেয়ে ব্যবহারযোগ্য প্রোটোকল বই। প্রতিটি অবস্থার জন্য এক পাতা: কী দেখবেন, প্রথমে কী করবেন, না হলে কী করবেন, আর কখন রেফার করবেন।",
    hue: 150,
    license: "© Ministry of Health, Vanuatu, reproduction permitted",
    file: {
      url: "/books/obstetrics-gynaecology-newborn-care-guide.pdf",
      sizeMb: 3.9,
      addedAt: "2026-08-24",
    },
  },

  // ── 08 WHO managing complications (MCPC) ────────────────────────────────
  {
    title: "Managing Complications in Pregnancy and Childbirth",
    titleBn: "গর্ভাবস্থা ও প্রসবের জটিলতা ব্যবস্থাপনা",
    subtitle: "A guide for midwives and doctors",
    slug: "who-managing-complications-pregnancy-childbirth",
    authorId: "a-who-unicef",
    categoryId: "cat-complications",
    year: 2017,
    publisher: "World Health Organization",
    pages: 492,
    edition: "2nd",
    coverImage: "/covers/who-managing-complications-pregnancy-childbirth.webp",
    language: "en",
    description:
      "The emergency book. Organised by what the woman presents with rather than by diagnosis (bleeding in early pregnancy, convulsions, fever after childbirth), because in an emergency the symptom is what you have and the diagnosis is what you are trying to reach. Nearly five hundred pages, and the procedures are illustrated step by step.",
    descriptionBn:
      "আকস্মিক অবস্থার বই। রোগনির্ণয় ধরে নয়, রোগী যা নিয়ে আসেন তা ধরে সাজানো (গর্ভাবস্থার শুরুতে রক্তক্ষরণ, খিঁচুনি, প্রসবের পরে জ্বর), কারণ সংকটের মুহূর্তে উপসর্গটিই হাতে থাকে, রোগনির্ণয় তখন লক্ষ্য। প্রায় পাঁচশো পাতা, প্রতিটি পদ্ধতি ধাপে ধাপে চিত্রিত।",
    featured: true,
    hue: 30,
    sourceUrl: "https://iris.who.int/handle/10665/255760",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-managing-complications-pregnancy-childbirth.pdf",
      sizeMb: 4.9,
      isbn: "978-92-4-156549-3",
      addedAt: "2026-08-24",
    },
  },

  // ── 09 WHO preterm birth ────────────────────────────────────────────────
  {
    title: "WHO Recommendations on Preterm Birth Outcomes",
    titleBn: "অকালজন্মের ফলাফল উন্নয়নে বিশ্ব স্বাস্থ্য সংস্থার সুপারিশ",
    subtitle: "Interventions to improve preterm birth outcomes",
    slug: "who-recommendations-preterm-birth",
    authorId: "a-who",
    categoryId: "cat-complications",
    year: 2015,
    publisher: "World Health Organization",
    pages: 108,
    coverImage: "/covers/who-recommendations-preterm-birth.webp",
    language: "en",
    description:
      "Antenatal corticosteroids, tocolytics, magnesium sulfate, antibiotics for preterm rupture of membranes, and kangaroo mother care: what to give, when, and at what gestation the evidence supports it. Preterm birth is the leading cause of death in children under five, and this is the short answer to what helps.",
    descriptionBn:
      "প্রসবপূর্ব কর্টিকোস্টেরয়েড, টোকোলাইটিক, ম্যাগনেসিয়াম সালফেট, ঝিল্লি ফেটে গেলে অ্যান্টিবায়োটিক, এবং ক্যাঙারু মাদার কেয়ার: কী দিতে হবে, কখন, আর কোন গর্ভকালে তার প্রমাণ আছে। পাঁচ বছরের কম বয়সী শিশুমৃত্যুর প্রধান কারণ অকালজন্ম, আর কী কাজে দেয় তার সংক্ষিপ্ত উত্তর এটি।",
    hue: 45,
    sourceUrl: "https://iris.who.int/handle/10665/183037",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-recommendations-preterm-birth.pdf",
      sizeMb: 1.6,
      isbn: "978-92-4-150898-8",
      addedAt: "2026-08-24",
    },
  },

  // ── 10 WHO PCPNC ────────────────────────────────────────────────────────
  {
    title: "Pregnancy, Childbirth, Postpartum and Newborn Care",
    titleBn: "গর্ভাবস্থা, প্রসব, প্রসবোত্তর ও নবজাতক পরিচর্যা",
    subtitle: "A guide for essential practice",
    slug: "who-pregnancy-childbirth-postpartum-newborn-care",
    authorId: "a-who-unicef",
    categoryId: "cat-newborn",
    year: 2015,
    publisher: "World Health Organization",
    pages: 184,
    edition: "3rd",
    coverImage: "/covers/who-pregnancy-childbirth-postpartum-newborn-care.webp",
    language: "en",
    description:
      "The whole continuum in one flip-chart, from the first antenatal visit to the six-week check. Every page is a decision table (ask, look, listen, classify, treat), designed to be used at the bedside with the woman in front of you rather than read through beforehand.",
    descriptionBn:
      "প্রথম প্রসবপূর্ব সাক্ষাৎ থেকে ছয় সপ্তাহের পরীক্ষা পর্যন্ত পুরো ধারাবাহিকতা একটি ফ্লিপ-চার্টে। প্রতিটি পাতা একটি সিদ্ধান্ত-তালিকা (জিজ্ঞেস করুন, দেখুন, শুনুন, শ্রেণিবদ্ধ করুন, চিকিৎসা দিন), আগে থেকে পড়ার জন্য নয়, রোগীর পাশে দাঁড়িয়ে ব্যবহারের জন্য।",
    hue: 130,
    sourceUrl: "https://iris.who.int/handle/10665/249580",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-pregnancy-childbirth-postpartum-newborn-care.pdf",
      sizeMb: 2.6,
      isbn: "978-92-4-154935-6",
      addedAt: "2026-08-24",
    },
  },

  // ── 11 WHO newborn health recommendations ───────────────────────────────
  {
    title: "WHO Recommendations on Newborn Health",
    titleBn: "নবজাতক স্বাস্থ্য বিষয়ে বিশ্ব স্বাস্থ্য সংস্থার সুপারিশ",
    subtitle: "Guidelines approved by the WHO Guidelines Review Committee",
    slug: "who-recommendations-newborn-health",
    authorId: "a-who",
    categoryId: "cat-newborn",
    year: 2017,
    publisher: "World Health Organization",
    pages: 26,
    coverImage: "/covers/who-recommendations-newborn-health.webp",
    language: "en",
    description:
      "Every current WHO recommendation on newborn care, collected into twenty-six pages: cord clamping, skin-to-skin, resuscitation, feeding, jaundice, sepsis, and care of the low-birth-weight infant. The one to read first, and the one to keep for reference.",
    descriptionBn:
      "নবজাতক পরিচর্যা নিয়ে বিশ্ব স্বাস্থ্য সংস্থার সব বর্তমান সুপারিশ ছাব্বিশ পাতায়: নাড়ি কাটা, ত্বকে-ত্বকে স্পর্শ, পুনরুজ্জীবন, খাওয়ানো, জন্ডিস, সেপসিস, ও কম ওজনের শিশুর পরিচর্যা। প্রথমে এটিই পড়ুন, আর তথ্যসূত্র হিসেবে রেখে দিন।",
    hue: 165,
    sourceUrl: "https://iris.who.int/handle/10665/259269",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-recommendations-newborn-health.pdf",
      sizeMb: 0.4,
      isbn: "978-92-4-155035-2",
      addedAt: "2026-08-24",
    },
  },

  // ── 12 WHO/UNICEF BFHI ──────────────────────────────────────────────────
  {
    title: "Baby-Friendly Hospital Initiative: Implementation Guidance",
    titleBn: "শিশুবান্ধব হাসপাতাল উদ্যোগ: বাস্তবায়ন নির্দেশিকা",
    subtitle:
      "Protecting, promoting and supporting breastfeeding in facilities providing maternity and newborn services",
    slug: "who-unicef-baby-friendly-hospital-initiative",
    authorId: "a-who-unicef",
    categoryId: "cat-feeding",
    year: 2018,
    publisher: "World Health Organization and UNICEF",
    pages: 64,
    coverImage: "/covers/who-unicef-baby-friendly-hospital-initiative.webp",
    language: "en",
    description:
      "The revised Ten Steps, and how a maternity unit actually gets there: the clinical practices, the staff competency, the monitoring, and the part about not accepting free formula. Aimed at whoever is responsible for a facility rather than at the bedside.",
    descriptionBn:
      "সংশোধিত দশটি ধাপ, এবং একটি প্রসূতি বিভাগ কীভাবে সত্যিই সেখানে পৌঁছায়: চিকিৎসা অনুশীলন, কর্মীদের দক্ষতা, পর্যবেক্ষণ, আর বিনামূল্যের ফর্মুলা না নেওয়ার প্রসঙ্গ। রোগীর পাশে নয়, প্রতিষ্ঠানের দায়িত্বে যাঁরা, তাঁদের জন্য।",
    hue: 355,
    sourceUrl: "https://iris.who.int/handle/10665/272943",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-unicef-baby-friendly-hospital-initiative.pdf",
      sizeMb: 1.0,
      isbn: "978-92-4-151380-7",
      addedAt: "2026-08-24",
    },
  },

  // ── 13 WHO infant and young child feeding ───────────────────────────────
  {
    title: "Infant and Young Child Feeding",
    titleBn: "শিশু ও অল্পবয়সী শিশুর খাদ্য",
    subtitle: "Model chapter for textbooks for medical students and allied health professionals",
    slug: "who-infant-young-child-feeding",
    authorId: "a-who",
    categoryId: "cat-feeding",
    year: 2009,
    publisher: "World Health Organization",
    pages: 112,
    coverImage: "/covers/who-infant-young-child-feeding.webp",
    language: "en",
    description:
      "Written to be lifted wholesale into a medical curriculum, which is why it explains the physiology before the practice: how milk is made, why attachment matters mechanically, what actually causes low supply. The best explanation here of why breastfeeding advice so often fails.",
    descriptionBn:
      "চিকিৎসা পাঠ্যক্রমে সরাসরি ব্যবহারের জন্য লেখা, তাই অনুশীলনের আগে শারীরবিদ্যা বোঝায়: দুধ কীভাবে তৈরি হয়, সঠিকভাবে স্তনে লাগানো যান্ত্রিকভাবে কেন জরুরি, দুধ কম হওয়ার আসল কারণ কী। স্তন্যদানের পরামর্শ কেন প্রায়ই ব্যর্থ হয়, তার সবচেয়ে ভালো ব্যাখ্যা এখানেই।",
    hue: 320,
    sourceUrl: "https://iris.who.int/handle/10665/44117",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-infant-young-child-feeding.pdf",
      sizeMb: 2.2,
      isbn: "978-92-4-159749-4",
      addedAt: "2026-08-24",
    },
  },

  // ── 14 WHO iron and folic acid ──────────────────────────────────────────
  {
    title: "Daily Iron and Folic Acid Supplementation in Pregnancy",
    titleBn: "গর্ভাবস্থায় প্রতিদিন আয়রন ও ফলিক অ্যাসিড",
    slug: "who-anaemia-iron-folic-acid-pregnancy",
    authorId: "a-who",
    categoryId: "cat-feeding",
    year: 2012,
    publisher: "World Health Organization",
    pages: 32,
    coverImage: "/covers/who-anaemia-iron-folic-acid-pregnancy.webp",
    language: "en",
    description:
      "One recommendation, thirty-two pages, and worth every one of them in a country where anaemia in pregnancy is close to universal: the dose, the schedule, the intermittent regimen for where daily is not adhered to, and the evidence on birth weight and maternal anaemia at term.",
    descriptionBn:
      "একটি সুপারিশ, বত্রিশ পাতা, আর যে দেশে গর্ভাবস্থায় রক্তাল্পতা প্রায় সর্বজনীন, সেখানে প্রতিটি পাতাই কাজের: মাত্রা, সময়সূচি, প্রতিদিন সম্ভব না হলে বিকল্প নিয়ম, এবং জন্ম-ওজন ও মেয়াদপূর্ণ গর্ভে মায়ের রক্তাল্পতার প্রমাণ।",
    hue: 300,
    sourceUrl: "https://iris.who.int/handle/10665/77770",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-anaemia-iron-folic-acid-pregnancy.pdf",
      sizeMb: 1.0,
      isbn: "978-92-4-150199-6",
      addedAt: "2026-08-24",
    },
  },

  // ── 15 WHO postnatal care ───────────────────────────────────────────────
  {
    title: "WHO Recommendations on Maternal and Newborn Care",
    titleBn: "মা ও নবজাতকের সেবা বিষয়ে বিশ্ব স্বাস্থ্য সংস্থার সুপারিশ",
    subtitle: "For a positive postnatal experience",
    slug: "who-postnatal-care-recommendations",
    authorId: "a-who",
    categoryId: "cat-postnatal",
    year: 2022,
    publisher: "World Health Organization",
    pages: 242,
    coverImage: "/covers/who-postnatal-care-recommendations.webp",
    language: "en",
    description:
      "The six weeks after the birth, which is when most maternal and newborn deaths actually happen and which almost no service is organised around. Sixty-three recommendations covering the mother's recovery, the baby's checks, feeding support, mental health, and contraception.",
    descriptionBn:
      "জন্মের পরের ছয় সপ্তাহ, যখন মা ও নবজাতকের অধিকাংশ মৃত্যু ঘটে, অথচ প্রায় কোনো সেবাব্যবস্থাই সেই সময়টিকে কেন্দ্র করে সাজানো নয়। তেষট্টিটি সুপারিশ: মায়ের সুস্থতা, শিশুর পরীক্ষা, খাওয়ানোর সহায়তা, মানসিক স্বাস্থ্য ও জন্মনিয়ন্ত্রণ।",
    featured: true,
    hue: 275,
    sourceUrl: "https://iris.who.int/handle/10665/352658",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-postnatal-care-recommendations.pdf",
      sizeMb: 1.3,
      isbn: "978-92-4-004598-9",
      addedAt: "2026-08-24",
    },
  },

  // ── 16 WHO quality-of-care standards ────────────────────────────────────
  {
    title: "Standards for Improving Quality of Maternal and Newborn Care",
    titleBn: "মা ও নবজাতকের সেবার মান উন্নয়নের মানদণ্ড",
    subtitle: "In health facilities",
    slug: "who-maternal-newborn-quality-of-care",
    authorId: "a-who",
    categoryId: "cat-postnatal",
    year: 2016,
    publisher: "World Health Organization",
    pages: 84,
    coverImage: "/covers/who-maternal-newborn-quality-of-care.webp",
    language: "en",
    description:
      "Eight standards, thirty-one quality statements, and a measure for each: the document you use to find out whether a facility is doing what it thinks it is doing. Half of it is about dignity, communication and companionship, which is unusual in a standards document and is the point of it.",
    descriptionBn:
      "আটটি মানদণ্ড, একত্রিশটি গুণগত বিবৃতি, প্রতিটির জন্য একটি পরিমাপ: একটি স্বাস্থ্যকেন্দ্র সত্যিই যা করছে বলে ভাবে তা করছে কি না, তা যাচাই করার দস্তাবেজ। এর অর্ধেকই মর্যাদা, যোগাযোগ ও সঙ্গ নিয়ে, যা মানদণ্ডের দস্তাবেজে বিরল, এবং সেটিই এর মূল কথা।",
    hue: 250,
    sourceUrl: "https://iris.who.int/handle/10665/249155",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-maternal-newborn-quality-of-care.pdf",
      sizeMb: 1.3,
      isbn: "978-92-4-151121-6",
      addedAt: "2026-08-24",
    },
  },
];

/**
 * Shelf-code prefix per category. Exported because newly catalogued books have
 * to be given a shelf position by the same rule as the seed data.
 *
 * These shelves are a fiction, and a deliberate one: there is no building. But
 * an accession code and a shelf mark are how a librarian talks about a book, the
 * admin table is built for someone doing that job, and a column of blanks would
 * be worse than a consistent invention.
 */
export const shelfPrefix: Record<string, string> = {
  "cat-pregnancy": "F1-PREG",
  "cat-labour": "F2-LABR",
  "cat-newborn": "F3-NEWB",
  "cat-feeding": "F4-FEED",
  "cat-complications": "F5-COMP",
  "cat-postnatal": "F6-POST",
};

const uploaders = ["Radiant Pharmaceuticals"];

function buildBook(seed: Seed, i: number): Book {
  const author = authors.find((a) => a.id === seed.authorId)!;
  const category = categories.find((c) => c.id === seed.categoryId)!;
  const status: BookStatus = seed.status ?? "available";

  // Real files: every one of these sixteen has a single physical copy (the
  // file). Borrowed/damaged/lost states still work; they just aren't pre-salted.
  const copiesTotal = 1;
  const copiesAvailable = status === "available" ? 1 : 0;

  return {
    id: `bk-${String(i + 1).padStart(3, "0")}`,
    code: `BK-${String(8000 + i * 37).padStart(5, "0")}`,
    slug: seed.slug,
    title: seed.title,
    titleBn: seed.titleBn,
    subtitle: seed.subtitle,
    authorId: author.id,
    authorName: author.name,
    authorNameBn: author.nameBn,
    categoryId: category.id,
    categoryName: category.name,
    publisher: seed.publisher,
    year: seed.year,
    // Explicit: these are English-language books with Bengali *display* titles.
    // Inferring language from titleBn would label them all Bengali.
    language: seed.language,
    isbn: seed.file.isbn,
    edition: seed.edition,
    pages: seed.pages,
    description: seed.description,
    descriptionBn: seed.descriptionBn,
    sourceUrl: seed.sourceUrl,
    license: seed.license,
    status,
    copiesTotal,
    copiesAvailable,
    shelf: `${shelfPrefix[category.id]}-SH${(i % 6) + 1}-R${(i % 4) + 1}-P${String(
      (i % 12) + 1,
    ).padStart(2, "0")}`,
    coverHue: seed.hue,
    coverImage: seed.coverImage,
    format: "pdf",
    fileSizeMb: seed.file.sizeMb,
    fileUrl: `/api/file/${seed.slug}`,
    // Deterministic, and openly fictional. A download counter on a library that
    // has just launched is either zero everywhere, which makes the "popular"
    // shelf meaningless, or invented. This is invented from the index, so it is
    // stable across renders and obviously not a measurement.
    downloads: 480 + ((i * 613) % 9200),
    rating: Math.round((3.6 + ((i * 7) % 14) / 10) * 10) / 10,
    featured: seed.featured ?? false,
    addedAt: seed.file.addedAt,
    uploadedBy: seed.file.uploadedBy ?? uploaders[i % uploaders.length],
  };
}

export const books: Book[] = seeds.map(buildBook);

/** The demo file served if a slug has no entry in `bookFiles`. */
export const sampleFileName = "sample.pdf";

/**
 * Slug → the file's name in private storage.
 *
 * Kept apart from `Book` deliberately. A `Book` is handed to Client Components
 * and therefore to the browser, and the one thing about a book that must not
 * travel with it is where the file actually is. The route handler looks the name
 * up here, on the server, after it has decided the reader is entitled to it.
 */
export const bookFiles: Record<string, string> = Object.fromEntries(
  books.map((book, i) => [
    book.slug,
    seeds[i].file.url.split("/").pop() ?? sampleFileName,
  ]),
);

// Backfill the denormalised counts now that every book exists.
for (const c of categories) {
  c.bookCount = books.filter((b) => b.categoryId === c.id).length;
}
for (const a of authors) {
  a.bookCount = books.filter((b) => b.authorId === a.id).length;
}
