import { useNavigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { NotificationPanel } from '@/components/NotificationPanel';
import { Logo } from '@/components/Logo';

interface NavbarProps {
  rightContent?: ReactNode;
}

export function Navbar({ rightContent }: NavbarProps) {
  const navigate = useNavigate();

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
        </div>
      </div>
    </nav>
  );
}
