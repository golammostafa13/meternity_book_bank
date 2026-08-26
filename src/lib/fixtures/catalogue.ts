import type { Author, Book, BookStatus, Category, Subject } from "@/types";

/**
 * Catalogue fixtures for the Maternity Book Bank.
 *
 * Thirty-three real files: twenty open-licensed guidelines and parent handbooks
 * on pregnancy, birth and the first weeks, and thirteen clinical textbooks the
 * guidance is argued from. A compact seed list is expanded into full `Book`
 * records by `buildBook` below, so the verified metadata stays readable and the
 * derived fields (codes, shelves, counts) stay internally consistent.
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
 * Two exceptions, declared. *Te Linde's* is an electronic extract whose front
 * matter names the editors and the edition but carries no ISBN, so it has none
 * here: a number nobody could read is a number nobody should type. And
 * `drugs-and-pregnancy` and `endometriosis-diagnosis-management` are partial
 * files — the opening seventy pages of much longer books — so their `pages` is
 * what the file holds rather than what the book has, and both descriptions say
 * so. See the comment above seed 21.
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
  /*
   * The seventh shelf, and the only one that is not a stage of a pregnancy.
   *
   * It exists because the subject catalogue asked a question the journey
   * categories could not answer. A semen analysis manual, a contraception
   * handbook and a cervical screening guideline are all squarely part of this
   * service and none of them happens between conception and the six-week check,
   * so filing them under "Pregnancy & Antenatal Care" would have been a lie told
   * to keep a taxonomy tidy. The six above are still the pregnancy; this is the
   * care either side of it.
   */
  {
    id: "cat-womens-health",
    slug: "womens-health-family-planning",
    name: "Women's Health & Family Planning",
    nameBn: "নারীস্বাস্থ্য ও পরিবার পরিকল্পনা",
    description:
      "Care before a pregnancy and after one has ended: contraception, fertility, cervical screening, and the pelvic injuries a birth can leave behind.",
    descriptionBn:
      "গর্ভধারণের আগে ও পরে সেবা: জন্মনিয়ন্ত্রণ, প্রজননক্ষমতা, জরায়ুমুখ পরীক্ষা, এবং প্রসবের ফলে শ্রোণিতে যে ক্ষতি থেকে যায়।",
    icon: "Venus",
    bookCount: 0,
  },
];

/**
 * Subjects: the clinical way in.
 *
 * The categories above file a book by where the reader is standing — still
 * pregnant, in labour, six weeks after. These file the same books by the
 * specialty that owns them, which is how the collection is asked for by a
 * midwife, a registrar or a medical student rather than by a mother.
 *
 * The seven are the standard subspecialty division of obstetrics and
 * gynaecology and they are not this library's to reorganise, which is why they
 * are a fixed array with no admin screen behind it. What *is* this library's
 * problem is that the collection began as a maternal-health collection, and for
 * a while four of these subjects rested on a single WHO volume each. The
 * thirteen clinical textbooks added on 26 August 2026 are the fix that was
 * always the right one — more books, not a tidier taxonomy — and they land
 * mostly on infertility, gynaecology and gynaecologic cancer. Urogynaecology and
 * family planning are still shelves of one.
 *
 * `image` is the subject's plate, drawn by `scripts/build-subject-art.mjs` and
 * checked in. Every subject has one, always: the subject page opens on it.
 */
export const subjects: Subject[] = [
  {
    id: "sub-obstetrics",
    slug: "obstetrics",
    name: "Obstetrics",
    nameBn: "প্রসূতিবিদ্যা",
    description:
      "The care of a woman through pregnancy, labour and the weeks after it: antenatal contacts, the conduct of a normal birth, and the emergencies that interrupt one.",
    descriptionBn:
      "গর্ভাবস্থা, প্রসব ও তার পরের সপ্তাহগুলোতে একজন নারীর সেবা: প্রসবপূর্ব সাক্ষাৎ, স্বাভাবিক প্রসব পরিচালনা, এবং যে আকস্মিক অবস্থাগুলো তাতে বাধা দেয়।",
    icon: "Stethoscope",
    image: "/subjects/obstetrics.webp",
    bookCount: 0,
  },
  {
    id: "sub-gynecology",
    slug: "gynecology",
    name: "Gynecology",
    nameBn: "স্ত্রীরোগবিদ্যা",
    description:
      "The health of the female reproductive tract outside pregnancy: menstrual and pelvic disorders, infection, benign disease, and the operations that treat them.",
    descriptionBn:
      "গর্ভাবস্থার বাইরে নারীর প্রজননতন্ত্রের স্বাস্থ্য: ঋতুস্রাব ও শ্রোণির সমস্যা, সংক্রমণ, নিরীহ রোগ, এবং সেগুলোর অস্ত্রোপচার।",
    icon: "Venus",
    image: "/subjects/gynecology.webp",
    bookCount: 0,
  },
  {
    id: "sub-mfm",
    slug: "maternal-fetal-medicine",
    name: "Maternal-Fetal Medicine",
    nameBn: "মাতৃ-ভ্রূণ চিকিৎসাবিদ্যা",
    description:
      "The high-risk pregnancy: a mother with a medical condition, a fetus that is not growing, a labour that has started far too early.",
    descriptionBn:
      "ঝুঁকিপূর্ণ গর্ভাবস্থা: অসুস্থ মা, যে ভ্রূণ ঠিকমতো বাড়ছে না, কিংবা যে প্রসব অনেক আগেই শুরু হয়ে গেছে।",
    icon: "HeartPulse",
    image: "/subjects/maternal-fetal-medicine.webp",
    bookCount: 0,
  },
  {
    id: "sub-rei",
    slug: "reproductive-endocrinology-infertility",
    name: "Reproductive Endocrinology and Infertility",
    nameBn: "প্রজনন এন্ডোক্রাইনোলজি ও বন্ধ্যত্ব",
    description:
      "Why a pregnancy does not begin: the hormones of the cycle, the investigation of a couple who cannot conceive, and what the laboratory can actually measure.",
    descriptionBn:
      "কেন গর্ভধারণ হয় না: ঋতুচক্রের হরমোন, সন্তান না-হওয়া দম্পতির পরীক্ষা-নিরীক্ষা, এবং পরীক্ষাগার আসলে কী মাপতে পারে।",
    icon: "Dna",
    image: "/subjects/reproductive-endocrinology-infertility.webp",
    bookCount: 0,
  },
  {
    id: "sub-gyn-onc",
    slug: "gynecologic-oncology",
    name: "Gynecologic Oncology",
    nameBn: "স্ত্রীরোগ ক্যান্সারবিদ্যা",
    description:
      "Cancer of the cervix, uterus and ovary — and, because this is a cancer that can be caught before it is one, the screening and treatment of cervical pre-cancer.",
    descriptionBn:
      "জরায়ুমুখ, জরায়ু ও ডিম্বাশয়ের ক্যান্সার — এবং যেহেতু এই ক্যান্সার হওয়ার আগেই ধরা যায়, তাই জরায়ুমুখের প্রাক-ক্যান্সার শনাক্তকরণ ও চিকিৎসা।",
    icon: "Ribbon",
    image: "/subjects/gynecologic-oncology.webp",
    bookCount: 0,
  },
  {
    id: "sub-urogyn",
    slug: "urogynecology-pelvic-reconstructive-surgery",
    name: "Urogynecology / Pelvic Reconstructive Surgery",
    nameBn: "ইউরোগাইনিকোলজি ও শ্রোণি পুনর্গঠন শল্যচিকিৎসা",
    description:
      "The pelvic floor after childbirth has damaged it: incontinence, prolapse, and the obstetric fistula that a long obstructed labour leaves behind.",
    descriptionBn:
      "প্রসবে ক্ষতিগ্রস্ত শ্রোণিতল: প্রস্রাব ধরে রাখতে না পারা, জরায়ু নেমে আসা, এবং দীর্ঘ বাধাগ্রস্ত প্রসবের ফলে সৃষ্ট ফিস্টুলা।",
    icon: "Activity",
    image: "/subjects/urogynecology-pelvic-reconstructive-surgery.webp",
    bookCount: 0,
  },
  {
    id: "sub-family-planning",
    slug: "family-planning",
    name: "Family Planning",
    nameBn: "পরিবার পরিকল্পনা",
    description:
      "Deciding whether and when to have a child, and the methods that make the decision stick: how each one works, who can safely use it, and how to counsel for it.",
    descriptionBn:
      "সন্তান নেওয়া হবে কি না এবং কখন হবে, সেই সিদ্ধান্ত ও তা বাস্তবায়নের পদ্ধতি: কোনটি কীভাবে কাজ করে, কে নিরাপদে ব্যবহার করতে পারেন, এবং কীভাবে পরামর্শ দিতে হয়।",
    icon: "CalendarHeart",
    image: "/subjects/family-planning.webp",
    bookCount: 0,
  },
];

