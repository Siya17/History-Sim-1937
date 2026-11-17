import { test, expect, type APIRequestContext } from "@playwright/test";
const origin = "http://localhost:3000";
async function rpc(client: APIRequestContext, body: Record<string, unknown>) {
  return (
    await client.post("/api/classroom", {
      headers: { Origin: origin },
      data: body,
    })
  ).json();
}
test("mission and isolated practice work without real commands", async ({
  page,
}) => {
  let commands = 0;
  page.on("request", (req) => {
    if (req.url().endsWith("/api/classroom")) {
      try {
        if (req.postDataJSON()?.op === "command") commands++;
      } catch {}
    }
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Lead your country/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Try the 2-minute practice/ }).click();
  const practice = page.getByRole("region", { name: /Practice tutorial/ });
  await practice.getByRole("button", { name: /Continue practice/ }).click();
  await practice
    .getByRole("button", { name: /Try the practice action/ })
    .click();
  await practice.getByRole("button", { name: /Review practice offer/ }).click();
  await practice.getByRole("button", { name: /Accept practice offer/ }).click();
  await expect(
    practice.getByRole("heading", { name: /Review the round/ }),
  ).toBeVisible();
  await expect(practice.getByText(/3 victory points/)).toBeVisible();
  expect(commands).toBe(0);
  await practice.getByRole("button", { name: /Finish practice/ }).click();
});
test("briefing, decision draft, offer notification, device-local read state and mobile layout", async ({
  page,
  request,
  browser,
}) => {
  await request.post("/api/auth/sign-in/email", {
    headers: { Origin: origin },
    data: {
      email: process.env.TEACHER_EMAIL,
      password: process.env.TEACHER_PASSWORD,
    },
  });
  const { room } = await rpc(request, {
    op: "create",
    title: "Student clarity rehearsal",
    duration: 180,
    rounds: 1,
  });
  await page.goto("/?room=" + room);
  const join = page.locator("#join-classroom");
  await join.getByLabel(/Team name/).fill("Seminar team");
  await join
    .getByLabel(/Country/, { exact: false })
    .first()
    .selectOption("UK");
  await join.getByRole("button", { name: /Claim country/ }).click();
  const rejoin = (await page.locator("strong.code").innerText()).trim();
  await page.getByRole("link", { name: /Enter classroom/ }).click();
  await expect(
    page.getByRole("button", { name: /Enter the command room/ }),
  ).toBeVisible();
  await expect(page.getByText(/Reach 9 economy/)).toBeVisible();
  await page.getByRole("button", { name: /Enter the command room/ }).click();
  await expect(page.getByRole("button", { name: /Sound off/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const france = await browser.newContext({ baseURL: origin });
  await rpc(france.request, {
    op: "join",
    room,
    country: "France",
    name: "France team",
  });
  await rpc(request, {
    op: "command",
    room,
    requestId: crypto.randomUUID(),
    command: { type: "START", round: 0 },
  });
  await page.getByRole("button", { name: /Refresh/ }).click();
  const card = page
    .locator(".decision-card")
    .filter({ hasText: "Grow your economy" });
  await card.getByRole("button", { name: /Review this decision/ }).click();
  await expect(page.locator("#action-review")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const proposed = await rpc(france.request, {
    op: "command",
    room,
    requestId: crypto.randomUUID(),
    command: { type: "PROPOSE", action: "ALLIANCE", target: "UK", round: 1 },
  });
  expect(proposed.error).toBeUndefined();
  await expect(page.locator(".notification-banner")).toContainText("France");
  await expect
    .poll(() =>
      page.locator(".notification-banner").evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.top < innerHeight;
      }),
    )
    .toBeTruthy();
  await page
    .locator(".notification-banner")
    .getByRole("button", { name: /Review offer/ })
    .click();
  await expect(
    page.getByRole("button", { name: /Accept this agreement/ }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: /Classroom navigation/ })
    .getByRole("button", { name: /Your decisions/ })
    .click();
  await expect(page.locator("#action-review")).toBeVisible();
  await page
    .locator(".notification-banner")
    .getByRole("button", { name: /Dismiss/ })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Student clarity rehearsal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Enter the command room/ }),
  ).toHaveCount(0);
  await expect(page.locator(".notification-banner")).toHaveCount(0);
  const second = await browser.newContext({ baseURL: origin });
  await rpc(second.request, {
    op: "recover",
    room,
    country: "UK",
    code: rejoin,
  });
  const teammate = await second.newPage();
  await teammate.goto("/dashboard/" + room);
  await expect(teammate.locator(".notification-banner")).toContainText(
    "France",
  );
  await page.getByRole("button", { name: /Diplomatic dispatches/ }).click();
  await page.getByRole("button", { name: /Accept this agreement/ }).click();
  await expect(page.locator(".dispatch").first()).toContainText("Accepted");
  await expect(teammate.locator(".inbox-button .badge")).toHaveText("0");
  await page
    .getByRole("navigation", { name: /Classroom navigation/ })
    .getByRole("button", { name: /Your decisions/ })
    .click();
  await page.screenshot({
    path: "test-results/redesign-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/redesign-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  const visible = await page.locator("body").innerText();
  expect(visible).not.toMatch(/\b(Econ|Mil|Pol|Dip|VP|d6|BUILD_ECON)\b/);
  await rpc(request, {
    op: "command",
    room,
    requestId: crypto.randomUUID(),
    command: { type: "CLOSE", round: 1 },
  });
  await rpc(request, { op: "delete", room });
  await france.close();
  await second.close();
});
