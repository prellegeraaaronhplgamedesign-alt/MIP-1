import { useState, useEffect, useCallback, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import type { PanInfo } from "framer-motion";
import confetti from "canvas-confetti";

// SFX
import clawSfxSrc from "../assets/sfx/claw_sfx.mp3";
import buttonSfxSrc from "../assets/sfx/button_sfx.wav";
import winSfxSrc from "../assets/sfx/win_sfx.mp3";

// Machine
import machineTopImg from "../assets/top.png";
import clawMachineImg from "../assets/machine-only.png";
import productImg from "../assets/PRODUCTS_VUNDLE.png";

// Dashboard
import dashboardImg from "../assets/DASHBOARD.png";
import joystickImg from "../assets/JOYSTICK 1 1.png";
import buttonImg from "../assets/BUTTON 1 1.png";

// CTA
import ctaImg from "../assets/CTA MAIN.png";

// Claw states
import closedClawImg from "../assets/CLAW/CLOSED_CLAW.png";
import openClawImg from "../assets/CLAW/OPEN_CLAW.png";
import grabTallImg from "../assets/CLAW/GRAB TALL.png";

// Timer
import timerImg from "../assets/TIMER 1.png";
import time1  from "../assets/TEXT/1.png";
import time2  from "../assets/TEXT/2.png";
import time3  from "../assets/TEXT/3.png";
import time4  from "../assets/TEXT/4.png";
import time5  from "../assets/TEXT/5.png";
import time6  from "../assets/TEXT/6.png";
import time7  from "../assets/TEXT/7.png";
import time8  from "../assets/TEXT/8.png";
import time9  from "../assets/TEXT/9.png";
import time10 from "../assets/TEXT/10.png";

const timeImages = [
  time10, time9, time8, time7, time6,
  time5,  time4, time3, time2, time1,
];

const CLAW_IDLE       = "idle";
const CLAW_DESCENDING = "descending";
const CLAW_GRABBING   = "grabbing";
const CLAW_ASCENDING  = "ascending";

const CLAW_X_LIMIT        = 120;
const MOVE_SPEED          = 3;
const JOYSTICK_DRAG_LIMIT = 14;

function handleClickAction() {
  const w = window as Window & { mraid?: { open?: () => void } };
  if (w.mraid?.open) {
    w.mraid.open();
  } else {
    window.open();
  }
}

type SfxRefs = {
  clawSfxRef:   React.RefObject<HTMLAudioElement>;
  buttonSfxRef: React.RefObject<HTMLAudioElement>;
  winSfxRef:    React.RefObject<HTMLAudioElement>;
};

type Props = {
  onComplete?:        () => void;
  showBg?:            boolean;
  onReady?:           (refs: SfxRefs) => void;
  tutorialStep?:      string | null;
  onJoystickUsed?:    () => void;
  onJoystickReleased?: () => void;
  onButtonUsed?:      () => void;
  buttonPressRef?:    React.MutableRefObject<(() => void) | null>;
  autoStart?:         boolean;
};


export function Game({
  onComplete,
  onReady,
  tutorialStep = null,
  onJoystickUsed,
  onJoystickReleased,
  onButtonUsed,
  buttonPressRef,
  autoStart = false,
}: Props) {
  const [timeIndex, setTimeIndex]             = useState(0);
  const [hasStarted, setHasStarted]           = useState(autoStart);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [clawState, setClawState]             = useState(CLAW_IDLE);
  const [grabImg, setGrabImg]                 = useState(grabTallImg);
  const [gameOver, setGameOver]               = useState(false);

  const joystickDirection      = useRef(0);
  const moveLoopRef            = useRef<number | null>(null);
  const clawXRef               = useRef(0);
  const pendingTimersRef       = useRef(new Set<ReturnType<typeof setTimeout>>());
  const clawRef                = useRef<HTMLImageElement>(null);
  const joystickTutorialDoneRef = useRef(false);

  // SFX refs
  const clawSfxRef   = useRef(new Audio(clawSfxSrc));
  const buttonSfxRef = useRef(new Audio(buttonSfxSrc));
  const winSfxRef    = useRef(new Audio(winSfxSrc));

  // Set volumes, expose refs to parent, and unlock audio on first touch (iOS)
  useEffect(() => {
    clawSfxRef.current.loop      = true;
    clawSfxRef.current.volume    = 0.2;
    buttonSfxRef.current.volume  = 0.2;
    winSfxRef.current.volume     = 0.1;

    if (onReady) onReady({ clawSfxRef, buttonSfxRef, winSfxRef });

    const unlock = () => {
      [clawSfxRef, buttonSfxRef, winSfxRef].forEach((r) => {
        r.current.play().catch(() => {});
        r.current.pause();
        r.current.currentTime = 0;
      });
      document.removeEventListener("touchstart", unlock, { capture: true });
    };
    document.addEventListener("touchstart", unlock, { capture: true, passive: true });
    return () => document.removeEventListener("touchstart", unlock, { capture: true });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const addTimer = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      pendingTimersRef.current.delete(id);
      fn();
    }, delay);
    pendingTimersRef.current.add(id);
    return id;
  }, []);

  const stopAll = useCallback(() => {
    pendingTimersRef.current.forEach(clearTimeout);
    pendingTimersRef.current.clear();
    if (moveLoopRef.current) {
      cancelAnimationFrame(moveLoopRef.current);
      moveLoopRef.current = null;
    }
    joystickDirection.current = 0;
    [clawSfxRef, buttonSfxRef, winSfxRef].forEach((r) => {
      r.current.pause();
      r.current.currentTime = 0;
    });
  }, []);

  useEffect(() => {
    if (gameOver) stopAll();
  }, [gameOver, stopAll]);

  useEffect(() => () => stopAll(), [stopAll]);

  const joystickX   = useMotionValue(0);
  const clawMotionX = useMotionValue(0);

  const joystickRotate = useTransform(
    joystickX,
    [-JOYSTICK_DRAG_LIMIT, 0, JOYSTICK_DRAG_LIMIT],
    [-23, 0, 23],
  );

  const startMoveLoop = useCallback(() => {
    if (moveLoopRef.current) return;
    const tick = () => {
      const dir = joystickDirection.current;
      if (dir !== 0) {
        const next = Math.max(
          -CLAW_X_LIMIT,
          Math.min(CLAW_X_LIMIT, clawXRef.current + dir * MOVE_SPEED),
        );
        clawXRef.current = next;
        clawMotionX.set(next);
        moveLoopRef.current = requestAnimationFrame(tick);
      } else {
        moveLoopRef.current = null;
      }
    };
    moveLoopRef.current = requestAnimationFrame(tick);
  }, [clawMotionX]);

  const stopMoveLoop = useCallback(() => {
    if (moveLoopRef.current) {
      cancelAnimationFrame(moveLoopRef.current);
      moveLoopRef.current = null;
    }
  }, []);

  const handleJoystickDrag = useCallback(
    (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
      if (clawState !== CLAW_IDLE) {
        joystickX.set(0);
        joystickDirection.current = 0;
        stopMoveLoop();
        return;
      }

      const clamped = Math.max(
        -JOYSTICK_DRAG_LIMIT,
        Math.min(JOYSTICK_DRAG_LIMIT, info.offset.x),
      );
      joystickX.set(clamped);

      if (Math.abs(clamped) < 3) {
        joystickDirection.current = 0;
        stopMoveLoop();
        clawSfxRef.current.pause();
        clawSfxRef.current.currentTime = 0;
      } else {
        joystickDirection.current = clamped > 0 ? 1 : -1;
        setHasStarted(true);
        startMoveLoop();
        if (clawSfxRef.current.paused) clawSfxRef.current.play().catch(() => {});

        if (tutorialStep === "joystick" && onJoystickUsed && !joystickTutorialDoneRef.current) {
          joystickTutorialDoneRef.current = true;
          onJoystickUsed();
        }
      }
    },
    [clawState, joystickX, startMoveLoop, stopMoveLoop, tutorialStep, onJoystickUsed],
  );

  const handleJoystickDragEnd = useCallback(() => {
    joystickDirection.current = 0;
    joystickX.set(0);
    stopMoveLoop();
    clawSfxRef.current.pause();
    clawSfxRef.current.currentTime = 0;

    if (joystickTutorialDoneRef.current && onJoystickReleased) {
      joystickTutorialDoneRef.current = false;
      onJoystickReleased();
    }
  }, [joystickX, stopMoveLoop, onJoystickReleased]);

  // Countdown — ticks once per second after first interaction
  useEffect(() => {
    if (!hasStarted || gameOver) return;
    if (timeIndex >= timeImages.length - 1) {
      setTimeout(() => {
        setGameOver(true);
        setTimeout(() => onComplete?.(), 1000);
      }, 0);
      return;
    }
    const id = setTimeout(() => setTimeIndex((p) => p + 1), 1000);
    return () => clearTimeout(id);
  }, [timeIndex, gameOver, hasStarted, onComplete]);

  const getClawImage = () => {
    if (clawState === CLAW_ASCENDING)                                      return grabImg;
    if (clawState === CLAW_DESCENDING || clawState === CLAW_GRABBING) return openClawImg;
    return closedClawImg;
  };

    // Fire gold-star confetti burst from the claw's current screen position
    const fireConfetti = useCallback(() => {
      const el = clawRef.current;
      const rect = el ? el.getBoundingClientRect() : null;
      const originX = rect
        ? (rect.left + rect.width / 2) / window.innerWidth
        : 0.5;
      const originY = rect
        ? (rect.top + rect.height / 2) / window.innerHeight +
          120 / window.innerHeight
        : 0.3;
  
      const defaults = {
        spread: 90,
        ticks: 40,
        gravity: 0.4,
        decay: 0.93,
        startVelocity: 12,
        origin: { x: originX, y: originY },
        colors: ["#FF0000", "#CC0000", "#FF3333", "#FF6666", "#FF9999"],
      };
  
      const shoot = () => {
        confetti({
          ...defaults,
          particleCount: 15,
          scalar: 1.2,
          shapes: ["star"],
        });
        confetti({
          ...defaults,
          particleCount: 5,
          scalar: 0.75,
          shapes: ["circle"],
        });
      };
  
      setTimeout(shoot, 0);
      setTimeout(shoot, 120);
    }, []);

  const getClawY = () =>
    clawState === CLAW_DESCENDING || clawState === CLAW_GRABBING ? 150 : 0;

  const handleButtonPress = useCallback(() => {
    if (clawState !== CLAW_IDLE || isButtonPressed || gameOver) return;

    if (tutorialStep === "button" && onButtonUsed) onButtonUsed();

    setIsButtonPressed(true);
    addTimer(() => setIsButtonPressed(false), 100);
    setHasStarted(true);
    setClawState(CLAW_DESCENDING);
    setGrabImg(grabTallImg);

    buttonSfxRef.current.currentTime = 0;
    buttonSfxRef.current.play().catch(() => {});

    // One-shot claw sound for descent
    clawSfxRef.current.loop = false;
    clawSfxRef.current.currentTime = 0;
    clawSfxRef.current.play().catch(() => {});
    addTimer(() => {
      clawSfxRef.current.pause();
      clawSfxRef.current.currentTime = 0;
    }, 800);

    // Descending → Grabbing
    addTimer(() => {
      setClawState(CLAW_GRABBING);

      // Grabbing → Ascending
      addTimer(() => {
        setClawState(CLAW_ASCENDING);
        clawSfxRef.current.currentTime = 0;
        clawSfxRef.current.play().catch(() => {});

        // Ascending → Idle → win
        addTimer(() => {
          setClawState(CLAW_IDLE);
          clawSfxRef.current.pause();
          clawSfxRef.current.currentTime = 0;

          winSfxRef.current.currentTime = 0;
          winSfxRef.current.play().catch(() => {});

          fireConfetti();

          setTimeout(() => {
            setGameOver(true);
            onComplete?.();
          }, 1000);
        }, 1000);
      }, 400);
    }, 1000);
  }, [clawState, isButtonPressed, gameOver, tutorialStep, onButtonUsed, addTimer, onComplete, fireConfetti]);

  // Expose handleButtonPress to parent (for Tutorial tap-to-press)
  useEffect(() => {
    if (buttonPressRef) buttonPressRef.current = handleButtonPress;
  }, [buttonPressRef, handleButtonPress]);

  
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative h-full w-full overflow-hidden"
    >
      {/* Machine top bar */}
      <img
        src={machineTopImg}
        alt="Machine Top"
        className="relative z-50 w-full"
      />

      {/* Claw machine body */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[88%] z-[3]">
        <img src={clawMachineImg} alt="Claw Machine" className="w-full block" />

        {/* Overflow window that clips the claw */}
        <div className="absolute top-[1%] left-0 w-full h-[90%] overflow-hidden z-[4]">
          <motion.img
            ref={clawRef}
            src={getClawImage()}
            alt="Claw"
            className="absolute left-1/2 -translate-x-1/2 w-[20%]"
            style={{ top: "-40%", x: clawMotionX }}
            animate={{ y: getClawY() }}
            transition={{
              duration:
                clawState === CLAW_DESCENDING || clawState === CLAW_ASCENDING
                  ? 1.0
                  : 0.05,
              ease: [0.45, 0, 0.55, 1],
            }}
          />
        </div>

        <img
          src={productImg}
          alt="Products"
          className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[88%] z-10"
        />
      </div>

      {/* Dashboard */}
      <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[92%] z-[4]">
        <img src={dashboardImg} alt="Dashboard" className="w-full block" />

        {/* Timer */}
        <div className="absolute bottom-[56%] left-[1%] z-[5] flex items-center justify-center">
          <img src={timerImg} alt="Timer" className="w-[40%] block" />
          <img
            src={timeImages[timeIndex]}
            alt="Countdown"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[55%]"
          />
        </div>

        {/* Joystick */}
        <div
          className="absolute -top-[45%] left-[53%] -translate-x-1/2 h-[75%]"
          style={{ zIndex: 6, touchAction: "none" }}
        >
          <motion.img
            src={joystickImg}
            alt="Joystick"
            className="h-full select-none"
            style={{
              x: joystickX,
              rotate: joystickRotate,
              cursor: clawState === CLAW_IDLE ? "grab" : "not-allowed",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            drag="x"
            dragConstraints={{
              left: -JOYSTICK_DRAG_LIMIT,
              right: JOYSTICK_DRAG_LIMIT,
            }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleJoystickDrag}
            onDragEnd={handleJoystickDragEnd}
          />
        </div>

        {/* Button */}
        <div
          className="absolute top-[3%] right-[13%] h-[51%] cursor-pointer"
          style={{ zIndex: 6, padding: "10px", margin: "-10px" }}
          onClick={handleButtonPress}
        >
          <motion.img
            src={buttonImg}
            alt="Button"
            className="h-full pointer-events-none"
            whileTap={{ scale: 0.85 }}
            animate={isButtonPressed ? { scale: 0.9 } : { scale: 1 }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* CTA */}
      <motion.img
        src={ctaImg}
        alt="Shop Now"
        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[60%] z-[6] cursor-pointer"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClickAction}
      />
    </motion.div>
  );
}
