---
name: RNQ v9 Indicator Structure
description: Indicators numbered I1-I32 continuously across 7 criteria, with applicability matrix and proof collection system
type: feature
---
- Official RNQ v9 numbering: I1-I32 (not I1.1, I2.1 etc.)
- C1: I1-I3, C2: I4-I8, C3: I9-I16, C4: I17-I20, C5: I21-I22, C6: I23-I29, C7: I30-I32
- CFA-specific indicators: I13, I14, I15, I20, I29
- Certification-specific: I3, I7, I16
- FEST/alternance: I28
- Each indicator has `preuves: PreuveItem[]` with `dynamic` flag
- Dynamic proofs = must be collected manually (émargements, CV, CR)
- Process docs = generatable by AI (procedures, grilles, tableaux)
- `collectedPreuves` in wizard store tracks proof collection status
- `auditStatus` field: 'initial' (nouvel entrant) | 'renouvellement'
