import { useCallback, useRef, useState } from "react";
import { ChevronLeft, MoreHorizontal, Share } from "lucide-react";
import { IOSKeyboard } from "./IOSKeyboard";
import { FlowSheet } from "./FlowSheet";
import { useDictation } from "../hooks/useDictation";

const INITIAL = "";

export function PhoneMock({
  onMockNotice,
}: {
  onMockNotice: (mocked: boolean) => void;
}) {
  const [text, setText] = useState(INITIAL);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const selRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const rememberSelection = () => {
    const el = areaRef.current;
    if (!el) return;
    selRef.current = {
      start: el.selectionStart ?? text.length,
      end: el.selectionEnd ?? text.length,
    };
  };

  const applyEdit = useCallback(
    (transform: (before: string, sel: string, after: string) => [string, number]) => {
      setText((cur) => {
        const el = areaRef.current;
        const start = el?.selectionStart ?? selRef.current.start ?? cur.length;
        const end = el?.selectionEnd ?? selRef.current.end ?? cur.length;
        const before = cur.slice(0, start);
        const sel = cur.slice(start, end);
        const after = cur.slice(end);
        const [next, caret] = transform(before, sel, after);
        requestAnimationFrame(() => {
          const node = areaRef.current;
          if (node) {
            node.focus();
            node.setSelectionRange(caret, caret);
            selRef.current = { start: caret, end: caret };
          }
        });
        return next;
      });
    },
    [],
  );

  const insert = useCallback(
    (chunk: string) =>
      applyEdit((before, _sel, after) => [
        before + chunk + after,
        before.length + chunk.length,
      ]),
    [applyEdit],
  );

  const backspace = useCallback(
    () =>
      applyEdit((before, sel, after) => {
        if (sel) return [before + after, before.length];
        return [before.slice(0, -1) + after, Math.max(0, before.length - 1)];
      }),
    [applyEdit],
  );

  const dictation = useDictation({
    getContext: () => text,
    onResult: (result, mocked) => {
      onMockNotice(mocked);
      const needsSpace = text.length > 0 && !/\s$/.test(text.slice(0, selRef.current.start));
      insert((needsSpace ? " " : "") + result);
    },
  });

  const flowActive =
    dictation.status === "recording" ||
    dictation.status === "transcribing" ||
    dictation.status === "requesting";

  const toggleFlow = () => {
    rememberSelection();
    if (dictation.status === "recording") dictation.stop();
    else void dictation.start();
  };

  return (
    <div className="relative mx-auto w-[360px] max-w-full">
      {/* device shell */}
      <div className="relative overflow-hidden rounded-[46px] bg-black p-[10px] shadow-[0_40px_80px_-20px_rgba(80,60,220,0.45),0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className="relative h-[720px] overflow-hidden rounded-[38px] bg-white">
          {/* dynamic island */}
          <div className="absolute left-1/2 top-2 z-30 h-[26px] w-[95px] -translate-x-1/2 rounded-full bg-black" />

          {/* status bar */}
          <div className="flex items-center justify-between px-7 pt-3 text-[13px] font-semibold text-black">
            <span>9:41</span>
            <span className="flex items-center gap-1 text-black/80">
              <span className="tracking-tight">Flow</span>
            </span>
          </div>

          {/* notes app header */}
          <div className="mt-2 flex items-center justify-between border-b border-black/5 px-4 pb-2">
            <button className="flex items-center text-[#f59e0b]">
              <ChevronLeft className="h-6 w-6" />
              <span className="text-[15px]">Notes</span>
            </button>
            <div className="flex items-center gap-4 text-[#f59e0b]">
              <Share className="h-[18px] w-[18px]" />
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </div>
          </div>

          {/* editor */}
          <div className="px-4 pt-3">
            <p className="text-[12px] text-black/35">
              14 July 2026 at 9:41
            </p>
            <textarea
              ref={areaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onSelect={rememberSelection}
              onKeyUp={rememberSelection}
              onClick={rememberSelection}
              placeholder="Tap the purple key and just talk…"
              spellCheck={false}
              className="no-scrollbar mt-2 h-[300px] w-full resize-none bg-transparent text-[17px] leading-relaxed text-black outline-none placeholder:text-black/25"
            />
          </div>

          {/* keyboard docked to bottom */}
          <div className="absolute inset-x-0 bottom-0">
            {!flowActive && (
              <IOSKeyboard
                onKey={insert}
                onBackspace={backspace}
                onReturn={() => insert("\n")}
                onFlow={toggleFlow}
                flowStatus={dictation.status}
              />
            )}
            {flowActive && (
              <FlowSheet
                status={dictation.status}
                levels={dictation.levels}
                elapsed={dictation.elapsed}
                onStop={dictation.stop}
                onCancel={dictation.cancel}
              />
            )}
          </div>

          {dictation.status === "error" && (
            <div className="absolute inset-x-4 bottom-4 z-40 rounded-xl bg-red-500 px-4 py-3 text-[13px] text-white shadow-lg">
              {dictation.error}
              <button
                className="ml-2 underline"
                onClick={dictation.reset}
              >
                dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
