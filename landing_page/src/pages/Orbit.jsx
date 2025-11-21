import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import React, { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import {
  Wallet,
  FileUser,
  Pill,
  Beaker,
  Users,
  IndianRupee,
} from "lucide-react";
import { isMobile } from "../utility/helper";

const OrbitContainer = ({ children }) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 500;
  const size = isMobile ? 400 : 700;
  const center = size / 2;

  return (
    <div
      className="container"
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
      }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { center, size, isMobile })
          : child
      )}
    </div>
  );
};

const OrbitPath = ({ radius, center, isInView }) => (
  <motion.svg
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    }}
    initial={{ opacity: 0 }}
    whileInView={isInView ? { opacity: 0.15 } : { opacity: 0 }}
    viewport={{ once: false, amount: isMobile ? 0.2 : 0.3 }}
    transition={{ duration: 1, delay: 0.3 }}
  >
    <circle
      cx={center}
      cy={center}
      r={radius}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="6 8"
    />
  </motion.svg>
);

const OrbitGroup = ({
  children,
  radius,
  startAngle,
  center,
  size,
  isInView,
}) => {
  const angle = useMotionValue(startAngle);

  // continuous rotation
  useEffect(() => {
    const controls = animate(angle, [startAngle, startAngle + 360], {
      duration: 40,
      ease: "linear",
      repeat: Infinity,
    });
    return controls.stop;
  }, [angle, startAngle]);

  return (
    <>
      <OrbitPath radius={radius} center={center} isInView={isInView} />
      <motion.div
        style={{
          position: "absolute",
          width: size,
          height: size,
          rotate: angle,
          transformOrigin: `${center}px ${center}px`,
        }}
        // gentle pulse while rotating
        animate={isInView ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, { radius, angle, center })
            : child
        )}
      </motion.div>
    </>
  );
};

const OrbitHex = ({
  index,
  radius,
  angle: orbitAngle,
  center,
  hexColor,
  isInView,
  children,
}) => {
  const offset = index * 180;
  const fullAngle = useTransform(orbitAngle, (a) => a + offset);

  const x = useTransform(
    fullAngle,
    (a) => radius * Math.cos((a * Math.PI) / 180)
  );
  const y = useTransform(
    fullAngle,
    (a) => radius * Math.sin((a * Math.PI) / 180)
  );

  return (
    <motion.div
      className="hex"
      style={{
        position: "absolute",
        left:
          typeof window !== "undefined" && window.innerWidth < 500
            ? center - 40
            : center - 55,
        top:
          typeof window !== "undefined" && window.innerWidth < 500
            ? center - 33
            : center - 45,
        x,
        y,
        rotate: useTransform(orbitAngle, (a) => -a),
        "--hex-color": hexColor,
      }}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{
        opacity: { duration: 0.5 },
      }}
    >
      <div className="hex-inner ">{children}</div>
    </motion.div>
  );
};

const CenterHex = ({ center, isInView }) => {
  const spin = useMotionValue(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(spin, [0, -360], {
      duration: 30,
      ease: "linear",
      repeat: Infinity,
    });
    return controls.stop;
  }, [spin, isInView]);

  return (
    <motion.div
      className="hex h-5 w-5 overflow-hidden"
      style={{
        position: "absolute",
        left:
          typeof window !== "undefined" && window.innerWidth < 500
            ? center - 40
            : center - 55,
        top:
          typeof window !== "undefined" && window.innerWidth < 500
            ? center - 33
            : center - 45,
        "--hex-color": "#000000",
      }}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="hex-inner">
        <img src="/icon.png" className="p-7" alt="center" />
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const sectionRef = useRef(null);
  const [ref, isInView] = useInView({
    threshold:
      typeof window !== "undefined" && window.innerWidth < 500 ? 0.3 : 0.4,
    triggerOnce: false,
  });

  return (
    <section
      id="about"
      ref={(node) => {
        sectionRef.current = node;
        ref(node);
      }}
      className="py-20 px-6 overflow-hidden w-screen flex items-center flex-col justify-center transition-colors duration-300"
    >
      <motion.div
        className="flex items-center justify-center flex-col"
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: false, amount: isMobile ? 0.3 : 0.4 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight w-full text-center">
          Velocare is the complete hospital ERP
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-700 dark:text-gray-300 text-center">
          connecting Hospitals, Doctors, and Patients anywhere.
        </p>
      </motion.div>
      <div className="flex items-center justify-center my-8 relative">
        <div className="absolute w-84 h-84 md:w-[700px] md:h-[700px] rounded-full bg-white shadow-[0_0_10px_10px_rgba(0,0,0,0.10)] md:shadow-[0_0_60px_20px_rgba(0,0,0,0.25)] dark:bg-gray-800/30"></div>
        <div className="absolute w-60 h-60 md:w-[500px] md:h-[500px] shadow-[0_0_10px_10px_rgba(0,0,0,0.10)] md:shadow-[0_0_60px_20px_rgba(0,0,0,0.25)] rounded-full bg-white dark:bg-gray-800/30"></div>
        <div className="absolute w-36 h-36 md:w-[300px] md:h-[300px] shadow-[0_0_10px_10px_rgba(0,0,0,0.10)] md:shadow-[0_0_60px_20px_rgba(0,0,0,0.25)] rounded-full bg-white dark:bg-gray-800/30"></div>

        <OrbitContainer>
          <OrbitGroup
            radius={
              typeof window !== "undefined" && window.innerWidth < 500
                ? 80
                : 160
            }
            startAngle={240}
            isInView={isInView}
          >
            <OrbitHex index={0} hexColor="#dc2626" isInView={isInView}>
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
                Billing
              </h6>
            </OrbitHex>
            <OrbitHex index={1} hexColor="#2563eb" isInView={isInView}>
              <FileUser className="w-5 h-5 sm:w-6 sm:h-6" />
              <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
                Patient Records
              </h6>
            </OrbitHex>
          </OrbitGroup>

          <OrbitGroup
            radius={
              typeof window !== "undefined" && window.innerWidth < 500
                ? 120
                : 240
            }
            startAngle={120}
            isInView={isInView}
          >
            <OrbitHex index={0} hexColor="#16a34a" isInView={isInView}>
              <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
              <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
                Medicines
              </h6>
            </OrbitHex>
            <OrbitHex index={1} hexColor="#ec4899" isInView={isInView}>
              <Beaker className="w-5 h-5 sm:w-6 sm:h-6" />
              <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
                Lab Test
              </h6>
            </OrbitHex>
          </OrbitGroup>

          <OrbitGroup
            radius={
              typeof window !== "undefined" && window.innerWidth < 500
                ? 170
                : 330
            }
            startAngle={360}
            isInView={isInView}
          >
            <OrbitHex index={0} hexColor="#ca8a04" isInView={isInView}>
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
                Staff Records
              </h6>
            </OrbitHex>
            <OrbitHex index={1} hexColor="#ea580c" isInView={isInView}>
              <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
              <h6 className="mt-1 text-[10px] sm:text-sm font-medium text-white px-2 text-center">
                Salary
              </h6>
            </OrbitHex>
          </OrbitGroup>

          <CenterHex isInView={isInView} />
        </OrbitContainer>
      </div>
    </section>
  );
};

export default FeaturesSection;
