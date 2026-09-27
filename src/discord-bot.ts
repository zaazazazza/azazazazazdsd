import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  Partials,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
  type TextChannel,
  type Message,
  type PermissionResolvable,
} from "discord.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchKomerzaProducts,
  productImageUrls,
  type KomerzaProduct,
} from "./lib/komerza";

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const PREFIX = "+";
const CATALOG_CHANNEL_ID =
  process.env.DISCORD_CATALOG_CHANNEL_ID ?? "1553571397312454748";
const shopBannerPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../banner.jpg",
);
const shopBannerName = "banner.jpg";
const CATALOG_PRODUCTS_PER_PAGE = 1;
const overridesPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../data/discord-overrides.json",
);
const disabledCategoriesPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../data/disabled-categories.json",
);
const catalogStatePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../data/catalog-state.json",
);
const syncMinutes = Number(process.env.KOMERZA_SYNC_MINUTES ?? 10);
const syncIntervalMs = Math.max(5, Number.isFinite(syncMinutes) ? syncMinutes : 10) * 60_000;
const token = process.env.DISCORD_BOT_TOKEN?.trim();
const products = new Map<string, KomerzaProduct>();
type ProductOverride = { price?: number; imageUrl?: string; title?: string; fees?: number; hidden?: boolean; featured?: boolean };
const overrides = new Map<string, ProductOverride>();
const disabledCategories = new Set<string>();
const deletedProductIds = new Set<string>();
const localProducts = new Map<string, KomerzaProduct>();
type CatalogState = {
  overrides?: Record<string, ProductOverride>;
  disabledCategories?: string[];
  deletedProductIds?: string[];
  localProducts?: KomerzaProduct[];
};
type CatalogPage = { category: string; products: KomerzaProduct[] };
let catalogPages: CatalogPage[] = [];
const pendingImageUploads = new Map<
  string,
  { productId: string; expiresAt: number }
>();

if (existsSync(overridesPath)) {
  try {
    const saved = JSON.parse(readFileSync(overridesPath, "utf8")) as Record<string, ProductOverride>;
    for (const [productId, override] of Object.entries(saved)) overrides.set(productId, override);
  } catch (error) {
    console.error("[Admin] Impossible de charger les modifications sauvegardees :", error);
  }
}

function saveOverrides() {
  mkdirSync(dirname(overridesPath), { recursive: true });
  writeFileSync(overridesPath, JSON.stringify(Object.fromEntries(overrides), null, 2), "utf8");
  saveCatalogState();
}

if (existsSync(disabledCategoriesPath)) {
  try {
    const saved = JSON.parse(readFileSync(disabledCategoriesPath, "utf8")) as string[];
    for (const category of saved) disabledCategories.add(category);
  } catch (error) {
    console.error("[Admin] Impossible de charger les categories desactivees :", error);
  }
}

if (existsSync(catalogStatePath)) {
  try {
    const saved = JSON.parse(readFileSync(catalogStatePath, "utf8")) as CatalogState;
    for (const [productId, override] of Object.entries(saved.overrides ?? {})) overrides.set(productId, override);
    for (const category of saved.disabledCategories ?? []) disabledCategories.add(category);
    for (const productId of saved.deletedProductIds ?? []) deletedProductIds.add(productId);
    for (const product of saved.localProducts ?? []) localProducts.set(product.id, product);
  } catch (error) {
    console.error("[Catalog] Impossible de charger l’état sauvegarde :", error);
  }
}

function saveCatalogState() {
  mkdirSync(dirname(catalogStatePath), { recursive: true });
  writeFileSync(catalogStatePath, JSON.stringify({
    overrides: Object.fromEntries(overrides),
    disabledCategories: [...disabledCategories],
    deletedProductIds: [...deletedProductIds],
    localProducts: [...localProducts.values()],
  }, null, 2), "utf8");
}

function saveCategorySettings() {
  mkdirSync(dirname(disabledCategoriesPath), { recursive: true });
  writeFileSync(disabledCategoriesPath, JSON.stringify([...disabledCategories], null, 2), "utf8");
  saveCatalogState();
}

