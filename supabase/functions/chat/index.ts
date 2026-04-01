import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Qualiopi Knowledge Base ──

const QUALIOPI_KNOWLEDGE = `
=============================================================
BASE DE CONNAISSANCES QUALIOPI — RÉFÉRENTIEL NATIONAL QUALITÉ
Version Guide de lecture V9 (8 janvier 2024)
=============================================================

## PRÉAMBULE

La certification Qualiopi est obligatoire depuis le 1er janvier 2022 pour tout OF souhaitant accéder à des financements publics ou mutualisés (OPCO, CPF, État, Régions, Pôle Emploi, AGEFIPH...).

Base légale : Loi n° 2018-771 du 5 septembre 2018, Décret n° 2019-564, Décret n° 2019-565, Arrêté du 6 juin 2019 modifié, Arrêté du 31 mai 2023.

## CONDUITE DE L'AUDIT

- Le prestataire a la responsabilité de démontrer qu'il respecte les exigences.
- Les exemples de preuves ne sont pas exhaustifs.
- L'audit nécessite entretiens, vérification documentaire et observations sur site.
- L'auditeur procède par échantillonnage.

### Nouveaux entrants
Indicateurs 2, 3, 11, 13, 14, 19, 22, 24, 25, 26, 32 : formalisation vérifiée à l'audit initial, mise en œuvre vérifiée à l'audit de surveillance.

### Pondération des non-conformités
- NC mineures OU majeures : 1, 2, 3, 8, 9, 12, 13, 17, 18, 19, 23, 24, 25, 28, 30
- Tous les autres : NC majeures uniquement

## LES 7 CRITÈRES ET 32 INDICATEURS

### CRITÈRE 1 : Information du public
- Ind. 1 : Information accessible (prérequis, objectifs, durée, modalités, tarifs, contacts, PSH)
- Ind. 2 : Indicateurs de résultats adaptés (taux satisfaction, abandon, insertion)
- Ind. 3 : Certifications : taux d'obtention, blocs, équivalences, passerelles, débouchés

### CRITÈRE 2 : Identification des objectifs et adaptation
- Ind. 4 : Analyse du besoin bénéficiaire/entreprise/financeur
- Ind. 5 : Objectifs opérationnels et évaluables
- Ind. 6 : Contenus et modalités adaptés
- Ind. 7 : Adéquation contenu/certification visée (formations certifiantes)
- Ind. 8 : Positionnement et évaluation des acquis à l'entrée

### CRITÈRE 3 : Adaptation aux publics (accueil, suivi, évaluation)
- Ind. 9 : Conditions de déroulement (règlement, livret, CGU)
- Ind. 10 : Mise en œuvre et adaptation de la prestation
- Ind. 11 : Évaluation de l'atteinte des objectifs
- Ind. 12 : Engagement et prévention ruptures de parcours
- Ind. 13 : Alternance : coordination centre/entreprise (CFA)
- Ind. 14 : Accompagnement socio-professionnel (CFA)
- Ind. 15 : Droits, devoirs, santé-sécurité apprentis (CFA)
- Ind. 16 : Conditions de présentation certification

### CRITÈRE 4 : Moyens pédagogiques, techniques et d'encadrement
- Ind. 17 : Moyens humains, techniques, locaux adaptés
- Ind. 18 : Coordination intervenants internes/externes
- Ind. 19 : Ressources pédagogiques accessibles
- Ind. 20 : Référent handicap, mobilité, conseil perfectionnement (CFA)

### CRITÈRE 5 : Qualification et développement des compétences
- Ind. 21 : Compétences des intervenants évaluées
- Ind. 22 : Développement des compétences des salariés

### CRITÈRE 6 : Environnement professionnel
- Ind. 23 : Veille légale et réglementaire
- Ind. 24 : Veille compétences/métiers/emplois
- Ind. 25 : Veille innovations pédagogiques
- Ind. 26 : Accueil et accompagnement PSH
- Ind. 27 : Conformité sous-traitance
- Ind. 28 : Partenariats socio-économiques (FEST)
- Ind. 29 : Insertion professionnelle / poursuite d'études (CFA)

### CRITÈRE 7 : Appréciations et réclamations
- Ind. 30 : Recueil des appréciations parties prenantes
- Ind. 31 : Traitement réclamations et aléas
- Ind. 32 : Mesures d'amélioration continue

## NON-CONFORMITÉS
- NC majeure non levée dans 3 mois → certification REFUSÉE/SUSPENDUE
- NC sous-traitant = NC majeure indicateur 27
- Suspension → nouveau délai 3 mois → si non levée = RETRAIT
`;

