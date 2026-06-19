import { create } from "zustand";
import type { components } from "@/lib/types/api";

export type Profile = components["schemas"]["UserProfileModel"];

type ProfileStore = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  setProfile: (profile) => set(() => ({ profile })),
}));
