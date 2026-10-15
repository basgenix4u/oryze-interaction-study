import { expect, test, type Page } from "@playwright/test";

const testBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3001"}`;
const mainSendButton = (page: Page) => page.locator("#demo .send-button");
const tracedEntry = (page: Page) => page.getByText("Relance 2 · tracée", { exact: true });

async function moveToCenter(page: Page, locator: ReturnType<typeof mainSendButton>) {
  await locator.scrollIntoViewIfNeeded();
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error("Le bouton de relance n'a pas de boîte visible.");
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}

test("un relâchement anticipé et un déplacement annulent la relance", async ({ page }) => {
  await page.goto("/");
  const button = mainSendButton(page);
  await moveToCenter(page, button);

  await page.mouse.down();
  await expect(button).toHaveAttribute("data-phase", "hold");
  await page.waitForTimeout(60);
  const pressPhysics = await button.evaluate((element) => ({
    transform: window.getComputedStyle(element).transform,
    shadow: window.getComputedStyle(element).boxShadow,
  }));
  expect(pressPhysics.transform).toBe("matrix(1, 0, 0, 1, 3, 3)");
  expect(pressPhysics.shadow).toBe("rgb(17, 17, 17) 0px 0px 0px 0px");
  await page.waitForTimeout(240);
  await page.mouse.up();
  await expect(button).toHaveAttribute("data-phase", "cancelled");
  await expect(tracedEntry(page)).toHaveCount(0);

  await page.waitForTimeout(700);
  await moveToCenter(page, button);
  const bounds = await button.boundingBox();
  if (!bounds) throw new Error("Le bouton de relance n'a pas de boîte visible.");
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 18, bounds.y + bounds.height / 2);
  await expect(button).toHaveAttribute("data-phase", "cancelled");
  await page.mouse.up();
  await expect(tracedEntry(page)).toHaveCount(0);
});

test("le maintien au pointeur écrit une nouvelle ligne d'historique", async ({ page }) => {
  await page.goto("/");
  const button = mainSendButton(page);
  await moveToCenter(page, button);
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-phase", "hold");
  await expect(button).toHaveAttribute("data-phase", "working", { timeout: 1_600 });
  await expect(button).toHaveAttribute("aria-busy", "true");
  await page.mouse.up();
  await expect(tracedEntry(page)).toHaveCount(1, { timeout: 2_500 });
  await expect(page.locator(".trace-log__row--new .trace-log__time")).toContainText(/\d{2}\/\d{2} · \d{2}:\d{2}/);
  await expect(button).toBeDisabled();
});

test("Espace et Entrée confirment uniquement après maintien", async ({ page }) => {
  await page.goto("/");
  const button = mainSendButton(page);
  await button.focus();
  await expect(button).toHaveCSS("outline-color", "rgb(95, 62, 248)");
  await expect(button).toHaveCSS("outline-offset", "3px");
  await page.keyboard.down("Space");
  await expect(button).toHaveAttribute("data-phase", "hold");
  await page.waitForTimeout(160);
  await page.keyboard.up("Space");
  await expect(button).toHaveAttribute("data-phase", "cancelled");
  await expect(tracedEntry(page)).toHaveCount(0);

  await page.waitForTimeout(700);
  await button.focus();
  await page.keyboard.down("Space");
  await expect(button).toHaveAttribute("data-phase", "hold");
  await page.getByRole("button", { name: "Modifier le texte" }).focus();
  await expect(button).toHaveAttribute("data-phase", "cancelled");
  await page.keyboard.up("Space");
  await expect(tracedEntry(page)).toHaveCount(0);

  await page.waitForTimeout(700);
  await button.focus();
  await page.keyboard.down("Enter");
  await expect(button).toHaveAttribute("data-phase", "hold");
  await expect(button).toHaveAttribute("data-phase", "working", { timeout: 1_600 });
  await page.keyboard.up("Enter");
  await expect(tracedEntry(page)).toHaveCount(1, { timeout: 2_500 });
});