if (!token || token.startsWith("remplace_")) {
  console.error("[Discord] DISCORD_BOT_TOKEN est manquant dans le fichier .env.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

function isAdmin(message: Message): boolean {
  return Boolean(
    message.member?.permissions.has("Administrator") ||
      message.member?.permissions.has("ManageGuild") ||
      (process.env.DISCORD_ADMIN_USER_IDS ?? "")
        .split(",")
        .map((id) => id.trim())
        .includes(message.author.id),
  );
}

function productPrice(product: KomerzaProduct): number | null {
  const override = overrides.get(product.id)?.price;
  if (override !== undefined) return override;
  return (
    product.variants?.find((variant) => typeof variant.cost === "number")?.cost ??
    null
  );
}

function productTitle(product: KomerzaProduct): string {
  return overrides.get(product.id)?.title?.trim() || product.name;
}

function productCategory(product: KomerzaProduct): string {
  const name = product.name.toLowerCase();
  if (/epicgames|valorant|logs/.test(name)) return "Logs EpicGames & Valorant";
  if (/spotify|netflix|crunchyroll/.test(name)) return "Streaming";
  if (/^g3n\b/.test(name)) return "G3N";
  if (/vpn/.test(name)) return "VPN";
  if (/nfa|skins?|v ?bucks|twitch prime|leviathan|omega|bonnet bleue/.test(name)) {
    return "Fortnite / NFA";
  }
  if (/cloud|checker|combo|multichecker/.test(name)) return "Cloud / Checkers";
  return "Autres produits";
}

function productEmbed(product: KomerzaProduct): EmbedBuilder {
  const override = overrides.get(product.id);
  const imageUrl = override?.imageUrl ?? productImageUrls(product)[0];
  const price = productPrice(product);
  const embed = new EmbedBuilder()
    .setTitle(product.name)
    .setColor(0x2ecc71)
    .addFields(
      {
        name: "Prix",
        value: price === null ? "Non renseigne" : `${price.toFixed(2)} EUR`,
        inline: true,
      },
    );

  if (imageUrl) embed.setThumbnail(imageUrl);
  return embed;
}

function catalogEmbed(product: KomerzaProduct): EmbedBuilder {
  const override = overrides.get(product.id);
  const imageUrl = override?.imageUrl;
  const price = productPrice(product);
  const embed = new EmbedBuilder()
    .setTitle(`${override?.featured ? "★ " : ""}${productTitle(product)}`)
    .setAuthor({ name: `KOMERZA · ${productCategory(product).toUpperCase()}` })
    .setDescription("Produit disponible chez Sicario Shop")
    .setColor(0x8e44ad)
    .addFields(
      {
        name: "PRIX",
        value: price === null ? "**Sur demande**" : `**${price.toFixed(2)} EUR**`,
        inline: true,
      },
      ...(override?.fees !== undefined
        ? [{ name: "FRAIS", value: `**${override.fees.toFixed(2)} EUR**`, inline: true }]
        : []),
    )
    .setFooter({ text: "Catalogue Komerza · utilisez les boutons pour naviguer" });
  if (imageUrl) {
    embed.setImage(imageUrl);
  } else if (existsSync(shopBannerPath)) {
    embed.setImage(`attachment://${shopBannerName}`);
  }
  if (existsSync(shopBannerPath)) {
    embed.setThumbnail(`attachment://${shopBannerName}`);
  }
  return embed;
}

function catalogComponents(pageIndex: number, privateView = false) {
  const category = catalogPages[pageIndex]?.category;
  const categoryIndexes = catalogPages
    .map((page, index) => (page.category === category ? index : -1))
    .filter((index) => index >= 0);
  const categoryPosition = categoryIndexes.indexOf(pageIndex);
  const prefix = privateView ? "catalog-private" : "catalog-page";
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${prefix}-prev:${pageIndex}`)
        .setLabel("Page precedente")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(categoryPosition <= 0),
      new ButtonBuilder()
        .setCustomId(`${prefix}-next:${pageIndex}`)
        .setLabel("Page suivante")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(categoryPosition >= categoryIndexes.length - 1),
    ),
  ];
}

function categorySelectMenu() {
  const categories = [...new Set(catalogPages.map((page) => page.category))];
  const menu = new StringSelectMenuBuilder()
    .setCustomId("catalog-category-select")
    .setPlaceholder("Choisir une categorie")
    .addOptions(
      categories.map((category) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(category.slice(0, 100))
          .setValue(category.slice(0, 100))
          .setDescription(
            `${catalogPages.filter((page) => page.category === category).length} page(s)`,
          ),
      ),
    );
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("catalog-search")
        .setLabel("Rechercher un produit")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function catalogPageEmbeds(pageIndex: number) {
  return catalogPages[pageIndex].products.map(catalogEmbed);
}

function catalogFiles() {
  const files = [];
  if (existsSync(shopBannerPath)) {
    files.push(new AttachmentBuilder(shopBannerPath, { name: shopBannerName }));
  }
  return files;
}

function shopCategoryEmbed() {
  const categorySummary = [...new Set([...products.values()].map(productCategory))]
    .map((category) => {
      const count = [...products.values()].filter(
        (product) => productCategory(product) === category,
      ).length;
      return `• **${category}** · ${count} produit(s)`;
    })
    .join("\n");
  const embed = new EmbedBuilder()
    .setAuthor({ name: "SICARIO SHOP · KOMERZA" })
    .setTitle("Bienvenue dans le catalogue")
    .setDescription(
      "Retrouve ici les produits disponibles de Sicario Shop.\n\n" +
        "Utilise le bouton ci-dessous pour parcourir le catalogue produit par produit. " +
        "Chaque page affiche le prix et l’image du produit. La navigation est privee : " +
        "ta page ne change pas celle des autres membres.\n\n" +
        "**Categories disponibles**\n" +
        (categorySummary || "Aucune categorie disponible"),
    )
    .setColor(0x8e44ad)
    .addFields(
      { name: "CATEGORIES", value: String(new Set([...products.values()].map(productCategory)).size), inline: true },
      { name: "PRODUITS", value: String(products.size), inline: true },
      { name: "ACCES", value: "Ouvert a tous", inline: true },
    )
    .setFooter({ text: "Catalogue synchronise depuis Komerza" });
  if (existsSync(shopBannerPath)) embed.setImage(`attachment://${shopBannerName}`);
  return embed;
}

function shopCategoryButtons() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("catalog-open")
        .setLabel("Ouvrir le catalogue")
        .setStyle(ButtonStyle.Primary),
    ),
  ];
}

function catalogPageContent(pageIndex: number) {
  const page = catalogPages[pageIndex];
  return `**CATALOGUE KOMERZA** · ${page.category}\npage ${pageIndex + 1}/${catalogPages.length} · ${page.products.length} produit(s)`;
}

