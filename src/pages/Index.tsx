import { useEffect, useState, useCallback } from "react";

type Color = "red" | "black" | "green";
type Spin = { color: Color; number: number | null; id: number };

const randomNum = () => Math.floor(Math.random() * 14) + 1;

const Index = () => {
  const [current, setCurrent] = useState<Spin | null>(null);
  const [history, setHistory] = useState<Spin[]>([]);
  const [spinning, setSpinning] = useState(false);

  const spin = useCallback((color: Color) => {
    setSpinning(true);
    const result: Spin = {
      color,
      number: color === "green" ? null : randomNum(),
      id: Date.now() + Math.random(),
    };
    setTimeout(() => {
      setCurrent(result);
      setHistory((h) => [result, ...h].slice(0, 14));
      setSpinning(false);
    }, 600);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (spinning) return;
      const k = e.key.toLowerCase();
      if (k === "o") spin("red");
      else if (k === "p") spin("black");
      else if (k === "l") spin("green");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spin, spinning]);

  const tileClass = (c: Color) =>
    c === "red"
      ? "bg-gradient-to-br from-[hsl(8_88%_58%)] to-[hsl(8_88%_45%)]"
      : c === "black"
      ? "bg-gradient-to-br from-[hsl(222_30%_28%)] to-[hsl(222_30%_15%)]"
      : "bg-gradient-to-br from-[hsl(152_70%_48%)] to-[hsl(152_70%_32%)]";

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

        {/* Wheel strip */}
        <div className="relative bg-secondary/40 rounded-2xl p-3 border border-border mb-5 overflow-hidden">
          <div className={`flex gap-2 ${spinning ? "animate-spin-strip" : ""}`}>
            {(spinning
              ? Array.from({ length: 7 }, (_, i) => ({
                  color: (["red", "black", "green", "red", "black", "red", "black"] as Color[])[i],
                  number: randomNum(),
                  id: i,
                }))
              : current
              ? [current]
              : []
            ).map((s, i) => (
              <div
                key={s.id}
                className={`${tileClass(s.color)} flex-1 min-w-[60px] h-20 rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg ${
                  !spinning && i === 0 ? "ring-2 ring-primary ring-offset-2 ring-offset-card animate-pop" : ""
                }`}
              >
                {s.number ?? "G"}
              </div>
            ))}
            {!current && !spinning && (
              <div className="flex-1 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                Press to spin
              </div>
            )}
          </div>
          {/* center indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-primary/60 pointer-events-none" />
        </div>

        {/* Color buttons */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            onClick={() => spin("red")}
            disabled={spinning}
            className="group relative bg-secondary/60 hover:bg-secondary border border-border hover:border-[hsl(8_88%_55%)] rounded-xl py-3 px-4 transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(8_88%_55%)]" />
              <span className="font-semibold">Red</span>
              <span className="text-muted-foreground text-sm">x2</span>
            </div>
          </button>
          <button
            onClick={() => spin("black")}
            disabled={spinning}
            className="group relative bg-secondary/60 hover:bg-secondary border border-border hover:border-foreground/30 rounded-xl py-3 px-4 transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(222_30%_30%)] border border-foreground/20" />
              <span className="font-semibold">Black</span>
              <span className="text-muted-foreground text-sm">x2</span>
            </div>
          </button>
          <button
            onClick={() => spin("green")}
            disabled={spinning}
            className="group relative bg-secondary/60 hover:bg-secondary border border-border hover:border-[hsl(152_70%_42%)] rounded-xl py-3 px-4 transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[hsl(152_70%_42%)]" />
              <span className="font-semibold">Green</span>
              <span className="text-muted-foreground text-sm">x14</span>
            </div>
          </button>
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
                {s.number ?? "G"}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