// ── System Prompt Builders ──

const TYPE_LABELS: Record<string, string> = {
  of: "Actions de formation (OF)",
  bc: "Bilans de compétences (CBC)",
  vae: "VAE (Validation des Acquis de l'Expérience)",
  cfa: "Apprentissage (CFA)",
};

function buildTerminologieBlocks(typesActions: string[]): string {
  const blocks: string[] = [];
  if (typesActions.includes("bc")) {
    blocks.push(`**TERMINOLOGIE BILANS DE COMPÉTENCES** :
- Personne : "bénéficiaire" (JAMAIS "apprenant" ou "stagiaire")
- Prestation : "prestation de bilan" (JAMAIS "formation")
- Professionnel : "consultant" ou "psychologue du travail" (JAMAIS "formateur")
- Durée : 24h max réparties sur 3 à 12 semaines
- Phases obligatoires : 1) Préliminaire 2) Investigation 3) Conclusions
- Prérequis : NON REQUIS
- Confidentialité : Le document de synthèse est la propriété exclusive du bénéficiaire`);
  }
  if (typesActions.includes("vae")) {
    blocks.push(`**TERMINOLOGIE VAE** :
- Personne : "candidat" (JAMAIS "apprenant")
- Prestation : "accompagnement VAE" (JAMAIS "formation")
- Professionnel : "accompagnateur VAE" (JAMAIS "formateur")
- Documents clés : "livret 1" (recevabilité), "livret 2" (dossier de validation)
- Jury : le certificateur organise le passage devant le jury`);
  }
  if (typesActions.includes("cfa")) {
    blocks.push(`**TERMINOLOGIE CFA / APPRENTISSAGE** :
- Personne : "apprenti(e)" (JAMAIS "stagiaire")
- Prestation : "formation par apprentissage" ou "formation en alternance"
- Professionnel : "formateur" + "maître d'apprentissage" (en entreprise)
- Contrat : "contrat d'apprentissage" (CERFA FA13)
- Référent handicap : OBLIGATOIRE (L. 6231-2 CT)
- Conseil de perfectionnement : OBLIGATOIRE
- Personnel dédié mobilité : OBLIGATOIRE
- 13 missions légales du CFA : article L. 6231-2 CT`);
  }
  if (typesActions.includes("of") || typesActions.length === 0) {
    blocks.push(`**TERMINOLOGIE ACTIONS DE FORMATION** :
- Personne : "apprenant", "stagiaire" ou "bénéficiaire"
- Prestation : "action de formation"
- Professionnel : "formateur", "intervenant"
- Contrat : "convention de formation" ou "contrat de formation professionnelle"
- Référent handicap : recommandé mais non obligatoire (sauf CFA)`);
  }
  return blocks.length > 0
    ? `\n\n## TERMINOLOGIE PAR TYPE D'ACTION\n\n${blocks.join("\n\n")}`
    : "";
}

