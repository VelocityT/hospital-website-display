import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";

const moduleContent = {
  pharmacy: {
    title: "Pharmacy Management",
    shortDescription:
      "A complete pharmacy workflow system ensuring accurate stock, billing, medicine dispensing, and real-time financial tracking.",

    points: [
      "Track medicine stock in real-time",
      "Expiry date monitoring & batch management",
      "Integrated billing for OPD/IPD patients",
      "Barcode-based medicine issue",
      "Supplier, batch, and purchase order management",
      "View paid and unpaid medicine orders",
      "Check doctor prescriptions by search",
      "Medicine-wise profit and sale quantity analytics",
    ],

    paragraphs: [
      "The Pharmacy module in our ERP is designed as a fully independent yet interconnected system that manages the complete lifecycle of medicines. From adding new medicines to tracking batches, expiry, and supplier details, the module ensures that every action is recorded with precision.",

      "The real-time stock dashboard gives pharmacists instant visibility into available quantities, upcoming expiries, and items that require urgent restocking. With automated low-stock alerts, the system ensures that no essential medicine runs out unexpectedly.",

      "A dedicated section for medicine orders allows staff to check the payment status of each transaction. You can instantly see which orders are paid, unpaid, or pending, helping maintain clear financial transparency.",

      "The module provides detailed sales analytics, showing how many units of each medicine have been sold and the exact profit earned. This helps hospitals understand fast-moving items, profit centers, and stock behavior.",

      "Doctors’ prescriptions can be quickly accessed by searching the patient’s name, phone number, or unique patient ID. This ensures accurate and fast medicine dispensing, reduces waiting time, and prevents human errors.",

      "Overall, the Pharmacy module integrates seamlessly with OPD, IPD, and billing workflows, making it a vital component of efficient hospital operations. It is designed for both small and large healthcare facilities to improve accuracy, reduce workload, and enhance patient experience.",
    ],
  },

  ipd: {
    title: "In-Patient Department (IPD)",
    shortDescription:
      "Manage admissions, treatment plans, ward transfers, patient monitoring, and billing with complete operational accuracy.",

    points: [
      "Digital patient admission process",
      "Bed, ward, and room allocation system",
      "Assign doctor, consultant, and nursing staff",
      "Nursing notes & vitals charting",
      "Switch OPD patient to IPD with one click",
      "Doctor-wise patient view & case history tracking",
      "Complete discharge summary generation",
    ],

    paragraphs: [
      "The IPD module provides a streamlined admission workflow where staff can quickly register new in-patients, assign beds, and allocate wards based on availability. Every admitted patient is linked with their designated doctor, consultant, and nursing team for complete operational clarity.",

      "One of the core strengths of the module is the ability to convert an OPD patient into an IPD admission with a single click. All previous details such as demographics, medical history, prescriptions, and reports are automatically carried over, eliminating repeated data entry.",

      "Doctors have a dedicated dashboard where they can view all their admitted patients along with complete IPD histories, vitals, medications, procedures, and progress notes. This provides a centralized medical record that improves clinical decision-making and reduces communication gaps.",

      "A detailed discharge workflow helps generate a complete discharge summary including diagnosis, treatment provided, procedure notes, medication charts, and follow-up instructions. The summary is generated digitally ensuring accuracy, readability, and easy printing.",
    ],
  },

  opd: {
    title: "Out-Patient Department (OPD)",
    shortDescription:
      "Fast, structured, and efficient OPD workflow including registration, consultations, prescriptions, and seamless departmental integration.",

    points: [
      "Quick patient registration with minimal fields",
      "Doctor-wise appointment scheduling",
      "Digital prescriptions with medicine, dosage & frequency",
      "Complete visit history & previous medical records",
      "Instant admission to IPD directly from OPD",
      "OPD to IPD transfer with one click",
      "Lab, pharmacy, and billing automation",
      "Consultation notes recording",
      "Follow-up tracking and revisit reminders",
    ],

    paragraphs: [
      "The OPD module is designed to manage high patient volume with a fast and structured workflow. Registration takes only a few seconds, allowing staff to quickly onboard new or returning patients. Every OPD visit is recorded with complete details including symptoms, vitals, diagnosis, and prescriptions.",

      "Doctors receive a dedicated dashboard that displays appointments, patient queue, and their full medical history. They can add notes, prescribe medicines, recommend lab tests, and review past consultations—all from one screen for efficient clinical decision-making.",

      "A major advantage of the system is the seamless transition from OPD to IPD. With a single click, any OPD patient can be admitted into IPD while automatically transferring all medical details, prescriptions, and diagnostic records to the IPD workflow. This reduces duplication and ensures smooth continuity of care.",

      "The module maintains a detailed and chronological history of every patient, including past visits, prescriptions, lab results, imaging reports, and doctor feedback. This ensures enhanced clinical insight and improved patient outcomes.",

      "OPD is fully integrated with pharmacy, pathology, and billing. Doctors’ prescriptions automatically reflect in the pharmacy, while ordered lab tests sync directly with the pathology department. This interconnected approach ensures quick service delivery and reduces waiting time for patients.",
    ],
  },

  pathology: {
    title: "Pathology & Lab Management",
    shortDescription:
      "A fully automated laboratory system handling test bookings, sample processing, report generation, and departmental billing with high accuracy.",

    points: [
      "Separate billing system for pathology tests",
      "Hospital-controlled test catalog (Admin-managed)",
      "Patient & doctor test booking",
      "Sample collection & barcode tracking",
      "Create, edit, and finalize digital test reports",
      "Normal range validation for each parameter",
      "Direct printing of test reports",
      "List view of all generated reports",
      "Revenue & sales tracking by test type",
      "Doctor & patient downloadable reports",
    ],

    paragraphs: [
      "The Pathology module automates the complete lab lifecycle—from test booking to report delivery. Admins can define the test catalog exclusively for the hospital, ensuring accurate pricing, categories, and parameter ranges. Only these approved tests appear for lab staff, maintaining consistency and preventing manual errors.",

      "When a test is booked, the system generates a dedicated pathology bill separate from OPD/IPD billing. This simplifies accounts and ensures proper revenue tracking for the laboratory department. Each test entry includes patient details, referring doctor, payment status, and sample information.",

      "Reports are created digitally through an intuitive interface. Each parameter is validated against configured normal ranges to eliminate manual mistakes. Technicians can save, edit values, and finalize reports with a single click. Once approved, reports can be directly printed or shared electronically.",

      "The system keeps a complete list of all generated reports, allowing staff to search by patient patient ID, Ipd ID, Opd ID or date. This centralized overview makes it easy for labs to reprint or resend reports at any time.",

      "The module includes detailed reporting for lab revenue and sales. Administrators can analyze how many tests were performed, which categories generated the most income, and how revenue trends differ across time periods. This helps optimize lab management and resource planning.",

      "doctors can instantly download reports from their respective portals, eliminating delays and reducing paperwork. This modern, connected approach significantly improves lab efficiency and service quality.",
    ],
  },
  billing: {
    title: "Billing & Accounts",
    shortDescription:
      "A centralized hospital billing system handling OPD, IPD, pharmacy, and pathology with automated calculations, part-payment support, and complete financial records.",

    points: [
      "Separate billing for OPD, IPD, Pharmacy, and Pathology",
      "Daily auto-calculation of IPD charges (bed, doctor, nursing, services)",
      "IPD part-payment and due-amount tracking",
      "Print-ready bills and receipts",
      "Complete payment history for every patient",
      "Doctor commission management",
      "Staff salary management",
      "Day-wise and department-wise collection reports",
    ],

    paragraphs: [
      "The Billing module provides a unified financial hub for the entire hospital. Each department—including OPD, IPD, pharmacy, and pathology—generates its own dedicated bill, ensuring clarity and departmental accountability. This structure allows administrators to track income sources accurately and maintain transparent financial operations.",

      "IPD billing includes a fully automated calculation engine. The system calculates bed charges, doctor visits, nursing fees, and service charges on a day-wise basis. As long as the patient remains admitted, charges keep updating automatically without manual intervention. This prevents human error and ensures accurate revenue capture.",

      "The module supports part-payments for IPD. An admitted patient may pay in multiple installments, and each payment is recorded with its timestamp. The outstanding due amount is always visible, helping both staff and management maintain proper financial control.",

      "All bills—OPD, IPD, pharmacy, and pathology—can be printed directly with automatically formatted receipts. Each bill includes patient details, breakdown of charges, applied taxes, discounts, and payment status, providing complete clarity to both staff and patients.",

      "The billing system also incorporates staff payment management. Administrators can manage salary configurations for nurses, receptionists, lab staff, and other employees. Salary reports help streamline payout cycles and reduce manual paperwork.",

      "Doctor payout management is integrated with commission rules. Each doctor may earn a percentage or fixed commission based on consultation, procedures, or test referrals. The system automatically tracks these earnings, enabling seamless monthly and on-demand calculations.",

      "Finally, department-wise and day-wise collection reports give administrators precise visibility over hospital revenue. Whether analyzing OPD income or pharmacy sales, accurate and real-time data helps improve decision-making and operational efficiency.",
    ],
  },
  inventory: {
    title: "Inventory & Resource Management",
    shortDescription:
      "Centralized control over hospital beds, wards, medicines, and lab test items with real-time tracking and automated stock flow.",

    points: [
      "Ward and bed allocation management",
      "Real-time bed availability status (Available / Occupied / Maintenance)",
      "Medicine stock, expiry, and batch tracking",
      "Pathology test master management",
      "Supplier, batch, and invoice tracking",
      "Daily and monthly stock analytics",
    ],

    paragraphs: [
      "The Inventory module acts as the operational backbone for managing all physical and consumable resources in the hospital. It connects beds, medicines, and pathology tests into a unified tracking system that ensures accuracy, availability, and transparency across departments.",

      "Ward and bed management is fully digitized. Hospital staff can create wards by floor, type, and category, then assign beds with details including bed type, status, and assigned patient. Every bed reflects its live availability—whether it is occupied, free, or under maintenance—allowing the admission team to allocate beds efficiently.",

      "Medicine inventory is managed with complete batch details, expiry tracking, manufacturer information, supplier entries, and pricing parameters. Stock is automatically updated when medicines are sold in the pharmacy or used during IPD treatment. The system prevents stock mismatch and offers accurate profit/loss reporting at the medicine level.",

      "Pathology test management allows administrators to add customized tests with units, ranges, categories, and sample types. Only hospital-added tests appear in pathology operations, ensuring consistent and controlled test lists across departments. Charges are predefined to maintain billing accuracy.",

      "With built-in expiry alerts, vendor tracking, and invoice management, the module minimizes wastage and ensures uninterrupted availability of essential resources. This improves operational efficiency and reduces financial leakage.",

      "Overall, this module ensures that every physical resource—beds, medicines, test kits, or consumables—is always monitored, organized, and audit-ready. It plays a crucial role in maintaining operational stability throughout the hospital environment.",
    ],
  },
};