async function publishCatalog(): Promise<number> {
  const channel = await client.channels.fetch(CATALOG_CHANNEL_ID);
  if (!channel?.isTextBased() || channel.isDMBased()) {
    throw new Error(`Le salon catalogue ${CATALOG_CHANNEL_ID} est introuvable ou n’est pas textuel`);
  }
  const textChannel = channel as TextChannel;
  const previousMessages = await textChannel.messages.fetch({ limit: 100 });
  for (const previousMessage of previousMessages.values()) {
    if (previousMessage.author.id === client.user?.id && previousMessage.deletable) {
      await previousMessage.delete().catch(() => undefined);
    }
  }

  const groupedProducts = new Map<string, KomerzaProduct[]>();
  for (const product of products.values()) {
    if (overrides.get(product.id)?.hidden) continue;
    const category = productCategory(product);
    if (disabledCategories.has(category)) continue;
    const categoryProducts = groupedProducts.get(category) ?? [];
    categoryProducts.push(product);
    groupedProducts.set(category, categoryProducts);
  }
  catalogPages = [];
  for (const [category, categoryProducts] of groupedProducts) {
    for (let index = 0; index < categoryProducts.length; index += CATALOG_PRODUCTS_PER_PAGE) {
      catalogPages.push({
        category,
        products: categoryProducts.slice(index, index + CATALOG_PRODUCTS_PER_PAGE),
      });
    }
  }
  if (catalogPages.length === 0) return 0;

  await textChannel.send({
    content: "**SICARIO SHOP** · catalogue officiel",
    embeds: [shopCategoryEmbed()],
    components: shopCategoryButtons(),
    files: catalogFiles(),
  });
  return products.size;
}

async function syncProductsFromKomerza(): Promise<{ added: number; changed: number; removed: number; priceChanged: number; stockChanged: number }> {
  const fetchedProducts = await fetchKomerzaProducts();
  const previous = new Map(products);
  products.clear();
  for (const product of fetchedProducts) {
    if (!deletedProductIds.has(product.id)) products.set(product.id, product);
  }
  for (const product of localProducts.values()) products.set(product.id, product);
  const added = fetchedProducts.filter((product) => !previous.has(product.id)).length;
  const removed = [...previous.keys()].filter((id) => !products.has(id)).length;
  const priceChanged = fetchedProducts.filter((product) => {
    const before = previous.get(product.id);
    return before && productPrice(before) !== productPrice(product);
  }).length;
  const stockChanged = fetchedProducts.filter((product) => {
    const before = previous.get(product.id);
    return before && before.stock !== product.stock;
  }).length;
  const changed = fetchedProducts.filter((product) => {
    const before = previous.get(product.id);
    return before && (before.name !== product.name || before.stock !== product.stock || JSON.stringify(before.variants) !== JSON.stringify(product.variants));
  }).length;
  return { added, changed, removed, priceChanged, stockChanged };
}

