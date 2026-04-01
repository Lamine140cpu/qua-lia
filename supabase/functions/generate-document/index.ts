import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TYPE_LABELS: Record<string, string> = {
  of: "Actions de formation (OF)",
  bc: "Bilans de compétences (CBC)",
  vae: "VAE",
  cfa: "Apprentissage (CFA)",
};

function buildTerminologieBlocks(typesActions: string[]): string {
  const blocks: string[] = [];
  if (typesActions.includes("bc")) blocks.push(`**BILANS DE COMPÉTENCES** : "bénéficiaire" (pas "apprenant"), "consultant" (pas "formateur"), 24h max sur 3-12 semaines, 3 phases obligatoires, pas de prérequis.`);
  if (typesActions.includes("vae")) blocks.push(`**VAE** : "candidat" (pas "apprenant"), "accompagnateur VAE" (pas "formateur"), livret 1 (recevabilité) + livret 2.`);
  if (typesActions.includes("cfa")) blocks.push(`**CFA** : "apprenti(e)" (pas "stagiaire"), référent handicap OBLIGATOIRE, conseil de perfectionnement OBLIGATOIRE, 13 missions L.6231-2 CT.`);
  if (typesActions.includes("of") || typesActions.length === 0) blocks.push(`**FORMATION** : "apprenant"/"stagiaire", "formateur", convention de formation, référent handicap recommandé.`);
  return blocks.join("\n");
}

function buildSystemPrompt(typesActions: string[], hasTemplate: boolean): string {
  const typeDesc = typesActions.length > 0
    ? `L'organisme est certifié pour : ${typesActions.map(t => TYPE_LABELS[t] || t).join(", ")}.`
    : "L'organisme est un organisme de formation.";

  const templateInstruction = hasTemplate
    ? `## TEMPLATE FOURNI
Tu disposes d'un TEMPLATE EXISTANT ci-dessous. Tu dois :
1. CONSERVER la structure et le format du template
2. REMPLACER tous les placeholders ([NOM DU CFA], [NDA], [SIRET], [Prénom Nom], etc.) par les VRAIES données fournies
3. ENRICHIR le contenu si nécessaire avec des détails spécifiques à l'organisme
4. NE PAS simplifier ou raccourcir le template — garde TOUT le contenu
5. Si une donnée n'est pas fournie, utiliser **"[À COMPLÉTER : description]"**`
    : `## GÉNÉRATION LIBRE
Aucun template n'est disponible. Génère un document complet de zéro.`;

  return `Tu es Qual'IA, un consultant expert Qualiopi RNQ v9 (janvier 2024).

IMPORTANT : Tu es Qual'IA, l'assistant IA de Groupe Averreo. Ne te présente JAMAIS comme Claude, ChatGPT, ou un autre modèle IA.

**CONTEXTE** : ${typeDesc}
${buildTerminologieBlocks(typesActions)}

## TA MISSION
Produire un document **prêt pour l'audit** : l'auditeur doit pouvoir le prendre tel quel comme preuve de conformité.

${templateInstruction}

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
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

// ── Fetch matching templates from DB ──

async function fetchTemplates(indicateurId: string): Promise<string[]> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const indicateurMatch = indicateurId.match(/(\d+)[.\-_]?(\d+)?/);
  const templates: string[] = [];

  if (indicateurMatch) {
    const critereNum = parseInt(indicateurMatch[1]);
    const indicateurNum = indicateurMatch[2] ? parseInt(indicateurMatch[2]) : null;

    if (indicateurNum) {
      const { data } = await supabase.from("templates").select("name, content_markdown").eq("indicateur", indicateurNum).limit(10);
      if (data && data.length > 0) {
        for (const t of data) templates.push(`### Template: ${t.name}\n\n${t.content_markdown}`);
      }
    }

    const { data: cfaData } = await supabase.from("templates").select("name, content_markdown").eq("category", "critere_cfa").eq("critere", critereNum).limit(5);
    if (cfaData && cfaData.length > 0) {
      for (const t of cfaData) templates.push(`### Template CFA: ${t.name}\n\n${t.content_markdown}`);
    }
  }
  return templates;
}

