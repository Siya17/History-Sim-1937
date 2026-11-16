import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";
async function main() {
  const email = process.env.TEACHER_EMAIL?.trim().toLowerCase(),
    password = process.env.TEACHER_PASSWORD;
  if (!email || !password || password.length < 12)
    throw new Error(
      "Set TEACHER_EMAIL and TEACHER_PASSWORD (at least 12 characters). Existing accounts have their password reset.",
    );
  const encrypted = await hashPassword(password);
  await db.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      create: { id: randomUUID(), email, name: "Teacher", emailVerified: true },
      update: {},
    });
    const account = await tx.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (account)
      await tx.account.update({
        where: { id: account.id },
        data: { password: encrypted },
      });
    else
      await tx.account.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: encrypted,
        },
      });
    await tx.session.deleteMany({ where: { userId: user.id } });
  });
  console.log(
    "Teacher ready. Existing sessions revoked. Remove TEACHER_PASSWORD from your environment.",
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
