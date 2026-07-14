import { useState } from "react";
import { ArrowBigUp, Delete, Globe } from "lucide-react";
import { FlowButton } from "./FlowButton";
import type { DictationStatus } from "../hooks/useDictation";

interface IOSKeyboardProps {
  onKey: (char: string) => void;
  onBackspace: () => void;
  onReturn: () => void;
  onFlow: () => void;
  flowStatus: DictationStatus;
}

const LETTER_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

const NUMBER_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'],
  [".", ",", "?", "!", "'"],
];

const SYMBOL_ROWS = [
  ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
  ["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"],
  [".", ",", "?", "!", "'"],
];

type Mode = "letters" | "numbers" | "symbols";

/** A key with the signature iOS white cap + hairline drop shadow. */
function Cap({
  children,
  onPress,
  variant = "light",
  flex,
  wide,
  ariaLabel,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "light" | "dark";
  flex?: number;
  wide?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      style={{ flex: flex ?? (wide ? 1.5 : 1) }}
      className={[
        "flex h-[42px] select-none items-center justify-center rounded-[6px]",
        "text-[17px] font-normal text-black/90 active:opacity-60",
        "shadow-[0_1px_0_rgba(0,0,0,0.28)] transition-opacity",
        variant === "light" ? "bg-white" : "bg-[#adb4bf] text-black/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function IOSKeyboard({
  onKey,
  onBackspace,
  onReturn,
  onFlow,
  flowStatus,
}: IOSKeyboardProps) {
  const [shift, setShift] = useState<"off" | "on" | "caps">("on");
  const [mode, setMode] = useState<Mode>("letters");

  const rows =
    mode === "letters"
      ? LETTER_ROWS
      : mode === "numbers"
        ? NUMBER_ROWS
        : SYMBOL_ROWS;

  const emit = (raw: string) => {
    if (mode === "letters") {
      const ch = shift === "off" ? raw : raw.toUpperCase();
      onKey(ch);
      if (shift === "on") setShift("off");
    } else {
      onKey(raw);
    }
  };

  return (
    <div className="w-full bg-[#d1d5db] px-[3px] pb-2 pt-2 font-sf">
      {/* letter / number rows */}
      <div className="flex flex-col gap-[11px]">
        {rows.map((row, ri) => {
          const isLastLetterRow = mode === "letters" && ri === 2;
          const isLastSymbolRow = mode !== "letters" && ri === 2;
          return (
            <div key={ri} className="flex items-stretch gap-[6px] px-[3px]">
              {isLastLetterRow && (
                <Cap
                  variant="dark"
                  wide
                  ariaLabel="shift"
                  onPress={() =>
                    setShift((s) =>
                      s === "off" ? "on" : s === "on" ? "caps" : "off",
                    )
                  }
                >
                  <ArrowBigUp
                    className={[
                      "h-6 w-6",
                      shift === "off"
                        ? "text-black/70"
                        : "fill-black/80 text-black/80",
                    ].join(" ")}
                    strokeWidth={1.75}
                  />
                </Cap>
              )}
              {isLastSymbolRow && (
                <Cap
                  variant="dark"
                  wide
                  onPress={() =>
                    setMode((m) => (m === "numbers" ? "symbols" : "numbers"))
                  }
                >
                  <span className="text-[15px]">
                    {mode === "numbers" ? "#+=" : "123"}
                  </span>
                </Cap>
              )}

              {ri === 1 && mode === "letters" && <div className="flex-[0.5]" />}
              {row.map((k) => (
                <Cap key={k} onPress={() => emit(k)}>
                  {mode === "letters" && shift !== "off" ? k.toUpperCase() : k}
                </Cap>
              ))}
              {ri === 1 && mode === "letters" && <div className="flex-[0.5]" />}

              {(isLastLetterRow || isLastSymbolRow) && (
                <Cap variant="dark" wide ariaLabel="backspace" onPress={onBackspace}>
                  <Delete className="h-6 w-6 text-black/70" strokeWidth={1.75} />
                </Cap>
              )}
            </div>
          );
        })}
      </div>

      {/* bottom function row with the Flow dictation button */}
      <div className="mt-[11px] flex items-stretch gap-[6px] px-[3px]">
        <Cap
          variant="dark"
          flex={1.4}
          onPress={() =>
            setMode((m) => (m === "letters" ? "numbers" : "letters"))
          }
        >
          <span className="text-[15px]">
            {mode === "letters" ? "123" : "ABC"}
          </span>
        </Cap>
        <Cap variant="dark" flex={1} ariaLabel="switch keyboard" onPress={() => {}}>
          <Globe className="h-5 w-5 text-black/70" strokeWidth={1.75} />
        </Cap>

        {/* Space bar */}
        <Cap flex={3.4} onPress={() => onKey(" ")}>
          <span className="text-[15px] text-black/45">space</span>
        </Cap>

        {/* Flow (dictation) — the star of the keyboard */}
        <FlowButton status={flowStatus} onClick={onFlow} />

        <Cap variant="dark" flex={1.9} onPress={onReturn}>
          <span className="text-[15px]">return</span>
        </Cap>
      </div>
    </div>
  );
}
