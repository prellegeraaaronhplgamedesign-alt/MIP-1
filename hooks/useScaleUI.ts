import { useLayoutEffect, useRef, type RefObject } from "react";

export default function useScaleUI(
  baseW = 420,
  baseH = 820
): {
  appRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
} {
  const appRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const app = appRef.current;
    const wrapper = wrapperRef.current;
    if (!app || !wrapper) return;

    const scaleUI = () => {
      const { width: viewportW, height: viewportH } =
        wrapper.getBoundingClientRect();

      const scale = Math.min(viewportW / baseW, viewportH / baseH);

      app.style.width = `${baseW}px`;
      app.style.height = `${baseH}px`;
      app.style.transformOrigin = "0 0";
      app.style.transform = `scale(${scale})`;

      const scaledW = baseW * scale;
      const scaledH = baseH * scale;

      app.style.left = `${(viewportW - scaledW) / 2}px`;
      app.style.top = `${(viewportH - scaledH) / 2}px`;
    };

    scaleUI();

    const ro = new ResizeObserver(scaleUI);
    ro.observe(wrapper);

    window.addEventListener("orientationchange", scaleUI);

    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", scaleUI);
    };
  }, [baseW, baseH]);

  return { appRef, wrapperRef };
}
