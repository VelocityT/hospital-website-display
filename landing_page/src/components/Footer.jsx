import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isMobile } from "../utility/helper";

const Footer = () => {
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", id: "home" },
    { name: "About", id: "about" },
    { name: "Modules", id: "modules" },
    { name: "Contact", id: "contact" },
  ];

  const handleNavClick = (id) => {
    if (window.location.pathname !== "/") {
      navigate("/", { replace: false });
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const socialLinks = [
    { icon: <Twitter size={18} />, href: "https://twitter.com/velocitytech" },
    {
      icon: <Linkedin size={18} />,
      href: "https://in.linkedin.com/company/velocitytechinfo",
    },
    {
      icon: <Facebook size={18} />,
      href: "https://www.facebook.com/people/Velocity-Tech/61569323847935",
    },
    {
      icon: <Instagram size={18} />,
      href: "https://www.instagram.com/velocitytech.in",
    },
    {
      icon: <Youtube size={18} />,
      href: "https://www.youtube.com/@VelocityTechYT",
    },
  ];

  return (
    <footer className="relative  bg-linear-to-br from-blue-50 to-cyan-100 dark:bg-linear-to-br dark:from-gray-900 dark:to-gray-950 pt-20 pb-10 overflow-hidden rounded-t-4xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 dark:bg-cyan-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-300 dark:bg-teal-800 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>
      <div className="absolute -top-10 left-0 w-full h-10  rounded-t-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: false, amount: 0.05 }}
        className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12"
      >
        <div>
          <h3 className="text-2xl font-semibold text-blue-500 mb-3">
            Velocare
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Next-generation Hospital ERP simplifying your daily operations with
            AI-driven automation.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Quick Links
          </h4>
          <ul className="space-y-2">
            {navItems.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: false }}
              >
                <button
                  onClick={() => handleNavClick(item.id)}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                >
                  {item.name}
                </button>
              </motion.li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Contact Us
          </h4>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: false }}
              className="flex items-center gap-3"
            >
              <Mail className="text-blue-500" size={18} />{" "}
              contact@velocitytech.in
            </motion.li>
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: false }}
              className="flex items-center gap-3"
            >
              <Mail className="text-blue-500" size={18} /> info@velocitytech.in
            </motion.li>
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: false }}
              className="flex items-center gap-3"
            >
              <Phone className="text-blue-500" size={18} /> +91 00000 00000
            </motion.li>
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: false }}
              className="flex items-center gap-3"
            >
              <MapPin className="text-blue-500" size={18} /> Lacknow, Uttar
              Pradesh
            </motion.li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Follow Us
          </h4>
          <div className="flex gap-3">
            {socialLinks.map((s, i) => (
              <motion.a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={!isMobile ? { scale: 1.2 } : {}}
                whileTap={isMobile ? { scale: 1.2 } : {}}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                className="p-2 rounded-full bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400  transition ring-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.55)] border-blue-500"
              >
                {s.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        viewport={{ once: false }}
        className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-6 text-center"
      >
        <p className="text-sm text-gray-600 dark:text-gray-500">
          © {new Date().getFullYear()} Velocare — All rights reserved.
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;
