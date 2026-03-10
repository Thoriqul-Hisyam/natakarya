"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/actions/notification";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NotificationDropdown() {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      const unread = await getUnreadNotificationCount();
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // In a real app, you would set up Pusher here to listen for new notifications realtime
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShow(!show);
          if (!show) fetchNotifications();
        }}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer relative"
      >
        <Bell size={18} style={{ color: "var(--color-muted-foreground)" }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full notification-pulse"
            style={{ background: "var(--color-destructive)" }}
          />
        )}
      </button>

      {show && (
        <div
          className="absolute right-0 top-12 w-80 rounded-2xl p-4 fade-in z-50 flex flex-col max-h-[400px]"
          style={{
            background: "var(--color-card)",
            boxShadow: "var(--shadow-dropdown)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="font-semibold text-sm">Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs transition-smooth hover:opacity-70 cursor-pointer"
                style={{ color: "var(--color-primary)" }}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
            {notifications.length === 0 ? (
              <div
                className="text-center py-8 text-sm"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-3 rounded-xl border text-sm transition-smooth flex flex-col gap-1 relative group cursor-default",
                      notif.isRead ? "bg-transparent border-transparent" : "bg-[var(--color-secondary)] border-[var(--color-border)]"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-medium truncate">{notif.title}</p>
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                      {notif.link && (
                        <Link 
                          href={notif.link}
                          onClick={() => {
                            if (!notif.isRead) handleMarkAsRead(notif.id);
                            setShow(false);
                          }}
                          className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
