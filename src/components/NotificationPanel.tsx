import { useNotificationStore } from '@/stores/notification-store';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle2, AlertCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ICON_MAP = {
  success: <CheckCircle2 className="w-4 h-4 text-[hsl(145,50%,36%)]" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
  warning: <AlertTriangle className="w-4 h-4 text-[hsl(45,75%,48%)]" />,
  info: <Info className="w-4 h-4 text-primary" />,
};

export function NotificationPanel() {
  const { notifications, markAllRead, clearAll, removeNotification, markRead } =
    useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" onClick={() => markAllRead()}>
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs gap-1 h-7">
              <Trash2 className="w-3 h-3" /> Tout effacer
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune notification
            </p>
          ) : (
            notifications.slice(0, 30).map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-2 px-3 py-2 border-b last:border-b-0 ${
                  n.read ? 'opacity-60' : ''
                }`}
                onClick={() => markRead(n.id)}
              >
                <div className="mt-0.5 shrink-0">{ICON_MAP[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                  {n.description && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{n.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {n.indicateurId && ` — ${n.indicateurId}`}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(n.id);
                  }}
                  className="p-0.5 hover:bg-muted rounded shrink-0"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
