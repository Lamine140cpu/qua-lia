export type TypeAction = 'of' | 'bc' | 'vae' | 'cfa';

export interface Indicateur {
  id: string;
  titre: string;
  description: string;
  preuves: string[];
  docs_types: string[];
  appliesToTypes?: TypeAction[];
  conditionalNote?: string;
}

export interface Critere {
  id: string;
  titre: string;
  indicateurs: Record<string, Indicateur>;
}

export type RNQData = Record<string, Critere>;

export const RNQ_V9: RNQData = {
  critere1: {
    id: "critere1",
    titre: "Les conditions d'information du public sur les prestations proposées, les délais pour y accéder et les résultats obtenus",
    indicateurs: {
      "I1.1": {
        id: "I1.1",
        titre: "Information accessible au public",
        description: "Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, durée, modalités et délais d'accès, tarifs, contacts, méthodes mobilisées et modalités d'évaluation, accessibilité aux personnes handicapées.",
        preuves: ["Plaquette de présentation", "Site internet", "Catalogue formations", "CGV", "Programme formation"],
        docs_types: ["Fiche_Information_Prealable.docx", "CGV.docx", "Programme_Formation.docx"]
      },
      "I1.2": {
        id: "I1.2",
        titre: "Indicateurs de résultats diffusés",
        description: "Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et des publics accueillis.",
        preuves: ["Tableau indicateurs de résultats", "Rapports d'activité", "Bilans", "Taux de satisfaction"],
        docs_types: ["Tableau_Indicateurs_Resultats.xlsx", "Bilan_Activite.docx"]
      },
      "I1.3": {
        id: "I1.3",
        titre: "Information sur les certifications et taux d'obtention",
        description: "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d'obtention des certifications préparées, les possibilités de valider un/ou des blocs de compétences, ainsi que sur les équivalences, passerelles, suites de parcours et les débouchés.",
        preuves: ["Taux d'obtention certification", "Fiches RNCP", "Supports d'information certifications"],
        docs_types: ["Information_Certifications.docx", "Tableau_Taux_Obtention.xlsx"]
      }
    }
  },
  critere2: {
    id: "critere2",
    titre: "L'identification précise des objectifs des prestations proposées et l'adaptation de ces prestations aux publics bénéficiaires lors de la conception des prestations",
    indicateurs: {
      "I2.1": {
        id: "I2.1",
        titre: "Analyse des besoins du bénéficiaire",
        description: "Le prestataire analyse le besoin du bénéficiaire en lien avec l'entreprise et/ou le financeur concerné(s).",
        preuves: ["Grilles d'analyse", "Diagnostics préalables", "Dossiers admission", "Comptes rendus entretiens"],
        docs_types: ["Grille_Analyse_Besoin.docx", "Fiche_Diagnostic_Prealable.docx"]
      },
      "I2.2": {
        id: "I2.2",
        titre: "Objectifs opérationnels et évaluables",
        description: "Le prestataire définit les objectifs opérationnels et évaluables de la prestation.",
        preuves: ["Supports d'analyse", "Indicateurs de suivi", "Compétences visées", "Objectifs intermédiaires et finaux"],
        docs_types: ["Fiche_Objectifs_Operationnels.docx"]
      },
      "I2.3": {
        id: "I2.3",
        titre: "Contenus et modalités adaptés aux objectifs",
        description: "Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires.",
        preuves: ["Parcours", "Déroulés", "Séquences", "Grilles évaluation", "Référentiels diplômes"],
        docs_types: ["Sequencage_Pedagogique.docx", "Guide_Modalites_FOAD.docx"]
      },
      "I2.4": {
        id: "I2.4",
        titre: "Adéquation contenu / certification visée",
        description: "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il s'assure de l'adéquation du ou des contenus de la prestation aux exigences de la certification visée.",
        preuves: ["Tableau croisé contenu/référentiel", "Habilitation à former", "Convention certificateur"],
        docs_types: ["Tableau_Croise_Contenu_RNCP.docx"]
      },
      "I2.5": {
        id: "I2.5",
        titre: "Positionnement et évaluation des acquis à l'entrée",
        description: "Le prestataire détermine les procédures de positionnement et d'évaluation des acquis à l'entrée de la prestation.",
        preuves: ["Diagnostic préalable", "Entretien", "QCM", "Mise en situation", "Auto-positionnement"],
        docs_types: ["Procedure_Positionnement_Entree.docx", "Grille_Evaluation_Acquis_Entree.xlsx"]
      }
    }
  },
  critere3: {
    id: "critere3",
    titre: "L'adaptation aux publics bénéficiaires des prestations et des modalités d'accueil, d'accompagnement, de suivi et d'évaluation mises en œuvre",
    indicateurs: {
      "I3.1": {
        id: "I3.1",
        titre: "Information sur les conditions de déroulement",
        description: "Le prestataire informe les publics bénéficiaires des conditions de déroulement de la prestation.",
        preuves: ["Règlement intérieur", "Livret d'accueil", "Convocation", "CGU", "Organigramme"],
        docs_types: ["Livret_Accueil.docx", "Reglement_Interieur.docx", "Convocation_Formation.docx"]
      },
      "I3.2": {
        id: "I3.2",
        titre: "Adaptation de la prestation et du suivi",
        description: "Le prestataire met en œuvre et adapte la prestation, l'accompagnement et le suivi aux publics bénéficiaires.",
        preuves: ["Emplois du temps", "Groupes de niveaux", "Livret de suivi pédagogique", "Fiches de suivi"],
        docs_types: ["Fiche_Suivi_Individuel.docx", "Livret_Suivi_Pedagogique.docx"]
      },
      "I3.3": {
        id: "I3.3",
        titre: "Évaluation de l'atteinte des objectifs",
        description: "Le prestataire évalue l'atteinte par les publics bénéficiaires des objectifs de la prestation.",
        preuves: ["Outils évaluation des acquis", "Auto-évaluation", "Bilans intermédiaires", "Taux réussite"],
        docs_types: ["Grille_Evaluation_Mi_Parcours.docx", "Grille_Evaluation_Fin_Formation.docx"]
      },
      "I3.4": {
        id: "I3.4",
        titre: "Engagement des bénéficiaires et prévention des ruptures",
        description: "Le prestataire décrit et met en œuvre les mesures pour favoriser l'engagement des bénéficiaires et prévenir les ruptures de parcours.",
        preuves: ["Procédure gestion abandons", "Listing relances", "Outils d'implication", "Enquêtes terrain"],
        docs_types: ["Procedure_Prevention_Ruptures.docx", "Fiche_Relance_Apprenant.docx"]
      },
      "I3.5": {
        id: "I3.5",
        titre: "Coordination des apprentissages en alternance",
        description: "Pour les formations en alternance, le prestataire, en lien avec l'entreprise, anticipe avec l'apprenant les missions confiées, à court, moyen et long terme, et assure la coordination et la progressivité des apprentissages réalisés en centre de formation et en entreprise.",
        preuves: ["Carnet de suivi", "Plannings", "CR visites entreprise", "Tableau bord dématérialisé"],
        docs_types: ["Carnet_Liaison_CFA_Entreprise.docx", "CR_Visite_Entreprise.docx"]
      },
      "I3.6": {
        id: "I3.6",
        titre: "Accompagnement socio-professionnel et citoyenneté",
        description: "Le prestataire met en œuvre un accompagnement socio-professionnel, éducatif et relatif à l'exercice de la citoyenneté.",
        preuves: ["Projets sportifs", "Ateliers culturels", "Éducation citoyenneté", "Aides financières"],
        docs_types: ["Programme_Accompagnement_Socio_Pro.docx"]
      },
      "I3.7": {
        id: "I3.7",
        titre: "Droits et devoirs des apprentis, santé et sécurité",
        description: "Le prestataire informe les apprentis de leurs droits et devoirs en tant qu'apprentis et salariés ainsi que des règles applicables en matière de santé et de sécurité en milieu professionnel.",
        preuves: ["Règlement intérieur du CFA", "Supports d'informations", "Livret d'accueil"],
        docs_types: ["Information_Droits_Devoirs_Apprentis.docx"]
      },
      "I3.8": {
        id: "I3.8",
        titre: "Conditions de présentation à la certification",
        description: "Lorsque le prestataire met en œuvre des formations conduisant à une certification professionnelle, il s'assure que les conditions de présentation des bénéficiaires à la certification respectent les exigences formelles de l'autorité de certification.",
        preuves: ["Information sur le déroulement de l'évaluation", "Habilitation à évaluer", "PV sessions d'examen"],
        docs_types: ["Procedure_Presentation_Certification.docx"]
      }
    }
  },
  critere4: {
    id: "critere4",
    titre: "L'adéquation des moyens pédagogiques, techniques et d'encadrement aux prestations mises en œuvre",
    indicateurs: {
      "I4.1": {
        id: "I4.1",
        titre: "Moyens humains et techniques adaptés",
        description: "Le prestataire met à disposition ou s'assure de la mise à disposition des moyens humains et techniques adaptés et d'un environnement approprié (conditions, locaux, équipements, plateaux techniques…).",
        preuves: ["Bail/contrat location", "Registre accessibilité", "DUERP", "Matériel adéquat", "Plateformes LMS"],
        docs_types: ["Inventaire_Moyens.docx", "DUERP.docx", "Registre_Accessibilite.docx"]
      },
      "I4.2": {
        id: "I4.2",
        titre: "Coordination des intervenants",
        description: "Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes (pédagogiques, administratifs, logistiques, commerciaux…).",
        preuves: ["Organigramme fonctionnel", "Liste intervenants", "Fiches de poste", "CR réunions équipes"],
        docs_types: ["Fiche_Poste_Formateur.docx", "Planning_Coordination.docx"]
      },
      "I4.3": {
        id: "I4.3",
        titre: "Ressources pédagogiques mises à disposition",
        description: "Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet à celui-ci de se les approprier.",
        preuves: ["Supports de cours", "Vidéos", "Fiches pratiques", "Plateforme e-learning"],
        docs_types: ["Catalogue_Ressources_Pedagogiques.docx", "Procedure_Acces_LMS.docx"]
      },
      "I4.4": {
        id: "I4.4",
        titre: "Personnel dédié : mobilité, handicap, conseil de perfectionnement",
        description: "Le prestataire dispose d'un personnel dédié à l'appui à la mobilité nationale et internationale, d'un référent handicap et d'un conseil de perfectionnement.",
        preuves: ["Membres du conseil de perfectionnement", "Personnes dédiées mobilité", "Référent handicap"],
        docs_types: ["PV_Conseil_Perfectionnement.docx", "PV_Nomination_Referent_Handicap.docx"]
      }
    }
  },
  critere5: {
    id: "critere5",
    titre: "La qualification et le développement des connaissances et compétences des personnels chargés de mettre en œuvre les prestations",
    indicateurs: {
      "I5.1": {
        id: "I5.1",
        titre: "Compétences des intervenants",
        description: "Le prestataire détermine, mobilise et évalue les compétences des différents intervenants internes et/ou externes, adaptées aux prestations.",
        preuves: ["Analyse besoins compétences", "CV", "Entretiens professionnels", "Plan développement compétences"],
        docs_types: ["Grille_Competences_Intervenants.docx", "Procedure_Recrutement_Formateurs.docx"]
      },
      "I5.2": {
        id: "I5.2",
        titre: "Développement des compétences des salariés",
        description: "Le prestataire entretient et développe les compétences de ses salariés, adaptées aux prestations qu'il délivre.",
        preuves: ["Qualification personnels", "Plan développement compétences", "Entretien professionnel", "Communauté de pairs"],
        docs_types: ["Plan_Developpement_Competences.xlsx", "Procedure_Entretien_Professionnel.docx"]
      }
    }
  },
  critere6: {
    id: "critere6",
    titre: "L'inscription et l'investissement du prestataire dans son environnement professionnel",
    indicateurs: {
      "I6.1": {
        id: "I6.1",
        titre: "Veille légale et réglementaire",
        description: "Le prestataire réalise une veille légale et réglementaire sur le champ de la formation professionnelle et en exploite les enseignements.",
        preuves: ["Abonnements", "Conférences", "Actualisation supports", "Diffusion actualités au personnel"],
        docs_types: ["Procedure_Veille_Juridique.docx", "Tableau_Veille_Legale.xlsx"]
      },
      "I6.2": {
        id: "I6.2",
        titre: "Veille sur les compétences, métiers et emplois",
        description: "Le prestataire réalise une veille sur les évolutions des compétences, des métiers et des emplois dans ses secteurs d'intervention et en exploite les enseignements.",
        preuves: ["Veille métiers/emplois", "Conférences", "Réseau professionnel", "Revues professionnelles"],
        docs_types: ["Tableau_Veille_Metiers.xlsx"]
      },
      "I6.3": {
        id: "I6.3",
        titre: "Veille sur les innovations pédagogiques et technologiques",
        description: "Le prestataire réalise une veille sur les innovations pédagogiques et technologiques permettant une évolution de ses prestations et en exploite les enseignements.",
        preuves: ["Veille innovations", "Conférences", "Groupes de réflexion", "Analyse opportunité/faisabilité"],
        docs_types: ["Tableau_Veille_Innovations.xlsx"]
      },
      "I6.4": {
        id: "I6.4",
        titre: "Accueil et accompagnement des publics en situation de handicap",
        description: "Le prestataire mobilise les expertises, outils et réseaux nécessaires pour accueillir, accompagner/former ou orienter les publics en situation de handicap.",
        preuves: ["Liste partenaires (Agefiph, Cap emploi, MDPH)", "Charte accessibilité", "Référent handicap"],
        docs_types: ["Convention_Partenariat_Handicap.docx", "Liste_Partenaires_Handicap.docx"]
      },
      "I6.5": {
        id: "I6.5",
        titre: "Sous-traitance et portage salarial",
        description: "Lorsque le prestataire fait appel à la sous-traitance ou au portage salarial, il s'assure du respect de la conformité au présent référentiel.",
        preuves: ["Contrats sous-traitance", "Process sélection", "Charte qualité"],
        docs_types: ["Charte_Qualite_Sous_Traitants.docx", "Contrat_Sous_Traitance.docx"]
      },
      "I6.6": {
        id: "I6.6",
        titre: "Réseau de partenaires socio-économiques",
        description: "Lorsque les prestations dispensées au bénéficiaire comprennent des périodes de formation en situation de travail, le prestataire mobilise son réseau de partenaires socio-économiques pour co-construire l'ingénierie de formation et favoriser l'accueil en entreprise.",
        preuves: ["Comités pilotage", "Conventions partenariats", "Liste entreprises partenaires"],
        docs_types: ["Convention_Partenariat_Entreprise.docx", "Liste_Entreprises_Partenaires.xlsx"]
      },
      "I6.7": {
        id: "I6.7",
        titre: "Insertion professionnelle et poursuite d'études",
        description: "Le prestataire développe des actions qui concourent à l'insertion professionnelle ou la poursuite d'étude par la voie de l'apprentissage ou par toute autre voie permettant de développer leurs connaissances et leurs compétences.",
        preuves: ["Salon orientation", "Visite entreprise", "Atelier CV", "Réseau anciens élèves"],
        docs_types: ["Programme_Actions_Insertion.docx"]
      }
    }
  },
  critere7: {
    id: "critere7",
    titre: "Le recueil et la prise en compte des appréciations et des réclamations formulées par les parties prenantes aux prestations délivrées",
    indicateurs: {
      "I7.1": {
        id: "I7.1",
        titre: "Recueil des appréciations des parties prenantes",
        description: "Le prestataire recueille les appréciations des parties prenantes : bénéficiaires, financeurs, équipes pédagogiques et entreprises concernées.",
        preuves: ["Enquêtes satisfaction", "Questionnaires", "CR entretiens", "Comité de pilotage"],
        docs_types: ["Questionnaire_Satisfaction_Apprenti.docx", "Questionnaire_Satisfaction_Entreprise.docx", "Procedure_Recueil_Appreciations.docx"]
      },
      "I7.2": {
        id: "I7.2",
        titre: "Traitement des réclamations et des aléas",
        description: "Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées par les parties prenantes, des réclamations exprimées par ces dernières, des aléas survenus en cours de prestation.",
        preuves: ["Procédure réclamation", "Tableau de suivi", "Système de médiation"],
        docs_types: ["Procedure_Traitement_Reclamations.docx", "Registre_Reclamations.xlsx"]
      },
      "I7.3": {
        id: "I7.3",
        titre: "Mesures d'amélioration continue",
        description: "Le prestataire met en œuvre des mesures d'amélioration à partir de l'analyse des appréciations et des réclamations.",
        preuves: ["Plans d'action amélioration", "Tableau de suivi mesures", "Analyse causes abandon"],
        docs_types: ["Procedure_Amelioration_Continue.docx", "Plan_Action_Amelioration.xlsx"]
      }
    }
  }
};

