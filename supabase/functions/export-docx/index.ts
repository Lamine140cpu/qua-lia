import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat,
} from "npm:docx@9.4.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Brand colors ──
const BRAND = {
  primary: "1E3A5F",
  primaryLight: "D5E8F0",
  accent: "2563EB",
  gray: "6B7280",
  lightGray: "F3F4F6",
  border: "D1D5DB",
  white: "FFFFFF",
  black: "1A1A1A",
};

// ── Markdown → docx elements ──

interface ParsedLine {
  type: "h1" | "h2" | "h3" | "bullet" | "numbered" | "table-row" | "empty" | "text";
  content: string;
  cells?: string[];
}

function parseLine(line: string): ParsedLine {
  const trimmed = line.trimEnd();
  if (!trimmed) return { type: "empty", content: "" };
  
  const h1 = trimmed.match(/^#\s+(.+)/);
  if (h1) return { type: "h1", content: h1[1] };
  
  const h2 = trimmed.match(/^##\s+(.+)/);
  if (h2) return { type: "h2", content: h2[1] };
  
  const h3 = trimmed.match(/^###\s+(.+)/);
  if (h3) return { type: "h3", content: h3[1] };
  
  const bullet = trimmed.match(/^[-*]\s+(.+)/);
  if (bullet) return { type: "bullet", content: bullet[1] };
  
  const numbered = trimmed.match(/^(\d+)\.\s+(.+)/);
  if (numbered) return { type: "numbered", content: trimmed };
  
  if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
    // Check if it's a separator row
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) return { type: "empty", content: "" };
    const cells = trimmed.split("|").slice(1, -1).map(c => c.trim());
    return { type: "table-row", content: trimmed, cells };
  }
  
  return { type: "text", content: trimmed };
}

function buildInlineRuns(text: string, baseBold = false, baseSize = 22): TextRun[] {
  const runs: TextRun[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), bold: baseBold, size: baseSize, font: "Calibri" }));
    }
    runs.push(new TextRun({ text: match[1], bold: true, size: baseSize, font: "Calibri" }));
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), bold: baseBold, size: baseSize, font: "Calibri" }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text, bold: baseBold, size: baseSize, font: "Calibri" }));
  }
  return runs;
}

function markdownToDocxElements(markdown: string, orgName: string, docTitle: string) {
  const lines = markdown.split("\n");
  const parsed = lines.map(parseLine);
  const elements: (Paragraph | Table)[] = [];
  
  let i = 0;
  while (i < parsed.length) {
    const p = parsed[i];
    
    switch (p.type) {
      case "h1":
        elements.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 200 },
          children: [new TextRun({ text: p.content, bold: true, size: 36, font: "Calibri", color: BRAND.primary })],
        }));
        break;
        
      case "h2":
        elements.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 160 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND.primary, space: 4 } },
          children: [new TextRun({ text: p.content, bold: true, size: 28, font: "Calibri", color: BRAND.primary })],
        }));
        break;
        
      case "h3":
        elements.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: p.content, bold: true, size: 24, font: "Calibri", color: BRAND.accent })],
        }));
        break;
        
      case "bullet":
        elements.push(new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { before: 40, after: 40 },
          children: buildInlineRuns(p.content),
        }));
        break;
        
      case "numbered":
        elements.push(new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { before: 40, after: 40 },
          children: buildInlineRuns(p.content.replace(/^\d+\.\s+/, "")),
        }));
        break;
        
      case "table-row": {
        // Collect all consecutive table rows
        const tableRows: string[][] = [];
        while (i < parsed.length && parsed[i].type === "table-row") {
          tableRows.push(parsed[i].cells!);
          i++;
        }
        i--; // compensate for outer loop increment
        
        if (tableRows.length > 0) {
          const colCount = tableRows[0].length;
          const colWidth = Math.floor(9360 / colCount);
          const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: BRAND.border };
          const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
          
          const rows = tableRows.map((cells, rowIdx) =>
            new TableRow({
              children: cells.map(cell =>
                new TableCell({
                  borders,
                  width: { size: colWidth, type: WidthType.DXA },
                  shading: rowIdx === 0
                    ? { fill: BRAND.primary, type: ShadingType.CLEAR }
                    : rowIdx % 2 === 0
                      ? { fill: BRAND.lightGray, type: ShadingType.CLEAR }
                      : { fill: BRAND.white, type: ShadingType.CLEAR },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [new Paragraph({
                    children: buildInlineRuns(cell, rowIdx === 0, rowIdx === 0 ? 20 : 22),
                    alignment: AlignmentType.LEFT,
                  })],
                })
              ),
            })
          );
          
          // Fix header row text color to white
          elements.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: Array(colCount).fill(colWidth),
            rows,
          }));
        }
        break;
      }
        
      case "empty":
        elements.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }));
        break;
        
      case "text":
        elements.push(new Paragraph({
          spacing: { before: 60, after: 60 },
          children: buildInlineRuns(p.content),
        }));
        break;
    }
    
    i++;
  }
  
  return elements;
}

