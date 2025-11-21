import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { isMobile } from "../utility/helper";
import {
  FileUser,
  Pill,
  Beaker,
  Users,
  MoreHorizontal,
  IndianRupee,
  Wallet,
  BarChart3,
  Wrench,
  Globe,
  Bed,
  FlaskConical,
  FileText,
  Boxes,
  Stethoscope,
  Mail,
  ArrowUpRight,
  MapPin,
  Phone,
  Check,
} from "lucide-react";
import { useCallback, useEffectEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeaturesSection from "./Orbit";

const Home = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const width = useTransform(scrollYProgress, [0, 0.6], ["100%", "90%"]);
  const y = useTransform(scrollYProgress, [0, 0.6], [0, -80]);
  const borderRadius = useTransform(
    scrollYProgress,
    [0, 0.6],
    ["0rem", "2rem"]
  );

  useEffectEvent(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.section
        id="home"
        ref={heroRef}
        style={{ width, y, borderRadius }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-[120px]
               bg-linear-to-br from-blue-50 to-cyan-100
               dark:bg-linear-to-br dark:from-gray-900 dark:to-gray-950
               overflow-hidden mx-auto shadow-2xl pb-12 sm:pb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 dark:bg-cyan-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute top-32 left-32 w-80 h-80 bg-teal-300 dark:bg-teal-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <motion.h1
            initial={{ opacity: 0, scale: 2.5, y: -120 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-3xl sm:text-5xl md:text-7xl font-bold text-gray-900 dark:text-white leading-tight"
          >
            Empowering Smarter Hospital Management
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: isMobile ? 0.2 : 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            A complete ERP platform for hospitals — streamline patient care,
            billing, and staff coordination with automation and real-time
            insights.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: isMobile ? 0.2 : 0.3 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="pt-6 flex flex-wrap gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#1677FF] dark:bg-blue-600
                     text-white font-semibold text-lg rounded-xl shadow-lg
                     hover:bg-[#1e7ed6] dark:hover:bg-blue-500
                     transition-all duration-300 cursor-pointer"
              onClick={() => navigate("/demo")}
            >
              Request Demo
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-[#1677FF] dark:border-blue-400
                     text-[#1677FF] dark:text-blue-300 font-semibold text-lg rounded-xl
                     hover:bg-[#1677FF]/10 dark:hover:bg-blue-500/10
                     transition-all duration-300"
              onClick={() => {
                const el = document.getElementById("about");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      <FeaturesSection />
      <Improve />
      <ChooseWhichYouWant />
      <ContactSection />
    </div>
  );
};

export default Home;

// // =================SCREEN ONE==============
// const FeaturesSection = () => {
//   const sectionRef = useRef(null);
//   const isInView = useInView(sectionRef, {
//     amount: isMobile ? 0.2 : 0.4,
//     once: false,
//   });
//   return (
//     <section
//       id="about"
//       ref={sectionRef}
//       className="py-20 px-6 overflow-hidden w-screen flex items-center flex-col justify-center transition-colors duration-300"
//     >
//       <motion.div
//         className="flex items-center justify-center flex-col"
//         initial={{ y: 60, opacity: 0 }}
//         animate={isInView ? { y: 0, opacity: 1 } : { y: 60, opacity: 0 }}
//         transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
//       >
//         <motion.h1
//           // initial={{ y: 60, opacity: 0 }}
//           // whileInView={{ y: 0, opacity: 1 }}
//           // viewport={{ amount: isMobile ? 0.2 : 0.4, once: false }}
//           // transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
//           className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight w-full text-center"
//         >
//           Velocare is the complete hospital ERP
//         </motion.h1>

//         <motion.p
//           // initial={{ y: 60, opacity: 0 }}
//           // whileInView={{ y: 0, opacity: 1 }}
//           // viewport={{ amount: isMobile ? 0.2 : 0.4, once: false }}
//           // transition={{ delay: 0.3, duration: 0.8 }}
//           className="mt-4 text-xl md:text-2xl text-gray-700 dark:text-gray-300 text-center"
//         >
//           connecting Hospitals, Doctors, and Patients anywhere.
//         </motion.p>
//       </motion.div>

//       <div className="flex items-center justify-center my-8">
//         <div className="container  flex items-center justify-center">
//           <div class="absolute w-[700px] h-[700px] bg-blue-500 rounded-full shadow-xl"></div>
//           <div class="absolute  w-[500px] h-[500px] bg-black rounded-full shadow-xl"></div>
//           <div class="absolute w-[300px] h-[300px] bg-blue-300 rounded-full shadow-xl"></div>

//           <div className="orbit-wrapper">
//             <Hex
//               isInView={isInView}
//               className="pos0 before:bg-red-600 dark:before:bg-red-700"
//               color="#e11d48"
//             >
//               <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
//               <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center ">
//                 Billing
//               </h6>
//             </Hex>

//             <Hex
//               isInView={isInView}
//               className="pos1 before:bg-blue-600 dark:before:bg-blue-700"
//               color="#7c3aed"
//             >
//               <FileUser className="w-5 h-5 sm:w-6 sm:h-6" />
//               <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
//                 Patient Records
//               </h6>
//             </Hex>

//             <Hex
//               isInView={isInView}
//               className="pos2 before:bg-green-600 dark:before:bg-green-700"
//               color="#7c3aed"
//             >
//               <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
//               <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center ">
//                 Medicines
//               </h6>
//             </Hex>

//             <Hex
//               isInView={isInView}
//               className="pos3 before:bg-gray-200 dark:before:bg-gray-800"
//               color="#7c3aed"
//             >
//               <img src="/icon.png" className="p-7" />
//             </Hex>

//             <Hex
//               isInView={isInView}
//               className="pos4 before:bg-pink-600 dark:before:bg-pink-700"
//               color="#7c3aed"
//             >
//               <Beaker className="w-5 h-5 sm:w-6 sm:h-6" />
//               <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
//                 Lab Test
//               </h6>
//             </Hex>

//             <Hex
//               isInView={isInView}
//               className="pos5 before:bg-yellow-600 dark:before:bg-yellow-700"
//               color="#7c3aed"
//             >
//               <Users className="w-5 h-5 sm:w-6 sm:h-6" />
//               <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
//                 Staff Records
//               </h6>
//             </Hex>

//             <Hex
//               isInView={isInView}
//               className="pos6 before:bg-orange-600 dark:before:bg-orange-700"
//               color="#7c3aed"
//             >
//               <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
//               <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
//                 Salary
//               </h6>
//             </Hex>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

function Hex({ className = "", children, isInView }) {
  return (
    <motion.div
      {...(isMobile
        ? { whileTap: { scale: 1.1, transition: { duration: 0.2 } } }
        : { whileHover: { scale: 1.1, transition: { duration: 0.2 } } })}
      initial={{ y: 40, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`hex ${className}`}
    >
      <div className="hex-inner">{children}</div>
    </motion.div>
  );
}

function Improve() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const yText = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const opacityText = useTransform(
    scrollYProgress,
    [0, 0.2, 0.7, 1],
    [0, 1, 1, 0]
  );

  const features = [
    {
      icon: Globe,
      title: "Access Anywhere with Any Device",
      desc: "Your hospital operations are no longer tied to a single system. With secure cloud access, administrators, doctors, and staff can manage data from desktops, tablets, or smartphones in real time.",
    },
    {
      icon: Wrench,
      title: "Effortless Maintenance",
      desc: "Updates, backups, and configurations happen seamlessly in the background. You focus on patients and management while the system keeps itself optimized.",
    },
    {
      icon: BarChart3,
      title: "Streamlined Management",
      desc: "Centralize billing, records, and scheduling into one dashboard. Gain instant insights into hospital performance with clean, visual analytics and reduce manual workload.",
    },
    {
      icon: Users,
      title: "Enhanced Collaboration",
      desc: "Bridge communication gaps between departments, doctors, and patients. Share updates instantly and keep every team aligned for faster, smarter decisions.",
    },
  ];

  return (
    <section
      ref={ref}
      className="relative flex flex-col md:flex-row w-full min-h-screen "
    >
      <div className="md:w-1/2 p-10">
        <div className="md:sticky md:top-24">
          <motion.h2
            style={{ y: yText, opacity: opacityText }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
          >
            How{" "}
            <span className="text-blue-600 dark:text-blue-400">Velocare</span>{" "}
            Improves Your Hospital
          </motion.h2>
          <motion.p
            style={{ y: yText, opacity: opacityText }}
            className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-md"
          >
            Experience a next-generation ERP designed to reduce admin workload,
            connect departments, and enable real-time decision making — all in
            one platform.
          </motion.p>
        </div>
      </div>

      <div className="md:w-1/2 flex flex-col space-y-20 p-4 md:p-6 lg:p-20">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: isMobile ? 0.3 : 0.8 }}
              className="flex items-start gap-5 p-6 rounded-2xl bg-white/60 dark:bg-black flex-col hover:scale-105 active:scale-105 transition-transform duration-300 ring-2 ring-blue-500 shadow-[0_0_22px_rgba(59,130,246,0.55)] border-blue-500"
            >
              <div className="flex items-center justify-start gap-4 ">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ChooseWhichYouWant() {
  const ref = useRef(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  const modules = [
    { key: "pharmacy", label: "Pharmacy", icon: Pill },
    { key: "ipd", label: "IPD", icon: Bed },
    { key: "opd", label: "OPD", icon: Stethoscope },
    { key: "pathology", label: "Pathology", icon: FlaskConical },
    { key: "billing", label: "Billing", icon: FileText },
    { key: "inventory", label: "Inventory", icon: Boxes },
  ];

  return (
    <section
      id="modules"
      ref={ref}
      className="relative flex flex-col items-center justify-center min-h-screen text-gray-900 dark:text-white overflow-hidden py-20"
    >
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="text-center mb-10"
      >
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Choose Modules You Want
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          Select the modules your hospital needs. Velocare is modular — you only
          pay for what you use.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center justify-center max-w-lg md:max-w-xl lg:max-w-3xl">
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.7 }}
              transition={{ duration: 0.3 }}
              key={i}
            >
              <motion.div
                initial={{ x: 100 }}
                whileInView={{ x: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.3 }}
                className="h-40 w-40 md:h-40 md:w-40 lg:h-50 lg:w-50
               active:bg-white  hover:bg-white
               dark:active:bg-black
               dark:hover:bg-black transition-all duration-400 flex items-center justify-center flex-col cursor-pointer group relative overflow-hidden"
                onClick={() => navigate(`/modules/${m.key}`)}
              >
                <span className="span1"></span>
                <span className="span2"></span>
                <span className="span3"></span>
                <span className="span4"></span>
                <Icon size={40} className="text-blue-500" />
                <h1 className="text-xl my-4 group-hover:text-blue-500">
                  {m.label}
                </h1>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ContactSection() {
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const glow =
    "ring-2 ring-blue-500 shadow-[0_0_22px_rgba(59,130,246,0.55)] border-blue-500";

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "Invalid email format";
    if (!form.message.trim()) newErrors.message = "Message is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\d+$/.test(form.phone))
      newErrors.phone = "Phone must be 10 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleClick = useCallback((type) => {
    setActive(type);

    if (type === "email") {
      window.location.href = "mailto:contact@velocitytech.in";
    } else if (type === "map") {
      window.open(
        "https://www.google.com/maps/place/Lucknow,+Uttar+Pradesh",
        "_blank"
      );
    }

    setTimeout(() => setActive(null), 600);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitted(true);
    setErrors({});

    try {
      const query = new URLSearchParams({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      }).toString();

      const APP_SCRIPT_URL =
        "https://script.google.com/macros/s/AKfycbzArw87chPQJwrJYfeZUP49rUs_7kWHstytGuCcaVYCGWT5YEe3w4U5Ze9R1I-XUbmQ/exec";

      const params = new URLSearchParams(form).toString();
      const response = await fetch(`${APP_SCRIPT_URL}?${params}`);
      const result = await response.json();

      if (result.status === "success") {
        setSuccess(true);

        setTimeout(() => {
          setForm({ name: "", email: "", phone: "", message: "" });
          setSuccess(false);
          setSubmitted(false);
        }, 1500);
      } else {
        alert("Failed to send message.");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.log(err);

      setTimeout(() => {
        setForm({ name: "", email: "", phone: "", message: "" });
        setSuccess(false);
        setSubmitted(false);
      }, 1500);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { x: -30, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const formItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
  };

  return (
    <section
      id="contact"
      className="w-full min-h-screen flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden"
    >
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-14">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5 }}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-900/70 text-xs sm:text-sm mb-4 inline-block"
          >
            Contact
          </motion.div>

          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold mb-3"
          >
            Get in touch
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.4 }}
            className="space-y-4 mt-8"
          >
            {[
              {
                id: "email",
                icon: (
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                ),
                label: "Email us",
                value: "contact@velocitytech.in",
              },
              {
                id: "map",
                icon: (
                  <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                ),
                label: "Our location",
                value: "Lucknow, Uttar Pradesh",
              },
            ].map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                onClick={() => handleClick(item.id)}
                className={`flex items-center justify-between p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-300
                  bg-blue-100 dark:bg-blue-900/20
                  hover:ring-2 hover:ring-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]
                  ${
                    active === item.id
                      ? glow
                      : "border-blue-300 dark:border-blue-900/70"
                  }
                `}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {item.icon}
                  <div className="min-w-0">
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                      {item.label}
                    </p>
                    <p className="font-medium text-sm sm:text-base break-words">
                      {item.value}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 opacity-60 flex-shrink-0" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ x: 50, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="border border-blue-300 dark:border-blue-900/70 p-6 sm:p-8 rounded-2xl bg-blue-100 dark:bg-blue-900/20 w-full"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center justify-center h-full py-10"
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-green-600 dark:text-green-400">
                  Message sent successfully!
                </p>
              </motion.div>
            ) : (
              <>
                <motion.input
                  variants={formItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Name"
                  className={`w-full p-3 sm:p-4 bg-white dark:bg-gray-900 border rounded-xl outline-none transition text-sm sm:text-base
                    ${
                      errors.name
                        ? "border-red-500 mb-1"
                        : "border-blue-300 dark:border-blue-900/70 focus:border-blue-500"
                    }
                  `}
                />
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm pb-3"
                  >
                    {errors.name}
                  </motion.p>
                )}

                <motion.input
                  variants={formItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone"
                  className={`w-full p-3 sm:p-4 bg-white dark:bg-gray-900 border rounded-xl outline-none transition text-sm sm:text-base mt-3  ${
                    errors.phone
                      ? "border-red-500 mb-1"
                      : "border-blue-300 dark:border-blue-900/70 focus:border-blue-500"
                  } `}
                />

                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm pb-3"
                  >
                    {errors.phone}
                  </motion.p>
                )}

                <motion.input
                  variants={formItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email"
                  className={`w-full p-3 sm:p-4 bg-white dark:bg-gray-900 border rounded-xl outline-none transition text-sm sm:text-base mt-3
                    ${
                      errors.email
                        ? "border-red-500 mb-1"
                        : "border-blue-300 dark:border-blue-900/70 focus:border-blue-500"
                    }
                  `}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm pb-3"
                  >
                    {errors.email}
                  </motion.p>
                )}

                <motion.textarea
                  variants={formItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Message"
                  className={`w-full p-3 sm:p-4 bg-white dark:bg-gray-900 border rounded-xl outline-none transition resize-none text-sm sm:text-base mt-3
                    ${
                      errors.message
                        ? "border-red-500"
                        : "border-blue-300 dark:border-blue-900/70 focus:border-blue-500"
                    }
                  `}
                />
                {errors.message && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm pb-4"
                  >
                    {errors.message}
                  </motion.p>
                )}

                <motion.button
                  variants={formItemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  type="submit"
                  disabled={submitted}
                  className={`w-full py-3 sm:py-4 font-medium rounded-xl transition text-sm sm:text-base text-white dark:text-black mt-4 flex items-center justify-center gap-2
                    ${
                      submitted
                        ? "bg-green-600 dark:bg-green-400 cursor-not-allowed"
                        : "bg-black dark:bg-white hover:opacity-80"
                    }`}
                >
                  {submitted ? (
                    <>
                      <Check className="w-5 h-5" />
                      Sent
                    </>
                  ) : (
                    "Submit"
                  )}
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </motion.form>
      </div>
    </section>
  );
}
