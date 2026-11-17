import type { State, Command } from "./classroom";
export type RoomView = {
  gameId: string;
  room: string;
  title: string;
  state: State;
  teacher: boolean;
  country: string | null;
  serverNow: number;
  teams: { country: string; name: string }[];
};
export type Send = (command: Command, retryId?: string) => Promise<void>;
