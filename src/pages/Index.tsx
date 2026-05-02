import { useEffect, useMemo, useState, useCallback, useRef } from "react";

type Color = "red" | "black" | "green";
type Spin = { color: Color; number: number | null; id: number };

const randomNum = () => Math.floor(Math.random() * 14) + 1;
const TILE_W = 88; // px (tile width + gap)
const REEL_LEN = 60; // total tiles in reel
const SPIN_MS = 5000;

// Build a reel of tiles. Force the tile at `winnerIdx` to be the chosen color.
const buildReel = (winnerColor: Color, winnerIdx: number): Spin[] => {
  const colors: Color[] = ["red", "black", "red", "black", "green", "red", "black"];
  return Array.from({ length: REEL_LEN }, (_, i) => {
    const c = i === winnerIdx ? winnerColor : colors[i % colors.length];
    return {
      color: c,
      number: c === "green" ? 0 : randomNum(),
      id: i,
    };
  });
};

const PinGate = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const press = (d: string) => {
    if (pin.length >= 4) return;
    setError(false);
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === "4571") onUnlock();
        else {
          setError(true);
          setPin("");
        }
      }, 150);
    }
  };

  const back = () => {
    setError(false);
    setPin((p) => p.slice(0, -1));
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-xs bg-card/80 backdrop-blur border border-border rounded-3xl p-6 shadow-2xl">
        <h1 className="text-center text-lg font-bold mb-1">Enter PIN</h1>
        <p className="text-center text-xs text-muted-foreground mb-5">
          Access required
        </p>
        <div className={`flex justify-center gap-3 mb-6 ${error ? "animate-pulse" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 ${
                error
                  ? "border-destructive bg-destructive"
                  : pin.length > i
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="h-14 rounded-xl bg-secondary/60 border border-border hover:bg-secondary text-lg font-semibold transition"
            >
              {d}
            </button>
          ))}
          <button onClick={back} className="h-14 rounded-xl bg-secondary/40 border border-border hover:bg-secondary text-sm">
            ⌫
          </button>
          <button
            onClick={() => press("0")}
            className="h-14 rounded-xl bg-secondary/60 border border-border hover:bg-secondary text-lg font-semibold"
          >
            0
          </button>
          <div />
        </div>
        {error && (
          <p className="text-center text-xs text-destructive mt-4">Wrong PIN</p>
        )}
      </section>
    </main>
  );
};

const Index = () => {
  const [unlocked, setUnlocked] = useState<boolean>(
    () => sessionStorage.getItem("pin_ok") === "1"
  );
  const [history, setHistory] = useState<Spin[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState<Spin[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [winner, setWinner] = useState<Spin | null>(null);
  const [containerW, setContainerW] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!unlocked) return;
    const update = () => setContainerW(containerRef.current?.clientWidth ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [unlocked]);

  const handleUnlock = useCallback(() => {
    sessionStorage.setItem("pin_ok", "1");
    setUnlocked(true);
  }, []);

  const spin = useCallback(
    (color: Color) => {
      if (spinning || !containerW) return;
      setSpinning(true);
      setWinner(null);

      // pick a winner index near the end so it spins for a while
      const winnerIdx = REEL_LEN - 8;
      const newReel = buildReel(color, winnerIdx);

      // Reset reel to start position (no transition) then animate
      setReel(newReel);
      setOffset(0);

      // Force layout flush, then animate to winner
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // small jitter so it doesn't always land dead-center
          const jitter = (Math.random() - 0.5) * (TILE_W * 0.3);
          const target =
            winnerIdx * TILE_W - containerW / 2 + TILE_W / 2 + jitter;
          setOffset(-target);
        });
      });

      setTimeout(() => {
        const result = newReel[winnerIdx];
        setWinner(result);
        setHistory((h) => [result, ...h].slice(0, 14));
        setSpinning(false);
      }, SPIN_MS + 50);
    },
    [spinning, containerW]
  );

  useEffect(() => {
    if (!unlocked) return;
    const handler = (e: KeyboardEvent) => {
      if (spinning) return;
      const k = e.key.toLowerCase();
      if (k === "o") spin("red");
      else if (k === "p") spin("black");
      else if (k === "l") spin("green");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spin, spinning, unlocked]);

  const tileClass = (c: Color) =>
    c === "red"
      ? "bg-gradient-to-br from-[hsl(8_88%_58%)] to-[hsl(8_88%_45%)]"
      : c === "black"
      ? "bg-gradient-to-br from-[hsl(222_30%_28%)] to-[hsl(222_30%_15%)]"
      : "bg-gradient-to-br from-[hsl(152_70%_48%)] to-[hsl(152_70%_32%)]";

  const displayReel = useMemo(() => reel ?? [], [reel]);

  if (!unlocked) return <PinGate onUnlock={handleUnlock} />;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl bg-card/80 backdrop-blur border border-border rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <span className="text-primary text-lg">⚙</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Roulette</h1>
          <div className="ml-auto px-4 py-1.5 rounded-full bg-secondary/60 border border-border text-sm">
            <span className="text-muted-foreground">Balance:</span>{" "}
            <span className="text-primary font-bold">91.00 $</span>
          </div>
        </div>

        {/* Reel */}
        <div
          ref={containerRef}
          className="relative bg-secondary/40 rounded-2xl p-3 border border-border mb-5 overflow-hidden h-[104px]"
        >
          {displayReel.length === 0 ? (
            <div className="h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
              Press O / P / L to spin
            </div>
          ) : (
            <div
              className="reel-track flex gap-2 absolute top-3 left-0"
              style={{
                transform: `translateX(${offset}px)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.25, 1)`
                  : "none",
              }}
            >
              {displayReel.map((s, i) => {
                const isWinner = !spinning && winner && i === REEL_LEN - 8;
                return (
                  <div
                    key={s.id}
                    className={`${tileClass(s.color)} w-20 h-20 rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0 ${
                      isWinner ? "ring-2 ring-primary animate-winner" : ""
                    }`}
                  >
                    {s.number}
                  </div>
                );
              })}
            </div>
          )}
          {/* center indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-primary/70 pointer-events-none z-10" />
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary z-10" />
        </div>

        {/* Color info (not clickable) */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-secondary/60 border border-border rounded-xl py-3 px-4">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(8_88%_55%)]" />
              <span className="font-semibold">Red</span>
              <span className="text-muted-foreground text-sm">x2</span>
            </div>
          </div>
          <div className="bg-secondary/60 border border-border rounded-xl py-3 px-4">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(222_30%_30%)] border border-foreground/20" />
              <span className="font-semibold">Black</span>
              <span className="text-muted-foreground text-sm">x2</span>
            </div>
          </div>
          <div className="bg-secondary/60 border border-border rounded-xl py-3 px-4">
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(152_70%_42%)]" />
              <span className="font-semibold">Green</span>
              <span className="text-muted-foreground text-sm">x14</span>
            </div>
          </div>
        </div>

        {/* Spin button */}
        <button
          onClick={() => spin(Math.random() < 0.5 ? "red" : "black")}
          disabled={spinning}
          className="w-full bg-gradient-to-b from-primary to-[hsl(32_100%_48%)] hover:brightness-110 text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all disabled:opacity-60 mb-5"
        >
          🎯 SPIN THE WHEEL
        </button>

        {/* Recent spins */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <span>📜</span> Recent Spins
          </h2>
          <div className="flex gap-2 flex-wrap min-h-[2.5rem]">
            {history.length === 0 && (
              <span className="text-sm text-muted-foreground">No spins yet.</span>
            )}
            {history.map((s) => (
              <div
                key={s.id}
                className={`${tileClass(s.color)} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}
              >
                {s.number}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
