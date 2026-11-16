import { test, expect, type APIRequestContext } from "@playwright/test";
const origin = "http://localhost:3000";
test("60 polling clients across two rooms", async ({ request, playwright }) => {
  test.setTimeout(120000);
  await request.post("/api/auth/sign-in/email", {
    headers: { Origin: origin },
    data: {
      email: process.env.TEACHER_EMAIL,
      password: process.env.TEACHER_PASSWORD,
    },
  });
  const call = async (body: Record<string, unknown>) =>
    (
      await request.post("/api/classroom", {
        headers: { Origin: origin },
        data: body,
      })
    ).json();
  const fixtures: {
    room: string;
    storage: Awaited<ReturnType<APIRequestContext["storageState"]>>;
  }[] = [];
  for (let i = 0; i < 2; i++) {
    const { room } = await call({
      op: "create",
      title: "Load rehearsal",
      rounds: 1,
      duration: 60,
    });
    const team = await playwright.request.newContext({ baseURL: origin });
    for (const country of ["Germany", "France"]) {
      const client =
        country === "Germany"
          ? team
          : await playwright.request.newContext({ baseURL: origin });
      const response = await client.post("/api/classroom", {
        headers: { Origin: origin },
        data: { op: "join", room, country, name: country },
      });
      expect((await response.json()).error).toBeUndefined();
      if (client !== team) await client.dispose();
    }
    await call({
      op: "command",
      room,
      requestId: crypto.randomUUID(),
      command: { type: "START", round: 0 },
    });
    fixtures.push({ room, storage: await team.storageState() });
    await team.dispose();
  }
  const clients = await Promise.all(
    Array.from({ length: 60 }, (_, i) =>
      playwright.request.newContext({
        baseURL: origin,
        storageState: fixtures[i % 2].storage,
      }),
    ),
  );
  const durations: number[] = [];
  for (let wave = 0; wave < 3; wave++) {
    await Promise.all(
      clients.map(async (client, i) => {
        const start = Date.now();
        const result = await (
          await client.post("/api/classroom", {
            headers: { Origin: origin },
            data: { op: "state", room: fixtures[i % 2].room },
          })
        ).json();
        expect(result.error).toBeUndefined();
        expect(result.state.phase).toBe("RUNNING");
        durations.push(Date.now() - start);
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  durations.sort((a, b) => a - b);
  const p95 = durations[Math.floor(durations.length * 0.95)];
  console.log(`60-client polling: p95 ${p95}ms`);
  expect(p95).toBeLessThan(5000);
  await Promise.all(clients.map((c) => c.dispose()));
  for (const f of fixtures) {
    await call({
      op: "command",
      room: f.room,
      requestId: crypto.randomUUID(),
      command: { type: "CLOSE", round: 1 },
    });
    await call({ op: "delete", room: f.room });
  }
});
