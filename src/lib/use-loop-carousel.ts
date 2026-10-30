"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Trượt qua bản nối ở hai đầu, rồi đổi về vị trí thật khi hình ảnh đã khớp. */
export function useLoopCarousel(count: number, duration: number) {
  const [state, setState] = useState({ position: 1, animate: false });
  const [queuedIndex, setQueuedIndex] = useState<number | null>(null);
  const moving = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const position = count > 0 ? Math.min(state.position, count + 1) : 1;
  const activeIndex = count > 0 ? (position - 1 + count) % count : 0;

  const settle = useCallback(() => {
    moving.current = false;
    setState((current) => {
      const position =
        current.position === 0
          ? count
          : current.position >= count + 1
            ? 1
            : current.position;
      return { position, animate: false };
    });
  }, [count]);

  useEffect(() => {
    if (!state.animate) return;
    // Dự phòng khi trình duyệt ngắt transition (đổi kích thước/ẩn tab).
    const timer = window.setTimeout(settle, duration + 80);
    return () => window.clearTimeout(timer);
  }, [state, duration, settle]);

  // Giữ thao tác mới nhất trong lúc trượt, rồi xử lý sau khi đã về slide thật.
  // Một frame giữa hai lượt giúp việc nối vòng không trượt xuyên toàn bộ dãy.
  useEffect(() => {
    if (state.animate || queuedIndex === null) return;
    const frame = window.requestAnimationFrame(() => {
      setQueuedIndex(null);
      if (count <= 1 || queuedIndex === activeIndex) return;
      const reduce = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      moving.current = !reduce;
      setState({ position: queuedIndex + 1, animate: !reduce });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.animate, queuedIndex, activeIndex, count]);

  function goTo(index: number) {
    if (count <= 1) return;
    if (moving.current) {
      setQueuedIndex((index + count) % count);
      return;
    }
    if (index === activeIndex) return;
    setQueuedIndex(null);
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setState({ position: ((index + count) % count) + 1, animate: false });
      return;
    }
    moving.current = true;
    setState({ position: index + 1, animate: true });
  }

  return {
    position,
    activeIndex,
    animate: state.animate,
    next: () => goTo(activeIndex + 1),
    previous: () => goTo(activeIndex - 1),
    goTo,
    swipeHandlers: {
      onTouchStart: (event: React.TouchEvent<HTMLElement>) => {
        const touch = event.touches.length === 1 ? event.touches[0] : null;
        touchStart.current = touch
          ? { x: touch.clientX, y: touch.clientY }
          : null;
      },
      onTouchEnd: (event: React.TouchEvent<HTMLElement>) => {
        const start = touchStart.current;
        const touch = event.changedTouches[0];
        touchStart.current = null;
        if (!start || !touch) return;
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
        event.preventDefault();
        goTo(activeIndex + (dx < 0 ? 1 : -1));
      },
      onTouchCancel: () => {
        touchStart.current = null;
      },
    },
    onTransitionEnd: (event: React.TransitionEvent<HTMLElement>) => {
      if (
        event.target === event.currentTarget &&
        event.propertyName === "transform"
      )
        settle();
    },
  };
}
