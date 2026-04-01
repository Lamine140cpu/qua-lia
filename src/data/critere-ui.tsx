import {
  Globe, Target, Users, Wrench, GraduationCap, Network, MessageSquare,
} from 'lucide-react';
import type { ReactNode } from 'react';

export const CRITERE_ICON_COMPONENTS: Record<string, (className?: string) => ReactNode> = {
  critere1: (cls) => <Globe className={cls} />,
  critere2: (cls) => <Target className={cls} />,
  critere3: (cls) => <Users className={cls} />,
  critere4: (cls) => <Wrench className={cls} />,
  critere5: (cls) => <GraduationCap className={cls} />,
  critere6: (cls) => <Network className={cls} />,
  critere7: (cls) => <MessageSquare className={cls} />,
};

export const CRITERE_ACCENTS = [
  'bg-[hsl(216,72%,30%)]',
  'bg-[hsl(190,60%,38%)]',
  'bg-[hsl(28,80%,52%)]',
  'bg-[hsl(145,50%,36%)]',
  'bg-[hsl(265,50%,48%)]',
  'bg-[hsl(340,55%,48%)]',
  'bg-[hsl(45,75%,48%)]',
] as const;
