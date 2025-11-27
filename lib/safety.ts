// lib/safety.ts

export type SafetyCategory =
  | "OK"
  | "MEDICAL_CONDITION"
  | "DOSAGE_OR_TREATMENT"
  | "CHILD_PREGNANCY_HIGH_RISK"
  | "ALLERGY_ANAPHYLAXIS";

export type SafetyCheckResult = {
  category: SafetyCategory;
  shouldBlock: boolean;
  messageForUser?: string; // human-facing safety note
};

const medicalKeywords = [
  "diagnosed with",
  "heart disease",
  "kidney",
  "liver failure",
  "cancer",
  "pcos",
  "thyroid",
  "diabetes",
  "asthma",
  "bp",
  "blood pressure",
  "cholesterol",
  "migraine",
  "epilepsy",
  "autoimmune",
  "ibd",
  "crohn",
  "ulcerative colitis",
  "doctor said",
  "prescribed",
  "on medication",
];

const dosageKeywords = [
  "mg",
  " ml",
  "dosage",
  "dose",
  "how much",
  "how many",
  "per kg",
  "maximum amount",
  "safe amount",
];

const childPregnancyKeywords = [
  "pregnant",
  "pregnancy",
  "breastfeeding",
  "lactating",
  "toddler",
  "baby",
  "infant",
  "newborn",
  "3 year old",
  "4 year old",
  "5 year old",
  "my child",
  "my kid",
  "children",
  "kids",
];

const allergyKeywords = [
  "anaphylaxis",
  "anaphylactic",
  "epi pen",
  "epipen",
  "severe allergy",
  "life threatening allergy",
  "shellfish allergy",
  "nut allergy",
  "peanut allergy",
  "gluten allergy",
  "wheat allergy",
];

export function checkUserSafetyIntent(userMessage: string): SafetyCheckResult {
  const text = userMessage.toLowerCase();

  if (dosageKeywords.some((k) => text.includes(k))) {
    return {
      category: "DOSAGE_OR_TREATMENT",
      shouldBlock: true,
      messageForUser:
        "I can’t give dosing or treatment advice. Please speak to a doctor or qualified professional for exact amounts and treatment decisions.",
    };
  }

  if (allergyKeywords.some((k) => text.includes(k))) {
    return {
      category: "ALLERGY_ANAPHYLAXIS",
      shouldBlock: true,
      messageForUser:
        "Severe allergies and anaphylaxis are medical emergencies. I can’t safely advise on that – please follow your doctor’s plan or seek urgent medical care.",
    };
  }

  if (childPregnancyKeywords.some((k) => text.includes(k))) {
    return {
      category: "CHILD_PREGNANCY_HIGH_RISK",
      shouldBlock: false,
      messageForUser:
        "For pregnancy, breastfeeding and young children, always consult a doctor or paediatrician. I’ll only share general ingredient information, not medical advice.",
    };
  }

  if (medicalKeywords.some((k) => text.includes(k))) {
    return {
      category: "MEDICAL_CONDITION",
      shouldBlock: false,
      messageForUser:
        "Because you mentioned a medical condition, please treat this only as general ingredient information and not as medical or treatment advice.",
    };
  }

  return {
    category: "OK",
    shouldBlock: false,
  };
}

// Helper to inject safety instructions into the system prompt
export function buildDynamicSystemPrompt(
  basePrompt: string,
  safety: SafetyCheckResult | null
): string {
  const genericSafetyInstruction = `
Important safety rules for you (the assistant):

- You are not a doctor or dietician.
- NEVER give medical advice, diagnoses, or treatment plans.
- NEVER give exact dosages (mg, ml, per kg, “how much to take”, etc.).
- For pregnancy, breastfeeding, babies, toddlers, serious allergies or chronic conditions,
  you must clearly say you cannot give medical advice and that they should consult a doctor.
- You can only explain ingredients in general, educational terms.
`;

  let prompt = basePrompt + "\n\n" + genericSafetyInstruction;

  if (!safety || safety.category === "OK") {
    return prompt;
  }

  if (safety.category === "CHILD_PREGNANCY_HIGH_RISK") {
    prompt += `
The user question involves pregnancy, breastfeeding or young children.
At the START of your reply, include a short safety note like:
"⚠️ Safety note: For pregnancy, breastfeeding and children, please talk to a doctor. I can only share general ingredient information."

Then answer in general ingredient terms only. Do NOT give medical advice or say if something is "safe for your baby/pregnancy" with certainty.
`;
  }

  if (safety.category === "MEDICAL_CONDITION") {
    prompt += `
The user question involves a medical condition.
At the START of your reply, include a short safety note like:
"⚠️ Safety note: Because a medical condition is involved, this is not medical advice. Please consult a doctor for personalised guidance."

Then answer in general ingredient terms only.
`;
  }

  return prompt;
}
