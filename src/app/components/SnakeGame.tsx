"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SnakeGameProps {
  roomId: string;
  duration: number;
  startTime?: string | null;
}

// Classic Nokia Snake settings
const GRID_SIZE = 20;
const CELL_SIZE = 25;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const GAME_SPEED = 150;

// Obstacles
const OBSTACLES: Position[] = [
  { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 2 },
  { x: 16, y: 2 }, { x: 17, y: 2 }, { x: 17, y: 3 },
  { x: 2, y: 16 }, { x: 2, y: 17 }, { x: 3, y: 17 },
  { x: 17, y: 16 }, { x: 16, y: 17 }, { x: 17, y: 17 },
  { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 3 }, { x: 4, y: 4 },
  { x: 15, y: 3 }, { x: 15, y: 4 }, { x: 16, y: 3 }, { x: 16, y: 4 },
  { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 10, y: 4 }, { x: 11, y: 3 },
  { x: 9, y: 4 }, { x: 11, y: 4 },
  { x: 3, y: 15 }, { x: 3, y: 16 }, { x: 4, y: 15 }, { x: 4, y: 16 },
  { x: 15, y: 15 }, { x: 15, y: 16 }, { x: 16, y: 15 }, { x: 16, y: 16 },
  { x: 9, y: 15 }, { x: 10, y: 15 }, { x: 11, y: 15 },
  { x: 9, y: 16 }, { x: 10, y: 16 }, { x: 11, y: 16 },
  { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 2, y: 12 }, { x: 2, y: 13 },
  { x: 17, y: 6 }, { x: 17, y: 7 }, { x: 17, y: 12 }, { x: 17, y: 13 },
];

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface Position {
  x: number;
  y: number;
}

