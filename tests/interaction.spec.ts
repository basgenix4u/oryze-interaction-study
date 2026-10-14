import { expect, test, type Page } from "@playwright/test";

const mainSendButton = (page: Page) => page.locator("#demo .send-button");
const tracedEntry = (page: Page) => page.getByText("Relance 2 · tracée", { exact: true });

async function moveToCenter(page: Page, locator: ReturnType<typeof mainSendButton>) {
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
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto("/"); // baseURL — runs against dev AND production
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

  const motionDurations = await page.locator(".trace-log__row--new").evaluate((element) =>
    window.getComputedStyle(element).animationDuration,
  );
  expect(motionDurations).toBe("1e-05s");
});

test("le contenu reste lisible lorsque JavaScript est désactivé", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page.locator("main > section")).toHaveCount(4);
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
    const measurements = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      phone: document.querySelector(".phone-frame")?.getBoundingClientRect().width ?? 0,
    }));

    expect(measurements.document, `débordement à ${width}px`).toBeLessThanOrEqual(width);
    expect(measurements.phone, `cadre téléphone trop large à ${width}px`).toBeLessThanOrEqual(width);
  }
});
