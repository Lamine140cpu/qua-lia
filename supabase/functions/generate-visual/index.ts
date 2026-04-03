import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
    const { type, prompt, cfaInfo, formations, organisation, mode = "html" } = body;

    if (!type || !prompt) {
      return new Response(JSON.stringify({ error: "type et prompt requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
Formateurs : ${organisation?.effectifFormateurs || "Non renseigné"}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY non configurée" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Mode IMAGE: generate prompt then image ──
    if (mode === "image") {
      // Step 1: Generate image prompt
      const promptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: `Tu es un expert en design graphique. Crée un prompt détaillé en anglais pour un générateur d'images IA. Le prompt doit décrire un document visuel professionnel corporate bleu marine (#1e3a5f) et blanc. Réponds UNIQUEMENT avec le prompt en anglais.` },
            { role: "user", content: `Crée un prompt de génération d'image pour : "${type}" avec ces données :\n${contextData}\n\nContexte : ${prompt}` },
          ],
        }),
      });

      if (!promptResponse.ok) {
        console.error("Prompt gen error:", promptResponse.status);
        return new Response(JSON.stringify({ error: "Erreur génération du prompt" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const promptData = await promptResponse.json();
      const imagePrompt = promptData.choices?.[0]?.message?.content || "";

      // Step 2: Generate image
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
        }),
      });

      if (!imageResponse.ok) {
        return new Response(JSON.stringify({ error: "Génération d'image indisponible, utilisez le mode HTML" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const imageData = await imageResponse.json();
      const imageContent = imageData.choices?.[0]?.message?.content || "";

      const urlMatch = imageContent.match(/https?:\/\/[^\s"]+\.(png|jpg|jpeg|webp)/i);
      if (urlMatch) {
        return new Response(JSON.stringify({ imageUrl: urlMatch[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const base64Match = imageContent.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match) {
        return new Response(JSON.stringify({ imageUrl: base64Match[0] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Fallback: return text as HTML
      return new Response(JSON.stringify({ html: `<div style="text-align:center;padding:40px;color:#6b7280;">Image non disponible. Contenu :</div><div>${imageContent}</div>` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Mode HTML ──
    const systemPrompt = `Tu es Qual'IA, expert Qualiopi RNQ v9. Tu génères des documents HTML professionnels et visuellement soignés.

IMPORTANT : Tu es Qual'IA, l'assistant de Groupe Averreo.

## RÈGLES HTML
1. HTML pur avec styles inline
2. Couleurs : bleu marine (#1e3a5f), gris (#6b7280), blanc
3. Tableaux stylisés avec en-têtes colorés
4. Données réelles — JAMAIS de données inventées
5. Donnée manquante → "[À COMPLÉTER]"
6. Le HTML doit être autonome et prêt pour PDF`;

    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${prompt}\n\nDonnées :\n${contextData}\n\nGénère uniquement le HTML (pas de balises html/head/body). Styles inline professionnels.` },
        ],
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error("Lovable AI error:", contentResponse.status, errorText);
      if (contentResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Erreur IA: ${contentResponse.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const contentData = await contentResponse.json();
    let html = contentData.choices?.[0]?.message?.content || "";
    html = html.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();

    return new Response(JSON.stringify({ html }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-visual error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