/**
 * Authors.
 *
 * Most are institutions, which the `Author` type already handles: no `era`,
 * because an organisation has no birth or death dates. That is not an accident
 * of this collection: guidance on how to keep a woman alive through childbirth
 * is written by committees and published by ministries, and pretending
 * otherwise by crediting a lead editor would misrepresent what these documents
 * are.
 *
 * The three clinical textbooks are the other case, and they are credited the
 * way a library credits them — lead editor "and colleagues" — because that is
 * genuinely who wrote them. Attributing *Williams Obstetrics* to McGraw Hill
 * would be the same mistake in the other direction.
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
  /*
   * The clinical authors.
   *
   * Thirteen entries for the thirteen textbooks appended to `seeds` below, and
   * the same rule as above decides how each is credited: an institution where
   * an institution wrote it, a named author where one person did, and lead
   * editor "and colleagues" for a multi-author volume. Crediting *Bonney's* to
   * Wiley-Blackwell would misrepresent it exactly as crediting a WHO guideline
   * to its lead consultant would.
   */
  {
    id: "a-little",
    slug: "bert-little",
    name: "Bert Little",
    nameBn: "বার্ট লিটল",
    bio: "A population scientist rather than a clinician: professor of public health at the University of Louisville, with adjunct chairs in obstetrics and gynecology and in anthropology, and a career spent on the epidemiology of birth defects. Drugs and Pregnancy is his alone, and it reads like an epidemiologist's book — what the cohort data actually support, and how thin the evidence usually is.",
    bioBn:
      "চিকিৎসক নন, জনসংখ্যা-বিজ্ঞানী: লুইভিল বিশ্ববিদ্যালয়ের জনস্বাস্থ্যের অধ্যাপক, সঙ্গে প্রসূতি-স্ত্রীরোগ ও নৃবিজ্ঞানে অতিরিক্ত অধ্যাপনা, আর গোটা কর্মজীবন কেটেছে জন্মগত ত্রুটির মহামারিবিদ্যা নিয়ে। ড্রাগস অ্যান্ড প্রেগনেন্সি একা তাঁরই লেখা, আর পড়লে মহামারিবিদের হাত টের পাওয়া যায় — গবেষণার তথ্য আসলে কী বলে, আর প্রমাণ কতটা পাতলা।",
    bookCount: 0,
  },
  {
    id: "a-chou",
    slug: "chou-and-colleagues",
    name: "Betty Chou and Colleagues",
    nameBn: "বেটি চৌ ও সহযোগীবৃন্দ",
    bio: "The editors of the Johns Hopkins Manual of Gynecology and Obstetrics — Chou, Bienstock and Satin, all of the Department of Gynecology and Obstetrics at the Johns Hopkins University School of Medicine, where the manual is written by the residents who carry it and edited by the faculty who teach them. Chou runs the residency programme; Satin chairs the department.",
    bioBn:
      "দ্য জনস হপকিন্স ম্যানুয়াল অফ গাইনিকোলজি অ্যান্ড অবস্টেট্রিক্স-এর সম্পাদকমণ্ডলী — চৌ, বিয়েনস্টক ও স্যাটিন, তিনজনই জনস হপকিন্স ইউনিভার্সিটি স্কুল অফ মেডিসিনের প্রসূতি ও স্ত্রীরোগ বিভাগের। ম্যানুয়ালটি লেখেন সেই রেসিডেন্টরাই যাঁরা এটি সঙ্গে নিয়ে ঘোরেন, সম্পাদনা করেন তাঁদের শিক্ষকেরা। চৌ রেসিডেন্সি কার্যক্রমের পরিচালক, স্যাটিন বিভাগীয় প্রধান।",
    bookCount: 0,
  },
  {
    id: "a-davies-sykes",
    slug: "davies-and-sykes",
    name: "Rhianna Davies and Kelsie Sykes",
    nameBn: "রিয়ানা ডেভিস ও কেলসি সাইকস",
    bio: "Two British obstetricians who wrote the book they wanted on the labour ward: Davies a senior registrar and clinical research fellow at Imperial College NHS Foundation Trust in London, Sykes a consultant obstetrician in Basildon. Obstetric Decisions is their first, and it is built out of flow-charts because that is what a decision taken at three in the morning needs.",
    bioBn:
      "দুজন ব্রিটিশ প্রসূতিবিদ, যাঁরা প্রসবকক্ষে যে বইটি হাতে চাইতেন সেটিই লিখেছেন: ডেভিস লন্ডনের ইম্পেরিয়াল কলেজ এনএইচএস ফাউন্ডেশন ট্রাস্টের সিনিয়র রেজিস্ট্রার ও ক্লিনিক্যাল রিসার্চ ফেলো, সাইকস ব্যাসিলডনের কনসালট্যান্ট প্রসূতিবিদ। অবস্টেট্রিক ডিসিশনস তাঁদের প্রথম বই, আর এটি গড়া হয়েছে ফ্লো-চার্ট দিয়ে — কারণ রাত তিনটের সিদ্ধান্তের জন্য ওটাই দরকার।",
    bookCount: 0,
  },
  {
    id: "a-pal-seifer",
    slug: "pal-and-seifer",
    name: "Lubna Pal and David B. Seifer",
    nameBn: "লুবনা পাল ও ডেভিড বি. সাইফার",
    bio: "Two reproductive endocrinologists in the Department of Obstetrics, Gynecology and Reproductive Sciences at Yale School of Medicine, who edit the standing multi-author account of polycystic ovary syndrome. Both work on the metabolic half of the condition, which is why their book treats it as a lifelong disorder rather than an infertility diagnosis.",
    bioBn:
      "ইয়েল স্কুল অফ মেডিসিনের প্রসূতি, স্ত্রীরোগ ও প্রজনন বিজ্ঞান বিভাগের দুই প্রজনন-এন্ডোক্রাইনোলজিস্ট, যাঁরা পলিসিস্টিক ওভারি সিনড্রোম নিয়ে বহু-লেখকের প্রামাণ্য সংকলনটি সম্পাদনা করেন। দুজনেরই কাজ রোগটির বিপাকীয় দিক নিয়ে, আর সেই কারণেই তাঁদের বইয়ে এটি কেবল বন্ধ্যত্বের রোগনির্ণয় নয়, আজীবনের একটি ব্যাধি।",
    bookCount: 0,
  },
  {
    id: "a-petrozza",
    slug: "petrozza-and-colleagues",
    name: "John C. Petrozza and Colleagues",
    nameBn: "জন সি. পেত্রোজা ও সহযোগীবৃন্দ",
    bio: "Chief of reproductive medicine and IVF at Massachusetts General Hospital and co-director of its integrated fibroid programme, which is the unusual thing about the volume he edits: a fibroid book assembled by a fertility surgeon asks throughout what a fibroid does to a pregnancy, not only what it does to a uterus.",
    bioBn:
      "ম্যাসাচুসেটস জেনারেল হাসপাতালের প্রজনন চিকিৎসা ও আইভিএফ বিভাগের প্রধান এবং সেখানকার সমন্বিত ফাইব্রয়েড কার্যক্রমের সহ-পরিচালক — তাঁর সম্পাদিত বইয়ের বিশেষত্ব এখানেই: একজন প্রজনন-শল্যচিকিৎসকের সাজানো ফাইব্রয়েড-গ্রন্থ গোড়া থেকে শেষ পর্যন্ত জিজ্ঞেস করে, ফাইব্রয়েড গর্ভাবস্থার কী করে — কেবল জরায়ুর কী করে, তা নয়।",
    bookCount: 0,
  },
  {
    id: "a-lopes",
    slug: "lopes-and-colleagues",
    name: "Tito Lopes and Colleagues",
    nameBn: "টিটো লোপেস ও সহযোগীবৃন্দ",
    bio: "The four surgeons who carry Bonney's: Lopes at the Royal Cornwall Hospital, Spirtos in Nevada, Naik and Monaghan at the Northern Gynaecological Oncology Centre in Gateshead. All four are gynaecological oncologists, which is why a textbook Victor Bonney first published in 1911 is now strongest on radical pelvic surgery.",
    bioBn:
      "বনি'জ বইটি এখন যাঁদের হাতে, সেই চার শল্যচিকিৎসক: রয়্যাল কর্নওয়াল হাসপাতালের লোপেস, নেভাদার স্পিরটোস, আর গেটসহেডের নর্দার্ন গাইনিকোলজিক্যাল অনকোলজি সেন্টারের নায়েক ও মোনাহান। চারজনই স্ত্রীরোগ-ক্যান্সার শল্যচিকিৎসক, সেই কারণেই ১৯১১ সালে ভিক্টর বনির প্রথম প্রকাশিত বইটি আজ শ্রোণির র‍্যাডিক্যাল অস্ত্রোপচারেই সবচেয়ে শক্তিশালী।",
    bookCount: 0,
  },
  {
    id: "a-bayer",
    slug: "bayer-and-colleagues",
    name: "Steven R. Bayer and Colleagues",
    nameBn: "স্টিভেন আর. বেয়ার ও সহযোগীবৃন্দ",
    bio: "The reproductive endocrinologists of Boston IVF — Bayer, Alper and Penzias, all on the faculty at Harvard Medical School — writing out of one of the oldest and largest fertility practices in the United States. Their handbook is that clinic's own protocols, which is what makes it specific where a textbook generalises.",
    bioBn:
      "বস্টন আইভিএফ-এর প্রজনন-এন্ডোক্রাইনোলজিস্টরা — বেয়ার, অ্যালপার ও পেনজিয়াস, তিনজনই হার্ভার্ড মেডিকেল স্কুলের শিক্ষক — যুক্তরাষ্ট্রের প্রাচীনতম ও বৃহত্তম বন্ধ্যত্ব-চিকিৎসাকেন্দ্রগুলোর একটি থেকে লিখছেন। তাঁদের হ্যান্ডবুকটি আসলে সেই ক্লিনিকের নিজের প্রোটোকল, আর সেখানেই এটি নির্দিষ্ট — যেখানে পাঠ্যবই সাধারণ কথা বলত।",
    bookCount: 0,
  },
  {
    id: "a-bottomley",
    slug: "bottomley-and-colleagues",
    name: "Cecilia Bottomley and Colleagues",
    nameBn: "সিসিলিয়া বটমলি ও সহযোগীবৃন্দ",
    bio: "Bottomley, MacSwan and Rymer, of the London teaching hospitals, who between them see the early-pregnancy and emergency gynaecology cases the book is made of. Rymer edits the whole 100 Cases series, and the format — history, examination, questions, then the discussion — is hers.",
    bioBn:
      "বটমলি, ম্যাকস্বান ও রাইমার — লন্ডনের শিক্ষা-হাসপাতালগুলোর চিকিৎসক, যাঁরা মিলিতভাবে গর্ভাবস্থার প্রথম দিক ও আকস্মিক স্ত্রীরোগের যে রোগীদের দেখেন, তাঁদের নিয়েই বইটি। গোটা ১০০ কেসেস সিরিজের সম্পাদক রাইমার; ইতিহাস, পরীক্ষা, প্রশ্ন, তারপর আলোচনা — এই ছাঁদটিও তাঁরই।",
    bookCount: 0,
  },
  {
    id: "a-balen",
    slug: "adam-balen",
    name: "Adam H. Balen",
    nameBn: "অ্যাডাম এইচ. বেলেন",
    bio: "Professor of reproductive medicine and surgery at Leeds Teaching Hospitals, and the author rather than the editor of Infertility in Practice, now in its fifth edition and drawn from forty years of his own clinics. He chaired the British Fertility Society; his work on polycystic ovary syndrome is why the book's chapters on ovulation disorders are the longest in it.",
    bioBn:
      "লিডস টিচিং হসপিটালসের প্রজনন চিকিৎসা ও শল্যচিকিৎসার অধ্যাপক। ইনফার্টিলিটি ইন প্র্যাকটিস-এর তিনি সম্পাদক নন, লেখক — এখন পঞ্চম সংস্করণে, আর পুরোটাই তাঁর নিজের চল্লিশ বছরের রোগী দেখার অভিজ্ঞতা থেকে। তিনি ব্রিটিশ ফার্টিলিটি সোসাইটির সভাপতি ছিলেন; পলিসিস্টিক ওভারি সিনড্রোম নিয়ে তাঁর কাজের কারণেই বইয়ে ডিম্বস্ফোটনের সমস্যা নিয়ে অধ্যায়গুলোই দীর্ঘতম।",
    bookCount: 0,
  },
  {
    id: "a-amso-banerjee",
    slug: "amso-and-banerjee",
    name: "Nazar N. Amso and Saikat Banerjee",
    nameBn: "নাজার এন. আমসো ও সৈকত ব্যানার্জি",
    bio: "Amso is emeritus professor of obstetrics and gynaecology at Cardiff University and a gynaecological surgeon; Banerjee co-directs the Cambridge Endometriosis and Endoscopic Surgery Unit. Their book is deliberately a diagnostic one: endometriosis is diagnosed years late almost everywhere, and both editors work on the imaging that could change that.",
    bioBn:
      "আমসো কার্ডিফ বিশ্ববিদ্যালয়ের প্রসূতি ও স্ত্রীরোগবিদ্যার ইমেরিটাস অধ্যাপক এবং স্ত্রীরোগ-শল্যচিকিৎসক; ব্যানার্জি কেমব্রিজ এন্ডোমেট্রিওসিস ও এন্ডোস্কোপিক সার্জারি ইউনিটের সহ-পরিচালক। তাঁদের বইটি সচেতনভাবেই রোগনির্ণয়ের বই: প্রায় সব দেশেই এন্ডোমেট্রিওসিস ধরা পড়ে বছরখানেক দেরিতে, আর দুই সম্পাদকেরই কাজ সেই ইমেজিং নিয়ে যা এটি বদলে দিতে পারে।",
    bookCount: 0,
  },
  {
    id: "a-gardner",
    slug: "gardner-and-colleagues",
    name: "David K. Gardner and Colleagues",
    nameBn: "ডেভিড কে. গার্ডনার ও সহযোগীবৃন্দ",
    bio: "The four editors of the Textbook of Assisted Reproductive Techniques — Gardner in Melbourne, Weissman in Israel, Howles in Geneva, Shoham at Kaplan Hospital in Rehovot — who have carried it through six editions. Gardner's own work on embryo culture media is part of why blastocyst transfer became routine.",
    bioBn:
      "টেক্সটবুক অফ অ্যাসিস্টেড রিপ্রোডাক্টিভ টেকনিকস-এর চার সম্পাদক — মেলবোর্নের গার্ডনার, ইসরায়েলের ওয়াইসম্যান, জেনেভার হাউলস, রেহোভোতের ক্যাপলান হাসপাতালের শোহাম — ছয়টি সংস্করণ ধরে বইটি বইছেন। ভ্রূণ-কালচার মাধ্যম নিয়ে গার্ডনারের নিজের কাজই অন্যতম কারণ, যে জন্য ব্লাস্টোসিস্ট প্রতিস্থাপন আজ নিয়মিত পদ্ধতি।",
    bookCount: 0,
  },
  {
    id: "a-handa-vanle",
    slug: "handa-and-van-le",
    name: "Victoria L. Handa and Linda Van Le",
    nameBn: "ভিক্টোরিয়া এল. হান্ডা ও লিন্ডা ভ্যান লে",
    bio: "Handa is a urogynaecologist at Johns Hopkins, Van Le a gynaecological oncologist at the University of North Carolina, and they took Te Linde's over for its twelfth edition after Howard Jones III had edited it for fifteen years. A pelvic-floor surgeon and a cancer surgeon between them is roughly the shape of operative gynaecology.",
    bioBn:
      "হান্ডা জনস হপকিন্সের একজন ইউরোগাইনিকোলজিস্ট, ভ্যান লে নর্থ ক্যারোলাইনা বিশ্ববিদ্যালয়ের স্ত্রীরোগ-ক্যান্সার চিকিৎসক। হাওয়ার্ড জোন্স তৃতীয়ের পনেরো বছরের সম্পাদনার পরে দ্বাদশ সংস্করণে টে লিন্ডে'স-এর ভার নেন তাঁরা। একজন শ্রোণিতল-শল্যচিকিৎসক ও একজন ক্যান্সার-শল্যচিকিৎসক — মোটামুটি এই দুইয়ের যোগফলই অপারেটিভ গাইনিকোলজি।",
    bookCount: 0,
  },
  {
    id: "a-arun-babu",
    slug: "sharmila-arun-babu",
    name: "Sharmila Arun Babu",
    nameBn: "শর্মিলা অরুণ বাবু",
    bio: "Additional professor and head of obstetrics and gynaecology at the All India Institute of Medical Sciences in Mangalagiri, and a JIPMER-trained clinician who wrote her book for the practical examination rather than the written one. It is the only title here organised around a viva: what the examiner will ask, and what a candidate is expected to have looked for.",
    bioBn:
      "মঙ্গলগিরির অল ইন্ডিয়া ইনস্টিটিউট অফ মেডিকেল সায়েন্সেসে প্রসূতি ও স্ত্রীরোগবিদ্যার অতিরিক্ত অধ্যাপক ও বিভাগীয় প্রধান; জিপমার-এ প্রশিক্ষিত এই চিকিৎসক তাঁর বইটি লিখেছেন লিখিত পরীক্ষার জন্য নয়, ব্যবহারিক পরীক্ষার জন্য। এই সংগ্রহে এটিই একমাত্র বই যা ভাইভাকে কেন্দ্র করে সাজানো: পরীক্ষক কী জিজ্ঞেস করবেন, আর পরীক্ষার্থীর কী দেখে আসা উচিত ছিল।",
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
  /**
   * The clinical subject. Independent of `categoryId` on purpose: the two
   * taxonomies cross rather than nest. See `subjects` above.
   */
  subjectId: string;
  year: number;
  publisher: string;
  pages: number;
  description: string;
  descriptionBn?: string;
  featured?: boolean;
  /**
   * Standing order, low first. Only the three clinical references carry one.
   * See `Book.priority` in `types` and the comparator in `lib/data/books`.
   */
  priority?: number;
  status?: BookStatus;
  /** Cover hue in degrees; drives the 3D spine and fallback generated art. */
  hue: number;
  /** Edition label as printed on the copyright page. */
  edition?: string;
  /**
   * Served path to the real cover WebP built by `scripts/build-covers.mjs`:
   * page one of the file itself, or, for the three references, the publisher's
   * jacket supplied in `private/covers/`. Present on every title, so the
   * generated art in `lib/cover-theme` never actually shows on this catalogue;
   * it is there for whatever the admin catalogues next.
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-gynecology",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-mfm",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-mfm",
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
    subjectId: "sub-obstetrics",
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
    subjectId: "sub-obstetrics",
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

  /* ────────────────────────────────────────────────────────────────────────
     The subject shelves, stocked.

     Four titles catalogued for the four subjects the maternal-health
     collection left standing empty: infertility, gynaecologic cancer, the
     pelvic floor, and contraception. They are not filler. Each is the WHO
     publication a clinician would actually expect to find under that heading,
     which is the only defensible way to fill a shelf — the alternative was
     seven subject pages of which four opened on nothing.

     Three are open-licensed like the guidance above them. The fourth is not,
     and is handled the way the three textbooks are: see its `license`.
     ──────────────────────────────────────────────────────────────────────── */

  // ── 17 WHO laboratory manual: human semen ───────────────────────────────
  {
    title: "WHO Laboratory Manual for the Examination and Processing of Human Semen",
    titleBn: "মানব শুক্রাণু পরীক্ষা ও প্রক্রিয়াকরণে বিশ্ব স্বাস্থ্য সংস্থার পরীক্ষাগার নির্দেশিকা",
    subtitle: "Standard methods for the assessment of male fertility",
    slug: "who-semen-examination-manual",
    authorId: "a-who",
    categoryId: "cat-womens-health",
    subjectId: "sub-rei",
    year: 2021,
    publisher: "World Health Organization",
    pages: 292,
    edition: "Sixth edition",
    coverImage: "/covers/who-semen-examination-manual.webp",
    language: "en",
    description:
      "The manual every andrology laboratory in the world measures against, now in its sixth edition. Bench procedure at a level of detail no textbook attempts — how to collect a sample, how long to let it liquefy, how to count and how to classify motility and morphology — followed by the reference ranges those methods produce and the quality control that keeps a laboratory honest about them. Half of infertility is male, and this is the book that decides what that half is measured with.",
    descriptionBn:
      "পৃথিবীর প্রতিটি অ্যান্ড্রোলজি পরীক্ষাগার যে নির্দেশিকার সঙ্গে নিজেকে মিলিয়ে নেয়, তার ষষ্ঠ সংস্করণ। কোনো পাঠ্যবই যে মাত্রার খুঁটিনাটিতে যায় না, সেই মাত্রায় বেঞ্চের কার্যপদ্ধতি — কীভাবে নমুনা নিতে হবে, কতক্ষণ তরল হতে দিতে হবে, কীভাবে গণনা করতে হবে এবং গতিশীলতা ও আকৃতি কীভাবে শ্রেণিবদ্ধ করতে হবে — তারপর সেই পদ্ধতিতে পাওয়া রেফারেন্স মান ও মান-নিয়ন্ত্রণ। বন্ধ্যত্বের অর্ধেকই পুরুষের, আর সেই অর্ধেক কী দিয়ে মাপা হবে তা এই বইই ঠিক করে।",
    hue: 265,
    sourceUrl: "https://iris.who.int/handle/10665/343208",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-semen-examination-manual.pdf",
      sizeMb: 7.3,
      isbn: "978-92-4-003078-7",
      addedAt: "2026-08-26",
    },
  },

  // ── 18 WHO cervical pre-cancer screening and treatment ──────────────────
  {
    title: "WHO Guideline for Screening and Treatment of Cervical Pre-cancer Lesions",
    titleBn: "জরায়ুমুখের প্রাক-ক্যান্সার শনাক্তকরণ ও চিকিৎসায় বিশ্ব স্বাস্থ্য সংস্থার নির্দেশিকা",
    subtitle: "For cervical cancer prevention",
    slug: "who-cervical-precancer-screening",
    authorId: "a-who",
    categoryId: "cat-womens-health",
    subjectId: "sub-gyn-onc",
    year: 2021,
    publisher: "World Health Organization",
    pages: 115,
    edition: "Second edition",
    coverImage: "/covers/who-cervical-precancer-screening.webp",
    language: "en",
    description:
      "Cervical cancer is the one gynaecological cancer that can be stopped before it starts, and this is the guideline that says how. The second edition moves the world to HPV DNA testing as the primary screen, sets the intervals, and gives the screen-and-treat and screen-triage-and-treat algorithms in full — with a separate set of recommendations throughout for women living with HIV, who are six times more likely to develop it. Written for programmes as much as for clinicians: the recommendations assume a country deciding what to offer, not only a doctor deciding what to do next.",
    descriptionBn:
      "জরায়ুমুখের ক্যান্সারই একমাত্র স্ত্রীরোগ-ক্যান্সার যা শুরু হওয়ার আগেই ঠেকানো যায়, আর কীভাবে ঠেকাতে হবে তা বলে এই নির্দেশিকা। দ্বিতীয় সংস্করণ প্রাথমিক পরীক্ষা হিসেবে এইচপিভি ডিএনএ পরীক্ষার দিকে বিশ্বকে নিয়ে যায়, বিরতিকাল নির্ধারণ করে, এবং শনাক্ত-ও-চিকিৎসা অ্যালগরিদমগুলো পুরোপুরি দেয় — সঙ্গে এইচআইভি আক্রান্ত নারীদের জন্য আলাদা সুপারিশ, যাঁদের এই ক্যান্সার হওয়ার ঝুঁকি ছয় গুণ বেশি।",
    hue: 20,
    sourceUrl: "https://iris.who.int/handle/10665/342365",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-cervical-precancer-screening.pdf",
      sizeMb: 3.3,
      isbn: "978-92-4-003082-4",
      addedAt: "2026-08-26",
    },
  },

  // ── 19 Family planning: a global handbook for providers ─────────────────
  {
    title: "Family Planning: A Global Handbook for Providers",
    titleBn: "পরিবার পরিকল্পনা: সেবাদাতাদের জন্য বিশ্বব্যাপী হ্যান্ডবুক",
    subtitle: "Evidence-based guidance developed through worldwide collaboration",
    slug: "who-family-planning-handbook",
    authorId: "a-who",
    categoryId: "cat-womens-health",
    subjectId: "sub-family-planning",
    year: 2018,
    publisher: "World Health Organization / Johns Hopkins CCP",
    pages: 460,
    edition: "2018 update",
    coverImage: "/covers/who-family-planning-handbook.webp",
    language: "en",
    description:
      "The blue book on the family planning clinic's desk, and the most practical volume in this library. A chapter per method — implants, IUDs, injectables, pills, condoms, sterilisation, fertility awareness — each answering the same questions in the same order: how well it works, who can and cannot use it, what to say when a client asks about side effects, and what to do when she comes back with one. Written for the person actually in the room, at whatever level of training, which is why it is a handbook and not a guideline.",
    descriptionBn:
      "পরিবার পরিকল্পনা কেন্দ্রের টেবিলে যে নীল বইটি থাকে, এবং এই গ্রন্থাগারের সবচেয়ে হাতে-কলমে কাজে লাগার বই। প্রতিটি পদ্ধতির জন্য আলাদা অধ্যায় — ইমপ্ল্যান্ট, আইইউডি, ইনজেকশন, বড়ি, কনডম, স্থায়ী পদ্ধতি, প্রাকৃতিক পদ্ধতি — আর প্রতিটিই একই প্রশ্নের উত্তর একই ক্রমে দেয়: কতটা কার্যকর, কে ব্যবহার করতে পারবেন আর কে পারবেন না, পার্শ্বপ্রতিক্রিয়ার কথা জিজ্ঞেস করলে কী বলতে হবে, আর সমস্যা নিয়ে ফিরে এলে কী করতে হবে।",
    featured: true,
    hue: 145,
    sourceUrl: "https://iris.who.int/handle/10665/260156",
    license: WHO_LICENSE,
    file: {
      url: "/books/who-family-planning-handbook.pdf",
      sizeMb: 7.8,
      isbn: "978-0-9992037-0-5",
      addedAt: "2026-08-26",
    },
  },

  // ── 20 Obstetric fistula: guiding principles ────────────────────────────
  {
    title: "Obstetric Fistula: Guiding Principles for Clinical Management",
    titleBn: "প্রসবজনিত ফিস্টুলা: ক্লিনিক্যাল ব্যবস্থাপনার মূলনীতি",
    subtitle: "And programme development",
    slug: "who-obstetric-fistula-guiding-principles",
    authorId: "a-who",
    categoryId: "cat-womens-health",
    subjectId: "sub-urogyn",
    year: 2006,
    publisher: "World Health Organization",
    pages: 81,
    coverImage: "/covers/who-obstetric-fistula-guiding-principles.webp",
    language: "en",
    description:
      "What is left of a woman after two or three days of obstructed labour with nobody to help her: a hole between the bladder and the vagina, incontinence that cannot be hidden, and in most cases a dead baby and a husband who has gone. This is the WHO volume on repairing it — classification, the pre-operative assessment, the surgical principles, the catheter regime afterwards — and, at equal length, on the counselling and reintegration without which a successful repair still leaves her outcast. Obstetric fistula is a disease of absent obstetric care, and it is the reason the rest of this library exists.",
    descriptionBn:
      "সাহায্য করার কেউ না থাকা অবস্থায় দুই-তিন দিন বাধাগ্রস্ত প্রসবের পর একজন নারীর যা অবশিষ্ট থাকে: মূত্রথলি ও যোনির মাঝে একটি ছিদ্র, যে অসংযম লুকানো যায় না, আর বেশিরভাগ ক্ষেত্রে একটি মৃত সন্তান ও চলে-যাওয়া স্বামী। এটি তা মেরামতের বিষয়ে বিশ্ব স্বাস্থ্য সংস্থার বই — শ্রেণিবিন্যাস, অস্ত্রোপচারের আগের মূল্যায়ন, শল্যচিকিৎসার মূলনীতি, পরবর্তী ক্যাথেটার ব্যবস্থাপনা — এবং সমান দৈর্ঘ্যে, সেই কাউন্সেলিং ও সমাজে ফেরানোর কথা, যা ছাড়া সফল অস্ত্রোপচারের পরেও তিনি একঘরে থেকে যান।",
    hue: 300,
    sourceUrl: "https://iris.who.int/handle/10665/43343",
    /*
     * Not open-licensed, and the only WHO title here that is not.
     *
     * WHO relicensed most of its catalogue under CC BY-NC-SA 3.0 IGO from 2013;
     * this one is from 2006 and was not swept up, and its copyright page still
     * says all rights reserved with reproduction by permission of WHO Press.
     * The IRIS record carries no licence either, so there is nothing to rely on.
     *
     * It is catalogued anyway, and handled exactly as the three textbooks are:
     * the record, the cover and the metadata are all real, and the file is kept
     * off the public release, so the reader and the download 404 while the entry
     * stands. See "The book files" in the README. It stays because it is the
     * document for this subject and a catalogue that hid it would be less useful
     * and no more lawful; if the library obtains permission, or WHO relicenses
     * it, adding the file to the release is the whole of the change.
     */
    license: "© World Health Organization 2006. All rights reserved.",
    file: {
      url: "/books/who-obstetric-fistula-guiding-principles.pdf",
      sizeMb: 0.4,
      isbn: "92-4-159367-9",
      addedAt: "2026-08-26",
    },
  },

  /* ────────────────────────────────────────────────────────────────────────
     The clinical shelf, restocked.

     Thirteen textbooks and monographs, appended in ascending order of file
     size, which is also the order they were chosen in. They stand in for the
     three reference works this collection carried until 26 August 2026 —
     *Williams Obstetrics*, *Williams Gynecology* and *Gabbe's* — which were
     470 MB between three titles. These are 292 MB between thirteen, and they
     stock the shelves a maternal-health collection had left nearly bare:
     infertility, gynaecological surgery, gynaecologic cancer, and the
     endocrine disorders that keep a pregnancy from starting.

     Appended rather than interleaved, for the same reason the references were:
     `buildBook` derives the accession code, shelf mark and download count from
     the array index, so inserting anywhere but the end renumbers every book
     above it. Standing order is `priority`, not position in this file.

     Every one of them is in copyright — CRC Press, Wolters Kluwer, Springer,
     Wiley — where everything above except the fistula guide is open-licensed.
     `license` says so on each, and none of them belongs in a public release
     asset. See **The book files** in the README.

     Two are honest partials. `drugs-and-pregnancy` and
     `endometriosis-diagnosis-management` are the opening seventy pages of much
     longer books and the supplied files stop mid-chapter. `pages` is therefore
     what the file holds, not what the book has, and each description says so.
     A truncated book catalogued as a whole one would be the single lie this
     fixture has avoided everywhere else.
     ──────────────────────────────────────────────────────────────────────── */

  // ── 21 Drugs and Pregnancy ──────────────────────────────────────────────
  {
    title: "Drugs and Pregnancy",
    titleBn: "ড্রাগস অ্যান্ড প্রেগনেন্সি",
    subtitle: "A handbook",
    slug: "drugs-and-pregnancy",
    authorId: "a-little",
    categoryId: "cat-pregnancy",
    subjectId: "sub-mfm",
    year: 2022,
    publisher: "CRC Press",
    pages: 70,
    edition: "Second edition",
    coverImage: "/covers/drugs-and-pregnancy.webp",
    language: "en",
    description:
      "What is safe to prescribe to a pregnant woman, drug by drug, and how little is usually known. Written by an epidemiologist of birth defects rather than by a clinician, so every entry carries the risk category, the animal data, the human cohort data where any exists, and an explicit admission where none does. One thing on the record: this file is the opening part of the book only — front matter and the first two chapters, as far as the antimicrobials — and it stops mid-chapter. It is catalogued as the extract it is.",
    descriptionBn:
      "একজন গর্ভবতী নারীকে কোন ওষুধ নিরাপদে দেওয়া যায়, ওষুধ ধরে ধরে — আর সাধারণত কত কম জানা আছে। লিখেছেন চিকিৎসক নন, জন্মগত ত্রুটির একজন মহামারিবিদ; তাই প্রতিটি ভুক্তিতে থাকে ঝুঁকির শ্রেণি, প্রাণীর তথ্য, মানুষের ওপর গবেষণার তথ্য যদি থাকে, আর না থাকলে স্পষ্ট স্বীকারোক্তি। একটি কথা খোলাখুলি বলা দরকার: এই ফাইলটি বইয়ের শুরুর অংশ মাত্র — ভূমিকা ও প্রথম দুই অধ্যায়, অ্যান্টিমাইক্রোবিয়াল পর্যন্ত — আর এটি অধ্যায়ের মাঝখানেই শেষ হয়ে গেছে। যা আছে, ঠিক তাই হিসেবেই তালিকাভুক্ত।",
    hue: 210,
    license: "© 2022 Taylor & Francis Group, LLC. All rights reserved.",
    file: {
      url: "/books/drugs-and-pregnancy.pdf",
      sizeMb: 2.4,
      isbn: "978-1-032-21678-2",
      addedAt: "2026-08-26",
    },
  },

  // ── 22 Johns Hopkins Manual ─────────────────────────────────────────────
  {
    title: "The Johns Hopkins Manual of Gynecology and Obstetrics",
    titleBn: "দ্য জনস হপকিন্স ম্যানুয়াল অফ গাইনিকোলজি অ্যান্ড অবস্টেট্রিক্স",
    subtitle: "The on-call reference for both halves of the specialty",
    slug: "johns-hopkins-manual-gynecology-obstetrics",
    authorId: "a-chou",
    categoryId: "cat-complications",
    subjectId: "sub-obstetrics",
    year: 2021,
    publisher: "Wolters Kluwer",
    pages: 855,
    edition: "Sixth edition (South Asian edition)",
    coverImage: "/covers/johns-hopkins-manual-gynecology-obstetrics.webp",
    language: "en",
    description:
      "The general reference at the head of this library: both halves of the specialty in one pocket manual small enough to keep on a phone. Maternal physiology, antenatal care, labour and its complications, then general gynaecology, reproductive endocrinology, urogynaecology and the gynaecologic cancers — each chapter written by the Johns Hopkins residents who actually carry it and edited by the faculty who teach them. This is the book the guidance elsewhere in the collection can be checked against, and the reason it sits first is simple: it answers almost anything asked of this shelf.",
    descriptionBn:
      "এই গ্রন্থাগারের শীর্ষে থাকা সাধারণ প্রামাণ্য বই: বিশেষত্বের দুই অর্ধেকই এক পকেট-ম্যানুয়ালে, যা একটি ফোনেই ধরে যায়। মায়ের শারীরবিদ্যা, প্রসবপূর্ব সেবা, প্রসব ও তার জটিলতা, তারপর সাধারণ স্ত্রীরোগবিদ্যা, প্রজনন এন্ডোক্রাইনোলজি, ইউরোগাইনিকোলজি ও স্ত্রীরোগ-ক্যান্সার — প্রতিটি অধ্যায় লিখেছেন জনস হপকিন্সের সেই রেসিডেন্টরাই যাঁরা এটি সঙ্গে নিয়ে ঘোরেন, সম্পাদনা করেছেন তাঁদের শিক্ষকেরা। এই সংগ্রহের বাকি নির্দেশিকাগুলো যাচাই করার বই এটিই, আর প্রথমে বসার কারণ সহজ: এই তাকের প্রায় যেকোনো প্রশ্নের উত্তর এতে আছে।",
    featured: true,
    priority: 1,
    hue: 205,
    license: "© 2021 Wolters Kluwer. All rights reserved.",
    file: {
      url: "/books/johns-hopkins-manual-gynecology-obstetrics.pdf",
      sizeMb: 7.9,
      isbn: "978-93-89859-66-9",
      addedAt: "2026-08-26",
    },
  },

  // ── 23 Obstetric Decisions ──────────────────────────────────────────────
  {
    title: "Obstetric Decisions",
    titleBn: "অবস্টেট্রিক ডিসিশনস",
    subtitle: "Quick thinking for safe deliveries",
    slug: "obstetric-decisions",
    authorId: "a-davies-sykes",
    categoryId: "cat-labour",
    subjectId: "sub-obstetrics",
    year: 2026,
    publisher: "CRC Press",
    pages: 170,
    edition: "First edition",
    coverImage: "/covers/obstetric-decisions.webp",
    language: "en",
    description:
      "The newest book in the library and the one written closest to the labour ward. Every entry has the same shape — what you are looking at, what to do, what to say — set out in boxes, flow-charts and tables, because a decision taken at three in the morning is not taken by reading prose. It sits beside the WHO intrapartum guideline rather than replacing it: the guideline says what practice should be, this says what to do next.",
    descriptionBn:
      "গ্রন্থাগারের সবচেয়ে নতুন বই, আর প্রসবকক্ষের সবচেয়ে কাছে বসে লেখা। প্রতিটি ভুক্তির ছাঁদ এক — সামনে যা দেখছেন, যা করতে হবে, যা বলতে হবে — বাক্স, ফ্লো-চার্ট ও সারণিতে সাজানো, কারণ রাত তিনটের সিদ্ধান্ত গদ্য পড়ে নেওয়া হয় না। এটি বিশ্ব স্বাস্থ্য সংস্থার প্রসবকালীন নির্দেশিকার জায়গা নেয় না, পাশে বসে: নির্দেশিকা বলে চর্চা কেমন হওয়া উচিত, আর এই বই বলে এখন কী করতে হবে।",
    featured: true,
    priority: 2,
    hue: 95,
    license: "© 2026 Rhianna Davies and Kelsie Sykes. All rights reserved.",
    file: {
      url: "/books/obstetric-decisions.pdf",
      sizeMb: 9.5,
      isbn: "978-1-032-83171-8",
      addedAt: "2026-08-26",
    },
  },

  // ── 24 Polycystic Ovary Syndrome ────────────────────────────────────────
  {
    title: "Polycystic Ovary Syndrome",
    titleBn: "পলিসিস্টিক ওভারি সিনড্রোম",
    subtitle: "Current and emerging concepts",
    slug: "polycystic-ovary-syndrome",
    authorId: "a-pal-seifer",
    categoryId: "cat-womens-health",
    subjectId: "sub-rei",
    year: 2022,
    publisher: "Springer",
    pages: 580,
    edition: "Second edition",
    coverImage: "/covers/polycystic-ovary-syndrome.webp",
    language: "en",
    description:
      "The commonest endocrine disorder in women of reproductive age, and the one most often reduced to a fertility problem. Thirty-odd chapters treat it as what it is: a lifelong metabolic and reproductive condition, with the insulin resistance, the cardiovascular risk, the pregnancy complications and the adolescent presentation each given their own account alongside ovulation induction.",
    descriptionBn:
      "প্রজননক্ষম বয়সের নারীদের মধ্যে সবচেয়ে সাধারণ হরমোন-ব্যাধি, আর সবচেয়ে বেশি যাকে কেবল বন্ধ্যত্বের সমস্যা বলে ছোট করে দেখা হয়। ত্রিশটির বেশি অধ্যায় এটিকে দেখে যা এটি সত্যিই — আজীবনের একটি বিপাকীয় ও প্রজনন-ব্যাধি: ইনসুলিন প্রতিরোধ, হৃদরোগের ঝুঁকি, গর্ভাবস্থার জটিলতা এবং কিশোরীদের ক্ষেত্রে এর প্রকাশ, প্রত্যেকটির আলাদা বিবরণ — ডিম্বস্ফোটন প্রবর্তনের পাশাপাশি।",
    hue: 230,
    license: "© 2022 Springer Nature Switzerland AG. All rights reserved.",
    file: {
      url: "/books/polycystic-ovary-syndrome.pdf",
      sizeMb: 9.7,
      isbn: "978-3-030-92588-8",
      addedAt: "2026-08-26",
    },
  },

  // ── 25 Uterine Fibroids ─────────────────────────────────────────────────
  {
    title: "Uterine Fibroids",
    titleBn: "ইউটেরাইন ফাইব্রয়েডস",
    subtitle: "Cause, consequence and treatment of uterine leiomyomata",
    slug: "uterine-fibroids",
    authorId: "a-petrozza",
    categoryId: "cat-womens-health",
    subjectId: "sub-gynecology",
    year: 2020,
    publisher: "CRC Press",
    pages: 165,
    edition: "First edition",
    coverImage: "/covers/uterine-fibroids.webp",
    language: "en",
    description:
      "Fibroids are the commonest tumour in women and the commonest reason for a hysterectomy, and this is a short book that covers the whole arc: what causes them, what they cost, why they bleed, what they do to a pregnancy, and every route to treating them from expectant management through embolisation to myomectomy. Edited by a fertility surgeon, so the chapters on reproduction are not an afterthought.",
    descriptionBn:
      "নারীদের মধ্যে সবচেয়ে সাধারণ টিউমার ফাইব্রয়েড, আর জরায়ু অপসারণের সবচেয়ে সাধারণ কারণও এটি। ছোট এই বইটি পুরো বৃত্তটি ধরে: কেন হয়, খরচ কত, রক্তক্ষরণ কেন হয়, গর্ভাবস্থার কী ক্ষতি করে, আর চিকিৎসার প্রতিটি পথ — অপেক্ষা থেকে এম্বোলাইজেশন হয়ে মায়োমেকটমি পর্যন্ত। সম্পাদক একজন প্রজনন-শল্যচিকিৎসক, তাই প্রজনন নিয়ে অধ্যায়গুলো শেষে জুড়ে দেওয়া নয়।",
    hue: 335,
    license: "© 2021 Taylor & Francis Group, LLC. All rights reserved.",
    file: {
      url: "/books/uterine-fibroids.pdf",
      sizeMb: 9.7,
      isbn: "978-1-4987-3920-7",
      addedAt: "2026-08-26",
    },
  },

  // ── 26 Bonney's Gynaecological Surgery ──────────────────────────────────
  {
    title: "Bonney's Gynaecological Surgery",
    titleBn: "বনি'জ গাইনিকোলজিক্যাল সার্জারি",
    subtitle: "From opening the abdomen to radical pelvic surgery",
    slug: "bonneys-gynaecological-surgery",
    authorId: "a-lopes",
    categoryId: "cat-womens-health",
    subjectId: "sub-gyn-onc",
    year: 2011,
    publisher: "Wiley-Blackwell",
    pages: 284,
    edition: "Eleventh edition",
    coverImage: "/covers/bonneys-gynaecological-surgery.webp",
    language: "en",
    description:
      "First published by Victor Bonney in 1911 and still the shortest way to learn how a pelvis is opened, worked in and closed. The current editors are all gynaecological oncologists, so the second half is radical surgery — hysterectomy for cancer, lymphadenectomy, exenteration, vulval reconstruction — described in the plain imperative of someone standing at the table. The oldest book in this library by a wide margin, and the least dated in what it teaches.",
    descriptionBn:
      "১৯১১ সালে ভিক্টর বনি প্রথম প্রকাশ করেন, আর শ্রোণি কীভাবে খোলা হয়, ভেতরে কাজ করা হয় ও বন্ধ করা হয় — তা শেখার সবচেয়ে সংক্ষিপ্ত পথ আজও এটিই। বর্তমান সম্পাদকরা সবাই স্ত্রীরোগ-ক্যান্সার শল্যচিকিৎসক, তাই বইয়ের দ্বিতীয়ার্ধ র‍্যাডিক্যাল অস্ত্রোপচার — ক্যান্সারে জরায়ু অপসারণ, লিম্ফ্যাডেনেকটমি, এক্সেন্টারেশন, ভালভার পুনর্গঠন — অপারেশন টেবিলে দাঁড়ানো মানুষের সরল আদেশবাচক ভাষায় লেখা। এই গ্রন্থাগারের সবচেয়ে পুরনো বই, আর যা শেখায় তাতে সবচেয়ে কম পুরনো।",
    hue: 220,
    license:
      "© 2011 Tito Lopes, Nick M. Spirtos, Raj Naik and John M. Monaghan. All rights reserved.",
    file: {
      url: "/books/bonneys-gynaecological-surgery.pdf",
      sizeMb: 10.6,
      isbn: "978-1-4051-9565-2",
      addedAt: "2026-08-26",
    },
  },

  // ── 27 The Boston IVF Handbook of Infertility ───────────────────────────
  {
    title: "The Boston IVF Handbook of Infertility",
    titleBn: "দ্য বস্টন আইভিএফ হ্যান্ডবুক অফ ইনফার্টিলিটি",
    subtitle: "A practical guide for practitioners who care for infertile couples",
    slug: "boston-ivf-handbook-of-infertility",
    authorId: "a-bayer",
    categoryId: "cat-womens-health",
    subjectId: "sub-rei",
    year: 2018,
    publisher: "CRC Press",
    pages: 260,
    edition: "Fourth edition",
    coverImage: "/covers/boston-ivf-handbook-of-infertility.webp",
    language: "en",
    description:
      "One clinic's protocols, published. The workup of a couple who cannot conceive, in the order it is actually done — history, semen analysis, ovarian reserve, tubal assessment — then ovulation induction, insemination and IVF with the decision points named. Its value is that it is specific: this is what Boston IVF does on a Tuesday, not what the literature permits.",
    descriptionBn:
      "একটি ক্লিনিকের নিজের প্রোটোকল, ছাপা অবস্থায়। সন্তান না-হওয়া দম্পতির পরীক্ষা-নিরীক্ষা, ঠিক যে ক্রমে সত্যিই করা হয় — ইতিহাস, শুক্রাণু পরীক্ষা, ডিম্বাশয়ের সঞ্চয়, নালির মূল্যায়ন — তারপর ডিম্বস্ফোটন প্রবর্তন, ইনসেমিনেশন ও আইভিএফ, প্রতিটি সিদ্ধান্তবিন্দু নাম ধরে বলা। এর মূল্য এর নির্দিষ্টতায়: গবেষণাপত্র কী অনুমোদন করে তা নয়, বস্টন আইভিএফ মঙ্গলবারে কী করে, সেটিই লেখা।",
    hue: 350,
    license: "© 2018 Taylor & Francis Group, LLC. All rights reserved.",
    file: {
      url: "/books/boston-ivf-handbook-of-infertility.pdf",
      sizeMb: 11.4,
      isbn: "978-1-138-63302-5",
      addedAt: "2026-08-26",
    },
  },

  // ── 28 100 Cases in Obstetrics and Gynaecology ──────────────────────────
  {
    title: "100 Cases in Obstetrics and Gynaecology",
    titleBn: "১০০ কেসেস ইন অবস্টেট্রিক্স অ্যান্ড গাইনিকোলজি",
    subtitle: "Clinical scenarios with questions and worked answers",
    slug: "100-cases-obstetrics-gynaecology",
    authorId: "a-bottomley",
    categoryId: "cat-complications",
    subjectId: "sub-gynecology",
    year: 2025,
    publisher: "CRC Press",
    pages: 313,
    edition: "Third edition",
    coverImage: "/covers/100-cases-obstetrics-gynaecology.webp",
    language: "en",
    description:
      "A hundred women arrive, one to a page, with a history, an examination and the first results; then the questions, then the answer worked through. Early pregnancy, emergency gynaecology, peripartum care, contraception and sexual health — the range a junior doctor meets in a year, compressed into an afternoon. The most useful teaching book here, and the one to hand a student who has read the guidelines and not yet seen a patient.",
    descriptionBn:
      "একশো জন নারী আসেন, প্রতি পাতায় একজন — সঙ্গে ইতিহাস, পরীক্ষা ও প্রথম ফলাফল; তারপর প্রশ্ন, তারপর ধাপে ধাপে উত্তর। গর্ভাবস্থার প্রথম দিক, আকস্মিক স্ত্রীরোগ, প্রসবকালীন সেবা, জন্মনিয়ন্ত্রণ ও যৌনস্বাস্থ্য — একজন নবীন চিকিৎসক এক বছরে যা দেখেন, তা এক বিকেলে গুছিয়ে দেওয়া। এই সংগ্রহে শেখানোর জন্য সবচেয়ে কাজের বই, আর যে ছাত্র নির্দেশিকা পড়েছেন কিন্তু এখনও রোগী দেখেননি, তাঁর হাতে দেওয়ার বই।",
    hue: 110,
    license:
      "© 2025 Cecilia Bottomley, Ruth MacSwan and Janice Rymer. All rights reserved.",
    file: {
      url: "/books/100-cases-obstetrics-gynaecology.pdf",
      sizeMb: 17.1,
      isbn: "978-1-032-48007-7",
      addedAt: "2026-08-26",
    },
  },

  // ── 29 Infertility in Practice ──────────────────────────────────────────
  {
    title: "Infertility in Practice",
    titleBn: "ইনফার্টিলিটি ইন প্র্যাকটিস",
    subtitle: "Investigation and management, from first consultation to assisted conception",
    slug: "infertility-in-practice",
    authorId: "a-balen",
    categoryId: "cat-womens-health",
    subjectId: "sub-rei",
    year: 2023,
    publisher: "CRC Press",
    pages: 453,
    edition: "Fifth edition",
    coverImage: "/covers/infertility-in-practice.webp",
    language: "en",
    description:
      "Written by one clinician out of forty years of his own clinics, which is why it reads as an argument rather than a committee report. A full classification of the causes of infertility, then the investigation of each, then the treatment — with the ovulation disorders and polycystic ovary syndrome given the most room, because that is where the author's own work is and where most of the treatable cases are.",
    descriptionBn:
      "একজন চিকিৎসকের নিজের চল্লিশ বছরের রোগী দেখার অভিজ্ঞতা থেকে লেখা, আর সেই কারণেই এটি কমিটির প্রতিবেদন নয়, একটি যুক্তির মতো পড়া যায়। বন্ধ্যত্বের কারণগুলোর পূর্ণ শ্রেণিবিভাগ, তারপর প্রত্যেকটির পরীক্ষা-নিরীক্ষা, তারপর চিকিৎসা — সবচেয়ে বেশি জায়গা পেয়েছে ডিম্বস্ফোটনের সমস্যা ও পলিসিস্টিক ওভারি সিনড্রোম, কারণ লেখকের নিজের কাজ সেখানেই, আর চিকিৎসাযোগ্য বেশিরভাগ রোগীও সেখানেই।",
    hue: 190,
    license: "© 2023 Adam H. Balen. All rights reserved.",
    file: {
      url: "/books/infertility-in-practice.pdf",
      sizeMb: 20.6,
      isbn: "978-0-367-55744-7",
      addedAt: "2026-08-26",
    },
  },

  // ── 30 Endometriosis ────────────────────────────────────────────────────
  {
    title: "Endometriosis",
    titleBn: "এন্ডোমেট্রিওসিস",
    subtitle: "Current topics in diagnosis and management",
    slug: "endometriosis-diagnosis-management",
    authorId: "a-amso-banerjee",
    categoryId: "cat-womens-health",
    subjectId: "sub-gynecology",
    year: 2023,
    publisher: "CRC Press",
    pages: 70,
    edition: "First edition",
    coverImage: "/covers/endometriosis-diagnosis-management.webp",
    language: "en",
    description:
      "A disease that affects one woman in ten and is typically diagnosed years late, taken up as a diagnostic problem first: what the pain actually sounds like in a history, what ultrasound can see, and what MRI adds once the pouch of Douglas is obliterated. Stated plainly, as with the drug handbook above — this file is the opening part of the book only, ending in the middle of the imaging chapter. It is catalogued as the extract it is.",
    descriptionBn:
      "প্রতি দশজন নারীর একজন এই রোগে ভোগেন, আর সাধারণত বছরখানেক দেরিতে ধরা পড়ে — বইটি তাই আগে রোগনির্ণয়ের সমস্যা হিসেবেই এটিকে ধরে: রোগীর কথায় ব্যথাটি আসলে কেমন শোনায়, আল্ট্রাসাউন্ডে কী দেখা যায়, আর পাউচ অফ ডগলাস বন্ধ হয়ে গেলে এমআরআই কী যোগ করে। ওপরের ওষুধের হ্যান্ডবুকের মতো এখানেও খোলাখুলি বলা: এই ফাইলটি বইয়ের শুরুর অংশ মাত্র, ইমেজিং অধ্যায়ের মাঝামাঝি পর্যন্ত। যা আছে, ঠিক তাই হিসেবেই তালিকাভুক্ত।",
    hue: 5,
    license: "© 2023 Nazar N. Amso and Saikat Banerjee. All rights reserved.",
    file: {
      url: "/books/endometriosis-diagnosis-management.pdf",
      sizeMb: 23.7,
      isbn: "978-1-138-59587-3",
      addedAt: "2026-08-26",
    },
  },

  // ── 31 Textbook of Assisted Reproductive Techniques, Volume 2 ───────────
  {
    title: "Textbook of Assisted Reproductive Techniques, Volume 2",
    titleBn: "টেক্সটবুক অফ অ্যাসিস্টেড রিপ্রোডাক্টিভ টেকনিকস, দ্বিতীয় খণ্ড",
    subtitle: "Clinical perspectives",
    slug: "assisted-reproductive-techniques-vol-2",
    authorId: "a-gardner",
    categoryId: "cat-womens-health",
    subjectId: "sub-rei",
    year: 2024,
    publisher: "CRC Press",
    pages: 520,
    edition: "Sixth edition",
    coverImage: "/covers/assisted-reproductive-techniques-vol-2.webp",
    language: "en",
    description:
      "The clinical half of the standing IVF reference: stimulation protocols, the poor responder, luteal support, frozen-embryo transfer, uterus transplantation, surrogacy, and the newer arguments about artificial intelligence in embryo selection. Volume 1 is the laboratory and is not held here; this volume stands on its own, and it is the one a clinician rather than an embryologist reaches for.",
    descriptionBn:
      "আইভিএফ-এর প্রামাণ্য গ্রন্থের চিকিৎসা-অংশ: উদ্দীপনার প্রোটোকল, কম সাড়া দেওয়া রোগী, লুটিয়াল সাপোর্ট, হিমায়িত ভ্রূণ প্রতিস্থাপন, জরায়ু প্রতিস্থাপন, সারোগেসি, আর ভ্রূণ বাছাইয়ে কৃত্রিম বুদ্ধিমত্তা নিয়ে নতুন বিতর্ক। প্রথম খণ্ডটি পরীক্ষাগারের, তা এখানে নেই; এই খণ্ডটি নিজেই সম্পূর্ণ, আর ভ্রূণবিজ্ঞানী নয়, চিকিৎসকই এটি হাতে নেন।",
    hue: 235,
    license:
      "© 2024 David K. Gardner, Ariel Weissman, Colin M. Howles and Zeev Shoham. All rights reserved.",
    file: {
      url: "/books/assisted-reproductive-techniques-vol-2.pdf",
      sizeMb: 26.2,
      isbn: "978-1-032-21480-1",
      addedAt: "2026-08-26",
    },
  },

  // ── 32 Te Linde's Operative Gynecology ──────────────────────────────────
  {
    title: "Te Linde's Operative Gynecology",
    titleBn: "টে লিন্ডে'স অপারেটিভ গাইনিকোলজি",
    subtitle: "The reference on gynaecological surgery",
    slug: "te-lindes-operative-gynecology",
    authorId: "a-handa-vanle",
    categoryId: "cat-womens-health",
    subjectId: "sub-gynecology",
    year: 2020,
    publisher: "Wolters Kluwer",
    pages: 1307,
    edition: "12th",
    coverImage: "/covers/te-lindes-operative-gynecology.webp",
    language: "en",
    description:
      "The operative reference, in print since 1946 and the book a gynaecological surgeon is expected to have read. Pelvic anatomy and surgical principles first, then every operation the specialty performs — abdominal and vaginal hysterectomy, myomectomy, surgery for endometriosis, prolapse and incontinence repair, the radical cancer operations, the obstetric injuries — each with the complications that follow it. Where Bonney's teaches the craft in three hundred pages, this settles the arguments in thirteen hundred. Its ISBN is absent because the copy here is an electronic extract whose front matter carries the editors and the edition but no accession number.",
    descriptionBn:
      "অস্ত্রোপচারের প্রামাণ্য গ্রন্থ, ১৯৪৬ সাল থেকে ছাপা হচ্ছে, আর একজন স্ত্রীরোগ-শল্যচিকিৎসকের এটি পড়ে থাকার কথা। প্রথমে শ্রোণির শারীরস্থান ও অস্ত্রোপচারের নীতি, তারপর এই বিশেষত্বের প্রতিটি অপারেশন — উদর ও যোনিপথে জরায়ু অপসারণ, মায়োমেকটমি, এন্ডোমেট্রিওসিসের অস্ত্রোপচার, জরায়ু নেমে আসা ও প্রস্রাব ধরে রাখতে না পারার মেরামত, ক্যান্সারের র‍্যাডিক্যাল অপারেশন, প্রসবজনিত ক্ষতি — প্রত্যেকটির সঙ্গে তার পরের জটিলতাগুলো। বনি'জ তিনশো পাতায় হাতের কাজ শেখায়, এই বই তেরোশো পাতায় বিতর্ক মিটিয়ে দেয়। আইএসবিএন নেই, কারণ এখানে যে কপিটি আছে সেটি একটি ইলেকট্রনিক সংকলন — শুরুর পাতায় সম্পাদক ও সংস্করণ আছে, কোনো নম্বর নেই।",
    featured: true,
    priority: 3,
    hue: 260,
    license: "© 2020 Lippincott Williams & Wilkins. All rights reserved.",
    file: {
      url: "/books/te-lindes-operative-gynecology.pdf",
      sizeMb: 43.2,
      addedAt: "2026-08-26",
    },
  },

  // ── 33 Clinical Obstetrics and Gynecology ───────────────────────────────
  {
    title: "Clinical Obstetrics and Gynecology",
    titleBn: "ক্লিনিক্যাল অবস্টেট্রিক্স অ্যান্ড গাইনিকোলজি",
    subtitle: "History taking, case discussion, practical viva voce topics and OSCE",
    slug: "clinical-obstetrics-gynecology-osce",
    authorId: "a-arun-babu",
    categoryId: "cat-pregnancy",
    subjectId: "sub-obstetrics",
    year: 2022,
    publisher: "Wolters Kluwer (India)",
    pages: 764,
    edition: "Second edition",
    coverImage: "/covers/clinical-obstetrics-gynecology-osce.webp",
    language: "en",
    description:
      "The only book here written for an examination, and the closest thing in the collection to a South Asian curriculum: set to the Indian competency-based medical curriculum by the head of obstetrics and gynaecology at AIIMS Mangalagiri. How to take an obstetric history and present it, how a case is discussed, what the instruments and specimens on the OSCE table are, and what a viva examiner will ask about each. Practical rather than authoritative, and for a Bangladeshi undergraduate the most directly useful thing on this shelf.",
    descriptionBn:
      "এই সংগ্রহে একটিই বই পরীক্ষার জন্য লেখা, আর দক্ষিণ এশিয়ার পাঠ্যক্রমের সবচেয়ে কাছের বইও এটি: এআইআইএমএস মঙ্গলগিরির প্রসূতি ও স্ত্রীরোগ বিভাগের প্রধান এটি লিখেছেন ভারতের দক্ষতাভিত্তিক মেডিকেল পাঠ্যক্রম মেনে। প্রসূতি-ইতিহাস কীভাবে নিতে হয় ও কীভাবে উপস্থাপন করতে হয়, কেস কীভাবে আলোচিত হয়, ওএসসিই টেবিলের যন্ত্র ও নমুনাগুলো কী, আর ভাইভায় পরীক্ষক প্রত্যেকটি নিয়ে কী জিজ্ঞেস করবেন। প্রামাণ্য নয়, ব্যবহারিক — আর বাংলাদেশের একজন স্নাতক-পর্যায়ের ছাত্রের জন্য এই তাকের সবচেয়ে সরাসরি কাজের বই।",
    hue: 15,
    license: "© 2022 Wolters Kluwer (India) Pvt. Ltd. All rights reserved.",
    file: {
      url: "/books/clinical-obstetrics-gynecology-osce.pdf",
      sizeMb: 99.5,
      isbn: "978-93-93553-35-5",
      addedAt: "2026-08-26",
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
  "cat-womens-health": "F7-WHFP",
};

const uploaders = ["Radiant Pharmaceuticals"];

function buildBook(seed: Seed, i: number): Book {
  const author = authors.find((a) => a.id === seed.authorId)!;
  const category = categories.find((c) => c.id === seed.categoryId)!;
  const subject = subjects.find((x) => x.id === seed.subjectId)!;
  const status: BookStatus = seed.status ?? "available";

  // Real files: every one of these has a single physical copy (the file).
  // Borrowed/damaged/lost states still work; they just aren't pre-salted.
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
    subjectId: subject.id,
    subjectName: subject.name,
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
    priority: seed.priority,
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
for (const s of subjects) {
  s.bookCount = books.filter((b) => b.subjectId === s.id).length;
}
for (const a of authors) {
  a.bookCount = books.filter((b) => b.authorId === a.id).length;
}
