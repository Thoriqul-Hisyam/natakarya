"use client";

import { useEffect, useState } from "react";
import { getGlobalActivities } from "@/actions/activity";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, MessageSquare, Plus, Move, CheckSquare } from "lucide-react";

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getGlobalActivities();
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getIcon = (action: string) => {
    if (action.includes("created")) return <Plus size={12} />;
    if (action.includes("moved")) return <Move size={12} />;
    if (action.includes("commented")) return <MessageSquare size={12} />;
    if (action.includes("completed")) return <CheckSquare size={12} />;
    return <Activity size={12} />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3 group">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarImage src={activity.user.image || ""} />
            <AvatarFallback className="text-[10px]">
              {activity.user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground leading-snug">
              <span className="font-semibold">{activity.user.name}</span>{" "}
              <span className="text-muted-foreground">{activity.action}</span>{" "}
              <span className="font-medium">{activity.entityTitle}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
              <span className="text-[10px] text-muted-foreground/30">•</span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {activity.board.title}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
