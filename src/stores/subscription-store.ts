import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  currentPlanId: string;
  loading: boolean;
  checkoutError: string | null;

  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  checkout: (planId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  currentPlanId: 'gratuit',
  loading: false,
  checkoutError: null,

  fetchPlans: async () => {},

  fetchSubscription: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('check-subscription error:', error);
        return;
      }
      if (data?.plan) {
        set({ currentPlanId: data.plan });
      }
    } catch (err) {
      console.error('fetchSubscription error:', err);
    }
  },

  checkout: async (planId: string) => {
    set({ loading: true, checkoutError: null });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      set({ loading: false });
      window.location.href = '/auth';
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planId },
      });

      if (error) {
        set({ loading: false, checkoutError: error.message || 'Erreur paiement' });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        set({ loading: false });
      } else {
        set({ loading: false, checkoutError: 'URL de paiement manquante' });
      }
    } catch (err: any) {
      set({ loading: false, checkoutError: err.message || 'Erreur réseau' });
    }
  },
}));
