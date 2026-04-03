import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false, plan: "gratuit" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Check for completed checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 50,
    });

    let hasComplet = false;
    let hasPreaudit = false;

    for (const session of sessions.data) {
      if (session.payment_status === "paid") {
        const planId = session.metadata?.plan_id;
        if (planId === "complet") hasComplet = true;
        if (planId === "preaudit") hasPreaudit = true;
      }
    }

    // Also check payment intents
    if (!hasComplet || !hasPreaudit) {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 50,
      });
      for (const pi of paymentIntents.data) {
        if (pi.status === "succeeded") {
          const planId = pi.metadata?.plan_id;
          if (planId === "complet") hasComplet = true;
          if (planId === "preaudit") hasPreaudit = true;
        }
      }
    }

    // Determine plan: complet > preaudit > gratuit
    let plan = "gratuit";
    if (hasComplet) plan = "complet";
    else if (hasPreaudit) plan = "preaudit";

    return new Response(JSON.stringify({
      subscribed: hasComplet || hasPreaudit,
      plan,
      hasComplet,
      hasPreaudit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("check-subscription error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
