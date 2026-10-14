"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { OryzeRing } from "@/components/ui/OryzeRing";
import { oryzeTokens } from "@/lib/tokens";

export type ButtonPhase = "idle" | "hold" | "working" | "done" | "cancelled" | "failed";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

type ManagedNativeProps =
  | "children"
  | "type"
  | "disabled"
  | "onClick"
  | "onPointerDown"
  | "onPointerUp"
  | "onPointerLeave"
  | "onPointerMove"
  | "onPointerCancel"
  | "onPointerEnter"
  | "onKeyDown"
  | "onKeyUp"
  | "onBlur"
  | "aria-busy";

type NativeButtonProps = Omit<ComponentPropsWithRef<"button">, ManagedNativeProps>;

export type ButtonProps = NativeButtonProps & {
  children: ComponentPropsWithRef<"button">["children"];
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ComponentPropsWithRef<"button">["children"];
  iconRight?: ComponentPropsWithRef<"button">["children"];
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  holdToConfirm?: number;
  onHoldComplete?: () => void;
  onHoldCancel?: () => void;
  phase?: ButtonPhase;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

type KeyboardGesture = {
  kind: "keyboard";
  key: " " | "Enter";
};

type PointerGesture = {
  kind: "pointer";
  pointerId: number;
  pointerType: string;
  originX: number;
  originY: number;
};

type GestureInput = KeyboardGesture | PointerGesture;
type ActiveGesture = GestureInput & { startedAt: number; durationMs: number };

type CallbackSet = {
  onHoldComplete?: () => void;
  onHoldCancel?: () => void;
  onClick?: () => void;
  type: "button" | "submit" | "reset";
};

const cancelDistance = oryzeTokens.interaction.pointerCancelDistancePx;

function getHoldHint(phase: ButtonPhase): string {
  switch (phase) {
    case "working":
      return "en cours";
    case "done":
      return "tracée";
    case "cancelled":
      return "annulée";
    case "failed":
      return "réessayer";
    case "hold":
    case "idle":
      return "maintenir";
  }
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  loading = false,
  holdToConfirm,
  onHoldComplete,
  onHoldCancel,
  phase,
  type = "button",
  onClick,
  className,
  style,
  ref,
  ...nativeProps
}: ButtonProps) {
  const [localPhase, setLocalPhase] = useState<ButtonPhase>("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const activeGestureRef = useRef<ActiveGesture | null>(null);
  const progressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const drainFrameRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const buttonElementRef = useRef<HTMLButtonElement | null>(null);
  const phasePropRef = useRef<ButtonPhase | undefined>(phase);
  const callbackRef = useRef<CallbackSet>({ onHoldComplete, onHoldCancel, onClick, type });

  phasePropRef.current = phase;
  callbackRef.current = { onHoldComplete, onHoldCancel, onClick, type };

  const setButtonRef = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonElementRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      reducedMotionRef.current = media.matches;
    };

    updatePreference();
    media.addEventListener("change", updatePreference);

    return () => {
      media.removeEventListener("change", updatePreference);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (drainFrameRef.current !== null) {
        window.cancelAnimationFrame(drainFrameRef.current);
      }
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const externalPhase = phase !== undefined && phase !== "idle" ? phase : undefined;
  const visiblePhase = activeGestureRef.current !== null ? "hold" : externalPhase ?? localPhase;
  const isUnavailable = disabled || loading || visiblePhase === "working" || visiblePhase === "done";
  const isBusy = loading || visiblePhase === "working";
  const isNativeDisabled = isUnavailable;
  const ringProgress = visiblePhase === "working" || visiblePhase === "done" ? 1 : holdProgress;

  const triggerCompletedAction = useCallback(() => {
    const callbacks = callbackRef.current;
    if (callbacks.onHoldComplete) {
      callbacks.onHoldComplete();
      return;
    }
    if (callbacks.onClick) {
      callbacks.onClick();
      return;
    }

    const button = buttonElementRef.current;
    if (callbacks.type === "submit") {
      button?.form?.requestSubmit(button);
    } else if (callbacks.type === "reset") {
      button?.form?.reset();
    }
  }, []);

  const finishGesture = useCallback(() => {
    if (activeGestureRef.current === null) return;

    activeGestureRef.current = null;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (drainFrameRef.current !== null) {
      window.cancelAnimationFrame(drainFrameRef.current);
      drainFrameRef.current = null;
    }
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    progressRef.current = 1;
    setHoldProgress(1);
    setIsPressing(false);
    setLocalPhase(phasePropRef.current === undefined ? "done" : "working");
    triggerCompletedAction();
  }, [triggerCompletedAction]);

  const cancelGesture = useCallback(() => {
    const activeGesture = activeGestureRef.current;
    if (activeGesture === null) {
      setIsPressing(false);
      return;
    }

    activeGestureRef.current = null;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (drainFrameRef.current !== null) {
      window.cancelAnimationFrame(drainFrameRef.current);
      drainFrameRef.current = null;
    }
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setIsPressing(false);
    setLocalPhase("cancelled");
    callbackRef.current.onHoldCancel?.();

    const startingProgress = progressRef.current;
    const drainDuration = reducedMotionRef.current ? 0 : 180;
    if (startingProgress <= 0.001 || drainDuration === 0) {
      progressRef.current = 0;
      setHoldProgress(0);
    } else {
      const drainStartedAt = performance.now();
      const drain = (now: number) => {
        const portion = Math.min(1, (now - drainStartedAt) / drainDuration);
        const nextProgress = startingProgress * (1 - portion);
        progressRef.current = nextProgress;
        setHoldProgress(nextProgress);

        if (portion < 1) {
          drainFrameRef.current = window.requestAnimationFrame(drain);
        } else {
          progressRef.current = 0;
          setHoldProgress(0);
          drainFrameRef.current = null;
        }
      };
      drainFrameRef.current = window.requestAnimationFrame(drain);
    }

    resetTimerRef.current = window.setTimeout(
      () => {
        setLocalPhase((current) => (current === "cancelled" ? "idle" : current));
        resetTimerRef.current = null;
      },
      reducedMotionRef.current ? 250 : 620,
    );
  }, []);

  const startGesture = useCallback(
    (input: GestureInput) => {
      if (holdToConfirm === undefined || isUnavailable || activeGestureRef.current !== null) return;

      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      if (drainFrameRef.current !== null) {
        window.cancelAnimationFrame(drainFrameRef.current);
        drainFrameRef.current = null;
      }

      const configuredDuration = Math.max(1, holdToConfirm);
      const durationMs = reducedMotionRef.current
        ? Math.min(oryzeTokens.interaction.reducedMotionHoldMs, configuredDuration)
        : input.kind === "pointer" && input.pointerType === "touch"
          ? configuredDuration * oryzeTokens.interaction.touchHoldRatio
          : configuredDuration;
      const activeGesture: ActiveGesture = {
        ...input,
        startedAt: performance.now(),
        durationMs,
      };

      activeGestureRef.current = activeGesture;
      progressRef.current = 0;
      setHoldProgress(0);
      setLocalPhase("hold");
      setIsPressing(true);

      const tick = (now: number) => {
        const current = activeGestureRef.current;
        if (current === null) return;

        const nextProgress = Math.min(1, (now - current.startedAt) / current.durationMs);
        progressRef.current = nextProgress;
        setHoldProgress(nextProgress);

        if (nextProgress >= 1) {
          finishGesture();
        } else {
          animationFrameRef.current = window.requestAnimationFrame(tick);
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    },
    [finishGesture, holdToConfirm, isUnavailable],
  );

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || isUnavailable) return;

    if (holdToConfirm === undefined) {
      setIsPressing(true);
      return;
    }

    startGesture({
      kind: "pointer",
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      originX: event.clientX,
      originY: event.clientY,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (holdToConfirm === undefined) {
      setIsPressing(false);
      return;
    }

    const activeGesture = activeGestureRef.current;
    if (activeGesture?.kind === "pointer" && activeGesture.pointerId === event.pointerId) {
      cancelGesture();
    } else if (activeGesture === null) {
      setIsPressing(false);
    }
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    setIsHovering(false);
    if (holdToConfirm === undefined) {
      setIsPressing(false);
      return;
    }

    const activeGesture = activeGestureRef.current;
    if (activeGesture?.kind === "pointer" && activeGesture.pointerId === event.pointerId) {
      cancelGesture();
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const activeGesture = activeGestureRef.current;
    if (
      activeGesture?.kind !== "pointer" ||
      activeGesture.pointerId !== event.pointerId
    ) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - activeGesture.originX,
      event.clientY - activeGesture.originY,
    );
    if (distance > cancelDistance) cancelGesture();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    const activeGesture = activeGestureRef.current;
    if (activeGesture?.kind === "pointer" && activeGesture.pointerId === event.pointerId) {
      cancelGesture();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (holdToConfirm === undefined || (event.key !== " " && event.key !== "Enter")) return;
    if (event.repeat) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    startGesture({ kind: "keyboard", key: event.key });
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (holdToConfirm === undefined || (event.key !== " " && event.key !== "Enter")) return;
    event.preventDefault();

    const activeGesture = activeGestureRef.current;
    if (activeGesture?.kind === "keyboard" && activeGesture.key === event.key) {
      cancelGesture();
    }
  };

  const handleBlur = () => {
    setIsHovering(false);
    setIsPressing(false);
    if (activeGestureRef.current !== null) cancelGesture();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (holdToConfirm === undefined) {
      callbackRef.current.onClick?.();
      return;
    }

    // Assistive technology activates a native button with a detail=0 click.
    // Preserve that activation path while ignoring the synthetic click after a pointer hold.
    if (event.detail === 0 && !isUnavailable && activeGestureRef.current === null) {
      event.preventDefault();
      progressRef.current = 1;
      setHoldProgress(1);
      setLocalPhase(phasePropRef.current === undefined ? "done" : "working");
      triggerCompletedAction();
      return;
    }

    event.preventDefault();
  };

  const classes = [
    "oryze-button",
    `oryze-button--${variant}`,
    `oryze-button--${size}`,
    fullWidth ? "oryze-button--full-width" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const showHoldMark = holdToConfirm !== undefined;
  const leadingIcon = loading && !showHoldMark ? <span aria-hidden="true" className="oryze-button__spinner" /> : iconLeft;

  return (
    <button
      {...nativeProps}
      aria-busy={isBusy || undefined}
      className={classes}
      data-hovering={isHovering ? "true" : "false"}
      data-phase={visiblePhase}
      data-pressing={isPressing || visiblePhase === "hold" ? "true" : "false"}
      disabled={isNativeDisabled}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setIsHovering(true);
      }}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={setButtonRef}
      style={style}
      type={type}
    >
      {showHoldMark ? (
        <span aria-hidden="true" className="oryze-button__mark">
          <OryzeRing progress={ringProgress} size={22} variant="outline" />
        </span>
      ) : null}
      {leadingIcon ? <span aria-hidden="true" className="oryze-button__icon">{leadingIcon}</span> : null}
      <span className="oryze-button__label">{children}</span>
      {showHoldMark ? (
        <span aria-hidden="true" className="oryze-button__hint">
          {getHoldHint(visiblePhase)}
        </span>
      ) : null}
      {iconRight ? <span aria-hidden="true" className="oryze-button__icon">{iconRight}</span> : null}
    </button>
  );
}
