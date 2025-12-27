import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { FaCheckCircle } from "react-icons/fa";

export default function WelcomeAnimation({ userName }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex flex-col justify-center items-center z-50 transition-colors duration-300"
        dir="rtl"
      >
        <Confetti width={window.innerWidth} height={window.innerHeight} />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
          className="text-center space-y-6"
        >
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-[#E41E26] mb-4 font-poppins drop-shadow-lg"
          >
            !مرحباً، {userName}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex items-center justify-center gap-3 text-xl font-semibold text-gray-800 dark:text-white"
          >
            <span>تم تسجيل الدخول بنجاح</span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <FaCheckCircle className="text-[#E41E26]" size={28} />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
