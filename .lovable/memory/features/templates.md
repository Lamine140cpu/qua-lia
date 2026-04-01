---
name: Templates Qualiopi Integration
description: 234 DOCX templates from mallette stored as markdown in templates table, injected into AI prompts for personalization
type: feature
---
- `templates` table: template_id, category, critere, indicateur, name, file_name, content_markdown, file_type
- Categories: critere_indicateur (67), dossier_apprenti (30), emargement (30), critere_cfa (27), reunion (20), qualite_operationnel (20), veille (20), convention (15), conformite (3)
- Templates have placeholders like [NOM DU CFA], [NDA], [SIRET], [Prénom Nom] that AI replaces with real org data
- generate-document Edge Function fetches templates by indicateur number, injects into prompt
- chat Edge Function fetches templates by critère number, adds to conversation context
- RLS: all authenticated users can SELECT (shared reference data)