export function getAllIndicateurs(): Indicateur[] {
  return Object.values(RNQ_V9).flatMap(critere =>
    Object.values(critere.indicateurs)
  );
}

export function getIndicateurById(id: string): Indicateur | undefined {
  for (const critere of Object.values(RNQ_V9)) {
    if (critere.indicateurs[id]) return critere.indicateurs[id];
  }
  return undefined;
}

export function getCritereForIndicateur(indicateurId: string): Critere | undefined {
  return Object.values(RNQ_V9).find(c => indicateurId in c.indicateurs);
}

export const CRITERE_ICONS = {
  critere1: "Globe",
  critere2: "Target",
  critere3: "Users",
  critere4: "Wrench",
  critere5: "GraduationCap",
  critere6: "Network",
  critere7: "MessageSquare",
} as const;

export const CRITERE_COLORS = {
  critere1: "216 72% 30%",
  critere2: "190 60% 38%",
  critere3: "28 80% 52%",
  critere4: "145 50% 36%",
  critere5: "265 50% 48%",
  critere6: "340 55% 48%",
  critere7: "45 75% 48%",
} as const;

/**
 * Matrice d'applicabilité des indicateurs par type d'action (RNQ v9).
 * Indicateurs non listés s'appliquent à tous les types.
 */
const INDICATEUR_TYPES: Record<string, { types: TypeAction[]; note?: string }> = {
  // Critère 1
  "I1.3": { types: ['of', 'cfa'], note: "Uniquement si formations certifiantes" },
  // Critère 2
  "I2.4": { types: ['of', 'cfa'], note: "Uniquement si formations certifiantes" },
  "I2.6": { types: ['of', 'cfa'], note: "Uniquement si formations certifiantes" },
  // Critère 3 — CFA uniquement
  "I3.13": { types: ['cfa'], note: "Spécifique CFA/alternance" },
  "I3.14": { types: ['cfa'], note: "Spécifique CFA" },
  // Critère 6
  "I6.24": { types: ['of', 'cfa'], note: "Si FEST/alternance" },
  "I6.26": { types: ['cfa'], note: "Spécifique CFA" },
  // Critère 7
  "I7.31": { types: ['cfa'], note: "Spécifique CFA" },
};

/** Vérifie si un indicateur s'applique aux types sélectionnés */
export function indicateurAppliesToTypes(indicateurId: string, selectedTypes: TypeAction[]): boolean {
  if (!selectedTypes || selectedTypes.length === 0) return true;
  const config = INDICATEUR_TYPES[indicateurId];
  if (!config) return true; // Pas de restriction = tous les types
  return config.types.some(t => selectedTypes.includes(t));
}

/** Retourne la note conditionnelle d'un indicateur, ou undefined */
export function getIndicateurTypeNote(indicateurId: string): string | undefined {
  return INDICATEUR_TYPES[indicateurId]?.note;
}
