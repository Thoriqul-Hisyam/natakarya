"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Camera, Save, Loader2, Bell, BellOff } from "lucide-react";
import { updateProfile } from "@/actions/user";
import { toast } from "sonner";
import Image from "next/image";

type Tab = "profile" | "notifications";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Notification prefs (UI-only for now)
  const [notifPrefs, setNotifPrefs] = useState({
    taskAssigned: true,
    taskDueSoon: true,
    commentMention: true,
    boardUpdates: false,
    weeklyDigest: false,
  });

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsPending(true);
    try {
      await updateProfile({ name: name.trim() });
      await update();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preference updated");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-smooth cursor-pointer"
            style={{
              background: activeTab === "profile" ? "var(--color-primary)" : "transparent",
              color: activeTab === "profile" ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
            }}
          >
            <User size={18} />
            My Profile
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-smooth cursor-pointer"
            style={{
              background: activeTab === "notifications" ? "var(--color-primary)" : "transparent",
              color: activeTab === "notifications" ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
            }}
          >
            <Mail size={18} />
            Notifications
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm shadow-black/5">
              <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--color-muted)] border-4 border-white shadow-sm">
                      {session?.user?.image ? (
                        <Image 
                          src={session.user.image} 
                          alt="" 
                          width={96} 
                          height={96} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <User size={40} />
                        </div>
                      )}
                    </div>
                    <button className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth rounded-full cursor-not-allowed">
                      <Camera size={20} />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Your photo will be used in tasks and workspaces.
                    </p>
                  </div>
                </div>

                {/* Form Section */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-smooth text-sm bg-transparent"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={session?.user?.email || ""}
                      disabled
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/50 text-muted-foreground text-sm cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                    <p className="text-[11px] text-muted-foreground">Email cannot be changed (signed in with Google).</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    onClick={handleSave}
                    disabled={isPending || !name.trim() || name === session?.user?.name}
                    className="flex items-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm transition-smooth enabled:hover:opacity-90 enabled:active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--color-foreground)",
                      color: "white",
                    }}
                  >
                    {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm shadow-black/5">
              <h2 className="text-lg font-semibold mb-2">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose what notifications you want to receive.</p>

              <div className="space-y-1">
                {[
                  { key: "taskAssigned" as const, label: "Task Assigned", desc: "When someone assigns a task to you", icon: Bell },
                  { key: "taskDueSoon" as const, label: "Due Date Reminder", desc: "When a task is due within 24 hours", icon: Bell },
                  { key: "commentMention" as const, label: "Comment Mentions", desc: "When someone mentions you in a comment", icon: Bell },
                  { key: "boardUpdates" as const, label: "Board Updates", desc: "When changes are made to boards you're part of", icon: Bell },
                  { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Summary of your tasks and activity every Monday", icon: Mail },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-4 px-4 rounded-xl transition-smooth hover:bg-[var(--color-secondary)]/50"
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--color-secondary)" }}>
                        <item.icon size={16} style={{ color: notifPrefs[item.key] ? "var(--color-info)" : "var(--color-muted-foreground)" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleNotif(item.key)}
                      className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer"
                      style={{
                        background: notifPrefs[item.key] ? "var(--color-success)" : "var(--color-muted)",
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                        style={{
                          left: notifPrefs[item.key] ? "calc(100% - 22px)" : "2px",
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground mt-4">
                * Notification preferences are saved locally. Server-side email notifications coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
