"use client";

import { useState } from "react";

import { currentUser } from "@/utils/mockData";
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
    <SettingsScreen
      user={user}
      onUpdateUser={handleUpdateUser}
    />
  );
}