/**
 * English strings. Because `Dictionary` is derived from this object, this is
 * also the shape every other language has to match. Add a key here and TypeScript fails
 * the build until Bengali has it too, which is the only reliable way to stop a
 * half-translated page shipping.
 *
 * Values that need a number or a name interpolated are functions rather than
 * templates with placeholders: pluralisation differs between the two languages,
 * and a function can just say so.
 */
export const en = {
  common: {
    skipToContent: "Skip to content",
    browseLibrary: "Browse library",
    search: "Search",
    searchTheCatalogue: "Search the catalogue",
    switchTheme: "Switch theme",
    switchLanguage: "Switch language",
    signIn: "Sign in",
    signOut: "Sign out",
    account: "Account",
    signedInAs: "Signed in as",
    home: "Home",
    books: "Books",
    authors: "Authors",
    categories: "Categories",
    viewAll: "View all",
    seeEverything: "See everything",
    startBrowsing: "Start browsing",
    backToLibrary: "Back to the library",
    readOnline: "Read online",
    read: "Read",
    download: "Download",
    downloadFormat: "Download {format}",
    downloadOf: "Download {title} ({format}, {mb} MB)",
    titlesOne: "{n} title",
    titlesMany: "{n} titles",
    resultsOne: "{n} result",
    resultsMany: "{n} results",
    breadcrumb: "Breadcrumb",
    mainNav: "Main",
    mobileNav: "Mobile",
    pagination: "Pagination",
    previousPage: "Previous page",
    nextPage: "Next page",
    /** The word on the button. `openMenu`/`closeMenu` are its accessible
     *  name, which has to say what the button *does*; the label beside the
     *  glyph says what is behind it, and does not change as it opens. */
    menu: "Menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  /** The 3D featured carousel. Its controls are the whole of its interface. */
  carousel: {
    label: "Featured books",
    previous: "Previous book",
    next: "Next book",
    show: "Show {title}",
    pause: "Pause the carousel",
    play: "Resume the carousel",
    position: "Book {n} of {total}",
    hint: "Drag, or use the arrow keys",
  },

  nav: {
    discover: "Discover",
    categories: "Categories",
    authors: "Authors",
    about: "About",
    contact: "Contact",
  },

  home: {
    /** Split so the arrow can sit inside the headline, as in the design. */
    titleStart: "Welcome to",
    titleMiddle: "where every page",
    titleOpens: "opens",
    titleEnd: "a new world.",
    lead: "Explore top reads, timeless classics and stories that inspire. Read them right in your browser, or keep the file.",
    getStarted: "Get started",
    browseCategories: "Browse categories",
    statBooks: "Books",
    statAuthors: "Authors",
    statDownloads: "Downloads",
    /**
     * The beat the hero scrubs through after the headline. One line the reader
     * passes rather than reads twice, so it stays short; anything longer than
     * a breath is the wrong length for a scroll beat. The beat after it is the
     * recently-added list, which carries its own copy below.
     */
    scene: {
      openTitle: "Open any volume.",
      openLead:
        "It opens in the browser. No app, no plugin, nothing to install.",
      scrollHint: "Scroll",
    },
    props: [
      {
        title: "Read in the browser",
        body: "Open any book instantly. No app, no plugin, no waiting for a download to finish.",
      },
      {
        title: "Download and keep",
        body: "Every title is available as a file you can keep, print or pass on.",
      },
      {
        title: "Bengali and English",
        body: "A collection built for both languages, with search that understands each of them.",
      },
    ],
    featuredEyebrow: "Featured",
    featuredTitle1: "Featured Books",
    featuredTitle: "Best Rating Books",
    featuredLead:
      "Discover a world where imagination comes alive and knowledge knows no bounds.",
    categoriesTitle: "Browse by category",
    categoriesLead: "Six shelves. Every spine is a book you can open right now.",
    cinema: {
      eyebrow: "Sponsored by Exium MUPS 20 · Radiant Pharmaceuticals",
      /* Not the site's name. The header carries that, two hundred pixels
         above this, and printing it twice inside one screen is the sort of
         repetition that makes a page look assembled rather than designed.
         What a hero should say is why the shelf exists, and "the first
         thousand days", conception to a child's second birthday, is the
         term maternal health actually uses for it. */
      titleTop: "The first",
      titleBottom: "thousand days",
      lead:
        "Pregnancy, birth and the first weeks: a shelf of trusted guides in Bangla and English, free to read in your browser or to keep as a file.",
      enter: "Enter the library",
      browse: "Browse the chapters",
      scrollHint: "Scroll",
    },
    collection: {
      eyebrow: "The collection",
      title: "Six chapters, from the first weeks to the last visit",
      lead:
        "Pregnancy, labour, the newborn, feeding, the emergencies and the weeks after. Keep scrolling, and the collection moves through each of them in turn.",
      chapterLabel: "Chapter",
      viewShelf: "Open this shelf",
      railLabel: "Chapters in the collection",
    },
    recentTitle: "Recently added",
    recentLead:
      "The newest arrivals on the shelf. Open the record, or take the file.",
    /**
     * The arrivals section pins and steps through the newest books, so its
     * frame is an eyebrow and a statement rather than a heading and a
     * paragraph: `recentTitle` above is the eyebrow, this is the statement,
     * and `recentLead` only appears in the stacked fallback where there is
     * room for it.
     */
    arrivals: {
      title: "New on the shelf.",
      openRecord: "Open the record",
      takeFile: "Take the file",
      railLabel: "Recent arrivals",
    },
    ctaTitle: "Start reading in the next ten seconds.",
    ctaLead: "No paywall. No adverts. Just open a book.",
    ctaButton: "Browse the library",
  },

  catalogue: {
    eyebrow: "Catalogue",
    title: "Books collection",
    lead: "Every title in the collection, ready to read in your browser or to keep as a file.",
    readInBrowser: "Read in the browser",
    orKeepTheFile: "Or keep the file",
    searchPlaceholder: "Search a book, author or ISBN…",
    filter: "Filter",
    all: "All",
    sortBy: "Sort by",
    sortRecent: "Newest first",
    sortPopular: "Most downloaded",
    sortTitle: "Title A-Z",
    sortYear: "Year published",
    language: "Language",
    allLanguages: "All languages",
    empty: "No books match those filters. Try widening your search.",
    signedInAs: "Signed in as",
    adminTools: "Catalogue tools",
    /* --- The room ------------------------------------------------------
       The catalogue's front is a dark band with the filters in it and one
       book standing in the middle; these are the strings that band needs
       and the grid below does not. */
    openRecord: "Open the record",
    /** On the cue that scrolls past the room to the grid. */
    seeAll: "Skip to the grid",
    /** Across the foot, in tracked capitals. Says what the shelf is. */
    strapline: "Every title free. Both languages. Nothing behind a paywall.",
    /** The scale a figure is read against: "196 pages of 528". */
    ofN: "of {n}",
    metaTitle: "All books",
    metaDescription:
      "Browse the complete catalogue: Bengali and English books, ready to read online or download.",
  },

  book: {
    featured: "Featured",
    by: "by",
    ratingOutOf: "/ 5",
    downloads: "{n} downloads",
    added: "Added {date}",
    aboutThisBook: "About this book",
    details: "Details",
    publisher: "Publisher",
    published: "Published",
    edition: "Edition",
    pages: "Pages",
    language: "Language",
    isbn: "ISBN",
    format: "Format",
    shelf: "Shelf",
    accession: "Accession",
    physicalCopies: "Physical copies",
    copiesLine: "{available} of {total} available on shelf {shelf}.",
    copiesLabel: "{available} of {total} copies available",
    fileSizeLine: "{mb} MB · yours to keep",
    alsoOpened: "Readers also opened",
    notFound: "Book not found",
    bengali: "বাংলা Bengali",
    english: "English",

    /* --- The reading room ---------------------------------------------
       This is the most visited page in the library, so it is built as a
       sequence of acts rather than as a record card: a plate with the
       volume standing on it, three plates and a paragraph, a statement,
       the record, the sponsor, and what to read next. These are the
       strings those acts need and the rest of the site does not. */
    room: {
      scrollHint: "Scroll",
      /** Captions under the three plates. */
      coverPlate: "The cover",
      subjectPlate: "The subject",
      imprintPlate: "The imprint",
      /** Credit under the subject photograph. A licence condition, not a
       *  courtesy: see the note on `Book.sourceUrl`. */
      photographBy: "Photograph: {artist}",
      sourceLabel: "Source",
      licenceLabel: "Licence",
      viewOriginal: "The original",
      /** The display pairing that runs across the page: a short italic line
       *  above a much larger one. Two halves of one sentence, so they have
       *  to be read together and translated together. */
      statementLead: "Every page,",
      statementWord: "free to read",
      /** Column head in the record. `downloads` above is a sentence with the
       *  figure in it; this is the bare noun a table needs. */
      downloadsLabel: "Downloads",
      recordEyebrow: "The record",
      sponsorEyebrow: "The sponsor",
      readNext: "Read next",
    },
  },

  authors: {
    eyebrow: "People",
    title: "Authors",
    lead: "{n} writers represented in the collection.",
    inCollectionOne: "{n} title in the collection",
    inCollectionMany: "{n} titles in the collection",
    notFound: "Author not found",
    metaDescription:
      "The writers in the collection, from Tagore and Nazrul to Austen and Sagan.",
  },

  categories: {
    eyebrow: "Browse",
    title: "Categories",
    lead: "Six shelves covering the whole collection.",
    notFound: "Category not found",
    metaDescription:
      "Browse the collection by subject: fiction, poetry, history, science, children's books and reference.",
  },

  search: {
    title: "Search the library",
    lead: "Instant results, in Bengali and English.",
    placeholder: "Title, author or category…",
    empty: "Nothing matches “{q}”.",
    hint: "Start typing to search the whole catalogue.",
    resultsForOne: "{n} result for “{q}”",
    resultsForMany: "{n} results for “{q}”",
    metaDescription:
      "Search the catalogue by title, author or category, in Bengali or English.",
  },

  about: {
    eyebrow: "About",
    title: "A library should be open to everyone.",
    lead: "{name} exists for one reason: a catalogue of {books} books should be as easy to reach as a search box. No paywall. No adverts. No ten-step download that ends in one.",
    body: "Every title here can be read directly in your browser, or downloaded and kept. The collection spans Bengali and English: literature, poetry, history, science, and books for children.",
    props: [
      {
        title: "Built to stay up",
        body: "Pages are pre-rendered and served from the edge, so the site behaves the same under a hundred readers or a hundred thousand.",
      },
      {
        title: "No tracking",
        body: "No advertising network, no third-party scripts, no profile of what you read. Nothing to opt out of.",
      },
      {
        title: "Two languages",
        body: "Bengali and English are equals here, in the interface and in search, not one bolted onto the other.",
      },
    ],
    statBooks: "Books",
    statAuthors: "Authors",
    statCategories: "Categories",
    statDownloads: "Downloads",
    metaDescription:
      "A free digital library for readers holding a copy. No paywalls, no adverts, no tracking. Here is how it works and why it stays free.",
  },

  contact: {
    eyebrow: "Contact",
    title: "Suggest a book. Or tell us what broke.",
    lead: "We read everything that comes in. If you have a title you think belongs in the collection, or a file that will not open, this is the place.",
    email: "Email",
    phone: "Phone",
    readingRoom: "Reading room",
    address: "12 Bangla Bazar Road, Dhaka 1100",
    formName: "Your name",
    formNamePlaceholder: "Apu Roy",
    formEmail: "Email",
    formSubject: "What is this about?",
    subjectSuggestion: "Suggesting a book",
    subjectProblem: "Reporting a problem",
    subjectDonation: "Donating books",
    subjectOther: "Something else",
    formMessage: "Message",
    formMessagePlaceholder: "Tell us what is on your mind…",
    send: "Send message",
    turnstile: "Protected by Turnstile. We never share your address.",
    sentTitle: "Message received",
    sentBody: "Thanks. We will get back to you within a couple of days.",
    sendAnother: "Send another",
    errorName: "Please enter your name.",
    errorEmail: "That does not look like an email address.",
    errorMessageShort:
      "A little more detail, please: at least 10 characters.",
    errorMessageLong: "That is longer than we can accept.",
    metaDescription:
      "Get in touch with the library: suggest a title, report a problem, or ask about donating books.",
  },

  reader: {
    backToBook: "Back to the book",
    previousPage: "Previous page",
    nextPage: "Next page",
    pageOf: "Page {page} of {total}",
    /** The field in the footer, and the label on each page in the column. */
    jumpToPage: "Jump to page",
    pageLabel: "Page {page}",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fitWidth: "Fit to width",
    sepia: "Sepia",
    loading: "Opening the book…",
    failed: "This book could not be opened.",
    downloadInstead: "Download it instead",
    metaTitle: "Read {title}",
    metaDescription: "Read {title} by {author} online, free.",
  },

  notFound: {
    code: "404",
    title: "That shelf is empty.",
    lead: "The page you asked for has been moved or never existed. The catalogue, however, is right where you left it.",
    back: "Back to the library",
    search: "Search the catalogue",
    suggestions: "Most opened this month",
    metaTitle: "Page not found",
  },

  sponsor: {
    courtesy: "Courtesy by",
    /* The product line, as printed on the pack. Not translated, because a medicine's
       brand name is the same word in every language, and a reader matching what
       is on the page against what is in their hand needs it to be. */
    product: "Exium MUPS 20",
    generic: "Esomeprazole 20 mg",
    company: "Radiant Pharmaceuticals Ltd.",
    alt: "Two Exium MUPS cartons, 20 mg and 40 mg, with their blister strips.",
    hint: "Drag to turn the pack",
    note: "A prescription medicine. This is an advertisement, not medical advice.",
    /* The About page's explanation of why an advert is here at all. */
    aboutTitle: "Who paid for this",
    aboutLead:
      "This library was given away with a print run funded by Radiant Pharmaceuticals, and the Exium MUPS pack on these pages is the whole of what they get for it. There is no advertising network, no third-party script and no record of what you read. The one advert on the site is a picture of a box, served from this domain, and it does not know you are there.",
  },
  auth: {
    /* --- The door ------------------------------------------------------- */
    title: "The password, please",
    lead: "It is printed inside your copy: one word, the same for every reader.",
    passwordLabel: "Password",
    passwordPlaceholder: "The word printed in your book",
    enter: "Open the library",
    entering: "Opening…",
    metaSignIn: "Enter",
    showPassword: "Show password",
    hidePassword: "Hide password",

    /* One message for every kind of wrong. It does not say whether the word
       was close, how long the right one is, or which of the two was being
       compared. */
    errorWrongPassword: "That is not the password. Check the page in your book.",
    errorTooMany:
      "Too many tries. Wait {minutes} minutes, then try again. The limit is {attempts} attempts per ten minutes.",
    errorUnavailable: "Not available just now. Please try again shortly.",

    /* --- The register --------------------------------------------------- */
    registerLink: "Received a copy? Add yourself to the register",
    backToDoor: "Back to the password",
    signUpTitle: "Add yourself to the register",
    signUpLead:
      "So we know where the books went. It is not how you get in (the password does that), and nothing here is required except a name and a number.",
    metaSignUp: "Add yourself to the register",
    nameLabel: "Your name",
    namePlaceholder: "Nusrat Jahan",
    phoneLabel: "Mobile number",
    phonePlaceholder: "01XXXXXXXXX",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    fieldOptional: "Optional.",

    districtLabel: "District",
    districtPlaceholder: "Choose your district",
    districtSearch: "Type to search 64 districts",
    districtEmpty: "No district matches that.",
    thanaLabel: "Thana",
    thanaPlaceholder: "Choose your thana",
    thanaPickDistrictFirst: "Choose a district first",
    thanaEmpty: "No thana matches that.",

    signUpContinue: "Add me to the register",
    signingUp: "Saving…",
    registered:
      "Thank you. You are on the register. Now enter the password to open the library.",

    errorNameEmpty: "Enter your name.",
    errorPhoneEmpty: "Enter your mobile number.",
    errorPhoneInvalid: "That does not look like a Bangladeshi mobile number.",
    errorEmailInvalid: "That does not look like an email address.",

    /* --- The aside ------------------------------------------------------ */
    sideEyebrow: "For mothers, midwives and health workers",
    sideLead:
      "Pregnancy, birth and the first weeks: every title in the collection, in Bangla and English, free in your browser.",
    sideLeadSignUp:
      "Tell us where your copy landed. It takes a moment and it is entirely optional.",
    badgeWithBook: "Yours with the book",
    badgeBilingual: "Bangla & English",
    badgeBrowser: "Reads in the browser",
  },

  admin: {
    dashboard: "Dashboard",
    books: "Books",
    authors: "Authors",
    categories: "Categories",
    settings: "Settings",
    notifications: "Notifications",
    publicCatalogue: "Public catalogue",
    librarian: "Librarian",
    signedIn: "Signed in",
    overview: "Library · Overview",
    breadcrumbTitles: "Library · {n} titles",
    breadcrumbWriters: "Library · {n} writers",
    breadcrumbShelves: "Library · {n} shelves",
    breadcrumbNew: "Library · Books · New",
    breadcrumbBook: "Library · Books · {code}",
    catalogueABook: "Catalogue a book",
    manageAll: "Manage all",
    statTitles: "Titles catalogued",
    statShelves: "{n} shelves",
    statWriters: "Writers",
    statBothLanguages: "Across both languages",
    statDownloads: "Downloads",
    statSinceLaunch: "Since launch",
    statOnLoan: "On loan",
    statAvailableNow: "{n} available now",
    recentlyShelved: "Recently shelved",
    recentlyShelvedLead:
      "The last fourteen volumes to enter the catalogue, in the order they were added.",
    recentUploads: "Most recent five uploads",
    colTitle: "Title",
    colUploadedBy: "Uploaded by",
    colAdded: "Added",
    colStatus: "Status",
    colCover: "Cover",
    colShelf: "Shelf",
    colCopies: "Copies",
    colDownloads: "Downloads",
    colActions: "Actions",
    colWriter: "Writer",
    colOnTheShelf: "On the shelf",
    colTitles: "Titles",
    inventory: "Inventory",
    statusAvailable: "Available",
    statusOnLoan: "On loan",
    statusDamaged: "Damaged",
    statusLost: "Lost",
    storage: "R2 storage",
    gigabytes: "GB",
    storageOf: "of {gb} GB free tier",
    storageUsedLabel: "{percent} percent of the free storage tier used",
    storageNote: "{mb} MB average per title. Egress is free at any volume, so the only budget that matters is this one.",
    addToLibrary: "Add to the library",
    addWriter: "Add a writer",
    openShelf: "Open a new shelf",
    occupancy: "Shelf occupancy",
    occupancyLead:
      "How the collection is distributed. A shelf with one title on it is a shelf worth filling or closing.",
    catalogueTable: "Catalogue, page {page} of {total}",
    filterSearch: "Search",
    filterSearchPlaceholder: "Title, author, ISBN or accession code…",
    filterShelf: "Shelf",
    filterAllShelves: "All shelves",
    filterStatus: "Status",
    filterAnyStatus: "Any status",
    filterSort: "Sort",
    apply: "Apply",
    clear: "Clear",
    noMatches: "Nothing matches those filters.",
    nothingYet: "Nothing yet",
    writersInCollection: "Writers represented in the collection",
    openPublicPage: "Open the public page for {name}",
    viewPublicPage: "View public page",
    edit: "Edit",
    markOnLoan: "Mark on loan",
    markAvailable: "Mark available",
    markOnLoanOf: "Mark {title} as on loan",
    markAvailableOf: "Mark {title} as available",
    withdraw: "Withdraw",
    withdrawOf: "Withdraw {title}",
    withdrawConfirm: "Withdraw?",
    yes: "Yes",
    no: "No",
    removing: "Removing…",
    editOf: "Edit {title}",
    form: {
      theBook: "The book",
      title: "Title",
      titlePlaceholder: "Gitanjali",
      titleBn: "Title in Bengali",
      titleBnHint: "Optional. Shown to Bengali readers wherever it exists.",
      titleBnPlaceholder: "গীতাঞ্জলি",
      author: "Author",
      shelf: "Shelf",
      publisher: "Publisher",
      publisherPlaceholder: "Indian Society",
      year: "Year published",
      language: "Language",
      isbn: "ISBN",
      isbnHint: "Or any accession reference for older stock.",
      description: "Description",
      descriptionHint:
        "This is the text search engines index. Write it for a reader.",
      descriptionBn: "Description in Bengali",
      optional: "Optional.",
      inventoryAndFile: "Inventory and file",
      pages: "Pages",
      copies: "Copies",
      status: "Status",
      format: "Format",
      fileSize: "File size (MB)",
      fileSizeHint: "Counts against the 10 GB R2 free tier.",
      bookFile: "Book file",
      choosePdf: "Choose a PDF or EPUB",
      uploadNote:
        "Uploads presigned direct to R2; the demo build serves a sample file instead.",
      feature: "Feature this book on the home page",
      cover: "Cover",
      coverLead: "Upload a cover image, or let the metadata generate one.",
      coverImage: "Cover image",
      chooseCover: "Choose an image",
      removeCover: "Remove cover",
      coverUploadNote:
        "WebP or JPEG, up to 2 MB. Saved as /covers/{slug}.webp.",
      scheme: "Scheme",
      save: "Save changes",
      add: "Add to the library",
      cancel: "Cancel",
      viewCatalogue: "View the catalogue",
      writerName: "Name",
      writerNamePlaceholder: "Rabindranath Tagore",
      writerNameBn: "Name in Bengali",
      writerNameBnPlaceholder: "রবীন্দ্রনাথ ঠাকুর",
      era: "Era",
      eraHint: "Birth and death years, e.g. 1861-1941.",
      biography: "Biography",
      biographyBn: "Biography in Bengali",
      addWriterButton: "Add writer",
      shelfName: "Name",
      shelfNamePlaceholder: "Biography",
      shelfNameBn: "Name in Bengali",
      shelfNameBnPlaceholder: "জীবনী",
      shelfDescription: "Description",
      shelfDescriptionHint: "Shown on the public category card.",
      shelfDescriptionBn: "Description in Bengali",
      icon: "Icon",
      createShelf: "Create shelf",
      iconBookOpen: "Open book",
      iconFeather: "Quill",
      iconLandmark: "Landmark",
      iconAtom: "Atom",
      iconBaby: "Child",
      iconLibrary: "Shelf",
    },
    messages: {
      needsAttention: "Some fields need attention.",
      created: "{title} is on the shelf as {code}.",
      saved: "Changes saved.",
      gone: "That book no longer exists.",
      missingId: "Missing book id.",
      writerAdded: "{name} added.",
      shelfCreated: "{name} shelf created.",
    },
    errors: {
      title: "A title is required.",
      author: "Choose an author.",
      category: "Choose a category.",
      publisher: "Who published it?",
      yearInt: "Use a four-digit year.",
      yearMin: "Before 1400 is out of scope for this catalogue.",
      yearMax: "That year is in the future.",
      isbn: "An ISBN or accession reference is required.",
      pagesMin: "A book has at least one page.",
      pagesMax: "That is more pages than any single volume.",
      descriptionShort: "Give readers at least a sentence or two.",
      descriptionLong: "That is longer than the catalogue stores.",
      copiesMin: "At least one copy.",
      copiesMax: "That many copies needs a warehouse, not a shelf.",
      fileSizeMin: "File size is needed for the storage budget.",
      fileSizeMax: "Split anything over 512 MB before uploading.",
      name: "A name is required.",
      nameBnRequired: "The Bengali name is required.",
      bio: "A sentence or two of biography, please.",
      shelfDescription: "Describe what belongs on this shelf.",
      notAuthorised: "Not authorised.",
    },
  },

  footer: {
    library: "Library",
    about: "About",
    legal: "Legal",
    allBooks: "All books",
    ourMission: "Our mission",
    privacy: "Privacy policy",
    terms: "Terms of use",
    copyright: "Copyright",
    rights: "© {year} {name}. Free to read, free to share.",
  },
};
