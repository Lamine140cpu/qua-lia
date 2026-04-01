

# Plan de stabilisation — Chat IA, Export DOCX et Documents Visuels

## Diagnostic

J'ai investigué en profondeur. Voici ce qui ne marche pas et pourquoi :

### 1. Chat IA — Bloqué sur les 3 points de chargement
**Cause racine** : Race condition entre les `useEffect` dans `AgentChat.tsx`.
- L'état Zustand persiste `streaming: true` dans localStorage quand l'utilisateur ferme l'onglet pendant le streaming
- Le useEffect "stuck fix" (L226) reset la conversation, ce qui met `messages.length = 0`
- Le useEffect "auto-send" (L240) dépend de `conversation?.messages.length` et `conversation?.streaming` — mais après le reset, `conversation` pointe vers l'ancienne référence avant que le store se mette à jour
- Résultat : le chat ne déclenche jamais `sendToAgent` et reste sur les dots

**Le backend fonctionne** : J'ai testé avec curl, le chat répond en streaming (200 OK, Gemini Flash).

### 2. Export DOCX — Le bouton télécharge du `.md` au lieu de `.docx`
**Cause** : La fonction `handleDownloadDoc` dans `AgentChat.tsx` (L399) fait un export client-side en `.md` au lieu d'appeler l'Edge Function `export-docx` qui génère de vrais DOCX stylisés.

### 3. Documents Visuels — Dépendance Anthropic directe
**Cause** : `generate-visual` appelle directement `api.anthropic.com` avec `claude-sonnet-4-20250514`, mais le modèle exact pourrait ne pas être disponible ou la clé API mal configurée. De plus, le mode image utilise Lovable AI Gateway avec un modèle d'image qui retourne du texte, pas une image.

## Plan de correction (5 fichiers)

### Étape 1 : Corriger le chat — `src/pages/AgentChat.tsx`
- Fusionner les 2 useEffects (stuck fix + auto-send) en un seul pour éliminer la race condition
- Ajouter un `useRef` pour tracker si le send initial a déjà été fait (éviter les doubles appels)
- Ajouter des `console.log` stratégiques pour le debug
- Remplacer `handleDownloadDoc` pour appeler l'Edge Function `export-docx` au lieu du download MD client-side

### Étape 2 : Corriger le streaming parser
- Le stream Lovable AI envoie `data: [DONE]` comme signal de fin, mais le parser ne le gère pas (il cherche `parsed.type === 'done'` qui est le legacy format)
- Ajouter la gestion de `data: [DONE]` et des lignes `: OPENROUTER PROCESSING` (commentaires SSE à ignorer)

### Étape 3 : Corriger `generate-visual` — Edge Function
- Basculer le mode HTML vers Lovable AI Gateway (comme le chat) au lieu d'Anthropic direct — pour cohérence et fiabilité
- Pour le mode image, utiliser le bon endpoint et gérer le cas où l'API retourne du texte au lieu d'une image

### Étape 4 : Redéployer les Edge Functions
- `chat` (déjà fonctionnel, mais on redéploie après fix du stream termination)
- `export-docx` (vérifier qu'il est bien déployé)
- `generate-visual` (après correction)

### Étape 5 : Nettoyer l'état persisté
- Ajouter un bouton visible "Réinitialiser" dans le chat qui clear le localStorage pour ce critère
- Le useEffect de stuck fix doit aussi clear `abortRef` proprement

## Détails techniques

```text
AgentChat.tsx — useEffect consolidé :
  1. Mount → check stuck state → reset if needed
  2. After reset → auto-send with ref guard (sentRef)
  3. Parse "data: [DONE]" as stream end signal
  4. handleDownloadDoc → call EDGE_FN.exportDocx

generate-visual/index.ts :
  Mode HTML → Lovable AI Gateway (gemini-3-flash-preview)
  Mode image → Keep current approach but add better error handling

export-docx/index.ts :
  Already functional — just needs frontend wiring
```

