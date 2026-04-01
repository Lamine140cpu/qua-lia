
Objectif: corriger le blocage “on ne peut pas envoyer” dans le chat critère.

Diagnostic confirmé
- Les logs backend montrent un appel `POST /chat` en `401` (`Token invalide`), donc l’envoi part parfois mais échoue côté auth.
- Dans le front, il y a une incohérence de garde:
  - bouton activé/désactivé avec `conversation.streaming && abortRef.current`
  - mais `handleSend` bloque avec `conversation.streaming` seul
- Résultat possible: bouton cliquable visuellement, mais l’action `send` est refusée en silence si `streaming` reste à `true` sans requête active.
- Do I know what the issue is? Oui: combinaison “session invalide + verrou streaming incohérent”.

Plan de correction
1) Unifier la logique “peut envoyer” dans `src/pages/AgentChat.tsx`
- Créer un booléen unique `isRequestInFlight = Boolean(conversation?.streaming && abortRef.current)`.
- Utiliser ce booléen à la fois pour:
  - `disabled` du bouton
  - condition de blocage dans `handleSend`
- Supprimer le blocage basé uniquement sur `conversation.streaming`.

2) Fiabiliser la session avant appel backend chat
- Dans `sendToAgent`, récupérer une session valide (tentative refresh si besoin).
- Si token absent/invalide: message clair “session expirée”, puis redirection vers `/auth` (ou demande de reconnexion).
- Ajouter un retry unique sur 401 après refresh session.

3) Nettoyer correctement l’état après échec
- Garantir en sortie d’erreur:
  - `setStreaming(false)`
  - `abortRef.current = null`
- Si l’échec survient avant premier delta, retirer le message assistant vide pour éviter un état UI ambigu.

4) Durcir la DX côté backend chat (sans changer le comportement métier)
- Rendre les erreurs auth plus explicites (code/texte différencié: non authentifié vs token invalide).
- Ajouter des logs auth ciblés pour diagnostiquer rapidement si le problème revient.

5) Validation end-to-end (obligatoire)
- Se connecter, aller sur `/agent/critere1`.
- Vérifier:
  1. champ saisissable
  2. clic envoyer déclenche bien la requête
  3. réponse streaming visible
  4. nouvel envoi possible juste après
- Test de non-régression: simuler session expirée, vérifier message explicite + reconnexion propre.

Détails techniques (fichiers impactés)
- `src/pages/AgentChat.tsx` (garde d’envoi, auth pré-call, cleanup, retry 401)
- `supabase/functions/chat/index.ts` (erreurs/logs auth plus explicites)
- Optionnel: `src/lib/api.ts` (helper partagé session valide si on veut factoriser)
