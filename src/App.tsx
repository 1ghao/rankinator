import React, { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { RankedItem } from "./types";
import { processMatch } from "./utils/rankingSystem";
import { getNextMatchup } from "./utils/matchmaking";
import { cropAndCompressImages } from "./utils/imageUtils";

// ---- shared hooks ----
function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        setValue(JSON.parse(raw));
      }
    } catch (e) {
      console.error(`Failed to parse localStorage key "${key}"`, e);
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to write localStorage key "${key}"`, e);
    }
  }, [key, value, isHydrated]);

  const reset = () => {
    setValue(initialValue);
    window.localStorage.removeItem(key);
  };

  return { value, setValue, isHydrated, reset };
}

// ---- theme & styles ----
const COLORS = {
  bgGradient:
    "radial-gradient(circle at top left, #1f2933, #0b1120 55%, #020617 100%)",
  cardBg: "rgba(15, 23, 42, 0.75)",
  cardBorder: "rgba(148, 163, 184, 0.4)",
  accent: "#38bdf8",
  accentSoft: "rgba(56, 189, 248, 0.15)",
  textPrimary: "#e5e7eb",
  textSecondary: "#9ca3af",
  danger: "#f97373",
};

const pageWrapperStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundImage: COLORS.bgGradient,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "3rem 1.5rem",
  boxSizing: "border-box",
};

const pageStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "820px",
  margin: "0 auto",
  padding: "2rem 2.5rem",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(15,23,42,0.82))",
  boxShadow: "0 24px 60px rgba(15,23,42,0.9), 0 0 0 1px rgba(148,163,184,0.25)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  color: COLORS.textPrimary,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(148,163,184,0.4)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "2.5rem",
  gap: "1.5rem",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.8rem",
  letterSpacing: "0.03em",
};

const subtitleStyle: React.CSSProperties = {
  marginTop: "0.4rem",
  marginBottom: 0,
  color: COLORS.textSecondary,
  fontSize: "0.95rem",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.6rem 1.2rem",
  background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", // accent gradient
  color: "#0f172a",
  border: "none",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
  boxShadow: "0 10px 20px rgba(56,189,248,0.25)",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "transparent",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  boxShadow: "none",
  color: COLORS.textSecondary,
  fontSize: "0.85rem",
  padding: "0.5rem 1rem",
};

const dangerButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "linear-gradient(135deg, #f97373, #ef4444)",
  color: "#0f172a",
  boxShadow: "0 10px 20px rgba(248,113,113,0.35)",
};

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  marginBottom: "1.75rem",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.7rem 0.9rem",
  borderRadius: "999px",
  border: "1px solid rgba(148,163,184,0.6)",
  background: "rgba(15,23,42,0.9)",
  color: COLORS.textPrimary,
  fontSize: "0.9rem",
  outline: "none",
  boxShadow: "0 0 0 1px transparent",
} as const;

const helperTextStyle: React.CSSProperties = {
  marginTop: "0.2rem",
  marginBottom: "1.5rem",
  fontSize: "0.8rem",
  color: COLORS.textSecondary,
};

const cardRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  width: "100%",
  alignItems: "stretch",
};

const cardStyle: React.CSSProperties = {
  flex: 1,
  padding: "1.9rem 1.4rem",
  fontSize: "1.25rem",
  background: COLORS.cardBg,
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: "18px",
  cursor: "pointer",
  transition:
    "transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.12s ease-out, background 0.12s ease-out",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "0 16px 40px rgba(15,23,42,0.75)",
};

const cardHoverStyle: React.CSSProperties = {
  transform: "translateY(-2px)",
  boxShadow: "0 22px 60px rgba(15,23,42,0.95)",
  borderColor: COLORS.accent,
  background:
    "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(15,23,42,0.75))",
};

const subTextStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: COLORS.textSecondary,
  marginTop: "0.6rem",
};

const drawButtonStyle: React.CSSProperties = {
  padding: "0.75rem 1.4rem",
  background:
    "radial-gradient(circle at 0 0, rgba(148,163,184,0.35), rgba(148,163,184,0.15))",
  color: COLORS.textPrimary,
  border: "1px solid rgba(148,163,184,0.7)",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const skipButtonStyle: React.CSSProperties = {
  marginTop: "0.4rem",
  background: "transparent",
  border: "none",
  textDecoration: "underline",
  cursor: "pointer",
  color: COLORS.textSecondary,
  fontSize: "0.8rem",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1.1rem",
  marginBottom: "0.6rem",
};

const leaderboardListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  borderRadius: "14px",
  border: "1px solid rgba(148,163,184,0.35)",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.7))",
  overflow: "hidden",
};

const leaderboardItemStyle: React.CSSProperties = {
  padding: "0.7rem 1rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "0.9rem",
};

const leaderboardTopStyle: React.CSSProperties = {
  ...leaderboardItemStyle,
  background:
    "linear-gradient(90deg, rgba(56,189,248,0.08), rgba(56,189,248,0))",
  borderBottom: "1px solid rgba(148,163,184,0.35)",
};

const rankBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "26px",
  height: "26px",
  borderRadius: "999px",
  border: "1px solid rgba(148,163,184,0.7)",
  marginRight: "0.5rem",
  fontSize: "0.8rem",
};

const rankBadgeTopStyle: React.CSSProperties = {
  ...rankBadgeStyle,
  border: "none",
  background: "radial-gradient(circle at 30% 0, #fde68a, #f59e0b)",
  color: "#0f172a",
  fontWeight: 700,
};

const emptyStateStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  fontSize: "0.85rem",
  color: COLORS.textSecondary,
};

// ---- subcomponents ----
type InputSectionProps = {
  textValue: string;
  onTextChange: (v: string) => void;
  imageValue: string | null;
  onImageChange: (v: string | null) => void;
  onSubmit: () => void;
};

function InputSection({
  textValue,
  onTextChange,
  imageValue,
  onImageChange,
  onSubmit,
}: InputSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const disabled = !textValue.trim();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await cropAndCompressImages(e.target.files[0]);
        onImageChange(compressed);
      } catch (err) {
        console.error("Image processing failed", err);
      }
    }
  };

  return (
    <>
      <div style={inputRowStyle}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
        <div style={{ position: "relative", flex: 1, display: "flex" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "absolute",
              left: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "32px",
              height: "32px",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              background: imageValue
                ? `url(${imageValue}) center/cover`
                : "rgba(255,255,255,0.1)",
              color: imageValue ? "transparent" : "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              fontSize: "1.2rem",
              textAlign: "center",
              lineHeight: 0,
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!imageValue) {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "#e2e8f0";
              }
            }}
            onMouseLeave={(e) => {
              if (!imageValue) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#94a3b8";
              }
            }}
            title="Add image"
          >
            {!imageValue && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </button>

          <input
            style={{ ...inputStyle, paddingLeft: "48px" }}
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Add item name..."
            onKeyDown={(e) => e.key === "Enter" && !disabled && onSubmit()}
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={disabled}
          style={{
            ...primaryButtonStyle,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          + Add
        </button>
      </div>
      {imageValue ? (
        <div
          style={{
            ...helperTextStyle,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ color: "#38bdf8" }}>✓ Image attached</span>
          <button
            onClick={() => onImageChange(null)}
            style={{
              background: "none",
              border: "none",
              color: "#f97373",
              cursor: "pointer",
              fontSize: "0.8rem",
              textDecoration: "underline",
            }}
          >
            Remove image
          </button>
        </div>
      ) : null}
    </>
  );
}

type VotingSectionProps = {
  pair: [RankedItem, RankedItem];
  onVote: (result: 0 | 1 | "draw") => void;
  onSkip: () => void;
  exitDirection: ExitAnimation;
};

function VotingSection({
  pair,
  onVote,
  onSkip,
  exitDirection,
}: VotingSectionProps) {
  const [hovered, setHovered] = useState<"left" | "right" | null>(null);

  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...cardRowStyle,
      transition: "transform 0.25s ease-in, opacity 0.25s ease-in", // Smooth transition
      opacity: 1,
      transform: "translate(0, 0) scale(1)",
    };

    if (exitDirection === "left") {
      // Swipe Left look
      return { ...base, opacity: 0, transform: "translate(-50px, 0)" };
    }
    if (exitDirection === "right") {
      // Swipe Right look
      return { ...base, opacity: 0, transform: "translate(50px, 0)" };
    }
    if (exitDirection === "draw") {
      // Sink down look
      return {
        ...base,
        opacity: 0,
        transform: "translate(0, 20px) scale(0.95)",
      };
    }
    if (exitDirection === "skip") {
      // Float up look
      return {
        ...base,
        opacity: 0,
        transform: "translate(0, -20px) scale(0.95)",
      };
    }

    return base;
  };

  const renderCardContent = (item: RankedItem) => (
    <>
      {item.image ? (
        <div
          style={{
            width: "120px",
            height: "120px",
            marginBottom: "1rem",
            borderRadius: "50%",
            border: "4px solid rgba(255, 255, 255, 0.1)",
            background: `url(${item.image}) center center / cover no-repeat`,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
          }}
        />
      ) : null}

      <div
        style={{
          fontWeight: "bold",
          fontSize: "1.3rem",
          marginBottom: "0.5rem",
        }}
      >
        {item.name}
      </div>
      <div style={subTextStyle}>Rating {Math.round(item.rating)}</div>
    </>
  );

  const kbdStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 6px",
    borderRadius: "4px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    fontSize: "0.7rem",
    marginLeft: "8px",
    verticalAlign: "middle",
    color: "#94a3b8",
    fontFamily: "monospace",
  };

  return (
    <section style={{ marginBottom: "2.4rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "0.8rem",
        }}
      >
        <h3 style={sectionTitleStyle}>Battle arena</h3>
      </div>
      <p style={{ ...helperTextStyle, marginBottom: "1.2rem" }}>
        Press <span style={kbdStyle}>A</span> <span style={kbdStyle}>D</span> to
        vote, <span style={kbdStyle}>S</span> for draw.
      </p>

      <div style={getContainerStyle()}>
        <button
          style={{
            ...cardStyle,
            ...(hovered === "left" ? cardHoverStyle : null),
            color: "rgb(229, 231, 235)",
          }}
          onClick={() => onVote(0)}
          onMouseEnter={() => setHovered("left")}
          onMouseLeave={() => setHovered(null)}
        >
          {renderCardContent(pair[0])}
          <div style={subTextStyle}>
            Rating {Math.round(pair[0].rating)} · {pair[0].matches} matches
          </div>
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            alignItems: "center",
          }}
        >
          <button style={drawButtonStyle} onClick={() => onVote("draw")}>
            Draw <span style={kbdStyle}>S</span>
          </button>
          <button style={skipButtonStyle} onClick={onSkip}>
            Skip <span style={kbdStyle}>W</span>
          </button>
        </div>

        <button
          style={{
            ...cardStyle,
            ...(hovered === "right" ? cardHoverStyle : null),
            color: "rgb(229, 231, 235)",
          }}
          onClick={() => onVote(1)}
          onMouseEnter={() => setHovered("right")}
          onMouseLeave={() => setHovered(null)}
        >
          {renderCardContent(pair[1])}
          <div style={subTextStyle}>
            Rating {Math.round(pair[1].rating)} · {pair[1].matches} matches
          </div>
        </button>
      </div>
    </section>
  );
}

type LeaderboardProps = {
  items: RankedItem[];
  onDelete: (id: string) => void;
};

function Leaderboard({ items, onDelete }: LeaderboardProps) {
  if (!items.length) {
    return (
      <section>
        <h2 style={sectionTitleStyle}>Leaderboard</h2>
        <p style={emptyStateStyle}>
          No rankings yet. Add a couple of items above and cast your first
          votes.
        </p>
      </section>
    );
  }

  const sorted = [...items].sort((a, b) => b.rating - a.rating);

  const deleteBtnStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#64748b", // slate-500
    cursor: "pointer",
    fontSize: "1.2rem",
    lineHeight: 1,
    padding: "4px 8px",
    marginLeft: "12px",
    borderRadius: "4px",
    transition: "color 0.2s, background 0.2s",
  };

  return (
    <section>
      <h2 style={sectionTitleStyle}>Leaderboard</h2>
      <ul style={leaderboardListStyle}>
        {sorted.map((item, index) => (
          <li
            key={item.id}
            style={index === 0 ? leaderboardTopStyle : leaderboardItemStyle}
          >
            <span style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <span style={index === 0 ? rankBadgeTopStyle : rankBadgeStyle}>
                #{index + 1}
              </span>

              {item.image && (
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    marginRight: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                />
              )}

              {item.name}
            </span>

            <span style={{ display: "flex", alignItems: "center" }}>
              <span style={{ color: COLORS.textSecondary, fontSize: "0.85em" }}>
                {Math.round(item.rating)}{" "}
                <span style={{ opacity: 0.8 }}>
                  · {item.matches} match{item.matches === 1 ? "" : "es"}
                </span>
              </span>

              <button
                style={deleteBtnStyle}
                onClick={() => onDelete(item.id)}
                title="Delete item"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444"; // red-500
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#64748b";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type ExitAnimation = "left" | "right" | "draw" | "skip" | null;

// ---- main app ----
function App() {
  const [newItemName, setNewItemName] = useState("");
  const [newImageName, setNewImageName] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<ExitAnimation>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    value: items,
    setValue: setItems,
    isHydrated,
    reset,
  } = useLocalStorageState<RankedItem[]>("glicko-rankings", []);
  const [currentPair, setCurrentPair] = useState<
    [RankedItem, RankedItem] | null
  >(null);

  const tryGetNextPair = useCallback((candidateItems: RankedItem[]) => {
    if (candidateItems.length < 2) return null;
    return getNextMatchup(candidateItems);
  }, []);

  useEffect(() => {
    if (isHydrated && items.length >= 2 && !currentPair) {
      const nextPair = tryGetNextPair(items);
      if (nextPair) setCurrentPair(nextPair);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const handleExport = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `rankinator-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);

        if (!Array.isArray(parsed)) throw new Error("Not an array");
        if (parsed.length > 0 && (!parsed[0].id || !parsed[0].name)) {
          throw new Error("Invalid data structure");
        }

        if (
          confirm(
            `Replace current list with ${parsed.length} items from backup?`
          )
        ) {
          setItems(parsed);

          setCurrentPair(null);
          setExitDirection(null);

          setTimeout(() => {
            const nextPair = tryGetNextPair(parsed);
            if (nextPair) setCurrentPair(nextPair);
          }, 0);
        }
      } catch (err) {
        alert("Failed to load file. It might be corrupt or the wrong format.");
        console.error(err);
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const newItem: RankedItem = {
      id: uuidv4(),
      name: newItemName.trim(),
      image: newImageName || undefined,
      rating: 1500,
      rd: 350,
      vol: 0.06,
      matches: 0,
    };

    const updatedItems = [...items, newItem];

    setItems(updatedItems);
    setNewItemName("");
    setNewImageName(null);

    if (!currentPair) {
      const nextPair = tryGetNextPair(updatedItems);
      if (nextPair) setCurrentPair(nextPair);
    }
  };

  const handleVote = useCallback(
    (result: 0 | 1 | "draw") => {
      if (!currentPair || exitDirection) return;

      setExitDirection(result === 0 ? "left" : result === 1 ? "right" : "draw");

      setTimeout(() => {
        const [item1, item2] = currentPair;
        let matchResult: { item1: RankedItem; item2: RankedItem };

        if (result === "draw") {
          matchResult = processMatch(item1, item2, 0.5);
        } else if (result === 0) {
          matchResult = processMatch(item1, item2, 1);
        } else {
          matchResult = processMatch(item1, item2, 0);
        }

        const updatedItems = items.map((item) => {
          if (item.id === matchResult.item1.id) return matchResult.item1;
          if (item.id === matchResult.item2.id) return matchResult.item2;
          return item;
        });

        setItems(updatedItems);

        const nextPair = tryGetNextPair(updatedItems);
        setCurrentPair(nextPair);

        setExitDirection(null);
      }, 250);
    },
    [currentPair, exitDirection, items, setItems, tryGetNextPair]
  );

  const handleSkip = useCallback(() => {
    if (!currentPair || exitDirection) return;

    setExitDirection("skip");

    setTimeout(() => {
      const nextPair = tryGetNextPair(items);
      setCurrentPair(nextPair);
      setExitDirection(null);
    }, 250);
  }, [currentPair, exitDirection, items, tryGetNextPair]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (!currentPair) return;

      switch (e.key.toLocaleLowerCase()) {
        case "a": //left
          handleVote(0);
          break;
        case "d": //right
          handleVote(1);
          break;
        case "s":
          handleVote("draw");
          break;
        case "w":
          handleSkip();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPair, handleVote, handleSkip]);

  const handleReset = () => {
    if (confirm("Are you sure? This deletes all rankings.")) {
      reset();
      setCurrentPair(null);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);

    // Check if the deleted item was currently in a match
    if (currentPair) {
      const [item1, item2] = currentPair;
      if (item1.id === id || item2.id === id) {
        const nextPair = tryGetNextPair(updatedItems);
        setCurrentPair(nextPair);
        setExitDirection(null);
      }
    } else {
      if (updatedItems.length >= 2) {
        const nextPair = tryGetNextPair(updatedItems);
        if (nextPair) setCurrentPair(nextPair);
      }
    }
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={pageStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Rankinator</h1>
            <p style={subtitleStyle}>
              A Glicko-2 ranker. Add items, vote on pairs, and create a
              leaderboard.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />

            <button
              onClick={handleExport}
              style={secondaryButtonStyle}
              title="Save backup"
            >
              Export
            </button>

            <button
              onClick={handleImportClick}
              style={secondaryButtonStyle}
              title="Load backup"
            >
              Import
            </button>

            <div
              style={{
                width: 1,
                height: 20,
                background: "rgba(148,163,184,0.3)",
                margin: "0 4px",
              }}
            />

            <button
              onClick={handleReset}
              style={dangerButtonStyle}
              title="Delete everything"
            >
              Reset
            </button>
          </div>
        </header>

        <InputSection
          textValue={newItemName}
          onTextChange={setNewItemName}
          imageValue={newImageName}
          onImageChange={setNewImageName}
          onSubmit={handleAddItem}
        />

        {currentPair && (
          <VotingSection
            pair={currentPair}
            onVote={handleVote}
            onSkip={handleSkip}
            exitDirection={exitDirection}
          />
        )}

        <Leaderboard items={items} onDelete={handleDeleteItem} />
      </div>
    </div>
  );
}

export default App;
