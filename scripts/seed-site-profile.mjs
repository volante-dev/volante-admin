import pg from "pg";
import { getSeedProfile } from "./site-profile-data.mjs";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error("Set DATABASE_URL or DATABASE_URL_UNPOOLED before running the seed.");
}

const profile = getSeedProfile();
const client = new Client({ connectionString });

const upsertTranslations = async (table, foreignKey, foreignId, rows, fields) => {
  for (const row of rows) {
    const [locale, ...values] = row;
    const id = `${foreignId}-${locale}`;
    const columns = ["id", foreignKey, "locale", ...fields];
    const params = [id, foreignId, locale, ...values];
    const updates = fields.map((field) => `"${field}" = EXCLUDED."${field}"`).join(", ");

    await client.query(
      `
        INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")})
        VALUES (${params.map((_, index) => `$${index + 1}`).join(", ")})
        ON CONFLICT ("${foreignKey}", "locale")
        DO UPDATE SET ${updates}, "updatedAt" = CURRENT_TIMESTAMP
      `,
      params,
    );
  }
};

try {
  await client.connect();
  await client.query("BEGIN");

  for (const locale of profile.locales) {
    await client.query(
      `
        INSERT INTO "SiteLocale"
          ("code", "label", "nativeLabel", "hreflang", "isDefault", "enabledInAdmin", "publishedOnFront", "aiEnabled", "order")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT ("code")
        DO UPDATE SET
          "label" = EXCLUDED."label",
          "nativeLabel" = EXCLUDED."nativeLabel",
          "hreflang" = EXCLUDED."hreflang",
          "isDefault" = EXCLUDED."isDefault",
          "enabledInAdmin" = EXCLUDED."enabledInAdmin",
          "publishedOnFront" = EXCLUDED."publishedOnFront",
          "aiEnabled" = EXCLUDED."aiEnabled",
          "order" = EXCLUDED."order",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      [
        locale.code,
        locale.label,
        locale.nativeLabel,
        locale.hreflang,
        locale.isDefault,
        locale.enabledInAdmin,
        locale.publishedOnFront,
        locale.aiEnabled,
        locale.order,
      ],
    );
  }

  for (const route of profile.routes) {
    const [
      id,
      label,
      slug,
      order,
      showInHeader,
      showInFooter,
      includeInSitemap,
      sitemapPriority,
      sitemapFrequency,
      translations,
    ] = route;

    await client.query(
      `
        INSERT INTO "SiteRoute"
          ("id", "label", "slug", "order", "showInHeader", "showInFooter", "includeInSitemap", "sitemapPriority", "sitemapFrequency")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT ("id")
        DO UPDATE SET
          "label" = EXCLUDED."label",
          "slug" = EXCLUDED."slug",
          "order" = EXCLUDED."order",
          "showInHeader" = EXCLUDED."showInHeader",
          "showInFooter" = EXCLUDED."showInFooter",
          "includeInSitemap" = EXCLUDED."includeInSitemap",
          "sitemapPriority" = EXCLUDED."sitemapPriority",
          "sitemapFrequency" = EXCLUDED."sitemapFrequency",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      [
        id,
        label,
        slug,
        order,
        showInHeader,
        showInFooter,
        includeInSitemap,
        sitemapPriority,
        sitemapFrequency,
      ],
    );

    await upsertTranslations(
      "SiteRouteTranslation",
      "routeId",
      id,
      Object.entries(translations).map(([locale, values]) => [
        locale,
        values[0],
        values[1],
      ]),
      ["label", "slug"],
    );
  }

  for (const header of profile.pageHeaders) {
    const [id, eyebrow, title, intro] = header;
    await client.query(
      `
        INSERT INTO "PageHeaderContent" ("id", "eyebrow", "title", "intro")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("id")
        DO UPDATE SET
          "eyebrow" = EXCLUDED."eyebrow",
          "title" = EXCLUDED."title",
          "intro" = EXCLUDED."intro",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      [id, eyebrow, title, intro],
    );
  }

  await client.query(
    `
      INSERT INTO "HomePageContent"
        ("id", "eyebrow", "title", "subheading", "primaryCtaLabel", "secondaryCtaLabel")
      VALUES ('home', $1, $2, $3, $4, $5)
      ON CONFLICT ("id")
      DO UPDATE SET
        "eyebrow" = EXCLUDED."eyebrow",
        "title" = EXCLUDED."title",
        "subheading" = EXCLUDED."subheading",
        "primaryCtaLabel" = EXCLUDED."primaryCtaLabel",
        "secondaryCtaLabel" = EXCLUDED."secondaryCtaLabel",
        "updatedAt" = CURRENT_TIMESTAMP
    `,
    [
      profile.homePage.eyebrow,
      profile.homePage.title,
      profile.homePage.subheading,
      profile.homePage.primaryCtaLabel,
      profile.homePage.secondaryCtaLabel,
    ],
  );
  await upsertTranslations(
    "HomePageContentTranslation",
    "contentId",
    "home",
    profile.homePage.translations,
    ["eyebrow", "title", "subheading", "primaryCtaLabel", "secondaryCtaLabel"],
  );

  await client.query(
    `
      INSERT INTO "FooterContent"
        ("id", "tagline", "contactHeading", "contactEmail", "contactSocialLabel", "legalText", "madeWithCare")
      VALUES ('footer', $1, $2, $3, $4, $5, $6)
      ON CONFLICT ("id")
      DO UPDATE SET
        "tagline" = EXCLUDED."tagline",
        "contactHeading" = EXCLUDED."contactHeading",
        "contactEmail" = EXCLUDED."contactEmail",
        "contactSocialLabel" = EXCLUDED."contactSocialLabel",
        "legalText" = EXCLUDED."legalText",
        "madeWithCare" = EXCLUDED."madeWithCare",
        "updatedAt" = CURRENT_TIMESTAMP
    `,
    [
      profile.footer.tagline,
      profile.footer.contactHeading,
      profile.footer.contactEmail,
      profile.footer.contactSocialLabel,
      profile.footer.legalText,
      profile.footer.madeWithCare,
    ],
  );
  await upsertTranslations(
    "FooterContentTranslation",
    "contentId",
    "footer",
    profile.footer.translations,
    [
      "tagline",
      "contactHeading",
      "contactEmail",
      "contactSocialLabel",
      "legalText",
      "madeWithCare",
    ],
  );

  await client.query(
    `
      INSERT INTO "StudioPageContent"
        (
          "id", "eyebrow", "title", "intro",
          "founderOneName", "founderOneRole", "founderOneDescription", "founderOneImageUrl", "founderOneImageAlt",
          "founderTwoName", "founderTwoRole", "founderTwoDescription", "founderTwoImageUrl", "founderTwoImageAlt",
          "historyTitle", "historyContentHtml"
        )
      VALUES ('studio', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT ("id")
      DO UPDATE SET
        "eyebrow" = EXCLUDED."eyebrow",
        "title" = EXCLUDED."title",
        "intro" = EXCLUDED."intro",
        "founderOneName" = EXCLUDED."founderOneName",
        "founderOneRole" = EXCLUDED."founderOneRole",
        "founderOneDescription" = EXCLUDED."founderOneDescription",
        "founderOneImageUrl" = EXCLUDED."founderOneImageUrl",
        "founderOneImageAlt" = EXCLUDED."founderOneImageAlt",
        "founderTwoName" = EXCLUDED."founderTwoName",
        "founderTwoRole" = EXCLUDED."founderTwoRole",
        "founderTwoDescription" = EXCLUDED."founderTwoDescription",
        "founderTwoImageUrl" = EXCLUDED."founderTwoImageUrl",
        "founderTwoImageAlt" = EXCLUDED."founderTwoImageAlt",
        "historyTitle" = EXCLUDED."historyTitle",
        "historyContentHtml" = EXCLUDED."historyContentHtml",
        "updatedAt" = CURRENT_TIMESTAMP
    `,
    [
      profile.studioPage.eyebrow,
      profile.studioPage.title,
      profile.studioPage.intro,
      profile.studioPage.founderOneName,
      profile.studioPage.founderOneRole,
      profile.studioPage.founderOneDescription,
      profile.studioPage.founderOneImageUrl,
      profile.studioPage.founderOneImageAlt,
      profile.studioPage.founderTwoName,
      profile.studioPage.founderTwoRole,
      profile.studioPage.founderTwoDescription,
      profile.studioPage.founderTwoImageUrl,
      profile.studioPage.founderTwoImageAlt,
      profile.studioPage.historyTitle,
      profile.studioPage.historyContentHtml,
    ],
  );

  await client.query("COMMIT");
  console.log(`Seeded site profile: ${process.env.SITE_PROFILE || "generic"}`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
