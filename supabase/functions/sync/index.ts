import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabase(serviceRole = false) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = serviceRole
    ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    : (Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY"))!;
  return createClient(url, key);
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabase(true);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

function getUserSupabase(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  return supabase;
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

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";
    const supabase = getUserSupabase(req);

    // ── PROJECT ──
    if (path === "project" && req.method === "GET") {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return new Response(
        JSON.stringify({ project: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (path === "project" && req.method === "POST") {
      const body = await req.json();
      const { id, name, cfa_info, formations, organisation, selected_indicateurs } = body;

      if (id) {
        const { data, error } = await supabase
          .from("projects")
          .update({ name, cfa_info, formations, organisation, selected_indicateurs })
          .eq("id", id)
          .eq("user_id", userId)
          .select("id")
          .single();
        if (error) throw error;
        return new Response(
          JSON.stringify({ id: data.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert({ user_id: userId, name, cfa_info, formations, organisation, selected_indicateurs })
          .select("id")
          .single();
        if (error) throw error;
        return new Response(
          JSON.stringify({ id: data.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── DOCUMENTS ──
    if (path === "documents" && req.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      if (!projectId) {
        return new Response(
          JSON.stringify({ error: "projectId requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) throw error;

      const documents: Record<string, any> = {};
      for (const doc of data || []) {
        documents[doc.indicateur_id] = {
          indicateurId: doc.indicateur_id,
          status: doc.status,
          content: doc.content,
          generatedAt: doc.generated_at,
          error: doc.error,
          stale: doc.stale,
          versions: doc.versions,
          currentVersion: doc.current_version,
          improvedFrom: doc.improved_from,
        };
      }

      return new Response(
        JSON.stringify({ documents }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (path === "documents" && req.method === "POST") {
      const body = await req.json();
      const { projectId, documents } = body;

      if (!projectId || !documents) {
        return new Response(
          JSON.stringify({ error: "projectId et documents requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      for (const [indicateurId, doc] of Object.entries(documents as Record<string, any>)) {
        const row = {
          project_id: projectId,
          user_id: userId,
          indicateur_id: indicateurId,
          status: doc.status || "todo",
          content: doc.content || null,
          generated_at: doc.generatedAt || null,
          error: doc.error || null,
          stale: doc.stale || false,
          versions: doc.versions || [],
          current_version: doc.currentVersion || 0,
          improved_from: doc.improvedFrom || null,
        };

        await supabase
          .from("documents")
          .upsert(row, { onConflict: "project_id,indicateur_id" });
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── CONVERSATIONS ──
    if (path === "conversations" && req.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      if (!projectId) {
        return new Response(
          JSON.stringify({ error: "projectId requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) throw error;

      const conversations: Record<string, any> = {};
      for (const conv of data || []) {
        conversations[conv.critere_id] = {
          critereId: conv.critere_id,
          messages: conv.messages,
          phase: conv.phase,
          generatedDocs: conv.generated_docs,
          streaming: false,
        };
      }

      return new Response(
        JSON.stringify({ conversations }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (path === "conversation" && req.method === "POST") {
      const body = await req.json();
      const { projectId, critereId, messages, phase, generatedDocs } = body;

      if (!projectId || !critereId) {
        return new Response(
          JSON.stringify({ error: "projectId et critereId requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const row = {
        project_id: projectId,
        user_id: userId,
        critere_id: critereId,
        messages: messages || [],
        phase: phase || "questions",
        generated_docs: generatedDocs || {},
      };

      await supabase
        .from("conversations")
        .upsert(row, { onConflict: "project_id,critere_id" });

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Route non trouvée: ${path}` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
