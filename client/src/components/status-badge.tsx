import { Badge } from "@/components/ui/badge";

type StatusType = "online" | "offline" | "busy" | "away" | "active" | "inactive" | "pending" | "answered" | "missed" | "voicemail" | "sent" | "delivered" | "failed" | "received";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  online: { label: "Online", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  offline: { label: "Offline", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  busy: { label: "Busy", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  away: { label: "Away", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  active: { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  answered: { label: "Answered", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  missed: { label: "Missed", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  voicemail: { label: "Voicemail", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  received: { label: "Received", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.offline;
  
  return (
    <Badge variant="secondary" className={`${config.className} border-0`}>
      {customLabel || config.label}
    </Badge>
  );
}