test("un pointeur tactile dispose du maintien raccourci", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>("#demo .send-button");
    if (!button) throw new Error("Bouton principal introuvable.");
    const bounds = button.getBoundingClientRect();
    const pointerInit: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 37,
      pointerType: "touch",
      isPrimary: true,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    };
    button.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
    window.setTimeout(() => {
      button.dispatchEvent(new PointerEvent("pointerup", pointerInit));
    }, 950);
  });

  const button = mainSendButton(page);
  await expect(button).toHaveAttribute("data-phase", "working", { timeout: 1_400 });
  await expect(tracedEntry(page)).toHaveCount(1, { timeout: 2_500 });
});

test("le toucher garde son amplitude de 4 px et un pointercancel annule", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: testBaseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto("/");
  const coarsePointer = await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches);
  expect(coarsePointer).toBe(true);

  const button = mainSendButton(page);
  await button.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 41,
      pointerType: "touch",
      isPrimary: true,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    }));
  });
  await page.waitForTimeout(70);
  const pressTransform = await button.evaluate((element) => window.getComputedStyle(element).transform);
  expect(pressTransform).toBe("matrix(1, 0, 0, 1, 4, 4)");

  await button.evaluate((element) => element.dispatchEvent(new PointerEvent("pointercancel", {
    bubbles: true,
    cancelable: true,
    pointerId: 41,
    pointerType: "touch",
    isPrimary: true,
  })));
  await expect(button).toHaveAttribute("data-phase", "cancelled");
  await expect(tracedEntry(page)).toHaveCount(0);
  await context.close();
});

test("reduced motion raccourcit le maintien sans retirer le changement d'état", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const button = mainSendButton(page);
  await moveToCenter(page, button);
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-phase", "working", { timeout: 900 });
  await page.mouse.up();
  await expect(tracedEntry(page)).toHaveCount(1, { timeout: 2_500 });

  await page.waitForTimeout(700);
  const productRow = page.locator("#dans-le-produit .product-row").first();
  const productButton = productRow.locator(".product-row__send");
  await moveToCenter(page, productButton);
  await page.mouse.down();
  await expect(productRow.locator(".product-row__confirmation")).toContainText(
    "Relance 2 · tracée · démonstration locale",
    { timeout: 1_200 },
  );
  await page.mouse.up();

  const motionDurations = await page.locator(".trace-log__row--new").evaluate((element) =>
    window.getComputedStyle(element).animationDuration,
  );
  expect(motionDurations).toBe("1e-05s");
});

