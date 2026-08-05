/**
 * Master symptom catalogue for patient registration.
 *
 * SHAPE (unchanged from the original 3-item list, so nothing downstream broke):
 *   { symptom: "Fever", category: "General", titles: [{ title, description }] }
 *
 * AUTHORING FORMAT
 * ----------------
 * Symptoms are written compactly as "Title|Description" strings and expanded
 * by S(). Shared qualifier sets (SEVERITY, ONSET, PAIN…) are spread in so a
 * hundred symptoms don't need a hundred hand-written severity blocks.
 *
 * Adding a symptom: add one S(...) line in the right category block, then bump
 * SYMPTOM_CATALOG_VERSION so every browser refreshes its cached copy.
 *
 * Descriptions auto-fill the "Symptoms Description" box, and the doctor can
 * still overwrite that text — these are starting points, not fixed wording.
 */

export const SYMPTOM_CATALOG_VERSION = 2;

const S = (category, symptom, ...types) => ({
  symptom,
  category,
  titles: types.map((t) => {
    const [title, description = ""] = t.split("|");
    return { title, description };
  }),
});

/* ---------- reusable qualifier sets ---------- */
const SEVERITY = [
  "Mild|Mild — does not interfere with daily activity.",
  "Moderate|Moderate — interferes with some daily activity.",
  "Severe|Severe — unable to carry out normal activity.",
];
const ONSET = [
  "Sudden onset|Started abruptly.",
  "Gradual onset|Developed slowly over time.",
];
const COURSE = [
  "Intermittent|Comes and goes.",
  "Persistent|Present continuously.",
];
const DURATION = [
  "Acute (under 1 week)|Present for less than a week.",
  "Sub-acute (1-4 weeks)|Present for one to four weeks.",
  "Chronic (over 1 month)|Present for more than a month.",
];
const PAIN = [
  "Sharp|Sharp, stabbing pain.",
  "Dull|Dull, aching pain.",
  "Burning|Burning pain.",
  "Cramping|Cramping, spasm-like pain.",
  "Throbbing|Throbbing, pulsating pain.",
];

