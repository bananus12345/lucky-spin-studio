import { useEffect, useState, useCallback } from "react";

type Color = "red" | "black" | "green";
type Spin = { color: Color; number: number | null; id: number };

const randomNum = () => Math.floor(Math.random() * 14) + 1;

const Index = () => {
  const [current, setCurrent] = useState<Spin | null>(null);
  const [history, setHistory] = useState<Spin[]>([]);

  const spin = useCallback((color: Color) => {
    const result: Spin = {
      color,
      number: color === "green" ? null : randomNum(),
      id: Date.now() + Math.random(),
    };
    setCurrent(result);
    setHistory((h) => [result, ...h].slice(0, 12));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "o") spin("red");
      else if (k === "p") spin("black");
      else if (k === "l") spin("green");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [spin]);

  const ballClass = (c: Color) =>
    c === "red" ? "ball-red" : c === "black" ? "ball-black" : "ball-green";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Roulette Keys
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Wciśnij klawisz, żeby zakręcić. Zielony pojawia się tylko ręcznie i nigdy nie wypada losowo.
        </p>
      </header>

      <section className="w-full max-w-md bg-card border rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center h-48 mb-8">
          {current ? (
            <div
              key={current.id}
              className={`${ballClass(current.color)} animate-pop w-40 h-40 rounded-full flex items-center justify-center`}
            >
              <span className="text-5xl font-black text-white drop-shadow-lg">
                {current.number ?? "—"}
              </span>
            </div>
          ) : (
            <div className="w-40 h-40 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              Naciśnij O / P / L
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => spin("red")}
            className="ball-red text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform"
          >
            <span className="key-cap mr-2">O</span>
            Red
          </button>
          <button
            onClick={() => spin("black")}
            className="ball-black text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform"
          >
            <span className="key-cap mr-2">P</span>
            Black
          </button>
          <button
            onClick={() => spin("green")}
            className="ball-green text-white font-bold py-4 rounded-xl hover:scale-105 transition-transform"
          >
            <span className="key-cap mr-2">L</span>
            Green
          </button>
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Recent spins
          </h2>
          <div className="flex gap-2 flex-wrap min-h-[3rem]">
            {history.length === 0 && (
              <span className="text-sm text-muted-foreground">Brak — zakręć kołem.</span>
            )}
            {history.map((s) => (
              <div
                key={s.id}
                className={`${ballClass(s.color)} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm`}
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