const Modules = () => {
  const { moduleName } = useParams();
  const data = moduleContent[moduleName];

  const images = [
    {
      light: `/ss/${moduleName}-1.png`,
      dark: `/ss/${moduleName}-1-dark.png`,
    },
    {
      light: `/ss/${moduleName}-2.png`,
      dark: `/ss/${moduleName}-2-dark.png`,
    },
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [moduleName]);

  if (!data)
    return (
      <div className="p-16 text-center text-xl font-semibold">
        Module not found
      </div>
    );

  return (
    <div className="w-full min-h-screen pt-40 pb-20 px-6 lg:px-24">
      <motion.h1
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-4xl lg:text-5xl font-bold mb-6 text-blue-600 dark:text-blue-400"
      >
        {data.title}
      </motion.h1>

      <motion.p
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mb-12"
      >
        {data.shortDescription}
      </motion.p>

      <div className="grid md:grid-cols-2 gap-12 mb-20 items-start">
        <div>
          <motion.ul
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: false }}
            className="space-y-4 text-lg mb-8"
          >
            {data.points.map((point, idx) => (
              <motion.li
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: false }}
                className="flex items-start gap-3"
              >
                <span className="mt-2 h-3 w-3 bg-blue-500 dark:bg-blue-300 rounded-full flex-shrink-0"></span>
                <span className="text-gray-800 dark:text-gray-200">
                  {point}
                </span>
              </motion.li>
            ))}
          </motion.ul>
          <div className="space-y-6">
            {data.paragraphs.map((para, idx) => (
              <motion.p
                key={idx}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                viewport={{ once: false }}
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-rows-2 gap-12">
            {images.slice(0, 2).map((img, idx) => (
              <GlossyImageCard key={idx} img={img} index={idx} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {images.slice(2, 4).map((img, idx) => (
              <GlossyImageCard key={idx} img={img} index={idx + 2} small />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GlossyImageCard = ({ img, index, small = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: false }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        whileInView={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        viewport={{ once: false }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={`relative group rounded-xl overflow-hidden shadow-lg bg-gray-200 dark:bg-gray-800 ${
          small ? "h-48" : "h-64 md:h-80"
        } cursor-pointer transition-all duration-300`}
      >
        <img
          src={img.light}
          alt={`Screenshot ${index + 1}`}
          className="w-full h-full object-cover dark:hidden transition-opacity duration-300"
        />
        <img
          src={img.dark}
          alt={`Screenshot ${index + 1} dark`}
          className="w-full h-full object-cover hidden dark:block transition-opacity duration-300"
        />

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white dark:via-blue-900/40 to-transparent opacity-30 translate-x-[-100%] translate-y-[-100%] group-hover:translate-x-[100%] group-hover:translate-y-[100%] transition-transform duration-700 skew-x-12"></div>
        </div>

        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 group-hover:ring-blue-500/50 transition-all duration-300"></div>
      </motion.div>
    </motion.div>
  );
};

export default Modules;