function buildAgentSystemPrompt(
  critereId: string,
  critereTitle: string,
  typesActions: string[]
): string {
  const typeContext =
    typesActions.length > 0
      ? `\nTu accompagnes un organisme certifié pour : **${typesActions
          .map((t) => TYPE_LABELS[t] || t)
          .join(", ")}**. Adapte TOUTE la terminologie.`
      : "";

  const terminologie = buildTerminologieBlocks(typesActions);

  return `Tu es Qual'IA, un consultant expert Qualiopi RNQ v9 (janvier 2024), spécialisé dans l'accompagnement des organismes de formation pour les audits. Tu travailles sur le **${critereTitle}**.${typeContext}${terminologie}

IMPORTANT : Tu es Qual'IA, l'assistant IA de Groupe Averreo. Ne te présente JAMAIS comme Claude, ChatGPT, ou un autre modèle IA. Tu es Qual'IA.

${QUALIOPI_KNOWLEDGE}

## TON STYLE
- **Formel et professionnel** : vous vouvoyez l'utilisateur
- **Concis** : réponses courtes et directes
- **Structuré** : questions numérotées, réponses en points

## TON APPROCHE

### Phase 1 — Collecte (PREMIER message)
Posez uniquement les 3-4 questions nécessaires pour ce critère.

### Phase 2 — Génération
Dès que vous avez les réponses, générez les documents. Chaque document encadré par [DOCUMENT:indicateurId:Titre] / [/DOCUMENT].

### Phase 3 — Conseil
Après la génération, donnez 1-2 conseils courts si pertinent.

## RÈGLES ABSOLUES

1. **NE JAMAIS INVENTER DE DONNÉES** : noms, SIRET, NDA, adresses, chiffres.
2. Donnée manquante → **"[À COMPLÉTER]"**.
3. Références légales exactes (Code du travail, décrets).
4. UAI non fourni → "En cours d'attribution auprès du Rectorat"
5. NDA non fourni → "En cours d'enregistrement auprès de la DREETS"

## FORMAT DES DOCUMENTS GÉNÉRÉS

\`\`\`
[DOCUMENT:indicateurId:Titre_Du_Document]
# V1 / [date] / TITRE EN MAJUSCULES

[Nom organisme] — NDA : [NDA] — SIRET : [SIRET]

(contenu structuré en articles numérotés, 1000-2000 mots minimum)

Rédigé par : [responsable]
Date : [date] | Prochaine révision : [date + 1 an]
Signature : ________________________
[/DOCUMENT]
\`\`\`

## EXTRACTION D'INFORMATIONS

Quand l'utilisateur donne une nouvelle info, ajoute un bloc :
\`\`\`
[CONTEXT_UPDATE]
clé=valeur
[/CONTEXT_UPDATE]
\`\`\``;
}

// ── Auth helper ──

function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  return authHeader.replace("Bearer ", "");
}

