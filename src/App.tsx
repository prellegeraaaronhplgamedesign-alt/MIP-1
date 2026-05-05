import './App.css'
import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Game } from "./components/Game";
import { Endscreen } from "./components/Endscreen";
import { Tutorial } from "./components/Tutorial";
import useScaleUI from "../hooks/useScaleUI";
import { useMediaQuery } from "./hooks/useMediaQuery";
import bgGame from "./assets/BG/BG SCENE.png";

const makeBgStyle = (url: string) => ({
  backgroundImage: `url(${url})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
});

function App() {
  const { appRef, wrapperRef } = useScaleUI(420, 820);
  const [scene, setScene]           = useState("game");
  const [gameStarted, setGameStarted]   = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState<string | null>("joystick");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sfxRefsRef     = useRef<any>(null);
  const buttonPressRef = useRef<(() => void) | null>(null);

  const isMobilePortrait = useMediaQuery(
    "(max-width: 500px) and (orientation: portrait)",
  );

  const wrapperStyle = scene === "game" ? makeBgStyle(bgGame) : {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGameReady = useCallback((refs: any) => {
    sfxRefsRef.current = refs;
  }, []);

  const handleTapToStart = useCallback(() => {
    if (sfxRefsRef.current) {
      Object.values(sfxRefsRef.current).forEach((ref) => {
        (ref as React.RefObject<HTMLAudioElement>).current?.play().catch(() => {});
        (ref as React.RefObject<HTMLAudioElement>).current?.pause();
        const el = (ref as React.RefObject<HTMLAudioElement>).current;
        if (el) el.currentTime = 0;
      });
    }
    setGameStarted(true);
    setShowTutorial(true);
    setTutorialStep("joystick");
  }, []);

  const handleTutorialStepChange = useCallback((step: string | null) => {
    setTutorialStep(step);
  }, []);

  const handleJoystickUsed = useCallback(() => {
    setTutorialStep(null);
  }, []);

  const handleJoystickReleased = useCallback(() => {
    setTutorialStep("button");
  }, []);

  const handleButtonUsed = useCallback(() => {
    setShowTutorial(false);
    setTutorialStep(null);
  }, []);

  return (
    <>
      <div ref={wrapperRef} className="app-wrapper" style={wrapperStyle}>
        <div ref={appRef} className="app" style={{ backgroundColor: "transparent" }}>
          {scene === "game" && (
            <Game
              onComplete={() => setScene("endscreen")}
              showBg={!isMobilePortrait}
              onReady={handleGameReady}
              tutorialStep={gameStarted ? tutorialStep : null}
              onJoystickUsed={handleJoystickUsed}
              onJoystickReleased={handleJoystickReleased}
              onButtonUsed={handleButtonUsed}
              buttonPressRef={buttonPressRef}
              autoStart={gameStarted}
            />
          )}

          {/* Tap-to-start overlay — sits above game, disappears on tap */}
          <AnimatePresence>
            {!gameStarted && scene === "game" && (
              <motion.div
                key="tap-to-start"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
                style={{ backgroundColor: "rgba(1, 49, 60, 0.76)" }}
                onClick={handleTapToStart}
              >
                <div
                  className="w-full py-4 flex items-center justify-center"
                  style={{ backgroundColor: "#C9A09A" }}
                >
                  <span
                    className="text-white text-3xl tracking-widest uppercase select-none"
                    style={{ fontFamily: "serif", letterSpacing: "0.2em" }}
                  >
                    TAP TO START
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showTutorial && gameStarted && scene === "game" && (
              <Tutorial
                step={tutorialStep}
                onStepChange={handleTutorialStepChange}
                onButtonTap={() => buttonPressRef.current?.()}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {scene === "endscreen" && (
        <div className="fixed inset-0 z-50">
          <Endscreen />
        </div>
      )}
    </>
  );
}

export default App;
