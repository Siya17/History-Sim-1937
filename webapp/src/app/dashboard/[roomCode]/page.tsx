import DashboardClient from "./DashboardClient";
export default async function Page({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  return <DashboardClient roomCode={roomCode.toUpperCase()} />;
}