function buildStyledDoc(markdown: string, orgName: string, docTitle: string): Document {
  const elements = markdownToDocxElements(markdown, orgName, docTitle);
  const date = new Date().toLocaleDateString("fr-FR");
  
  return new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
      },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Calibri", color: BRAND.primary },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Calibri", color: BRAND.primary },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Calibri", color: BRAND.accent },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [
        { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND.primary, space: 4 } },
            children: [
              new TextRun({ text: orgName, bold: true, size: 18, font: "Calibri", color: BRAND.primary }),
              new TextRun({ text: `  |  ${docTitle}`, size: 18, font: "Calibri", color: BRAND.gray }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BRAND.border, space: 4 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Document généré par Qual'IA · ${date} · `, size: 16, font: "Calibri", color: BRAND.gray }),
              new TextRun({ text: "Page ", size: 16, font: "Calibri", color: BRAND.gray }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Calibri", color: BRAND.gray }),
            ],
          })],
        }),
      },
      children: elements,
    }],
  });
}

// ── Auth ──

async function authenticate(req: Request): Promise<string | null> {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { action, markdown, filename, documents, cfaInfo } = await req.json();

    const orgName = cfaInfo?.nom || "Organisme";

    // ── Single DOCX export ──
    if (action === "single" || (!action && markdown)) {
      if (!markdown) {
        return new Response(JSON.stringify({ error: "markdown requis" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const title = filename || "Document";
      const doc = buildStyledDoc(markdown, orgName, title);
      const buffer = await Packer.toBuffer(doc);

      return new Response(buffer, {
        headers: {
          ...cors,
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${title.replace(/[^a-zA-Z0-9àéèêëïôùûç _-]/gi, "")}.docx"`,
        },
      });
    }

    // ── Mallette ZIP export ──
    if (action === "mallette") {
      if (!documents || typeof documents !== "object") {
        return new Response(JSON.stringify({ error: "documents requis" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // Dynamic import JSZip for ZIP
      const JSZip = (await import("npm:jszip@3.10.1")).default;
      const malletteZip = new JSZip();
      let docCount = 0;

      for (const [id, doc] of Object.entries(documents)) {
        const d = doc as any;
        if (d.status !== "generated" || !d.content) continue;

        const safeId = id.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const styledDoc = buildStyledDoc(d.content, orgName, safeId);
        const docxBuffer = await Packer.toBuffer(styledDoc);
        malletteZip.file(`${safeId}.docx`, docxBuffer);
        docCount++;
      }

      if (docCount === 0) {
        return new Response(JSON.stringify({ error: "Aucun document généré à exporter" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const zipBuffer = await malletteZip.generateAsync({ type: "uint8array" });

      return new Response(zipBuffer, {
        headers: {
          ...cors,
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="Mallette_Qualiopi_${orgName.replace(/[^a-zA-Z0-9àéèêëïôùûç _-]/gi, "")}.zip"`,
        },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue. Utilisez 'single' ou 'mallette'." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("export-docx error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erreur serveur" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
