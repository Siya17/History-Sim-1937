import { test, expect, type APIRequestContext } from "@playwright/test";
const origin = "http://localhost:3000";
async function rpc(client: APIRequestContext, body: Record<string, unknown>) {
  const response = await client.post("/api/classroom", {
    headers: { Origin: origin },
    data: body,
  });
  return response.json();
}
test("complete two-round class, shared orders, replay, authorization and occupation", async ({
  browser,
  request,
}) => {
  const login = await request.post("/api/auth/sign-in/email", {
    headers: { Origin: origin },
    data: {
      email: process.env.TEACHER_EMAIL,
      password: process.env.TEACHER_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const { room } = await rpc(request, {
    op: "create",
    title: "Integration rehearsal",
    rounds: 2,
    duration: 60,
  });
  const a = await browser.newContext({ baseURL: origin }),
    b = await browser.newContext({ baseURL: origin }),
    teammate = await browser.newContext({ baseURL: origin });
  const joining = await rpc(a.request, {
    op: "join",
    room,
    country: "Germany",
    name: "Team A",
  });
  expect(joining.error).toBeUndefined();
  expect(joining.code).toBeTruthy();
  await rpc(b.request, { op: "join", room, country: "France", name: "Team B" });
  await rpc(teammate.request, {
    op: "recover",
    room,
    country: "Germany",
    code: joining.code,
  });
  const command = (
    client: APIRequestContext,
    type: string,
    extra: Record<string, unknown> = {},
    round = 1,
    id = crypto.randomUUID(),
  ) =>
    rpc(client, {
      op: "command",
      room,
      requestId: id,
      command: { type, round, ...extra },
    });
  expect((await command(a.request, "START", {}, 0)).error).toMatch(/Teacher/);
  await command(request, "START", {}, 0);
  let v = await rpc(a.request, { op: "state", room });
  expect(v.state.countries).toHaveLength(2);
  expect(JSON.stringify(v)).not.toMatch(/codeHash|password|tokenHash|hostPin/);
  await command(a.request, "PROPOSE", { action: "TRADE", target: "France" });
  v = await rpc(a.request, { op: "state", room });
  await command(b.request, "ACCEPT", { proposalId: v.state.proposals[0].id });
  const id = crypto.randomUUID();
  const outcomes = await Promise.all([
    command(a.request, "ORDER", { action: "SPECIAL" }, 1, id),
    command(teammate.request, "ORDER", { action: "SPECIAL" }, 1, id),
  ]);
  expect(outcomes.every((r) => !r.error)).toBeTruthy();
  v = await rpc(a.request, { op: "state", room });
  expect(
    v.state.countries.find((c: { name: string }) => c.name === "Germany").used,
  ).toBe(2);
  expect(
    (await command(teammate.request, "ORDER", { action: "BUILD_ECON" })).error,
  ).toMatch(/No orders/);
  await command(request, "PAUSE");
  expect(
    (await command(b.request, "ORDER", { action: "SPECIAL" })).error,
  ).toMatch(/not accepting/);
  await command(request, "RESUME");
  await Promise.all([command(request, "CLOSE"), command(request, "CLOSE")]);
  await command(request, "START", {}, 1);
  await command(
    request,
    "ADJUST",
    { target: "Germany", resource: "mil", delta: 15, reason: "Rehearsal" },
    2,
  );
  await command(
    request,
    "ADJUST",
    { target: "Germany", resource: "pol", delta: 15, reason: "Rehearsal" },
    2,
  );
  await command(
    request,
    "ADJUST",
    { target: "France", resource: "mil", delta: -15, reason: "Rehearsal" },
    2,
  );
  await command(
    request,
    "ADJUST",
    { target: "France", resource: "econ", delta: -15, reason: "Rehearsal" },
    2,
  );
  await command(a.request, "ORDER", { action: "WAR", target: "France" }, 2);
  v = await rpc(b.request, { op: "state", room });
  expect(
    v.state.countries.find((c: { name: string }) => c.name === "France").master,
  ).toBe("Germany");
  expect(
    (await command(b.request, "ORDER", { action: "REBUILD" }, 2)).error,
  ).toBeUndefined();
  const concurrent = await Promise.all([
    command(a.request, "ORDER", { action: "BUILD_POL" }, 2),
    command(teammate.request, "ORDER", { action: "BUILD_DIP" }, 2),
  ]);
  expect(concurrent.filter((r) => r.error)).toHaveLength(1);
  v = await rpc(a.request, { op: "state", room });
  expect(
    v.state.countries.find((c: { name: string }) => c.name === "Germany").used,
  ).toBe(2);
  const page = await a.newPage();
  await page.goto("/dashboard/" + room);
  await expect(
    page.getByRole("heading", { name: "Integration rehearsal" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/classroom-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/classroom-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await command(request, "CLOSE", {}, 2);
  await command(request, "CLOSE", {}, 2);
  v = await rpc(a.request, { op: "state", room });
  expect(v.state.phase).toBe("FINISHED");
  expect(v.state.summaries).toHaveLength(2);
  expect(
    (await rpc(request, { op: "export", room })).export.state.rulesVersion,
  ).toBe("classroom-v2");
  const other = await rpc(request, { op: "create", title: "Other room" });
  expect(
    (await rpc(a.request, { op: "state", room: other.room })).error,
  ).toBeTruthy();
  await rpc(request, { op: "rotate", room, country: "Germany" });
  expect(
    (await rpc(teammate.request, { op: "state", room })).error,
  ).toBeTruthy();
  await rpc(request, { op: "delete", room });
  await rpc(request, { op: "delete", room: other.room });
  await a.close();
  await b.close();
  await teammate.close();
});
