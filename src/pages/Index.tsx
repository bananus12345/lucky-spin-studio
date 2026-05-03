import { useEffect, useMemo, useRef, useState } from "react";

type Color = "red" | "black" | "green";
type Spin = { color: Color; number: number; id: number };

const SPIN_MS = 5000;
const TILE_W = 96; // px (w-24)
const REEL_LEN = 60;
const WIN_INDEX = REEL_LEN - 8;

const colorClass = (c: Color) =>
  c === "red" ? "ball-red" : c === "black" ? "ball-black" : "ball-green";

const randomNum = (c: Color) =>
  c === "green" ? 0 : 1 + Math.floor(Math.random() * 14);

const randomColor = (): Color => {
  const r = Math.random();
  if (r < 1 / 15) return "green";
  return Math.random() < 0.5 ? "red" : "black";
};

function buildReel(winner: Color, winnerNum: number): Spin[] {
  const tiles: Spin[] = [];
  for (let i = 0; i < REEL_LEN; i++) {
    if (i === WIN_INDEX) {
      tiles.push({ color: winner, number: winnerNum, id: i });
    } else {
      const c = randomColor();
      tiles.push({ color: c, number: randomNum(c), id: i });
    }
  }
  return tiles;
}

const PinGate = ({ onOk }: { onOk: () => void }) => {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("rb_pin_ok") === "1") onOk();
  }, [onOk]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "4571") {
      sessionStorage.setItem("rb_pin_ok", "1");
      onOk();
    } else {
      setErr(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl"
      >
        <h1 className="text-2xl font-bold mb-2 text-foreground">Enter PIN</h1>
        <p className="text-muted-foreground text-sm mb-6">Access required</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setErr(false);
          }}
          className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-ring"
          placeholder="••••"
          maxLength={4}
        />
        {err && (
          <p className="text-destructive text-sm mt-3 text-center">Wrong PIN</p>
        )}
        <button
          type="submit"
          className="w-full mt-6 bg-primary text-primary-foreground font-semibold rounded-lg py-3 hover:opacity-90 transition"
        >
          Unlock
        </button>
      </form>
    </div>
  );
};

const Index = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [reel, setReel] = useState<Spin[]>(() => buildReel("red", 1));
  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<Spin[]>([]);
  const [winnerFlash, setWinnerFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cycleRef = useRef(0);

  const counts = useMemo(() => {
    const c = { red: 0, black: 0, green: 0 };
    history.forEach((h) => c[h.color]++);
    return c;
  }, [history]);

  const spin = (forced: Color) => {
    if (spinning) return;
    const winnerNum = randomNum(forced);
    const newReel = buildReel(forced, winnerNum);
    setReel(newReel);
    setWinnerFlash(false);

    const containerW = containerRef.current?.clientWidth ?? 800;
    const jitter = (Math.random() - 0.5) * (TILE_W * 0.4);
    const target =
      WIN_INDEX * TILE_W + TILE_W / 2 - containerW / 2 + jitter;

    // reset to 0 instantly then animate to target
    cycleRef.current += 1;
    const cycle = cycleRef.current;
    setOffset(0);
    setSpinning(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cycleRef.current !== cycle) return;
        setOffset(target);
      });
    });

    window.setTimeout(() => {
      if (cycleRef.current !== cycle) return;
      setSpinning(false);
      setWinnerFlash(true);
      setHistory((h) => [
        { color: forced, number: winnerNum, id: Date.now() },
        ...h,
      ].slice(0, 20));
    }, SPIN_MS + 50);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!unlocked) return;
      const k = e.key.toLowerCase();
      if (k === "o") spin("red");
      else if (k === "p") spin("black");
      else if (k === "l") spin("green");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlocked, spinning]);

  if (!unlocked) return <PinGate onOk={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Red · Black · Green
          </h1>
        </header>

        {/* Reel */}
        <div className="relative bg-card border border-border rounded-2xl p-6 shadow-2xl overflow-hidden">
          <div
            ref={containerRef}
            className="relative h-28 overflow-hidden rounded-xl"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--card)) 0%, transparent 12%, transparent 88%, hsl(var(--card)) 100%)",
            }}
          >
            {/* center pointer */}
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 bg-primary z-10 pointer-events-none" />
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary z-10" />

            <div
              className="flex h-full items-center"
              style={{
                transform: `translateX(${-offset}px)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.25, 1)`
                  : "none",
                willChange: "transform",
              }}
            >
              {reel.map((t, i) => (
                <div
                  key={t.id + "_" + i}
                  className="shrink-0 px-1"
                  style={{ width: TILE_W }}
                >
                  <div
                    className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white font-bold text-2xl ${colorClass(
                      t.color
                    )} ${
                      !spinning && winnerFlash && i === WIN_INDEX
                        ? "animate-winner"
                        : ""
                    }`}
                  >
                    {t.number}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              disabled={spinning}
              onClick={() => spin("red")}
              className={`ball-red w-20 h-20 rounded-full text-white font-bold text-xl transition-transform ${
                spinning ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
              }`}
              aria-label="Red"
            />
            <button
              disabled={spinning}
              onClick={() => spin("black")}
              className={`ball-black w-20 h-20 rounded-full transition-transform ${
                spinning ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
              }`}
              aria-label="Black"
            />
            <button
              disabled={spinning}
              onClick={() => spin("green")}
              className={`ball-green w-20 h-20 rounded-full transition-transform ${
                spinning ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
              }`}
              aria-label="Green"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="ball-red w-10 h-10 rounded-full mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">×{counts.red}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="ball-black w-10 h-10 rounded-full mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">×{counts.black}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="ball-green w-10 h-10 rounded-full mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">×{counts.green}</div>
          </div>
        </div>

        {/* History */}
        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Recent
          </h2>
          <div className="flex flex-wrap gap-2 min-h-[3rem]">
            {history.length === 0 && (
              <span className="text-muted-foreground text-sm">No spins yet</span>
            )}
            {history.map((h) => (
              <div
                key={h.id}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${colorClass(
                  h.color
                )} animate-pop`}
              >
                {h.number}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
