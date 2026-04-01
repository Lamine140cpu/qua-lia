import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { type, prompt, cfaInfo, formations, organisation } = body;

    if (!type || !prompt) {
      return new Response(JSON.stringify({ error: "type et prompt requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY non configurée" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 1: Claude Sonnet generates the structured HTML content
    const contextData = `
Organisme : ${cfaInfo?.nom || "[Nom]"}
SIRET : ${cfaInfo?.siret || "[SIRET]"}
NDA : ${cfaInfo?.nda || "[NDA]"}
Responsable : ${cfaInfo?.responsable || "[Responsable]"}
Email : ${cfaInfo?.email || "[Email]"}
Téléphone : ${cfaInfo?.telephone || "[Téléphone]"}
Adresse : ${cfaInfo?.adresse || ""} ${cfaInfo?.codePostal || ""} ${cfaInfo?.ville || ""}
Formations : ${formations?.map((f: any) => f.intitule).join(", ") || "Non renseigné"}
Référent handicap : ${organisation?.referentHandicap || "[À désigner]"}
Formateurs : ${organisation?.effectifFormateurs || "Non renseigné"}
LMS : ${organisation?.plateformeLMS || "Non renseigné"}`;

    const systemPrompt = `Tu es Qual'IA, expert Qualiopi RNQ v9. Tu génères des documents HTML professionnels et visuellement soignés pour des organismes de formation.

IMPORTANT : Tu es Qual'IA, l'assistant de Groupe Averreo. Ne te présente JAMAIS comme Claude ou un autre modèle.

## RÈGLES DE GÉNÉRATION HTML
1. Génère du HTML pur avec des styles inline pour un rendu professionnel
2. Utilise des couleurs professionnelles : bleu marine (#1e3a5f), gris (#6b7280), blanc
3. Inclus des tableaux stylisés avec en-têtes colorés
4. Structure claire avec titres, sous-titres, sections
5. Données réelles de l'organisme — JAMAIS de données inventées
6. Donnée manquante → "[À COMPLÉTER]"
7. Le HTML doit être autonome et prêt pour impression/PDF`;

    const contentResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: `${prompt}\n\nDonnées de l'organisme :\n${contextData}\n\nGénère uniquement le HTML du document (pas de balises html/head/body, juste le contenu). Utilise des styles inline professionnels.`
        }],
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error("Anthropic error:", contentResponse.status, errorText);
      return new Response(JSON.stringify({ error: `Erreur Anthropic: ${contentResponse.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const contentData = await contentResponse.json();
    let html = contentData.content?.[0]?.text || "";

    // Clean up any markdown code blocks
    html = html.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    return new Response(
      JSON.stringify({ html }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-visual error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