export default function SnakeGame({
  roomId,
  duration,
  startTime,
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const directionRef = useRef<Direction>("RIGHT");
  const pendingDirectionRef = useRef<Direction | null>(null);
  const directionChangedRef = useRef<boolean>(false);

  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [leaderboardHighScore, setLeaderboardHighScore] = useState<number>(0);
  const [, setTimeLeft] = useState<number>(0);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      ) ||
      OBSTACLES.some((obs) => obs.x === newFood.x && obs.y === newFood.y)
    );
    return newFood;
  }, []);

  const checkCollision = useCallback(
    (head: Position, body: Position[]): boolean => {
      if (OBSTACLES.some((obs) => obs.x === head.x && obs.y === head.y)) {
        return true;
      }
      return body.some(
        (segment) => segment.x === head.x && segment.y === head.y
      );
    },
    []
  );

  const updateGame = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake((prevSnake) => {
      if (pendingDirectionRef.current) {
        const pendingDir = pendingDirectionRef.current;
        const currentDir = directionRef.current;
        const isValid =
          (currentDir === "UP" && pendingDir !== "DOWN") ||
          (currentDir === "DOWN" && pendingDir !== "UP") ||
          (currentDir === "LEFT" && pendingDir !== "RIGHT") ||
          (currentDir === "RIGHT" && pendingDir !== "LEFT");

        if (isValid) {
          directionRef.current = pendingDir;
        }
        pendingDirectionRef.current = null;
        directionChangedRef.current = true;
      } else {
        directionChangedRef.current = false;
      }

      const dir = directionRef.current;
      const head = { ...prevSnake[0] };

      switch (dir) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      if (head.x < 0) {
        head.x = GRID_SIZE - 1;
      } else if (head.x >= GRID_SIZE) {
        head.x = 0;
      }
      if (head.y < 0) {
        head.y = GRID_SIZE - 1;
      } else if (head.y >= GRID_SIZE) {
        head.y = 0;
      }

      if (checkCollision(head, prevSnake)) {
        setGameOver(true);
        return prevSnake;
      }

      const ateFood = head.x === food.x && head.y === food.y;
      const newSnake = [head, ...prevSnake];

      if (!ateFood) {
        newSnake.pop();
      } else {
        setScore((prev) => prev + 10);
        setFood(generateFood(newSnake));
      }

      return newSnake;
    });
  }, [gameOver, isPaused, food, checkCollision, generateFood]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = "#666666";
    OBSTACLES.forEach((obs) => {
      ctx.fillRect(
        obs.x * CELL_SIZE + 1,
        obs.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );

    snake.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = "#4ade80";
      } else {
        ctx.fillStyle = "#22c55e";
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 2,
        segment.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    });

    if (gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GAME OVER", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 40);
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      ctx.fillText(
        `High: ${leaderboardHighScore}`,
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2 + 30
      );
    }

    if (isPaused && !gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }
  }, [snake, food, gameOver, isPaused, score, leaderboardHighScore]);

  const handleDirectionChange = useCallback(
    (newDir: Direction) => {
      if (gameOver || isPaused) return;

      const currentDir = directionRef.current;
      const isValid =
        (currentDir === "UP" && newDir !== "DOWN") ||
        (currentDir === "DOWN" && newDir !== "UP") ||
        (currentDir === "LEFT" && newDir !== "RIGHT") ||
        (currentDir === "RIGHT" && newDir !== "LEFT");

      if (isValid && newDir !== currentDir && !directionChangedRef.current) {
        pendingDirectionRef.current = newDir;
      }
    },
    [gameOver, isPaused]
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.key === " ") {
        setIsPaused((prev) => !prev);
        return;
      }

      if (gameOver || isPaused) return;

      let newDir: Direction | null = null;
      switch (e.key) {
        case "ArrowUp":
          newDir = "UP";
          break;
        case "ArrowDown":
          newDir = "DOWN";
          break;
        case "ArrowLeft":
          newDir = "LEFT";
          break;
        case "ArrowRight":
          newDir = "RIGHT";
          break;
      }

      if (newDir) {
        handleDirectionChange(newDir);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameOver, isPaused, handleDirectionChange]);

  useEffect(() => {
    const gameLoop = () => {
      updateGame();
      draw();
      gameLoopRef.current = setTimeout(gameLoop, GAME_SPEED);
    };

    gameLoopRef.current = setTimeout(gameLoop, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
      }
    };
  }, [updateGame, draw]);

  useEffect(() => {
    if (!startTime || gameOver) return;

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(startTime).getTime();
      const elapsed = Math.floor((now.getTime() - start) / 1000);
      const remaining = duration * 60 - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        setGameOver(true);
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, duration, gameOver]);

  useEffect(() => {
    const fetchUserHighestScore = async () => {
      try {
        const response = await fetch(
          `/api/games/user-highest-score?roomId=${roomId}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setLeaderboardHighScore(data.highestScore || 0);
        }
      } catch (error) {
        console.error("Failed to fetch user highest score:", error);
      }
    };

    const interval = setInterval(fetchUserHighestScore, 3000);
    fetchUserHighestScore();

    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    if (gameOver || score === 0 || isPaused) return;

    const saveScore = async () => {
      try {
        await fetch("/api/games/save-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            score: score,
            isFinal: false,
          }),
        });
      } catch (error) {
        console.error("Failed to save score:", error);
      }
    };

    const interval = setInterval(saveScore, 5000);
    return () => clearInterval(interval);
  }, [roomId, score, gameOver, isPaused]);

  useEffect(() => {
    if (!gameOver || score === 0) return;

    const saveFinalScore = async () => {
      try {
        await fetch("/api/games/save-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            score: score,
            isFinal: true,
          }),
        });
        const response = await fetch(
          `/api/games/user-highest-score?roomId=${roomId}`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          setLeaderboardHighScore(data.highestScore || 0);
        }
      } catch (error) {
        console.error("Failed to save final score:", error);
      }
    };

    saveFinalScore();
  }, [gameOver, score, roomId]);

  const handleRestart = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]);
    directionRef.current = "RIGHT";
    pendingDirectionRef.current = null;
    directionChangedRef.current = false;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setFood(
      generateFood([
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ])
    );
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          window.innerWidth < 768
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center bg-black ${
        isMobile ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      {isMobile ? (
        <div className="py-1 px-2 text-white text-center w-full">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div>Score: {score}</div>
            <div>High: {leaderboardHighScore}</div>
          </div>
        </div>
      ) : (
        <div className="mb-4 text-white text-center w-full px-4">
          <div className="text-3xl font-bold mb-2">SNAKE</div>
          <div className="flex gap-6 justify-center text-xl flex-wrap">
            <div>Score: {score}</div>
            <div>High: {leaderboardHighScore}</div>
          </div>
        </div>
      )}

      <div className={`shrink-0 ${isMobile ? "my-1" : ""}`}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className={
            isMobile ? "border-2 border-gray-800" : "border-4 border-gray-800"
          }
          style={{
            imageRendering: "pixelated",
            ...(isMobile
              ? {
                  width: "90vw",
                  height: "auto",
                  maxHeight: "45vh",
                }
              : {
                  maxWidth: "100vw",
                  maxHeight: "50vh",
                }),
          }}
        />
      </div>

      {isMobile && (
        <div className="mt-6 w-full max-w-md px-4">
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => handleDirectionChange("UP")}
              className="w-14 h-14 bg-gray-700 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold select-none"
              style={{
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              }}
            >
              ↑
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDirectionChange("LEFT")}
                className="w-14 h-14 bg-gray-700 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold select-none"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                ←
              </button>
              <button
                onClick={() => setIsPaused((prev) => !prev)}
                className="w-14 h-14 bg-yellow-600 active:bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xs font-bold select-none"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                ⏸
              </button>
              <button
                onClick={() => handleDirectionChange("RIGHT")}
                className="w-14 h-14 bg-gray-700 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold select-none"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  userSelect: "none",
                }}
              >
                →
              </button>
            </div>
            <button
              onClick={() => handleDirectionChange("DOWN")}
              className="w-14 h-14 bg-gray-700 active:bg-gray-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold select-none"
              style={{
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              }}
            >
              ↓
            </button>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="mt-4 text-white text-center px-4">
          <p className="mb-2 text-sm">
            Use arrow keys to move • Space to pause
          </p>
          {gameOver && (
            <button
              onClick={handleRestart}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-bold mt-2"
            >
              Play Again
            </button>
          )}
        </div>
      )}

      {isMobile && gameOver && (
        <div className="pb-2">
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-green-600 active:bg-green-500 rounded text-white text-sm font-bold"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

