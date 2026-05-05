import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg    from "../assets/flutterhabit-logo.png";
// import bgImg      from "../assets/BG/OPAQUE BG.png";
import titleImg   from "../assets/The Glow-Getter Brunette.png";

import logoImgm    from "../assets/flutterhabit-mobile-logo.png";
import bgImgm      from "../assets/The Glow-Getter Brunette-mobile.png";
// Slider images — swap these out when you provide the real ones
import slide1 from "../assets/CAROUSEL/IMAGE_1.png";
import slide2 from "../assets/CAROUSEL/IMAGE_2.png";
import slide3 from "../assets/CAROUSEL/IMAGE_3.png";
import slide4 from "../assets/CAROUSEL/IMAGE_4.png";
import slide5 from "../assets/CAROUSEL/IMAGE_5.png";

import { useMediaQuery } from "../hooks/useMediaQuery";

const slides = [slide1, slide2, slide3, slide4, slide5];
const SLIDE_INTERVAL_MS = 2000;

function handleClickAction() {
  const w = window as Window & { mraid?: { open?: () => void } };
  if (w.mraid?.open) {
    w.mraid.open();
  } else {
    window.open();
  }
}

const TEAL = "#01313C";

// Auto-advancing image slider
function Slider({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const variants = {
    enter:  (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.img
          key={index}
          src={slides[index]}
          alt={`Slide ${index + 1}`}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full h-full object-cover block"
          style={{ position: "relative" }}
        />
      </AnimatePresence>

      {/* Dot indicators */}
      {/* <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: i === index ? "#fff" : "rgba(255,255,255,0.45)" }}
          />
        ))}
      </div> */}
    </div>
  );
}

function ShopNowButton({ animated }: { animated: boolean }) {
  return (
    <motion.button
      onClick={handleClickAction}
      animate={animated ? { scale: [1, 1.05, 1] } : {}}
      transition={animated ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer rounded-[20px] text-white font-bold uppercase px-14 py-4 text-base"
      style={{ backgroundColor: TEAL, letterSpacing: "0.2em" }}
    >
      SHOP NOW
    </motion.button>
  );
}

export function Endscreen() {
  const isPortrait = useMediaQuery("(orientation: portrait)");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full w-full"
    >
      {isPortrait ? (
        /* ── Portrait ── */
        <div
          className="h-full w-full flex flex-col items-center justify-center space-y-[50px] py-10 px-6 bg-linear-to-b from-[#01313C] via-[#01313C] to-transparent"
          // style={{
          //   backgroundImage: `url(${bgImg})`,
          //   backgroundSize: "cover",
          //   backgroundPosition: "center",
          // }}
        >
          <div className="flex flex-col items-center gap-3 w-full">
            <img src={logoImgm} alt="flutterhabit" className="w-[45%]" />
            <img src={bgImgm} alt="The Glow-Getter Brunette" className="w-[90%]" />
          </div>

          <Slider className="w-full aspect-4/3" />

          <ShopNowButton animated />
        </div>
      ) : (
        /* ── Landscape ── */
        <div className="h-full w-full flex">
          {/* Left — teal bg + animated slider */}
          <div
            className="w-1/2 h-full flex items-center justify-center p-8 bg-linear-to-b from-[#01313C] via-[#01313C] to-transparent"
            // style={{
            //   backgroundImage: `url(${bgImg})`,
            //   backgroundSize: "cover",
            //   backgroundPosition: "center",
            // }}
          >
            <Slider className="w-[428px] aspect-square" />
          </div>

          {/* Right — white bg + branding + CTA */}
          <div className="w-1/2 h-full flex flex-col items-center justify-center gap-6 bg-white px-10 space-y-6">
            <img src={logoImg} alt="flutterhabit" className="w-[50%]" />
            {/* <div></div> */}
            <img src={titleImg} alt="The Glow-Getter Brunette" className="w-[85%]" />
            <ShopNowButton animated={false} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
