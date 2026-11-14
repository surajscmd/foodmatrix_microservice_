"use client";

import { useState } from "react";
import {
  Activity,
  Check,
  Database,
  Globe,
  Key,
  MonitorCog,
  RefreshCw,
  Save,
  ShieldCheck,
  Store,
  User as UserIcon,
  Wifi,
} from "lucide-react";
import type { User } from "@/utils/types";




interface SettingsScreenProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

interface ToggleSetting {
  kitchenAutoAccept: boolean;
  soundAlerts: boolean;
  emailReports: boolean;
  inventoryAlerts: boolean;
  autoPrint: boolean;
  darkMode: boolean;
}

export default function SettingsScreen({
  user,
  onUpdateUser,
}: SettingsScreenProps) {
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
    phone: "+91 98765 43210",
    role: user.role,
  });

  const [restaurant, setRestaurant] = useState({
    name: "FoodMatrix Downtown",
    branch: "BLR-014",
    gst: "29ABCDE1234F1Z9",
    timezone: "Asia/Kolkata",
    currency: "INR (₹)",
  });

  const [settings, setSettings] = useState<ToggleSetting>({
    kitchenAutoAccept: true,
    soundAlerts: true,
    emailReports: false,
    inventoryAlerts: true,
    autoPrint: true,
    darkMode: true,
  });

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    onUpdateUser({
      name: profile.name,
      email: profile.email,
    });

    setSuccessMsg("Settings updated successfully.");

    setTimeout(() => {
      setSuccessMsg("");
    }, 3000);
  };

  const toggleSetting = (key: keyof ToggleSetting) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const Toggle = ({
    value,
    onClick,
  }: {
    value: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition cursor-pointer ${
        value ? "bg-emerald-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          value ? "left-6" : "left-1"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <Check className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            {successMsg}
          </span>
        </div>
      )}

      {/* ================= KPI ================= */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              Database
            </span>
            <Database className="h-5 w-5 text-emerald-400" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">Online</h2>

          <p className="mt-1 text-xs text-zinc-500">Connected successfully</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              POS Sync
            </span>
            <Wifi className="h-5 w-5 text-emerald-400" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">Healthy</h2>

          <p className="mt-1 text-xs text-zinc-500">Last sync 12 sec ago</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              API
            </span>
            <Globe className="h-5 w-5 text-blue-400" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">Active</h2>

          <p className="mt-1 text-xs text-zinc-500">99.98% uptime</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">
              Security
            </span>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">Protected</h2>

          <p className="mt-1 text-xs text-zinc-500">All systems secure</p>
        </div>
      </div>

      {/* ================= MAIN ================= */}

      <div className="grid gap-6 xl:grid-cols-12">
        {/* LEFT */}

        <div className="space-y-6 xl:col-span-7">
          {/* Profile */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3">
               <UserIcon className="h-5 w-5 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Manager Profile
                </h2>
                <p className="text-sm text-zinc-500">
                  Update account information
                </p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Full Name
                  </label>

                  <input
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Email
                  </label>

                  <input
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        email: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Phone
                  </label>

                  <input
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        phone: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Role
                  </label>

                  <input
                    value={profile.role}
                    disabled
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </form>
          </div>

          {/* Restaurant Information */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3">
                <Store className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Restaurant Information
                </h2>
                <p className="text-sm text-zinc-500">Branch configuration</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                  Restaurant Name
                </label>

                <input
                  value={restaurant.name}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                  Branch ID
                </label>

                <input
                  value={restaurant.branch}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      branch: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                  GST Number
                </label>

                <input
                  value={restaurant.gst}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      gst: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500">
                  Time Zone
                </label>

                <input
                  value={restaurant.timezone}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      timezone: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}

        <div className="space-y-6 xl:col-span-5">
          {/* Preferences */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="mb-5 flex items-center gap-3">
              <MonitorCog className="h-5 w-5 text-emerald-400" />

              <h2 className="text-lg font-semibold text-white">
                Operational Preferences
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "Kitchen Auto Accept",
                  key: "kitchenAutoAccept",
                },
                {
                  label: "Sound Alerts",
                  key: "soundAlerts",
                },
                {
                  label: "Inventory Alerts",
                  key: "inventoryAlerts",
                },
                {
                  label: "Auto Print Bills",
                  key: "autoPrint",
                },
                {
                  label: "Email Reports",
                  key: "emailReports",
                },
                {
                  label: "Dark Theme",
                  key: "darkMode",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                >
                  <span className="text-sm text-white">{item.label}</span>

                  <Toggle
                    value={settings[item.key as keyof ToggleSetting]}
                    onClick={() =>
                      toggleSetting(item.key as keyof ToggleSetting)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* API */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Key className="h-5 w-5 text-amber-400" />

              <h2 className="text-lg font-semibold text-white">
                API Credentials
              </h2>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Primary API Key</p>

              <p className="mt-2 break-all font-mono text-xs text-zinc-300">
                fm_live_7200a8df9e81b37f4cf911029c42
              </p>
            </div>

            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm text-white transition hover:bg-zinc-800 cursor-pointer">
              <RefreshCw className="h-4 w-4" />
              Regenerate Key
            </button>
          </div>

          {/* System */}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-400" />

              <h2 className="text-lg font-semibold text-white">
                System Information
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Version</span>

                <span className="text-white">FoodMatrix Edge 4.8</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Build</span>

                <span className="text-white">2026.07.24</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Last Backup</span>

                <span className="text-white">Today 02:15 AM</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">License</span>

                <span className="text-emerald-400">Enterprise</span>
              </div>
            </div>
          </div>

          {/* Danger */}

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
            <h2 className="text-lg font-semibold text-rose-400">Danger Zone</h2>

            <p className="mt-2 text-sm text-zinc-400">
              These operations are irreversible and should only be performed by
              administrators.
            </p>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="mt-5 w-full rounded-xl border border-rose-500/20 bg-rose-500/10 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
            >
              Reset Local Restaurant Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