// ── Anthropic SSE → OpenAI-compatible SSE transformer ──

function anthropicToOpenAIStream(anthropicBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = anthropicBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "content_block_delta" && evt.delta?.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: evt.delta.text } }] })}\n\n`));
            } else if (evt.type === "message_stop") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              reader.cancel();
              return;
            }
          } catch { /* ignore */ }
        }
      }
    },
    cancel() { reader.cancel(); },
  });
}

// ── Handler ──

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
    const { indicateurId, cfaInfo, formations, organisation, previousDocuments } = body;

    if (!indicateurId) {
      return new Response(JSON.stringify({ error: "indicateurId requis" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const missingFields: string[] = [];
    if (!cfaInfo?.nom?.trim()) missingFields.push("Nom de l'organisme");
    if (!cfaInfo?.siret?.trim()) missingFields.push("SIRET");
    if (!cfaInfo?.responsable?.trim()) missingFields.push("Responsable");
    if (!cfaInfo?.email?.trim()) missingFields.push("Email");
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({ error: "Champs obligatoires manquants", missingFields }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const templateContents = await fetchTemplates(indicateurId);
    const hasTemplate = templateContents.length > 0;

    const dateAujourdhui = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const prevDocsText = previousDocuments && Object.keys(previousDocuments).length > 0
      ? `\n### DOCUMENTS DÉJÀ GÉNÉRÉS (cohérence)\n${Object.entries(previousDocuments as Record<string, string>).map(([id, content]) =>
          `- **${id}** : ${(content as string).slice(0, 400).replace(/\n/g, " ")}...`).join("\n")}`
      : "";

    const templateSection = hasTemplate
      ? `\n### TEMPLATES DE RÉFÉRENCE\nPersonnalise ces templates avec les données de l'organisme :\n\n${templateContents.join("\n\n---\n\n")}`
      : "";

    const userPrompt = `## DOCUMENT À GÉNÉRER

**Indicateur** : ${indicateurId}

### Données de l'organisme

\`\`\`json
${JSON.stringify({
  identite: { nom: cfaInfo?.nom || "", siret: cfaInfo?.siret || "", nda: cfaInfo?.nda || "", responsable: cfaInfo?.responsable || "", adresse: cfaInfo?.adresse || "", codePostal: cfaInfo?.codePostal || "", ville: cfaInfo?.ville || "", siteWeb: cfaInfo?.siteWeb || "", email: cfaInfo?.email || "", telephone: cfaInfo?.telephone || "" },
  formations: formations?.map((f: any) => ({ intitule: f.intitule || "", rncp: f.rncp || "", niveau: f.niveau || "", duree: f.duree || "" })) || [],
  organisation: { referentHandicap: organisation?.referentHandicap || "", referentHandicapEmail: organisation?.referentHandicapEmail || "", effectifFormateurs: organisation?.effectifFormateurs || "", plateformeLMS: organisation?.plateformeLMS || "", locaux: organisation?.locaux || "" },
}, null, 2)}
\`\`\`

**Date** : ${dateAujourdhui}
${prevDocsText}
${templateSection}

### INSTRUCTIONS
${hasTemplate
  ? `Personnalise le(s) template(s) ci-dessus avec les données réelles de l'organisme. Remplace TOUS les placeholders. Conserve la structure complète du template.`
  : `Génère le document complet pour l'indicateur ${indicateurId}.`}
Le document doit :
1. Commencer par l'en-tête avec version et date
2. Être structuré en articles numérotés
3. Contenir des références légales exactes du Code du travail
4. Inclure au moins 1 tableau avec données
5. Se terminer par le bloc validation
6. Être intégralement rédigé, sans placeholder générique`;

    const typesActions: string[] = cfaInfo?.typesActions || [];
    const systemPrompt = buildSystemPrompt(typesActions, hasTemplate);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY non configurée" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
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
        messages: [{ role: "user", content: userPrompt }],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Anthropic error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes Anthropic atteinte." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Erreur Anthropic: ${aiResponse.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const openAIStream = anthropicToOpenAIStream(aiResponse.body!);

    return new Response(openAIStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("generate-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
