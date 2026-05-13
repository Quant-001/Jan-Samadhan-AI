import { Bell, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../../api";
import ThemeLangToggle from "./ThemeLangToggle";
import { useLanguage } from "../../hooks/useLanguage";
import { formatDate } from "../../utils/helpers";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: notifs, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list().then((r) => r.data),
    refetchInterval: 30000,
  });
  const notifications = notifs?.results || notifs || [];
  const unread = notifications.filter((n) => !n.is_read).length;
  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <header className="sticky top-0 z-30 border-b border-amber-100 bg-white/90 text-slate-950 shadow-sm backdrop-blur-xl transition-colors duration-200 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded p-1.5 hover:bg-amber-50 dark:hover:bg-slate-800 lg:hidden">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-amber-500 text-sm font-black text-slate-950 dark:bg-amber-400">JS</div>
            <div className="hidden sm:block">
              <p className="text-sm font-black text-slate-950 dark:text-slate-100">Jan Samadhan AI</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("Citizen Grievance Intelligence Platform")}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeLangToggle variant="light" className="hidden md:inline-flex" />
          <div className="relative">
            <button
              type="button"
              className="relative rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-300"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={t("Notifications")}
              aria-expanded={notificationsOpen}
            >
              <Bell size={20} />
            </button>
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unread}
              </span>
            )}
            {notificationsOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded border border-slate-200 bg-white text-left shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="text-sm font-black text-slate-950 dark:text-slate-100">{t("Notifications")}</p>
                  {unread > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">{unread}</span>}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">{t("Loading...")}</p>
                  ) : notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">{t("No notifications")}</p>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-amber-50 dark:border-slate-800 dark:hover:bg-slate-800 ${notif.is_read ? "bg-white dark:bg-slate-900" : "bg-cyan-50/70 dark:bg-cyan-400/10"}`}
                        onClick={() => {
                          if (!notif.is_read) markReadMutation.mutate(notif.id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-bold text-slate-950 dark:text-slate-100">{t(notif.title)}</p>
                          {!notif.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{t(notif.message)}</p>
                        <p className="mt-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{formatDate(notif.created_at)}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-slate-950 dark:bg-amber-500 dark:text-slate-950">
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="hidden text-right md:block">
              <p className="text-sm font-bold text-slate-950 dark:text-slate-100">{user?.first_name || user?.username}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t(user?.role)}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400" title={t("Logout")}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
