import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Demo = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    hospitalName: "",
    location: "",
    demoDate: "",
    demoTime: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: "Contact", icon: "Person" },
    { title: "Hospital", icon: "Hospital" },
    { title: "Schedule", icon: "Calendar" },
  ];

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzjmgiTPj5d7X0tiAHWAqGehSyS_lVtGD1CKhSNs1xtqYYpu047MGi9kPmTGVZ6IoTpzQ/exec";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = () => {
    const stepFields =
      steps[currentStep - 1].title === "Contact"
        ? ["name", "email", "phone"]
        : steps[currentStep - 1].title === "Hospital"
        ? ["hospitalName", "location"]
        : ["demoDate", "demoTime", "message"];

    const newErrors = {};
    stepFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = "Required";
      }
    });

    if (currentStep === 1) {
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Invalid email";
      if (formData.phone && !/^\d{8,15}$/.test(formData.phone))
        newErrors.phone = "Enter a valid phone number (8–15 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () =>
    validateStep() && setCurrentStep((p) => Math.min(p + 1, 3));
  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);

    try {
      const query = new URLSearchParams(formData).toString();
      const res = await fetch(`${SCRIPT_URL}?${query}`);
      const data = await res.json();

      if (data.status === "success") {
        alert("Demo Scheduled Successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          hospitalName: "",
          location: "",
          demoDate: "",
          demoTime: "",
          message: "",
        });
        setCurrentStep(1);
        navigate("/");
      } else alert("Submission failed.");
    } catch (err) {
      alert("Network error. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-4 overflow-hidden transition-colors pt-20">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-blue-500 dark:bg-blue-600 rounded-full blur-3xl opacity-10"
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ top: "10%", left: "10%" }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-blue-500 dark:bg-blue-600 rounded-full blur-3xl opacity-10"
          animate={{ x: [0, -80, 0], y: [0, 80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ bottom: "15%", right: "15%" }}
        />
      </div>

      <motion.div
        className="relative w-full max-w-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-blue-500 dark:border-blue-500/50 overflow-hidden">
          <div className="mb-10 relative h-16 flex items-center justify-center">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 60"
              preserveAspectRatio="xMidYMid meet"
            >
              <motion.path
                d="M0,30 Q50,10 100,30 T200,30 T300,30 T400,30 T500,30 T600,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-blue-300 dark:text-blue-700"
              />
              <motion.path
                d="M0,30 Q50,10 100,30 T200,30 T300,30 T400,30 T500,30 T600,30"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-blue-500 dark:text-blue-500"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "linear" }}
              />
              {steps.map((_, i) => (
                <motion.circle
                  cx={100 + i * 200}
                  cy={30}
                  r={12}
                  fill={currentStep > i ? "#3b82f6" : "#9ca3af"}
                  transformBox="fill-box"
                  transformOrigin="center"
                  initial={{ scale: 0 }}
                  animate={{ scale: currentStep > i ? 1.3 : 1 }}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </svg>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <Step1
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              )}
              {currentStep === 2 && (
                <Step2
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              )}
              {currentStep === 3 && (
                <Step3
                  formData={formData}
                  handleChange={handleChange}
                  errors={errors}
                />
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center mt-12">
              <motion.button
                type="button"
                onClick={prevStep}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all cursor-pointer ${
                  currentStep === 1
                    ? "opacity-0 pointer-events-none"
                    : "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </motion.button>

              {currentStep < 3 ? (
                <motion.button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next
                  <ChevronRight className="w-5 h-5 inline ml-1" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all disabled:opacity-70"
                  whileHover={{ scale: loading ? 1 : 1.05 }}
                  whileTap={{ scale: loading ? 1 : 0.95 }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      Sending...
                    </span>
                  ) : (
                    <>
                      Submit
                      <Send className="w-5 h-5 inline ml-1" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const Step1 = ({ formData, handleChange, errors }) => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    className="space-y-6"
  >
    {["name", "email", "phone"].map((field, i) => (
      <FloatingInput
        key={field}
        label={
          field === "name" ? "Full Name" : field === "email" ? "Email" : "Phone"
        }
        name={field}
        type={field === "phone" ? "tel" : field}
        value={formData[field]}
        onChange={handleChange}
        error={errors[field]}
        delay={i * 0.1}
      />
    ))}
  </motion.div>
);

const Step2 = ({ formData, handleChange, errors }) => (
  <motion.div
    key="step2"
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    className="space-y-6"
  >
    {["hospitalName", "location"].map((field, i) => (
      <FloatingInput
        key={field}
        label={field === "hospitalName" ? "Hospital Name" : "Location"}
        name={field}
        type="text"
        value={formData[field]}
        onChange={handleChange}
        error={errors[field]}
        delay={i * 0.1}
      />
    ))}
  </motion.div>
);

const Step3 = ({ formData, handleChange, errors }) => (
  <motion.div
    key="step3"
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    className="space-y-6"
  >
    {["demoDate", "demoTime"].map((field, i) => (
      <FloatingInput
        key={field}
        label={field === "demoDate" ? "Preferred Date" : "Preferred Time"}
        name={field}
        type={field}
        value={formData[field]}
        onChange={handleChange}
        error={errors[field]}
        delay={i * 0.1}
      />
    ))}
    <motion.textarea
      name="message"
      value={formData.message}
      onChange={handleChange}
      rows={3}
      placeholder="Any special requirements?"
      className={`w-full px-5 py-4 rounded-xl border ${
        errors.message
          ? "border-red-500"
          : "border-blue-300 dark:border-blue-600"
      } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-all duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    />
    {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
  </motion.div>
);

const FloatingInput = ({
  label,
  name,
  type,
  value,
  onChange,
  error,
  delay,
}) => (
  <motion.div
    className="relative"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`peer w-full px-5 py-4 rounded-xl  border ${
        error ? "border-red-500" : "border-blue-300 dark:border-blue-600"
      } text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-all duration-300`}
      placeholder={label}
      required
    />
    <label
      htmlFor={name}
      className="absolute left-5 -top-3 px-2 bg-white dark:bg-gray-800 text-sm font-medium text-blue-600 dark:text-blue-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 dark:peer-placeholder-shown:text-gray-400 peer-focus:-top-3 peer-focus:text-sm peer-focus:text-blue-600 dark:peer-focus:text-blue-400 cursor-text"
    >
      {label}
    </label>
    {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
  </motion.div>
);

export default Demo;
