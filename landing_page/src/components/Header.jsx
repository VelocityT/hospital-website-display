import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Home", id: "home" },
  { label: "About", id: "about" },
  { label: "Modules", id: "modules" },
  { label: "Contact", id: "contact" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState("Home");
  const [hovered, setHovered] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("velocare-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = saved === "dark" || (!saved && prefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newDark = !prev;
      if (newDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("velocare-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("velocare-theme", "light");
      }
      return newDark;
    });
  };

  const handleNavClick = (id) => {
    console.log(id);
    if (window.location.pathname !== "/") {
      navigate("/", { replace: false });
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView();
      }, 50);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView();
    }
  };

  return (
    <motion.header className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl backdrop-blur-lg shadow-lg z-50 overflow-hidden bg-white/70 dark:bg-gray-900/70 border border-white/30 dark:border-gray-800/40 rounded-4xl">
      <div className="px-6 py-2 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="/icon.png"
            alt="Velocare Logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <h1 className="text-xl font-semibold text-blue-500 tracking-wide">
            Velocare
          </h1>
        </div>

        <nav className="hidden md:flex items-center relative">
          {navItems.map((item) => {
            const isActive = active === item.label;
            const isHovered = hovered === item.label;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActive(item.label);
                  handleNavClick(item.id);
                }}
                onMouseEnter={() => setHovered(item.label)}
                onMouseLeave={() => setHovered(null)}
                className="relative px-4 py-2 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
              >
                {(isHovered || isActive) && (
                  <motion.span
                    layoutId="desktopPill"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800"
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}
                <span
                  className={`relative z-10 transition-colors duration-200 ${
                    isHovered || isActive
                      ? "text-blue-500"
                      : "text-black/80 dark:text-white/80"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-700
                       transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="px-5 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium cursor-pointer"
            onClick={() => navigate("/demo")}
          >
            Demo
          </button>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-700
                       transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-black dark:text-white cursor-pointer"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobileMenu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden rounded-b-2xl overflow-hidden"
          >
            <nav className="flex flex-col items-center py-4">
              {navItems.map((item) => {
                const isActive = active === item.label;
                const isHovered = hovered === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActive(item.label);
                      handleNavClick(item.id);

                      setTimeout(() => {
                        setIsOpen(false);
                      }, 200);
                    }}
                    onMouseEnter={() => setHovered(item.label)}
                    onMouseLeave={() => setHovered(null)}
                    className="relative w-3/4 px-4 py-2 rounded-lg font-medium transition-colors duration-200 overflow-hidden cursor-pointer"
                  >
                    {(isHovered || isActive) && (
                      <motion.span
                        layoutId="mobilePill"
                        className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800"
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    )}
                    <span
                      className={`relative z-10 transition-colors duration-200 ${
                        isHovered || isActive
                          ? "text-blue-500"
                          : "text-black/80 dark:text-white/80"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
              <button
                className="mt-4 px-4 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 dark:hover:bg-blue-400 transition-all cursor-pointer"
                onClick={() =>
                  window.open("https://wa.me/+910000000000", "_blank")
                }
              >
                Demo
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