async function runAutomaticSync() {
  try {
    const result = await syncProductsFromKomerza();
    if (result.added || result.changed || result.removed) {
      await publishCatalog();
      const channel = await client.channels.fetch(CATALOG_CHANNEL_ID);
      if (channel?.isTextBased() && !channel.isDMBased()) {
        const updateMessage = await (channel as TextChannel).send(
          `Catalogue mis a jour : +${result.added}, ${result.changed} modifie(s), ${result.removed} retire(s), ${result.priceChanged} alerte(s) de prix, ${result.stockChanged} disponibilite(s) changee(s).`,
        );
        setTimeout(() => {
          void updateMessage.delete().catch(() => undefined);
        }, 5_000);
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[Komerza] Synchronisation automatique en erreur :", detail);
  }
}

async function syncKomerza(message: Message) {
  await message.reply("Synchronisation du catalogue Komerza en cours...");
  const result = await syncProductsFromKomerza();

  await message.reply({
    content: `Catalogue synchronise : ${products.size} produit(s). (+${result.added}, ${result.changed} modifie(s), ${result.removed} retire(s))`,
  });
}

function normalizeCatalogueProductName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const excludedCatalogueTextProducts = new Set([
  "1 MONTH CHECKER + CLOUD COMBO PRIVATE",
  "1 WEEK CHECKER + CLOUD COMBO PRIVATE",
  "3 DAY CHECKER + CLOUD COMBO PRIVATE",
  "LIFETIME CHECKER + CLOUD COMBO PRIVATE",
  "NFA 1K VBU INA",
  "NFA 1K VBUCK INA",
  "L0GS REGULAR",
  "NFA 225 skins STW Faucheur Omega Bonnet bleue 1100 VB",
  "NFA 33 SKIN TWITCH INA 1400 DAY",
  "NFA 39 SKIN BONNET BLEUE INA 1400 DAY",
  "NFA Skins 193Omega,Blue Squire,The Reaper,Ikonic,glow INA 2 SAIS",
  "NFA Skins: 106 Rare: Leviathan Axe INA (237 days ago)",
  "NFA Skins: 137 Astro jack Dernière partie (101 days ago)",
  "NFA Skins: 40 Rare: Bonnet bleue,OG STW INA (1404 days ago)",
  "NFA Skins: 41 Twitch Prime, Valor, Omega ina: 04.12.22",
  "NFA Skins: 45 Rare: Omega INA 15 SAISON",
  "NFA Skins: 95 Leviathan Axe INA 3 SAISON",
  "Skins: 41 Axe leviathan derniere saison Saison 24 PIN:100 110",
  "LIFETIME CLOUD COMBO EPICGAMES AND ULP",
].map(normalizeCatalogueProductName));

function catalogueTextEmbeds(): { embeds: EmbedBuilder[]; productCount: number } {
  const visibleProducts = [...products.values()]
    .filter((product) => !overrides.get(product.id)?.hidden && !disabledCategories.has(productCategory(product)))
    .filter((product) => !excludedCatalogueTextProducts.has(normalizeCatalogueProductName(product.name)) && !excludedCatalogueTextProducts.has(normalizeCatalogueProductName(productTitle(product))))
    .sort((first, second) => productCategory(first).localeCompare(productCategory(second), "fr") || productTitle(first).localeCompare(productTitle(second), "fr"));
  const descriptions: string[] = [];
  let currentDescription = "";
  let currentCategory = "";

  for (const product of visibleProducts) {
    const category = productCategory(product);
    const normalizedName = normalizeCatalogueProductName(product.name);
    const normalizedTitle = normalizeCatalogueProductName(productTitle(product));
    const isLifetimeG3n = normalizedName === "g3n lifetime" || normalizedTitle === "g3n lifetime";
    const price = isLifetimeG3n ? 20 : productPrice(product);
    const priceText = price === null ? "Sur demande" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price);
    const productHeading = `### <:star:1528189527330390126> ${productTitle(product).replace(/\s+/g, " ").slice(0, 200)}\n`;
    let entry = `${category !== currentCategory ? `## ${category}\n` : ""}${productHeading}*<:moneybag:1545824269181653042> Prix :* **${priceText}**\n\n`;

    if (currentDescription.length + entry.length > 3_400) {
      descriptions.push(currentDescription.trimEnd());
      currentDescription = "";
      currentCategory = "";
      entry = `## ${category}\n${productHeading}*<:moneybag:1545824269181653042> Prix :* **${priceText}**\n\n`;
    }
    currentDescription += entry;
    currentCategory = category;
  }

  if (visibleProducts.length === 0) currentDescription = "### Aucun produit visible\n*Le catalogue ne contient aucun produit à afficher.*";
  descriptions.push(currentDescription.trimEnd());

  const embeds = descriptions.map((description, index) => new EmbedBuilder()
    .setColor(0x8e44ad)
    .setTitle("<:star:1528189527330390126> SICARIO SHOP · CATALOGUE KOMERZA")
    .setDescription(
      `# Catalogue actualisé\n***Synchronisé le <t:${Math.floor(Date.now() / 1000)}:F>***\n**${visibleProducts.length} produit${visibleProducts.length > 1 ? "s" : ""}** · Page ${index + 1}/${descriptions.length}\n\n${description}`,
    )
    .setFooter({ text: "Prix synchronisés depuis Komerza · Tarifs en EUR" }));
  return { embeds, productCount: visibleProducts.length };
}

async function sendCatalogueText(): Promise<number> {
  const channel = await client.channels.fetch(CATALOG_CHANNEL_ID);
  if (!channel?.isTextBased() || channel.isDMBased()) {
    throw new Error(`Le salon catalogue ${CATALOG_CHANNEL_ID} est introuvable ou n’est pas textuel`);
  }

  const catalogue = catalogueTextEmbeds();
  for (const embed of catalogue.embeds) {
    await (channel as TextChannel).send({ embeds: [embed], allowedMentions: { parse: [] } });
  }
  return catalogue.productCount;
}

function adminHelp() {
  return [
    "**Commandes admin**",
    "`+admin formulaire <id>` ouvre le formulaire produit.",
    "`+admin prix <id> <montant>` modifie le prix.",
    "`+admin image <id>` avec une image jointe ajoute l’image au produit.",
    "Le formulaire accepte titre, frais, masquage et mise en avant.",
    "Le bouton Creer ajoute un produit local au catalogue Discord.",
    "`+admin liste` affiche les produits synchronises.",
  ].join("\n");
}

function adminPanel() {
  return new EmbedBuilder()
    .setTitle("Komerza Admin Center")
    .setDescription(
      "Gere le catalogue depuis Discord. Les changements de prix et d’image sont appliques au prochain affichage.",
    )
    .setColor(0x5865f2)
    .addFields(
      { name: "Produits charges", value: String(products.size), inline: true },
      { name: "Modifications", value: String(overrides.size), inline: true },
      { name: "Salon catalogue", value: `<#${CATALOG_CHANNEL_ID}>`, inline: true },
      { name: "Prefixe", value: "`+`", inline: true },
    )
    .setFooter({ text: "Acces reserve aux administrateurs du serveur" });
}

function adminButtons() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("komerza-admin-sync")
        .setLabel("Synchroniser Komerza")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("komerza-admin-publish")
        .setLabel("Publier le catalogue")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("komerza-admin-products")
        .setLabel("Produits")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("komerza-admin-create")
        .setLabel("Creer un produit")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("komerza-admin-help")
        .setLabel("Aide")
        .setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("komerza-admin-popular")
        .setLabel("Produits populaires")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("komerza-admin-categories")
        .setLabel("Activer categories")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("komerza-admin-text")
        .setLabel("Envoyer le texte du catalogue")
        .setStyle(ButtonStyle.Success),
    ),
  ];
}

function adminCategoryMenu() {
  const categories = [...new Set([...products.values()].map(productCategory))];
  const menu = new StringSelectMenuBuilder()
    .setCustomId("komerza-admin-category-toggle")
    .setPlaceholder("Choisir une categorie a activer/desactiver")
    .addOptions(
      categories.map((category) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(category.slice(0, 100))
          .setValue(category.slice(0, 100))
          .setDescription(disabledCategories.has(category) ? "Desactivee" : "Active"),
      ),
    );
  return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)];
}

function popularProductsEmbed() {
  const popular = [...products.values()]
    .sort((left, right) => Number(right.isBestSeller) - Number(left.isBestSeller) || (left.order ?? 9999) - (right.order ?? 9999))
    .slice(0, 10);
  const description = popular.length
    ? popular.map((product, index) => `${index + 1}. **${productTitle(product)}**${product.isBestSeller ? " · best-seller" : ""}`).join("\n")
    : "Aucun produit synchronise.";
  return new EmbedBuilder()
    .setTitle("Produits populaires")
    .setDescription(description)
    .setColor(0xf1c40f)
    .setFooter({ text: "Classement base sur les indicateurs Komerza" });
}

