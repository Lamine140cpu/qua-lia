import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── System Prompt (same as chat but focused on document generation) ──

const TYPE_LABELS: Record<string, string> = {
  of: "Actions de formation (OF)",
  bc: "Bilans de compétences (CBC)",
  vae: "VAE",
  cfa: "Apprentissage (CFA)",
};

function buildTerminologieBlocks(typesActions: string[]): string {
  const blocks: string[] = [];
  if (typesActions.includes("bc")) {
    blocks.push(`**BILANS DE COMPÉTENCES** : "bénéficiaire" (pas "apprenant"), "consultant" (pas "formateur"), 24h max sur 3-12 semaines, 3 phases obligatoires, pas de prérequis.`);
  }
  if (typesActions.includes("vae")) {
    blocks.push(`**VAE** : "candidat" (pas "apprenant"), "accompagnateur VAE" (pas "formateur"), livret 1 (recevabilité) + livret 2.`);
  }
  if (typesActions.includes("cfa")) {
    blocks.push(`**CFA** : "apprenti(e)" (pas "stagiaire"), référent handicap OBLIGATOIRE, conseil de perfectionnement OBLIGATOIRE, 13 missions L.6231-2 CT.`);
  }
  if (typesActions.includes("of") || typesActions.length === 0) {
    blocks.push(`**FORMATION** : "apprenant"/"stagiaire", "formateur", convention de formation, référent handicap recommandé.`);
  }
  return blocks.join("\n");
}

function buildSystemPrompt(typesActions: string[]): string {
  const typeDesc = typesActions.length > 0
    ? `L'organisme est certifié pour : ${typesActions.map(t => TYPE_LABELS[t] || t).join(", ")}.`
    : "L'organisme est un organisme de formation.";

  return `Tu es un consultant expert Qualiopi RNQ v9 (janvier 2024).

**CONTEXTE** : ${typeDesc}
${buildTerminologieBlocks(typesActions)}

## TA MISSION
Produire un document **prêt pour l'audit** : l'auditeur doit pouvoir le prendre tel quel comme preuve de conformité. Le document répond DIRECTEMENT au niveau attendu de l'indicateur.

## FORMAT OBLIGATOIRE

En-tête : \`V1 / [date] / TITRE EN MAJUSCULES\` puis \`[Nom] — NDA : [NDA] — SIRET : [SIRET]\`
Corps : Articles numérotés, références légales exactes, données concrètes, tableaux.
Pied : Rédigé par / Date / Prochaine révision / Signature.

## RÈGLES
1. NE JAMAIS INVENTER DE DONNÉES. Utiliser UNIQUEMENT ce qui est fourni.
2. Donnée manquante → **"[À COMPLÉTER : description]"**
3. 1000-2000 MOTS minimum. Document complet.
4. Français professionnel Qualiopi.
5. UAI non fourni → "En cours d'attribution auprès du Rectorat"
6. NDA non fourni → "En cours d'enregistrement auprès de la DREETS"

## FORMAT MARKDOWN
# titre | ## articles | ### sous-sections | | tableaux | - listes | **gras**`;
}

// ── Auth ──

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

// ── Handler ──

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
    const { indicateurId, cfaInfo, formations, organisation, previousDocuments } = body;

    if (!indicateurId) {
      return new Response(
        JSON.stringify({ error: "indicateurId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const missingFields: string[] = [];
    if (!cfaInfo?.nom?.trim()) missingFields.push("Nom de l'organisme");
    if (!cfaInfo?.siret?.trim()) missingFields.push("SIRET");
    if (!cfaInfo?.responsable?.trim()) missingFields.push("Responsable");
    if (!cfaInfo?.email?.trim()) missingFields.push("Email");
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants", missingFields }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dateAujourdhui = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    const formationsText = formations?.length
      ? formations.map((f: any) =>
          `- ${f.intitule || "Sans intitulé"} (RNCP: ${f.rncp || "N/R"}, Niveau: ${f.niveau || "N/R"}, Durée: ${f.duree || "N/R"})`
        ).join("\n")
      : "Non renseigné";

    const prevDocsText = previousDocuments && Object.keys(previousDocuments).length > 0
      ? `\n### DOCUMENTS DÉJÀ GÉNÉRÉS (cohérence)\n${Object.entries(previousDocuments as Record<string, string>).map(([id, content]) =>
          `- **${id}** : ${(content as string).slice(0, 400).replace(/\n/g, " ")}...`
        ).join("\n")}`
      : "";

    const userPrompt = `## DOCUMENT À GÉNÉRER

**Indicateur** : ${indicateurId}

### Données de l'organisme

\`\`\`json
${JSON.stringify({
  identite: {
    nom: cfaInfo?.nom || "",
    siret: cfaInfo?.siret || "",
    nda: cfaInfo?.nda || "",
    responsable: cfaInfo?.responsable || "",
    adresse: cfaInfo?.adresse || "",
    codePostal: cfaInfo?.codePostal || "",
    ville: cfaInfo?.ville || "",
    siteWeb: cfaInfo?.siteWeb || "",
    email: cfaInfo?.email || "",
    telephone: cfaInfo?.telephone || "",
  },
  formations: formations?.map((f: any) => ({
    intitule: f.intitule || "",
    rncp: f.rncp || "",
    niveau: f.niveau || "",
    duree: f.duree || "",
  })) || [],
  organisation: {
    referentHandicap: organisation?.referentHandicap || "",
    referentHandicapEmail: organisation?.referentHandicapEmail || "",
    effectifFormateurs: organisation?.effectifFormateurs || "",
    plateformeLMS: organisation?.plateformeLMS || "",
    locaux: organisation?.locaux || "",
  },
}, null, 2)}
\`\`\`

**Date** : ${dateAujourdhui}
${prevDocsText}

### INSTRUCTIONS
Génère le document complet pour l'indicateur ${indicateurId}. Le document doit :
1. Commencer par l'en-tête avec version et date
2. Être structuré en articles numérotés
3. Contenir des références légales exactes du Code du travail
4. Inclure au moins 1 tableau avec données
5. Se terminer par le bloc validation
6. Être intégralement rédigé, sans placeholder générique`;

    const typesActions: string[] = cfaInfo?.typesActions || [];
    const systemPrompt = buildSystemPrompt(typesActions);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
