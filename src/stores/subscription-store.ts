import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { API_BASE } from '@/lib/constants';

// Stripe Payment Links — configure these in .env or hardcode
const PAYMENT_LINKS: Record<string, string> = {
  complet: import.meta.env.VITE_STRIPE_LINK_COMPLET || '',
  preaudit: import.meta.env.VITE_STRIPE_LINK_PREAUDIT || '',
};

interface SubscriptionState {
  currentPlanId: string;
  preAuditsRemaining: number;
  generationsUsed: number;
  loading: boolean;
  checkoutError: string | null;

  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  checkout: (planId: string) => Promise<void>;
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  currentPlanId: 'gratuit',
  preAuditsRemaining: 0,
  generationsUsed: 0,
  loading: false,
  checkoutError: null,

  fetchPlans: async () => {},

  fetchSubscription: async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/subscription`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          currentPlanId: data.planId,
          preAuditsRemaining: data.preAuditsRemaining,
          generationsUsed: data.generationsUsed,
        });
      }
    } catch {}
  },

  checkout: async (planId: string) => {
    set({ loading: true, checkoutError: null });

    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      set({ loading: false });
      window.location.href = '/auth';
      return;
    }

    // Use Stripe Payment Link (simple redirect, no backend needed)
    const link = PAYMENT_LINKS[planId];
    if (link) {
      // Append client_reference_id so webhook can identify the user
      const url = new URL(link);
      url.searchParams.set('client_reference_id', session.user.id);
      url.searchParams.set('prefilled_email', session.user.email || '');
      window.location.href = url.toString();
      return;
    }

    // Fallback: try backend checkout
    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
      } else {
        set({ loading: false, checkoutError: data?.error || `Erreur ${res.status}` });
      }
    } catch (err: any) {
      set({ loading: false, checkoutError: err.message || 'Erreur réseau' });
    }
  },
}));