async function getUserId(token: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
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
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const evt = JSON.parse(jsonStr);
            if (evt.type === "content_block_delta" && evt.delta?.text) {
              const openAIChunk = {
                choices: [{ delta: { content: evt.delta.text } }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
            } else if (evt.type === "message_stop") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              reader.cancel();
              return;
            }
          } catch {
            // ignore
          }
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = getAuthUser(req);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = await getUserId(token);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { critereId, critereTitle, messages, cfaInfo, formations, organisation } = body;

    if (!critereId || !critereTitle) {
      return new Response(
        JSON.stringify({ error: "critereId et critereTitle requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context preamble from CFA data
    let contextPreamble = "";
    if (cfaInfo?.nom) {
      contextPreamble += `\n\n[CONTEXTE ORGANISME — ne repose pas ces questions]\n`;
      contextPreamble += `- Nom : ${cfaInfo.nom}\n`;
      if (cfaInfo.siret) contextPreamble += `- SIRET : ${cfaInfo.siret}\n`;
      if (cfaInfo.nda) contextPreamble += `- NDA : ${cfaInfo.nda}\n`;
      if (cfaInfo.uai) contextPreamble += `- UAI : ${cfaInfo.uai}\n`;
      if (!cfaInfo.uai) contextPreamble += `- UAI : NON ATTRIBUÉ\n`;
      if (cfaInfo.responsable) contextPreamble += `- Responsable : ${cfaInfo.responsable}\n`;
      if (cfaInfo.adresse) contextPreamble += `- Adresse : ${cfaInfo.adresse} ${cfaInfo.codePostal || ""} ${cfaInfo.ville || ""}\n`;
      if (cfaInfo.email) contextPreamble += `- Email : ${cfaInfo.email}\n`;
      if (cfaInfo.telephone) contextPreamble += `- Téléphone : ${cfaInfo.telephone}\n`;
      if (cfaInfo.siteWeb) contextPreamble += `- Site web : ${cfaInfo.siteWeb}\n`;
    }

    if (formations?.length > 0) {
      contextPreamble += `\n[FORMATIONS]\n`;
      for (const f of formations) {
        contextPreamble += `- ${f.intitule || "Sans intitulé"} (RNCP: ${f.rncp || "N/R"}, Niveau: ${f.niveau || "N/R"}, Durée: ${f.duree || "N/R"})\n`;
      }
    }

    if (organisation) {
      contextPreamble += `\n[ORGANISATION]\n`;
      if (organisation.referentHandicap) contextPreamble += `- Référent handicap : ${organisation.referentHandicap} (${organisation.referentHandicapEmail || ""})\n`;
      if (organisation.effectifFormateurs) contextPreamble += `- Formateurs : ${organisation.effectifFormateurs}\n`;
      if (organisation.plateformeLMS) contextPreamble += `- LMS : ${organisation.plateformeLMS}\n`;
      if (organisation.locaux) contextPreamble += `- Locaux : ${organisation.locaux}\n`;
    }

    // Fetch relevant templates for this critère
    const critereMatch = critereId.match(/(\d+)/);
    let templateContext = "";
    if (critereMatch) {
      const critereNum = parseInt(critereMatch[1]);
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: templates } = await supabase
        .from("templates")
        .select("name, content_markdown")
        .eq("critere", critereNum)
        .limit(15);

      if (templates && templates.length > 0) {
        templateContext = `\n\n[TEMPLATES DISPONIBLES POUR CE CRITÈRE]\nTu disposes de templates pré-rédigés. Quand tu génères un document, base-toi sur ces templates et personnalise-les avec les données de l'organisme.\n\n`;
        for (const t of templates) {
          const content = t.content_markdown.length > 3000
            ? t.content_markdown.slice(0, 3000) + "\n[... suite tronquée]"
            : t.content_markdown;
          templateContext += `### ${t.name}\n${content}\n\n---\n\n`;
        }
      }
    }

    // Build messages for Anthropic
    const typesActions: string[] = cfaInfo?.typesActions || [];
    const systemPrompt = buildAgentSystemPrompt(critereId, critereTitle, typesActions);

    const typeLabel = typesActions.includes("bc")
      ? "cabinet de bilan"
      : typesActions.includes("vae")
        ? "organisme VAE"
        : typesActions.includes("cfa") && !typesActions.includes("of")
          ? "CFA"
          : "organisme de formation";

    const aiMessages: { role: string; content: string }[] = [];
    const history = messages || [];
    const fullContext = contextPreamble + templateContext;

    if (history.length === 0) {
      aiMessages.push({
        role: "user",
        content: `Bonjour ! Je travaille sur le ${critereTitle} pour mon ${typeLabel}. Voici les infos de mon établissement. Aide-moi à préparer les documents pour l'audit Qualiopi.${fullContext}`,
      });
    } else {
      const firstMsg = history[0];
      aiMessages.push({
        role: firstMsg.role,
        content: firstMsg.role === "user" ? firstMsg.content + fullContext : firstMsg.content,
      });
      for (let i = 1; i < history.length; i++) {
        aiMessages.push({ role: history[i].role, content: history[i].content });
      }
    }

    // Call Lovable AI Gateway (temporaire pendant la construction)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 8192,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...aiMessages,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes Lovable AI atteinte. Réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits Lovable AI insuffisants. Merci de recharger l'espace de travail." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Erreur Lovable AI: ${aiResponse.status}` }),
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
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