test("la cinquième section reprend les deux lignes et les six surfaces sans dérive", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("main > section")).toHaveCount(5);
  await expect(page.locator("main section")).toHaveCount(5);
  await expect(page.locator(".header-index__range")).toHaveText("01—05");
  await expect(page.locator("main > section .section-label__text")).toHaveText([
    "La démonstration",
    "L'idée",
    "Au doigt",
    "Dans le produit",
    "Dans votre système",
  ]);
  await expect(page.getByRole("heading", { name: "Le même composant, sur vos vrais écrans." })).toBeVisible();
  await expect(page.locator("#dans-le-produit .product-section-heading > p")).toHaveText(
    "Un bouton, quatre variantes, sept états — appliqué à vos surfaces réelles, sans déplacer un seul élément de mise en page. Ce n'est pas une refonte. C'est le même produit, avec un bouton qui se comporte enfin de la même façon partout.",
  );

  const rows = page.locator("#dans-le-produit .product-row");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Studio Nord");
  await expect(rows.nth(0)).toContainText("FAC-2026-0038");
  await expect(rows.nth(0)).toContainText("échue 02/08");
  await expect(rows.nth(0)).toContainText("860,00 €");
  await expect(rows.nth(0)).toContainText("Relance 1 · tracée le 12/08");
  await expect(rows.nth(0)).toContainText("Relance 2 · préparée · à envoyer");
  await expect(rows.nth(1)).toContainText("Menuiserie Roux");
  await expect(rows.nth(1)).toContainText("FAC-2026-0031");
  await expect(rows.nth(1)).toContainText("échue 26/07");
  await expect(rows.nth(1)).toContainText("2 340,00 €");
  await expect(rows.nth(1)).toContainText("Relance 1 · tracée le 05/08");
  await expect(rows.nth(1)).toContainText("Promesse de règlement · 25/08");
  await expect(page.locator("#dans-le-produit .product-context")).toHaveCount(6);
  await expect(page.locator("#dans-le-produit .product-context__caption")).toHaveText([
    "Factures",
    "Dépenses",
    "TVA",
    "Documents",
    "Relances",
    "Comptes",
  ]);
  await expect(page.locator("#dans-le-produit .product-context__button")).toHaveText([
    "Encaisser",
    "Importer un justificatif",
    "Préparer la déclaration",
    "Exporter le FEC",
    "Envoyer la relance",
    "Nouveau virement",
  ]);
  const contextButtons = page.locator("#dans-le-produit .product-context__button");
  const contextButtonClasses = await contextButtons.evaluateAll((elements) =>
    elements.map((element) => element.className),
  );
  expect(contextButtonClasses).toHaveLength(6);
  expect(contextButtonClasses.every((className) =>
    className.includes("oryze-button--primary") && className.includes("oryze-button--md"),
  )).toBe(true);
  await contextButtons.first().hover();
  await expect(contextButtons.first()).toHaveAttribute("data-hovering", "true");
  await expect(contextButtons.first()).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#dans-le-produit .product-context-line")).toHaveText(
    "Un seul composant. Six surfaces réelles. Aucune dérive.",
  );
});

test("une relance du produit garde le maintien, le logo-anneau et écrit sa trace", async ({ page }) => {
  await page.goto("/");
  const row = page.locator("#dans-le-produit .product-row").first();
  const button = row.locator(".product-row__send");
  await expect(button.locator(".oryze-ring")).toBeVisible();
  await moveToCenter(page, button);
  await page.mouse.down();
  await expect(button).toHaveAttribute("data-phase", "hold");
  await expect(button).toHaveAttribute("data-phase", "working", { timeout: 1_600 });
  await expect(button).toHaveAttribute("aria-busy", "true");
  await page.mouse.up();
  await expect(row.locator(".product-row__confirmation")).toContainText(
    "Relance 2 · tracée · démonstration locale",
    { timeout: 2_500 },
  );
  await expect(row.locator(".product-row__history")).toContainText("Relance 2 · tracée le");
  await expect(button).toBeDisabled();
});

test("le bouton produit accepte le maintien au clavier", async ({ page }) => {
  await page.goto("/");
  const row = page.locator("#dans-le-produit .product-row").nth(1);
  const button = row.locator(".product-row__send");
  await button.scrollIntoViewIfNeeded();
  await button.focus();
  await page.keyboard.down("Enter");
  await expect(button).toHaveAttribute("data-phase", "hold");
  await expect(button).toHaveAttribute("data-phase", "working", { timeout: 1_600 });
  await page.keyboard.up("Enter");
  await expect(row.locator(".product-row__confirmation")).toContainText(
    "Relance 2 · tracée · démonstration locale",
    { timeout: 2_500 },
  );
});

test("le bouton produit reste lisible et confirme une pression tactile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>("#dans-le-produit .product-row button");
    if (!button) throw new Error("Bouton produit introuvable.");
    const bounds = button.getBoundingClientRect();
    const pointerInit: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      button: 0,
      pointerId: 52,
      pointerType: "touch",
      isPrimary: true,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    };
    button.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
    window.setTimeout(() => button.dispatchEvent(new PointerEvent("pointerup", pointerInit)), 950);
  });

  const button = page.locator("#dans-le-produit .product-row").first().getByRole("button");
  await expect(button).toHaveAttribute("data-phase", "working", { timeout: 1_400 });
  await expect(page.locator("#dans-le-produit .product-row").first().locator(".product-row__confirmation")).toContainText(
    "Relance 2 · tracée · démonstration locale",
    { timeout: 2_500 },
  );
});

