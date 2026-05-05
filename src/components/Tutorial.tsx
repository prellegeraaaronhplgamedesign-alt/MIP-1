import { motion, AnimatePresence } from "framer-motion";
import handImg from "../assets/crsr_hand.webp"
type Props = {
  step: string | null;
  onStepChange: (step: string | null) => void;
  onButtonTap: () => void;
};

export function Tutorial({ step, onButtonTap }: Props) {
  return (
    <AnimatePresence>
      {step === "joystick" && (
        <motion.div
          key="joystick-hint"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-1/3 left-[37%] z-20 pointer-events-none"
        >
          <div className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
            ← drag joystick →
          </div>
        </motion.div>
      )}

      {step === "button" && (
        <motion.div
          key="button-hint"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          exit={{ opacity: 0, y: 10 }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-[25%] right-[10%] z-20 cursor-pointer"
          onClick={onButtonTap}
        >
          <img src={handImg} alt="hand" className="size-6"/>
          <div className="bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
            press!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
