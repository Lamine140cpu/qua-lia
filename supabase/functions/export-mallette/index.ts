import { corsHeaders } from "@anthropic-ai/sdk/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Minimal DOCX generation: create a valid .docx from markdown text
// DOCX is a ZIP of XML files — we use JSZip to build it

import JSZip from "npm:jszip@3.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── CORS ──
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Markdown → DOCX XML body ──

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function mdToDocxBody(md: string): string {
  const lines = md.split("\n");
  const paragraphs: string[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) {
      paragraphs.push(`<w:p><w:r><w:t></w:t></w:r></w:p>`);
      continue;
    }

    // Headings
    const h1 = line.match(/^#\s+(.+)/);
    if (h1) {
      paragraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>${escapeXml(h1[1])}</w:t></w:r></w:p>`
      );
      continue;
    }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      paragraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(h2[1])}</w:t></w:r></w:p>`
      );
      continue;
    }
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      paragraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(h3[1])}</w:t></w:r></w:p>`
      );
      continue;
    }

    // Bullet list
    const bullet = line.match(/^[-*]\s+(.+)/);
    if (bullet) {
      paragraphs.push(
        `<w:p><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:r><w:t>• ${escapeXml(bullet[1])}</w:t></w:r></w:p>`
      );
      continue;
    }

    // Numbered list
    const numbered = line.match(/^\d+\.\s+(.+)/);
    if (numbered) {
      paragraphs.push(
        `<w:p><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:r><w:t>${escapeXml(line)}</w:t></w:r></w:p>`
      );
      continue;
    }

    // Bold inline: **text**
    const parts: string[] = [];
    let remaining = line;
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          `<w:r><w:t xml:space="preserve">${escapeXml(remaining.slice(lastIndex, match.index))}</w:t></w:r>`
        );
      }
      parts.push(
        `<w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(match[1])}</w:t></w:r>`
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < remaining.length) {
      parts.push(
        `<w:r><w:t xml:space="preserve">${escapeXml(remaining.slice(lastIndex))}</w:t></w:r>`
      );
    }
    paragraphs.push(`<w:p>${parts.join("")}</w:p>`);
  }

  return paragraphs.join("\n");
}

function buildDocx(title: string, body: string): JSZip {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`
  );

  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
            mc:Ignorable="w14 wp14">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
  );

  return zip;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { documents, cfaInfo } = await req.json();
    if (!documents || typeof documents !== "object") {
      return new Response(
        JSON.stringify({ error: "Paramètre 'documents' manquant" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const malletteZip = new JSZip();
    let docCount = 0;

    for (const [id, doc] of Object.entries(documents)) {
      const d = doc as any;
      if (d.status !== "generated" || !d.content) continue;

      const safeId = id.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const body = mdToDocxBody(d.content);
      const docxZip = buildDocx(safeId, body);
      const docxBuffer = await docxZip.generateAsync({ type: "uint8array" });

      malletteZip.file(`${safeId}.docx`, docxBuffer);
      docCount++;
    }

    if (docCount === 0) {
      return new Response(
        JSON.stringify({ error: "Aucun document généré à exporter" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const zipBuffer = await malletteZip.generateAsync({ type: "uint8array" });

    return new Response(zipBuffer, {
      headers: {
        ...cors,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Mallette_Qualiopi_${(cfaInfo?.nom || "Organisme").replace(/[^a-zA-Z0-9àéèêëïôùûç _-]/gi, "")}.zip"`,
      },
    });
  } catch (err: any) {
    console.error("export-mallette error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erreur serveur" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