function createProductModal() {
  const modal = new ModalBuilder()
    .setCustomId("komerza-admin-create-form")
    .setTitle("Creer un produit local");
  const nameInput = new TextInputBuilder()
    .setCustomId("name")
    .setLabel("Nom du produit")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const priceInput = new TextInputBuilder()
    .setCustomId("price")
    .setLabel("Prix EUR")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  const categoryInput = new TextInputBuilder()
    .setCustomId("category")
    .setLabel("Categorie (mot-cle dans le nom)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(priceInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput),
  );
  return modal;
}

function adminProductEmbed(product: KomerzaProduct) {
  const override = overrides.get(product.id);
  return new EmbedBuilder()
    .setTitle(productTitle(product))
    .setColor(0x5865f2)
    .setDescription(`ID interne : \`${product.id}\``)
    .addFields(
      { name: "Categorie", value: productCategory(product), inline: true },
      { name: "Prix", value: productPrice(product)?.toFixed(2) ?? "Sur demande", inline: true },
      { name: "Etat", value: override?.hidden ? "Masque" : "Visible", inline: true },
      { name: "Vedette", value: override?.featured ? "Oui" : "Non", inline: true },
    );
}

function adminProductMenus() {
  const visibleProducts = [...products.values()];
  const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
  for (let index = 0; index < visibleProducts.length; index += 25) {
    const options = visibleProducts.slice(index, index + 25).map((product) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(productTitle(product).slice(0, 100))
        .setValue(product.id)
        .setDescription(`${productCategory(product)}${overrides.get(product.id)?.hidden ? " · masque" : ""}`.slice(0, 100)),
    );
    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`komerza-admin-product-select:${index / 25}`)
          .setPlaceholder(`Produits ${index + 1}-${Math.min(index + 25, visibleProducts.length)}`)
          .addOptions(options),
      ),
    );
  }
  return rows;
}

function adminProductActions(productId: string, hidden: boolean) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`komerza-admin-product-edit:${productId}`)
        .setLabel("Modifier")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`komerza-admin-product-hide:${productId}`)
        .setLabel(hidden ? "Afficher" : "Masquer")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`komerza-admin-product-delete:${productId}`)
        .setLabel("Supprimer")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`komerza-admin-product-duplicate:${productId}`)
        .setLabel("Dupliquer")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function isInteractionAdmin(interaction: {
  memberPermissions: { has: (permission: PermissionResolvable) => boolean } | null;
}) {
  return Boolean(
    interaction.memberPermissions?.has("Administrator") ||
      interaction.memberPermissions?.has("ManageGuild"),
  );
}

