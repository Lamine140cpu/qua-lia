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
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { documents, cfaInfo, selectedIndicateurs } = body;

    if (!documents || !cfaInfo) {
      return new Response(
        JSON.stringify({ error: "documents et cfaInfo requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const docsText = Object.entries(documents as Record<string, any>)
      .filter(([, doc]: [string, any]) => doc.status === "generated" && doc.content)
      .map(([id, doc]: [string, any]) => `### ${id}\n${(doc.content as string).slice(0, 2000)}`)
      .join("\n\n---\n\n");

    const auditPrompt = `Tu es un auditeur Qualiopi RNQ v9 certifié COFRAC. Analyse les documents suivants et produis un rapport d'audit structuré.

## Organisme
- Nom : ${cfaInfo.nom || "Non renseigné"}
- Types d'actions : ${(cfaInfo.typesActions || []).join(", ")}

## Documents à auditer

${docsText}

## INSTRUCTIONS

Produis un rapport JSON avec cette structure exacte :
{
  "date": "date ISO",
  "overall_score": "conforme" | "partiellement_conforme" | "non_conforme",
  "overall_percentage": number (0-100),
  "overall_summary": "résumé en 2-3 phrases",
  "criteria": [
    {
      "critere_id": "critere1",
      "critere_titre": "titre",
      "score": "conforme" | "partiellement_conforme" | "non_conforme",
      "indicateurs": [
        {
          "id": "I1.1",
          "titre": "titre",
          "score": "conforme" | "partiellement_conforme" | "non_conforme",
          "score_num": number (0-100),
          "strengths": ["..."],
          "weaknesses": ["..."],
          "recommendations": ["..."],
          "nc_risk": "aucun" | "mineure" | "majeure",
          "nc_detail": "détail"
        }
      ]
    }
  ],
  "priority_actions": ["action 1", "action 2"],
  "audit_readiness": "résumé de la préparation"
}

Réponds UNIQUEMENT avec le JSON, sans markdown ni backticks.`;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Anthropic API with Claude Opus for audit (most powerful model)
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-20250514",
        max_tokens: 8192,
        system: "Tu es un auditeur Qualiopi certifié COFRAC, expert RNQ v9. Tu es Qual'IA, l'assistant de Groupe Averreo. Réponds uniquement en JSON valide.",
        messages: [{ role: "user", content: auditPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Anthropic error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes Anthropic atteinte." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Erreur Anthropic: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.content?.[0]?.text || "";

    let auditResult;
    try {
      const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      auditResult = JSON.parse(cleanJson);
    } catch {
      return new Response(
        JSON.stringify({ error: "Impossible de parser le résultat d'audit", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(auditResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("audit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
