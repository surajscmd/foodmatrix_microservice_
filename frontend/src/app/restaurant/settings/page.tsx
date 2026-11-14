"use client";

import { useState } from "react";

import { currentUser } from "@/utils/mockData";
import PlatformSettingsScreen from "@/components/PlatformSettingsScreen";
import SettingsScreen from "@/components/system/SettingsScreen";
import type { User } from "@/utils/types";


export default function SettingsPage() {
  const [user, setUser] = useState<User>(currentUser);

  const handleUpdateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => ({
      ...prev,
      ...updatedUser,
    }));
  };

  return (
    <div className="min-h-screen space-y-5 pb-12 font-sans text-zinc-300">
      <PlatformSettingsScreen />

      <details className="mx-6 rounded-2xl border border-zinc-800 bg-zinc-950/80">
        <summary className="cursor-pointer px-5 py-4 text-xs font-semibold text-zinc-200">
          Restaurant settings
        </summary>
        <div className="border-t border-zinc-800">
          <SettingsScreen user={user} onUpdateUser={handleUpdateUser} />
        </div>
      </details>
    </div>
  );
}