function adminModal(productId: string) {
  const modal = new ModalBuilder()
    .setCustomId("komerza-admin-form")
    .setTitle("Modifier un produit Komerza");
  const idInput = new TextInputBuilder()
    .setCustomId("product-id")
    .setLabel("ID du produit")
    .setStyle(TextInputStyle.Short)
    .setValue(productId)
    .setRequired(true);
  const priceInput = new TextInputBuilder()
    .setCustomId("price")
    .setLabel("Prix EUR optionnel")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Titre optionnel")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const feesInput = new TextInputBuilder()
    .setCustomId("fees")
    .setLabel("Frais EUR optionnels")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const flagsInput = new TextInputBuilder()
    .setCustomId("flags")
    .setLabel("Options: hidden=true, featured=true")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(idInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(priceInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(feesInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(flagsInput),
  );
  return modal;
}

function searchModal() {
  const modal = new ModalBuilder()
    .setCustomId("catalog-search-form")
    .setTitle("Rechercher dans le catalogue");
  const queryInput = new TextInputBuilder()
    .setCustomId("query")
    .setLabel("Produit, mot-cle ou categorie")
    .setPlaceholder("ex: fortnite, spotify, cloud")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(queryInput));
  return modal;
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[Discord] Connecte en tant que ${readyClient.user.tag}`);
  console.log(`[Komerza] Synchronisation automatique toutes les ${syncMinutes} minute(s)`);
  void runAutomaticSync();
  setInterval(() => void runAutomaticSync(), syncIntervalMs);
  console.log("[Discord] Commandes : +komerza, +admin, +recherche, +produit");
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channel = await client.channels.fetch(CATALOG_CHANNEL_ID);
    if (!channel?.isTextBased() || channel.isDMBased()) return;
    const welcomeMessage = await (channel as TextChannel).send(
      `Bienvenue <@${member.id}> sur **Sicario Shop** !`,
    );
    setTimeout(() => {
      void welcomeMessage.delete().catch(() => undefined);
    }, 3_000);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[Discord] Message de bienvenue impossible :", detail);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const uploadKey = `${message.channelId}:${message.author.id}`;
  const pendingUpload = pendingImageUploads.get(uploadKey);
  if (pendingUpload) {
    pendingImageUploads.delete(uploadKey);
    if (pendingUpload.expiresAt < Date.now()) {
      await message.reply("Le delai d’upload est expire. Relance le formulaire admin.");
      return;
    }
    const attachment = message.attachments.find((item) =>
      item.contentType?.startsWith("image/"),
    );
    if (!attachment) {
      await message.reply("Je n’ai pas trouve d’image jointe. Envoie un fichier image ou relance le formulaire.");
      return;
    }
    overrides.set(pendingUpload.productId, {
      ...overrides.get(pendingUpload.productId),
      imageUrl: attachment.url,
    });
    saveOverrides();
    await message.reply(`Image du produit ${pendingUpload.productId} enregistree.`);
    return;
  }

  if (!message.content.startsWith(PREFIX)) return;
  const [command, subcommand, value, extra] = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  try {
    if (command.toLowerCase() === "ping") {
      await message.reply("Pong ! Le bot Discord est en ligne.");
      return;
    }
    if (command.toLowerCase() === "komerza") {
      await syncKomerza(message);
      const publishedCount = await publishCatalog();
      await message.reply(`${publishedCount} produit(s) publie(s) dans <#${CATALOG_CHANNEL_ID}>.`);
      return;
    }
    if (command.toLowerCase() === "recherche" || command.toLowerCase() === "produit") {
      const query = [subcommand, value, extra].filter(Boolean).join(" ").toLowerCase();
      if (!query) {
        await message.reply("Utilise `+recherche fortnite` ou le bouton de recherche du catalogue.");
        return;
      }
      const results = [...products.values()].filter((product) => {
        if (overrides.get(product.id)?.hidden) return false;
        return `${productTitle(product)} ${productCategory(product)}`.toLowerCase().includes(query);
      });
      await message.reply({
        content: results.length ? `${results.length} resultat(s) pour « ${query} »` : `Aucun produit pour « ${query} »`,
        embeds: results.slice(0, 10).map(catalogEmbed),
        files: results.length ? catalogFiles() : [],
      });
      return;
    }
    if (command.toLowerCase() !== "admin") return;
    if (!isAdmin(message)) {
      await message.reply("Permission refusee. Commande reservee aux administrateurs.");
      return;
    }
    if (!subcommand || subcommand.toLowerCase() === "panel") {
      await message.reply({ embeds: [adminPanel()], components: adminButtons() });
      return;
    }
    if (subcommand.toLowerCase() === "produits") {
      await message.reply({
        embeds: [new EmbedBuilder().setTitle("Gestion des produits").setDescription("Choisis un produit pour ouvrir ses actions admin.").setColor(0x5865f2)],
        components: adminProductMenus(),
      });
      return;
    }

    if (subcommand.toLowerCase() === "formulaire") {
      await message.reply({
        content: "Clique sur le bouton pour ouvrir le formulaire.",
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`komerza-admin-open:${value ?? ""}`)
              .setLabel("Modifier le produit")
              .setStyle(ButtonStyle.Primary),
          ),
        ],
      });
      return;
    }

    if (subcommand.toLowerCase() === "prix" && value && extra) {
      const price = Number(extra.replace(",", "."));
      if (!products.has(value) || !Number.isFinite(price) || price < 0) {
        await message.reply("Produit inconnu ou prix invalide. Lance `+komerza` d’abord.");
        return;
      }
      overrides.set(value, { ...overrides.get(value), price });
      saveOverrides();
      await message.reply(`Prix du produit ${value} modifie a ${price.toFixed(2)} EUR.`);
      return;
    }

    if (subcommand.toLowerCase() === "image" && value) {
      const attachment = message.attachments.first();
      if (!products.has(value) || !attachment) {
        await message.reply("Utilise `+admin image <id>` avec une image jointe, après `+komerza`.");
        return;
      }
      overrides.set(value, { ...overrides.get(value), imageUrl: attachment.url });
      saveOverrides();
      await message.reply(`Image du produit ${value} mise a jour.`);
      return;
    }

    if (subcommand.toLowerCase() === "liste") {
      await message.reply(
        [...products.values()]
          .slice(0, 20)
          .map((product) => `\`${product.id}\` - ${product.name}`)
          .join("\n") || "Aucun produit. Lance `+komerza`.",
      );
      return;
    }
    await message.reply(adminHelp());
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[Discord] Commande en erreur :", detail);
    await message.reply("La commande a echoue. Consulte la console du bot.");
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton() && interaction.customId === "catalog-search") {
    await interaction.showModal(searchModal());
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === "catalog-search-form") {
    const query = interaction.fields.getTextInputValue("query").trim().toLowerCase();
    const results = [...products.values()].filter((product) => {
      if (overrides.get(product.id)?.hidden) return false;
      return `${productTitle(product)} ${productCategory(product)}`.toLowerCase().includes(query);
    });
    if (results.length === 0) {
      await interaction.reply({ content: `Aucun produit trouve pour « ${query} »`, ephemeral: true });
      return;
    }
    await interaction.reply({
      content: `${results.length} resultat(s) pour « ${query} »`,
      embeds: results.slice(0, 10).map(catalogEmbed),
      files: catalogFiles(),
      ephemeral: true,
    });
    return;
  }

  if (interaction.isButton() && interaction.customId === "catalog-open") {
    if (catalogPages.length === 0) {
      await interaction.reply({ content: "Le catalogue est vide. Demande une synchronisation.", ephemeral: true });
      return;
    }
    await interaction.reply({
      content: "Choisis une categorie pour ouvrir son catalogue.",
      embeds: [shopCategoryEmbed()],
      components: categorySelectMenu(),
      files: catalogFiles(),
      ephemeral: true,
    });
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "catalog-category-select") {
    const category = interaction.values[0];
    const pageIndex = catalogPages.findIndex((page) => page.category === category);
    if (pageIndex < 0) {
      await interaction.reply({ content: "Cette categorie n’est plus disponible.", ephemeral: true });
      return;
    }
    await interaction.update({
      content: catalogPageContent(pageIndex),
      embeds: catalogPageEmbeds(pageIndex),
      components: catalogComponents(pageIndex, true),
      files: catalogFiles(),
    });
    return;
  }

  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("catalog-page-prev:") ||
      interaction.customId.startsWith("catalog-page-next:") ||
      interaction.customId.startsWith("catalog-private-prev:") ||
      interaction.customId.startsWith("catalog-private-next:"))
  ) {
    if (catalogPages.length === 0) {
      await interaction.reply({ content: "Le catalogue n’est pas encore publie.", ephemeral: true });
      return;
    }
    const currentPage = Number(interaction.customId.split(":")[1]);
    const privateView = interaction.customId.startsWith("catalog-private-");
    const category = catalogPages[currentPage]?.category;
    const categoryIndexes = catalogPages
      .map((page, index) => (page.category === category ? index : -1))
      .filter((index) => index >= 0);
    const categoryPosition = categoryIndexes.indexOf(currentPage);
    const direction = interaction.customId.includes("-next:") ? 1 : -1;
    const nextPage = categoryIndexes[
      Math.max(0, Math.min(categoryIndexes.length - 1, categoryPosition + direction))
    ];
    if (nextPage === undefined) {
      await interaction.reply({ content: "Cette page n’est plus disponible.", ephemeral: true });
      return;
    }
    if (!privateView) {
      await interaction.reply({
        content: `${catalogPageContent(nextPage)}\nVue privee pour vous.`,
        embeds: catalogPageEmbeds(nextPage),
        components: catalogComponents(nextPage, true),
        files: catalogFiles(),
        ephemeral: true,
      });
    } else {
      await interaction.update({
        content: catalogPageContent(nextPage),
        embeds: catalogPageEmbeds(nextPage),
        components: catalogComponents(nextPage, true),
      });
    }
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-sync") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.deferUpdate();
    try {
      const result = await syncProductsFromKomerza();
      await interaction.editReply({
        content: `Catalogue synchronise : ${products.size} produit(s). +${result.added}, ${result.changed} modifie(s), ${result.removed} retire(s).`,
        embeds: [adminPanel()],
        components: adminButtons(),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Discord] Synchronisation admin en erreur :", detail);
      await interaction.editReply({ content: "La synchronisation Komerza a echoue. Verifie les logs.", embeds: [adminPanel()], components: adminButtons() });
    }
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-text") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      await syncProductsFromKomerza();
      const productCount = await sendCatalogueText();
      await interaction.editReply(`✅ Catalogue synchronisé : ${productCount} produit(s) envoyé(s) dans <#${CATALOG_CHANNEL_ID}>.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Discord] Envoi du texte catalogue en erreur :", detail);
      await interaction.editReply("L’envoi du texte catalogue a échoué. Vérifie la connexion Komerza et les permissions du salon.");
    }
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-list") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    const list = [...products.values()]
      .slice(0, 25)
      .map((product) => `\`${product.id}\` - ${product.name}`)
      .join("\n") || "Aucun produit. Clique sur Synchroniser Komerza.";
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Catalogue Komerza").setDescription(list).setColor(0x2ecc71)], ephemeral: true });
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-products") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.reply({
      embeds: [new EmbedBuilder().setTitle("Gestion des produits").setDescription("Choisis un produit pour ouvrir ses actions admin.").setColor(0x5865f2)],
      components: adminProductMenus(),
      ephemeral: true,
    });
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-popular") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.reply({ embeds: [popularProductsEmbed()], ephemeral: true });
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-categories") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.reply({
      content: "Choisis une categorie pour basculer son affichage global.",
      components: adminCategoryMenu(),
      ephemeral: true,
    });
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "komerza-admin-category-toggle") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    const category = interaction.values[0];
    if (disabledCategories.has(category)) disabledCategories.delete(category);
    else disabledCategories.add(category);
    saveCategorySettings();
    await publishCatalog();
    await interaction.update({
      content: `Categorie **${category}** ${disabledCategories.has(category) ? "desactivee" : "activee"}.`,
      components: adminCategoryMenu(),
    });
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("komerza-admin-product-select:")) {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    const product = products.get(interaction.values[0]);
    if (!product) {
      await interaction.reply({ content: "Produit introuvable. Synchronise le catalogue.", ephemeral: true });
      return;
    }
    await interaction.reply({
      embeds: [adminProductEmbed(product)],
      components: adminProductActions(product.id, Boolean(overrides.get(product.id)?.hidden)),
      ephemeral: true,
    });
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("komerza-admin-product-edit:")) {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.showModal(adminModal(interaction.customId.split(":")[1] ?? ""));
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("komerza-admin-product-duplicate:")) {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    const sourceId = interaction.customId.split(":")[1] ?? "";
    const source = products.get(sourceId);
    if (!source) {
      await interaction.reply({ content: "Produit introuvable.", ephemeral: true });
      return;
    }
    const duplicateId = `local-${Date.now()}`;
    products.set(duplicateId, {
      ...source,
      id: duplicateId,
      name: `${productTitle(source)} - copie`,
      variants: source.variants?.map((variant) => ({ ...variant })),
    });
    localProducts.set(duplicateId, products.get(duplicateId)!);
    const sourceOverride = overrides.get(sourceId);
    if (sourceOverride) overrides.set(duplicateId, { ...sourceOverride });
    saveOverrides();
    await publishCatalog();
    await interaction.reply({ content: `Produit **${productTitle(source)}** duplique.`, ephemeral: true });
    return;
  }

  if (
    interaction.isButton() &&
    (interaction.customId.startsWith("komerza-admin-product-hide:") ||
      interaction.customId.startsWith("komerza-admin-product-delete:") ||
      interaction.customId.startsWith("komerza-admin-product-delete-confirm:") ||
      interaction.customId.startsWith("komerza-admin-product-delete-cancel:"))
  ) {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    const productId = interaction.customId.split(":")[1] ?? "";
    const product = products.get(productId);
    if (!product) {
      await interaction.reply({ content: "Produit introuvable.", ephemeral: true });
      return;
    }
    if (interaction.customId.startsWith("komerza-admin-product-delete-cancel:")) {
      await interaction.update({ embeds: [adminProductEmbed(product)], components: adminProductActions(productId, Boolean(overrides.get(productId)?.hidden)) });
      return;
    }
    if (interaction.customId.startsWith("komerza-admin-product-delete:") && !interaction.customId.startsWith("komerza-admin-product-delete-confirm:")) {
      await interaction.update({
        content: `Confirmer la suppression de **${productTitle(product)}** ?`,
        embeds: [],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`komerza-admin-product-delete-confirm:${productId}`).setLabel("Confirmer").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`komerza-admin-product-delete-cancel:${productId}`).setLabel("Annuler").setStyle(ButtonStyle.Secondary),
        )],
      });
      return;
    }
    if (interaction.customId.startsWith("komerza-admin-product-delete-confirm:")) {
      products.delete(productId);
      localProducts.delete(productId);
      deletedProductIds.add(productId);
      overrides.delete(productId);
      saveOverrides();
      await publishCatalog();
      await interaction.update({ content: `Produit **${productTitle(product)}** supprime du catalogue.`, embeds: [], components: [] });
      return;
    }
    const current = overrides.get(productId) ?? {};
    overrides.set(productId, { ...current, hidden: !current.hidden });
    saveOverrides();
    await publishCatalog();
    await interaction.update({
      embeds: [adminProductEmbed(product)],
      components: adminProductActions(productId, !current.hidden),
    });
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-publish") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
      if (products.size === 0) {
        const fetchedProducts = await fetchKomerzaProducts();
        for (const product of fetchedProducts) products.set(product.id, product);
      }
      const publishedCount = await publishCatalog();
      await interaction.editReply(`${publishedCount} produit(s) publie(s) dans <#${CATALOG_CHANNEL_ID}>.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[Discord] Publication catalogue en erreur :", detail);
      await interaction.editReply("Publication impossible. Verifie les permissions du salon catalogue et les logs.");
    }
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-create") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.showModal(createProductModal());
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === "komerza-admin-create-form") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    const name = interaction.fields.getTextInputValue("name").trim();
    const priceText = interaction.fields.getTextInputValue("price").trim();
    const category = interaction.fields.getTextInputValue("category").trim();
    const price = Number(priceText.replace(",", "."));
    if (!name || !Number.isFinite(price) || price < 0) {
      await interaction.reply({ content: "Nom ou prix invalide.", ephemeral: true });
      return;
    }
    const id = `local-${Date.now()}`;
    products.set(id, {
      id,
      name: category ? `[${category}] ${name}` : name,
      variants: [{ cost: price }],
      stock: 0,
    });
    localProducts.set(id, products.get(id)!);
    saveCatalogState();
    await publishCatalog();
    await interaction.reply({ content: `Produit local **${name}** cree et ajoute au catalogue.`, ephemeral: true });
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-edit") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.showModal(adminModal(""));
    return;
  }

  if (interaction.isButton() && interaction.customId === "komerza-admin-help") {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.reply({ content: adminHelp(), ephemeral: true });
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("komerza-admin-open:")) {
    if (!isInteractionAdmin(interaction)) {
      await interaction.reply({ content: "Permission refusee.", ephemeral: true });
      return;
    }
    await interaction.showModal(adminModal(interaction.customId.split(":")[1] ?? ""));
    return;
  }
  if (!interaction.isModalSubmit() || interaction.customId !== "komerza-admin-form") return;
  if (!isInteractionAdmin(interaction)) {
    await interaction.reply({ content: "Permission refusee.", ephemeral: true });
    return;
  }

  const productId = interaction.fields.getTextInputValue("product-id").trim();
  if (!products.has(productId)) {
    await interaction.reply({ content: "Produit inconnu. Lance d’abord `+komerza`.", ephemeral: true });
    return;
  }
  const priceText = interaction.fields.getTextInputValue("price").trim();
  const title = interaction.fields.getTextInputValue("title").trim();
  const feesText = interaction.fields.getTextInputValue("fees").trim();
  const flags = interaction.fields.getTextInputValue("flags").toLowerCase();
  const price = priceText ? Number(priceText.replace(",", ".")) : undefined;
  const fees = feesText ? Number(feesText.replace(",", ".")) : undefined;
  if (
    (priceText && (!Number.isFinite(price) || (price ?? 0) < 0)) ||
    (feesText && (!Number.isFinite(fees) || (fees ?? 0) < 0))
  ) {
    await interaction.reply({ content: "Prix ou frais invalides.", ephemeral: true });
    return;
  }
  const hidden = flags.includes("hidden=true") ? true : flags.includes("hidden=false") ? false : undefined;
  const featured = flags.includes("featured=true") ? true : flags.includes("featured=false") ? false : undefined;
  overrides.set(productId, {
    ...overrides.get(productId),
    ...(price === undefined ? {} : { price }),
    ...(title ? { title } : {}),
    ...(fees === undefined ? {} : { fees }),
    ...(hidden === undefined ? {} : { hidden }),
    ...(featured === undefined ? {} : { featured }),
  });
  saveOverrides();
  const uploadKey = `${interaction.channelId}:${interaction.user.id}`;
  pendingImageUploads.set(uploadKey, {
    productId,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  await interaction.reply({
    content: "Prix enregistre. Envoie maintenant une image jointe dans ce salon (delai : 5 minutes).",
    ephemeral: true,
  });
});

client.on(Events.Error, (error) => {
  console.error("[Discord] Erreur Gateway :", error.message);
});

process.on("SIGINT", () => {
  client.destroy();
  process.exit(0);
});
process.on("SIGTERM", () => {
  client.destroy();
  process.exit(0);
});

client.login(token).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Discord] Connexion impossible : ${message}`);
  process.exit(1);
});