test("le rendu initial ne produit aucun avertissement console", async ({ page }) => {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleIssues.push(error.message));

  await page.goto("/");
  await expect(page.locator("#dans-le-produit .product-row")).toHaveCount(2);
  expect(consoleIssues).toEqual([]);
});

test("le contenu reste lisible lorsque JavaScript est désactivé", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.locator("main > section")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Le geste complète votre marque." })).toBeVisible();
  await expect(page.locator("#demo .send-button")).toBeVisible();
  await expect(page.locator("#demo .relance-card")).toContainText("Studio Nord");

  await context.close();
});

test("le texte de la relance peut être modifié sans quitter l'étude", async ({ page }) => {
  await page.goto("/");
  const editButton = page.getByRole("button", { name: "Modifier le texte" });
  await editButton.click();
  const editor = page.getByLabel("Texte de la relance");
  await expect(editButton).toHaveAttribute("aria-expanded", "true");
  await expect(editor).toBeFocused();
  await editor.fill("Bonjour Monsieur Roux,\n\nVotre règlement est attendu.\n\nStudio Lumen");
  await page.getByRole("button", { name: "Enregistrer le texte" }).click();
  await expect(page.locator("#demo .message-copy")).toContainText("Votre règlement est attendu.");
  await expect(editButton).toBeFocused();
});

test("375, 768 et 1440 px n'introduisent pas de débordement horizontal", async ({ page }) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const measurements = await page.evaluate(() => {
      const product = document.querySelector<HTMLElement>(".product-application");
      return {
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        phone: document.querySelector(".phone-frame")?.getBoundingClientRect().width ?? 0,
        productClient: product?.clientWidth ?? 0,
        productScroll: product?.scrollWidth ?? 0,
        sectionHeights: [...document.querySelectorAll("main > section")].map(
          (section) => section.getBoundingClientRect().height,
        ),
      };
    });

    expect(measurements.document, `débordement à ${width}px`).toBeLessThanOrEqual(width);
    expect(measurements.phone, `cadre téléphone trop large à ${width}px`).toBeLessThanOrEqual(width);
    expect(measurements.productScroll, `vue produit trop large à ${width}px`).toBeLessThanOrEqual(
      measurements.productClient + 1,
    );
    const firstThreeSections = measurements.sectionHeights.slice(0, 3).reduce((sum, height) => sum + height, 0);
    expect(
      measurements.sectionHeights[3],
      `section 04 plus longue que 01–03 réunies à ${width}px`,
    ).toBeLessThanOrEqual(firstThreeSections);
  }
});

test("le défilement annule le maintien, comme l'annonce la section 03", async ({ page }) => {
  await page.goto("/");
  const button = mainSendButton(page);
  await moveToCenter(page, button);

  await page.mouse.down();
  await expect(button).toHaveAttribute("data-phase", "hold");
  await page.waitForTimeout(140);

  await page.mouse.wheel(0, 260);
  await expect(button).toHaveAttribute("data-phase", "cancelled");
  await expect(tracedEntry(page)).toHaveCount(0);
  await page.mouse.up();
});

test("le badge de retard des deux lignes dérive de la même source que les sections 01 et 03", async ({ page }) => {
  await page.goto("/");

  const rows = page.locator("#dans-le-produit .product-row");
  await expect(rows.nth(0).locator(".product-row__overdue")).toHaveText("Retard12j");
  await expect(rows.nth(1).locator(".product-row__overdue")).toHaveText("Retard19j");

  /* la section 03 annonce la même valeur pour la même facture */
  await expect(page.locator(".phone-invoice__top .status-badge")).toHaveText("Retard 12 jours");
  await expect(page.locator("#demo .relance-card__header .status-badge")).toHaveText("Retard 12 jours");
});

test("le pied de page signe l'étude", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-footer__name")).toHaveText("Abdulbasit Abdulalim");
  await expect(page.locator(".site-footer__topic")).toHaveText("Étude d'interaction");
});