const CATALOG = [
  /* ---------------- General / constitutional ---------------- */
  S(
    "General",
    "Fever",
    "Low grade|Below 100°F (37.8°C).",
    "Moderate|100-102°F (37.8-38.9°C).",
    "High grade|Above 102°F (38.9°C).",
    "With chills|Fever with shivering and rigors.",
    "Intermittent|Rises and falls, returns to normal in between.",
    "Continuous|Stays raised without returning to normal.",
    "Evening rise|Rises typically in the evening."
  ),
  S("General", "Chills and Rigors", ...SEVERITY, "With fever|Accompanied by raised temperature."),
  S("General", "Fatigue", ...SEVERITY, ...DURATION),
  S("General", "Weakness", "Generalised|Whole-body weakness.", "One-sided|Weakness on one side of the body.", "Limb specific|Weakness limited to one limb.", ...SEVERITY),
  S("General", "Loss of Appetite", ...SEVERITY, ...DURATION),
  S("General", "Weight Loss", "Unintentional|Unplanned weight loss.", "Rapid|Significant loss over a short period.", "Gradual|Slow loss over months."),
  S("General", "Weight Gain", "Rapid|Sudden increase in weight.", "Gradual|Slow increase over months.", "With swelling|Associated with fluid retention."),
  S("General", "Night Sweats", ...SEVERITY, "Drenching|Soaking night sweats requiring change of clothes."),
  S("General", "Excessive Thirst", ...SEVERITY, "With frequent urination|Accompanied by passing urine often."),
  S("General", "Excessive Hunger", ...SEVERITY),
  S("General", "Dehydration", "Mild|Dry mouth, thirst.", "Moderate|Reduced urine output, sunken eyes.", "Severe|Lethargy, very low urine output — needs urgent care."),
  S("General", "Heat Intolerance", ...SEVERITY),
  S("General", "Cold Intolerance", ...SEVERITY),
  S("General", "Swelling (Oedema)", "Feet and ankles|Swelling of the lower limbs.", "Face and eyelids|Puffiness around the eyes and face.", "Generalised|Swelling over the whole body.", "One limb|Swelling of a single limb."),

  /* ---------------- Neurological ---------------- */
  S(
    "Neurological",
    "Headache",
    "Mild|Mild pain, tolerable.",
    "Severe|Severe pain, limits activity.",
    "Throbbing|Pulsating pain, often one-sided.",
    "Band-like|Tight band around the head.",
    "With aura|Preceded by visual or sensory warning signs.",
    "With vomiting|Headache accompanied by vomiting.",
    "Worse in morning|Most severe on waking."
  ),
  S("Neurological", "Dizziness", "Light-headed|Feeling faint or unsteady.", "On standing|Occurs when getting up.", ...SEVERITY),
  S("Neurological", "Vertigo", "Spinning sensation|Room feels like it is spinning.", "Positional|Triggered by head movement.", "With nausea|Accompanied by nausea or vomiting."),
  S("Neurological", "Fainting (Syncope)", "Single episode|Fainted once.", "Recurrent|Repeated episodes.", "On exertion|Occurs during physical activity."),
  S("Neurological", "Seizure", "Generalised|Whole-body convulsion with loss of consciousness.", "Focal|Involving one part of the body.", "First episode|First ever seizure.", "Recurrent|Known seizure disorder."),
  S("Neurological", "Confusion", ...ONSET, ...SEVERITY),
  S("Neurological", "Memory Loss", "Short-term|Recent events forgotten.", "Progressive|Worsening over months.", ...SEVERITY),
  S("Neurological", "Numbness", "Hands|Loss of sensation in the hands.", "Feet|Loss of sensation in the feet.", "One-sided|Numbness on one side of the body.", "Around the mouth|Perioral numbness."),
  S("Neurological", "Tingling (Pins and Needles)", "Hands|Tingling in the hands.", "Feet|Tingling in the feet.", ...COURSE),
  S("Neurological", "Tremor", "At rest|Shaking when the limb is still.", "On movement|Shaking during activity.", ...SEVERITY),
  S("Neurological", "Difficulty Walking", "Unsteady|Loss of balance while walking.", "Weakness|Legs give way.", ...SEVERITY),
  S("Neurological", "Slurred Speech", ...ONSET, ...SEVERITY),
  S("Neurological", "Insomnia", "Difficulty falling asleep|Takes long to fall asleep.", "Frequent waking|Wakes repeatedly at night.", "Early waking|Wakes very early and cannot sleep again."),
  S("Neurological", "Excessive Sleepiness", ...SEVERITY, "Daytime|Sleepy through the day."),

  /* ---------------- Eye ---------------- */
  S("Eye", "Blurred Vision", "Distance|Difficulty seeing far objects.", "Near|Difficulty seeing close objects.", "Both|Blurring at all distances.", "One eye|Affects a single eye.", ...ONSET),
  S("Eye", "Eye Pain", ...PAIN, "On movement|Pain when moving the eye.", ...SEVERITY),
  S("Eye", "Red Eye", "One eye|Redness in one eye.", "Both eyes|Redness in both eyes.", "With discharge|Redness with sticky discharge."),
  S("Eye", "Watering Eyes", ...COURSE, "With itching|Watering with itching, often allergic."),
  S("Eye", "Itching Eyes", ...SEVERITY, "Seasonal|Worse in particular seasons."),
  S("Eye", "Eye Discharge", "Watery|Clear watery discharge.", "Sticky/purulent|Thick yellow or green discharge.", "Crusting|Lids stuck together on waking."),
  S("Eye", "Double Vision", "One eye|Persists when the other eye is closed.", "Both eyes|Resolves when either eye is closed.", ...ONSET),
  S("Eye", "Light Sensitivity", ...SEVERITY),
  S("Eye", "Floaters and Flashes", "Floaters|Dark spots drifting across vision.", "Flashes|Brief flashes of light.", "Sudden increase|Sudden rise in number — needs urgent review."),
  S("Eye", "Night Blindness", ...SEVERITY, ...DURATION),
  S("Eye", "Foreign Body Sensation", "Gritty|Feels like sand in the eye.", "Constant|Present all the time."),
  S("Eye", "Loss of Vision", "Sudden|Abrupt loss — urgent.", "Gradual|Slow loss over time.", "Partial|Part of the visual field lost.", "Complete|Total loss of vision."),

  /* ---------------- ENT ---------------- */
  S("ENT", "Sore Throat", ...SEVERITY, "With difficulty swallowing|Painful or difficult swallowing.", "With fever|Accompanied by raised temperature."),
  S("ENT", "Ear Pain", ...PAIN, "One ear|Pain in a single ear.", "Both ears|Pain in both ears.", ...SEVERITY),
  S("ENT", "Ear Discharge", "Watery|Clear discharge.", "Purulent|Thick, pus-like discharge.", "Blood-stained|Discharge containing blood."),
  S("ENT", "Hearing Loss", "One ear|Reduced hearing in one ear.", "Both ears|Reduced hearing in both ears.", ...ONSET, ...SEVERITY),
  S("ENT", "Ringing in Ears (Tinnitus)", ...COURSE, ...SEVERITY),
  S("ENT", "Nasal Congestion", "One side|Blocked on one side.", "Both sides|Both nostrils blocked.", ...COURSE),
  S("ENT", "Runny Nose", "Clear|Watery discharge.", "Thick/coloured|Yellow or green discharge.", "With sneezing|Accompanied by repeated sneezing."),
  S("ENT", "Sneezing", ...COURSE, "Seasonal|Worse in particular seasons."),
  S("ENT", "Nosebleed", "One side|Bleeding from one nostril.", "Recurrent|Repeated episodes.", ...SEVERITY),
  S("ENT", "Loss of Smell", "Partial|Reduced sense of smell.", "Complete|No sense of smell.", ...ONSET),
  S("ENT", "Loss of Taste", "Partial|Reduced sense of taste.", "Complete|No sense of taste."),
  S("ENT", "Hoarseness of Voice", ...DURATION, ...SEVERITY),
  S("ENT", "Mouth Ulcers", "Single|One ulcer.", "Multiple|Several ulcers.", "Recurrent|Repeated episodes."),
  S("ENT", "Toothache", ...PAIN, ...SEVERITY, "With swelling|Associated facial or gum swelling."),
  S("ENT", "Bleeding Gums", "On brushing|Bleeds while brushing.", "Spontaneous|Bleeds without provocation."),

  /* ---------------- Respiratory ---------------- */
  S(
    "Respiratory",
    "Cough",
    "Dry|Dry cough without mucus.",
    "Productive (wet)|Cough with mucus or phlegm.",
    "Blood-stained|Cough containing blood — needs urgent review.",
    "Night-time|Worse at night.",
    "Whooping|Severe bouts followed by a whoop.",
    ...DURATION
  ),
  S("Respiratory", "Shortness of Breath", "On exertion|Breathless during activity.", "At rest|Breathless even when resting.", "On lying flat|Worse when lying down.", "Night-time|Wakes from sleep breathless.", ...SEVERITY),
  S("Respiratory", "Wheezing", ...COURSE, "With exertion|Triggered by activity.", ...SEVERITY),
  S("Respiratory", "Chest Tightness", ...SEVERITY, "With breathlessness|Accompanied by difficulty breathing."),
  S("Respiratory", "Sputum Production", "Clear/white|Clear or white phlegm.", "Yellow/green|Coloured phlegm suggesting infection.", "Blood-stained|Phlegm containing blood.", "Copious|Large amounts."),
  S("Respiratory", "Rapid Breathing", ...SEVERITY, "With distress|Visible effort of breathing."),

  /* ---------------- Cardiovascular ---------------- */
  S("Cardiovascular", "Chest Pain", ...PAIN, "On exertion|Brought on by activity.", "At rest|Occurs without activity.", "Radiating to arm/jaw|Spreads to arm, neck or jaw — urgent.", "With sweating|Accompanied by cold sweats — urgent."),
  S("Cardiovascular", "Palpitations", "Fast heartbeat|Racing heart.", "Irregular heartbeat|Skipped or irregular beats.", ...COURSE, "With dizziness|Accompanied by light-headedness."),
  S("Cardiovascular", "Swelling in Legs", "One leg|Swelling of a single leg.", "Both legs|Swelling of both legs.", "Worse in evening|Increases through the day.", "With pain|Painful swelling."),
  S("Cardiovascular", "Bluish Discolouration", "Lips|Blue tinge to the lips.", "Fingertips|Blue tinge to the fingers.", "Generalised|Widespread bluish colour — urgent."),

  /* ---------------- Gastrointestinal ---------------- */
  S("Gastrointestinal", "Abdominal Pain", ...PAIN, "Upper abdomen|Pain in the upper belly.", "Lower abdomen|Pain in the lower belly.", "Around navel|Central abdominal pain.", "Right side|Right-sided pain.", "Left side|Left-sided pain.", "After meals|Worse after eating."),
  S("Gastrointestinal", "Nausea", ...SEVERITY, ...COURSE, "After meals|Worse after eating."),
  S("Gastrointestinal", "Vomiting", "Occasional|A few episodes.", "Repeated|Frequent vomiting.", "Projectile|Forceful vomiting.", "Blood-stained|Vomit containing blood — urgent.", "Bilious|Green or yellow vomit."),
  S("Gastrointestinal", "Diarrhoea", "Watery|Loose watery stools.", "With mucus|Stools containing mucus.", "With blood|Stools containing blood — urgent.", "Frequent|More than four times a day.", ...DURATION),
  S("Gastrointestinal", "Constipation", ...DURATION, "With straining|Difficulty passing stool.", "With pain|Painful defecation."),
  S("Gastrointestinal", "Bloating", ...SEVERITY, "After meals|Worse after eating."),
  S("Gastrointestinal", "Heartburn / Acidity", ...SEVERITY, "After meals|Worse after eating.", "On lying down|Worse when lying flat."),
  S("Gastrointestinal", "Indigestion", ...SEVERITY, ...COURSE),
  S("Gastrointestinal", "Difficulty Swallowing", "Solids|Difficulty with solid food.", "Liquids|Difficulty with liquids.", "Both|Difficulty with both.", "Painful|Swallowing is painful."),
  S("Gastrointestinal", "Blood in Stool", "Fresh red|Bright red blood.", "Black tarry|Dark tarry stools — urgent.", "On wiping|Blood noticed only on tissue."),
  S("Gastrointestinal", "Jaundice", "Eyes|Yellowing of the whites of the eyes.", "Skin|Yellowing of the skin.", "With dark urine|Accompanied by dark-coloured urine.", "With itching|Accompanied by generalised itching."),
  S("Gastrointestinal", "Abdominal Distension", ...ONSET, ...SEVERITY),
  S("Gastrointestinal", "Hiccups", "Short-lived|Settles on its own.", "Persistent|Lasting more than 48 hours."),

  /* ---------------- Urinary ---------------- */
  S("Urinary", "Painful Urination", "Burning|Burning sensation while passing urine.", ...SEVERITY, "At end of stream|Pain at the end of urination."),
  S("Urinary", "Frequent Urination", "Daytime|Passing urine often during the day.", "Night-time|Waking at night to pass urine.", "With urgency|Sudden strong need to urinate."),
  S("Urinary", "Blood in Urine", "Visible|Red or cola-coloured urine.", "With pain|Accompanied by burning or pain.", "Painless|No associated pain."),
  S("Urinary", "Reduced Urine Output", ...SEVERITY, "With swelling|Accompanied by body swelling."),
  S("Urinary", "Urinary Incontinence", "On coughing/straining|Leaks with pressure.", "Urge|Leaks with a sudden urge.", "Continuous|Constant leakage."),
  S("Urinary", "Flank Pain", ...PAIN, "One side|Pain on one side.", "Radiating to groin|Spreads towards the groin."),
  S("Urinary", "Difficulty Passing Urine", "Poor stream|Weak flow.", "Straining|Needs effort to start.", "Incomplete emptying|Bladder does not feel empty."),

  /* ---------------- Musculoskeletal ---------------- */
  S("Musculoskeletal", "Joint Pain", "Single joint|One joint affected.", "Multiple joints|Several joints affected.", "Morning stiffness|Stiff on waking.", "With swelling|Joint is swollen.", ...SEVERITY),
  S("Musculoskeletal", "Back Pain", "Lower back|Pain in the lower back.", "Upper back|Pain in the upper back.", "Radiating to leg|Pain travelling down the leg.", "On movement|Worse with movement.", ...SEVERITY),
  S("Musculoskeletal", "Neck Pain", ...SEVERITY, "With stiffness|Restricted neck movement.", "Radiating to arm|Pain travelling down the arm."),
  S("Musculoskeletal", "Muscle Pain", "Generalised|Aching all over.", "Localised|Limited to one area.", ...SEVERITY),
  S("Musculoskeletal", "Muscle Cramps", "Night-time|Occurs at night.", "On exertion|Occurs during activity.", ...COURSE),
  S("Musculoskeletal", "Joint Swelling", "One joint|Single joint swollen.", "Multiple joints|Several joints swollen.", "With redness|Warm and red — possible infection."),
  S("Musculoskeletal", "Joint Stiffness", "Morning|Worse on waking.", "After rest|Worse after sitting still.", ...SEVERITY),
  S("Musculoskeletal", "Restricted Movement", ...SEVERITY, "With pain|Movement limited by pain."),

  /* ---------------- Skin ---------------- */
  S("Skin", "Rash", "Itchy|Rash with itching.", "Non-itchy|Rash without itching.", "Raised|Raised lesions.", "Blistering|Fluid-filled blisters.", "Spreading|Increasing in area."),
  S("Skin", "Itching", "Generalised|Whole-body itching.", "Localised|Limited to one area.", "Night-time|Worse at night.", ...SEVERITY),
  S("Skin", "Skin Lesion", "Single|One lesion.", "Multiple|Several lesions.", "Non-healing|Present for weeks without healing.", "Changing|Changing in size or colour."),
  S("Skin", "Boils / Abscess", "Single|One boil.", "Multiple|Several boils.", "With pus|Discharging pus.", "Recurrent|Repeated episodes."),
  S("Skin", "Hair Loss", "Patchy|Loss in defined patches.", "Diffuse|Thinning all over.", ...DURATION),
  S("Skin", "Easy Bruising", ...SEVERITY, "Without injury|Bruises appear without trauma."),
  S("Skin", "Pallor", ...SEVERITY, "With fatigue|Accompanied by tiredness."),
  S("Skin", "Dry Skin", ...SEVERITY, "With cracking|Skin cracking or fissuring."),
  S("Skin", "Wound", "Clean|Clean wound.", "Infected|Red, warm or discharging.", "Non-healing|Not healing as expected.", "Deep|Involving deeper tissue."),

  /* ---------------- Mental health ---------------- */
  S("Mental Health", "Anxiety", ...SEVERITY, "With palpitations|Accompanied by a racing heart.", "Situational|Triggered by specific situations."),
  S("Mental Health", "Low Mood", ...SEVERITY, ...DURATION, "With loss of interest|No longer enjoys usual activities."),
  S("Mental Health", "Irritability", ...SEVERITY, ...COURSE),
  S("Mental Health", "Sleep Disturbance", "Difficulty falling asleep|Takes long to fall asleep.", "Frequent waking|Wakes repeatedly.", "Unrefreshing sleep|Wakes tired despite sleeping."),
  S("Mental Health", "Loss of Concentration", ...SEVERITY, ...DURATION),

  /* ---------------- Obstetrics and gynaecology ---------------- */
  S("Obs & Gyn", "Menstrual Irregularity", "Delayed periods|Cycles longer than usual.", "Frequent periods|Cycles shorter than usual.", "Absent periods|No periods.", "Heavy bleeding|Unusually heavy flow.", "Painful periods|Significant cramping."),
  S("Obs & Gyn", "Vaginal Discharge", "White|Whitish discharge.", "Yellow/green|Coloured discharge.", "Foul smelling|Unpleasant odour.", "With itching|Accompanied by itching."),
  S("Obs & Gyn", "Pelvic Pain", ...PAIN, "With periods|Linked to the menstrual cycle.", ...SEVERITY),
  S("Obs & Gyn", "Breast Lump", "One breast|Lump in a single breast.", "Painful|Tender lump.", "Painless|No tenderness.", "With skin change|Overlying skin altered."),
  S("Obs & Gyn", "Breast Pain", "Cyclical|Linked to the menstrual cycle.", "Non-cyclical|Unrelated to periods.", ...SEVERITY),
  S("Obs & Gyn", "Bleeding in Pregnancy", "Spotting|Light spotting.", "Heavy|Heavy bleeding — urgent.", "With pain|Accompanied by abdominal pain — urgent."),
  S("Obs & Gyn", "Reduced Foetal Movement", "Reduced|Fewer movements than usual — urgent.", "Absent|No movements felt — urgent."),

  /* ---------------- Paediatric ---------------- */
  S("Paediatric", "Poor Feeding", ...SEVERITY, "Refusing feeds|Not taking feeds at all."),
  S("Paediatric", "Excessive Crying", ...COURSE, "Inconsolable|Cannot be settled."),
  S("Paediatric", "Delayed Milestones", "Motor|Delay in sitting, standing or walking.", "Speech|Delay in speech development.", "Global|Delay across all areas."),
  S("Paediatric", "Failure to Thrive", "Poor weight gain|Not gaining weight as expected.", "Weight loss|Losing weight."),
  S("Paediatric", "Napkin Rash", ...SEVERITY, "With broken skin|Skin is raw or broken."),

  /* ---------------- Injury and emergency ---------------- */
  S("Injury", "Injury / Trauma", "Fall|Injury from a fall.", "Road traffic accident|Injury from a vehicle accident.", "Assault|Injury from assault.", "Sports injury|Injury during sport.", "Workplace injury|Injury at work."),
  S("Injury", "Burn", "Superficial|Redness only.", "Partial thickness|Blistering.", "Full thickness|Deep burn — urgent.", "Chemical|Caused by a chemical.", "Electrical|Caused by electricity."),
  S("Injury", "Suspected Fracture", "Closed|Skin intact.", "Open|Bone exposed — urgent.", "With deformity|Visible deformity."),
  S("Injury", "Animal Bite", "Dog bite|Bite from a dog.", "Cat bite|Bite from a cat.", "Snake bite|Snake bite — urgent.", "Insect sting|Sting from an insect."),
  S("Injury", "Poisoning / Overdose", "Accidental|Taken by accident.", "Intentional|Deliberate — needs urgent assessment.", "Unknown substance|Substance not identified."),
  S("Injury", "Foreign Body", "Ear|Object in the ear.", "Nose|Object in the nose.", "Throat|Object in the throat — urgent.", "Eye|Object in the eye."),

  /* ---------------- Other ---------------- */
  S("Other", "Lump / Swelling", "Neck|Swelling in the neck.", "Armpit|Swelling in the armpit.", "Groin|Swelling in the groin.", "Painful|Tender to touch.", "Painless|No tenderness.", "Growing|Increasing in size."),
  S("Other", "Allergic Reaction", "Skin rash|Hives or rash.", "Facial swelling|Swelling of the lips or face — urgent.", "Breathing difficulty|Wheeze or breathlessness — urgent.", "Known trigger|Exposure to a known allergen."),
  S("Other", "Routine Check-up", "General health|Routine assessment.", "Follow-up|Review of an existing condition.", "Pre-operative|Assessment before surgery.", "Vaccination|Immunisation visit.", "Medical certificate|Fitness or medical certificate."),
];

export const symptomsData = CATALOG;

/** Flat, de-duplicated list of every symptom name. */
export const symptomNames = CATALOG.map((s) => s.symptom);

export default CATALOG;
