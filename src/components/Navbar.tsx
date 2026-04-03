import { useNavigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { LogOut, User } from 'lucide-react';
import { NotificationPanel } from '@/components/NotificationPanel';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  rightContent?: ReactNode;
}

export function Navbar({ rightContent }: NavbarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button onClick={() => navigate('/')} className="flex items-center">
          <Logo size={34} showWordmark={true} />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pricing')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tarifs
          </button>
          <NotificationPanel />
          {rightContent}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate max-w-[200px]">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
