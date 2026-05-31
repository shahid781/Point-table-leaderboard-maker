/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { toPng, toBlob } from "html-to-image";
import Cropper, { Point, Area } from "react-easy-crop";
import { motion } from "motion/react";
import {
  Upload,
  Table as TableIcon,
  Users,
  Trash2,
  Plus,
  FileText,
  Loader2,
  Download,
  Trophy,
  AlertCircle,
  RotateCcw,
  Settings,
  Image as ImageIcon,
  ImagePlus,
  X,
  Edit2,
  Check,
  Target,
  Shield,
  Activity,
  Sun,
  Moon,
  FileSpreadsheet,
  Undo,
  Redo,
  ChevronDown,
  ChevronUp,
  Sword,
  User,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LeaderboardChart } from "./components/LeaderboardChart";
import { StatsSummary } from "./components/StatsSummary";
import { BulkTeamModal } from "./components/BulkTeamModal";
import { TournamentProgression } from "./components/TournamentProgression";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL("image/jpeg", 0.9);
};

interface ImageCropperProps {
  image: string;
  aspect: number;
  onDone: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper = ({
  image,
  aspect,
  onDone,
  onCancel,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [completedCrop, setCompletedCrop] = useState<Area | null>(null);

  const onCropComplete = useCallback((_0: Area, pixelCrop: Area) => {
    setCompletedCrop(pixelCrop);
  }, []);

  const handleDone = async () => {
    if (completedCrop) {
      const cropped = await getCroppedImg(image, completedCrop);
      onDone(cropped);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex justify-between items-center px-4 py-3 bg-[#111] border-b border-white/10 shrink-0">
        <h2 className="text-white text-sm font-black uppercase tracking-widest">
          Adjust Background
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-white/50 hover:text-white text-[10px] font-bold uppercase transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-6 py-2 bg-orange-500 text-black text-[10px] font-black uppercase rounded-lg hover:bg-orange-400 transition-colors"
          >
            Apply Crop
          </button>
        </div>
      </div>
      <div className="relative flex-1 bg-[#0a0a0a]">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: "#0a0a0a" },
            cropAreaStyle: { border: "2px solid #f97316" },
          }}
        />
      </div>
      <div className="p-6 bg-[#111] border-t border-white/10 shrink-0">
        <div className="max-w-xs mx-auto">
          <label className="block text-[10px] text-white/40 uppercase font-black mb-3 text-center">
            Zoom Adjust
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
      </div>
    </div>
  );
};

// --- Types ---

interface SlotEntry {
  id: string;
  slotNumber: number;
  teamName: string;
  players?: string;
  logo?: string;
}

interface MatchResult {
  rank: number;
  teamName: string;
  kills: number;
  placementPoints: number;
  totalPoints: number;
  wwcd?: number;
}

interface HistoryEntry {
  id: string;
  gameType: "Scarfall" | "BGMI";
  tournamentType: string;
  groupName: string;
  timestamp: number;
  results: MatchResult[];
}

interface LeaderboardEntry {
  teamName: string;
  logo?: string;
  matchesPlayed: number;
  wwcd: number;
  totalKills: number;
  totalPlacementPoints: number;
  totalPoints: number;
}

type ViewMode = "current" | "leaderboard" | "import";
type GameType = "Scarfall" | "BGMI";

const TOURNAMENT_TYPES = ["Daily Scrim", "Weekly War", "Monthly Cup", "Custom"];
const GROUPS = ["Group A", "Group B", "Group C", "Group D", "Finals", "Custom"];

const TEMPLATES = [
  { id: "classic-dark", name: "Classic Dark", color: "#f97316" },
  { id: "modern-blue", name: "Modern Blue", color: "#2563eb" },
  { id: "neon-purple", name: "Neon Purple", color: "#a855f7" },
  { id: "royal-red", name: "Royal Red", color: "#dc2626" },
  { id: "toxic-green", name: "Toxic Green", color: "#22c55e" },
  { id: "cyber-yellow", name: "Cyber Yellow", color: "#eab308" },
  { id: "minimal-white", name: "Minimal White", color: "#64748b" },
  { id: "anime-pink", name: "Anime Pink", color: "#ec4899" },
  { id: "hero-red", name: "Hero Red", color: "#991b1b" },
  { id: "marine-blue", name: "Marine Blue", color: "#0e7490" },
  { id: "stealth-black", name: "Stealth Black", color: "#000000" },
  { id: "premium-1", name: "Premium 1", color: "#00ffcc" },
  { id: "premium-2", name: "Premium 2", color: "#4a3728" },
  { id: "premium-3", name: "Premium 3", color: "#ef4444" },
  { id: "premium-4", name: "Premium 4", color: "#3b82f6" },
  { id: "premium-5", name: "Premium 5", color: "#22c55e" },
  { id: "premium-6", name: "Premium 6 (Halloween)", color: "#f97316" },
  { id: "premium-7", name: "Premium 7 (Winter)", color: "#93c5fd" },
  { id: "premium-8", name: "Premium 8 (Tropical)", color: "#10b981" },
  { id: "tropical-pro", name: "Tropical Pro (9:16)", color: "#0ea5e9" },
  { id: "halloween-pro", name: "Halloween Pro (9:16)", color: "#f97316" },
  { id: "republic-utsav", name: "Republic Utsav", color: "#15803d" },
  { id: "irush-pro", name: "IRush Pro", color: "#00ffff" },
  { id: "professional-pro", name: "Professional Pro", color: "#312e81" },
  { id: "cyber-elite", name: "Cyber Elite", color: "#f43f5e" },
  { id: "golden-glory", name: "Golden Glory", color: "#eab308" },
  { id: "velocity-pro", name: "Velocity Pro", color: "#ef4444" },
  { id: "solaris-elite", name: "Solaris Elite", color: "#eab308" },
  { id: "frostbite-series", name: "Frostbite Series", color: "#00d4ff" },
  { id: "shadow-ops", name: "Shadow Ops", color: "#22c55e" },
  {
    id: "krafton-style",
    name: "Pro Circuit (Image Inspired)",
    color: "#00d4ff",
  },
  { id: "pmhi-pink", name: "PMHI Pink (Bold)", color: "#ec4899" },
  { id: "pmgo-sky", name: "PMGO Global (Sky)", color: "#0ea5e9" },
  { id: "pmgo-gold", name: "PMGO Africa (Gold)", color: "#d97706" },
  { id: "cyber-glitch", name: "Cyberpunk Glitch", color: "#f0f" },
  { id: "vanguard-premier", name: "Vanguard Premier", color: "#bef264" },
  { id: "nebula-circuit", name: "Nebula Circuit", color: "#a855f7" },
  { id: "horizon-series", name: "Horizon Series", color: "#6366f1" },
];

const SocialLinks = ({
  instagram,
  youtube,
  color,
  className,
}: {
  instagram?: string;
  youtube?: string;
  color?: string;
  className?: string;
}) => {
  if (!instagram && !youtube) return null;
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {instagram && (
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded flex items-center justify-center bg-black/20"
            style={{ backgroundColor: color ? `${color}20` : undefined }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={color || "currentColor"}
              className="w-2.5 h-2.5"
            >
              <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
            </svg>
          </div>
          <span
            className="text-[10px] font-black italic tracking-tighter"
            style={{ color: color || undefined }}
          >
            {instagram}
          </span>
        </div>
      )}
      {youtube && (
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded flex items-center justify-center bg-black/20"
            style={{ backgroundColor: color ? `${color}20` : undefined }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={color || "currentColor"}
              className="w-2.5 h-2.5"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span
            className="text-[10px] font-black italic tracking-tighter"
            style={{ color: color || undefined }}
          >
            {youtube}
          </span>
        </div>
      )}
    </div>
  );
};

const LeaderboardTemplate = ({
  data,
  tournament,
  group,
  templateId,
  logo,
  sponsorLogo,
  gameType,
  customHeader1,
  customHeader2,
  customHeader3,
  customHeader4,
  customTableTitle,
  customFooter,
  socialInstagram,
  socialYoutube,
  qualificationCount = 4,
  customQualifiedColor = "#22c55e",
  disqualificationCount = 0,
  customDisqualifiedColor = "#ef4444",
  customHeaderColor,
  customFooterColor,
  customAccentColor,
  customBackgroundImage,
  customFontSize = 100,
  h1FontSize = 100,
  h2FontSize = 100,
  h3FontSize = 100,
  h4FontSize = 100,
  footerFontSize = 100,
  tableFontSize = 100,
  currentPage = 0,
  aspectRatio = "1:1",
  isMini = false,
}: {
  data: LeaderboardEntry[];
  tournament: string;
  group: string;
  templateId: string;
  logo?: string;
  sponsorLogo?: string;
  gameType: GameType;
  customHeader1?: string;
  customHeader2?: string;
  customHeader3?: string;
  customHeader4?: string;
  customTableTitle?: string;
  customFooter?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  qualificationCount?: number;
  customQualifiedColor?: string;
  disqualificationCount?: number;
  customDisqualifiedColor?: string;
  customHeaderColor?: string;
  customFooterColor?: string;
  customAccentColor?: string;
  customBackgroundImage?: string | null;
  customFontSize?: number;
  h1FontSize?: number;
  h2FontSize?: number;
  h3FontSize?: number;
  h4FontSize?: number;
  footerFontSize?: number;
  tableFontSize?: number;
  currentPage?: number;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  isMini?: boolean;
}) => {
  const teamsPerPage = isMini ? 10 : 20;
  const startIdx = isMini ? 0 : currentPage * teamsPerPage;
  const pageData = isMini ? data.slice(0, 10) : data.slice(startIdx, startIdx + teamsPerPage);

  const leftColumn = isMini ? pageData : pageData.slice(0, 10);
  const rightColumn = isMini ? [] : pageData.slice(10, 20);

  const getTemplateStyles = () => {
    switch (templateId) {
      case "tropical-pro":
        return {
          bg: "bg-sky-100",
          text: "text-sky-900",
          accent: "bg-[#15803d]",
          accentText: "text-white",
          rowBg: "bg-[#fdfbf7]",
          rowText: "text-[#15803d]",
          gradient: "linear-gradient(to bottom, #87ceeb 0%, #e0f2fe 100%)",
          border: "border-[#15803d]",
        };
      case "halloween-pro":
        return {
          bg: "bg-[#0a001a]",
          text: "text-yellow-400",
          accent: "bg-yellow-400",
          accentText: "text-black",
          rowBg: "bg-purple-950/40",
          rowText: "text-white",
          gradient: "linear-gradient(to bottom, #0a001a, #1a0b2e)",
          border: "border-yellow-400",
        };
      case "republic-utsav":
        return {
          bg: "bg-[#e0f2fe]",
          text: "text-[#15803d]",
          accent: "bg-[#15803d]",
          accentText: "text-white",
          rowBg: "bg-[#fefce8]",
          rowText: "text-[#15803d]",
          gradient: "linear-gradient(to bottom, #87ceeb 0%, #e0f2fe 100%)",
          border: "border-[#15803d]",
        };
      case "irush-pro":
        return {
          bg: "bg-[#001f24]",
          text: "text-white",
          accent: "bg-[#00ffff]",
          accentText: "text-black",
          rowBg: "bg-[#002a2f]/80",
          rowText: "text-[#00ffff]",
          gradient: "linear-gradient(135deg, #001a1d 0%, #003a41 100%)",
          border: "border-[#00ffff]",
        };
      case "professional-pro":
        return {
          bg: "bg-[#0f172a]",
          text: "text-white",
          accent: "bg-[#fbbf24]",
          accentText: "text-slate-900",
          rowBg: "bg-white/5",
          rowText: "text-white",
          gradient: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          border: "border-slate-700",
        };
      case "cyber-elite":
        return {
          bg: "bg-[#0a0a0c]",
          text: "text-white",
          accent: "bg-[#f43f5e]",
          accentText: "text-white",
          rowBg: "bg-white/[0.03]",
          rowText: "text-white",
          gradient:
            "radial-gradient(circle at 50% 50%, #1a1a1e 0%, #0a0a0c 100%)",
          border: "border-[#f43f5e]",
        };
      case "modern-blue":
        return {
          bg: "bg-slate-100",
          text: "text-slate-900",
          accent: "bg-blue-600",
          accentText: "text-white",
          rowBg: "bg-white",
          rowText: "text-slate-900",
          gradient:
            "radial-gradient(circle at center, #f8fafc 0%, #cbd5e1 100%)",
          border: "border-blue-600",
        };
      case "neon-purple":
        return {
          bg: "bg-[#1a0b2e]",
          text: "text-white",
          accent: "bg-purple-600",
          accentText: "text-white",
          rowBg: "bg-purple-900/20",
          rowText: "text-white",
          gradient: "linear-gradient(135deg, #1a0b2e 0%, #4c1d95 100%)",
          border: "border-purple-400",
        };
      case "royal-red":
        return {
          bg: "bg-[#2a0505]",
          text: "text-white",
          accent: "bg-red-700",
          accentText: "text-white",
          rowBg: "bg-red-950/40",
          rowText: "text-white",
          gradient: "radial-gradient(circle at center, #450a0a 0%, #000 100%)",
          border: "border-red-600",
        };
      case "toxic-green":
        return {
          bg: "bg-[#051a05]",
          text: "text-white",
          accent: "bg-green-600",
          accentText: "text-black",
          rowBg: "bg-green-900/20",
          rowText: "text-white",
          gradient: "linear-gradient(to bottom, #051a05, #000)",
          border: "border-green-500",
        };
      case "cyber-yellow":
        return {
          bg: "bg-[#111]",
          text: "text-white",
          accent: "bg-yellow-500",
          accentText: "text-black",
          rowBg: "bg-yellow-500/10",
          rowText: "text-white",
          gradient:
            "repeating-linear-gradient(45deg, #111, #111 10px, #1a1a1a 10px, #1a1a1a 20px)",
          border: "border-yellow-500",
        };
      case "minimal-white":
        return {
          bg: "bg-white",
          text: "text-slate-900",
          accent: "bg-slate-900",
          accentText: "text-white",
          rowBg: "bg-slate-50",
          rowText: "text-slate-900",
          gradient: "none",
          border: "border-slate-200",
        };
      case "anime-pink":
        return {
          bg: "bg-[#2d0a1a]",
          text: "text-white",
          accent: "bg-pink-600",
          accentText: "text-white",
          rowBg: "bg-pink-900/20",
          rowText: "text-white",
          gradient: "linear-gradient(135deg, #2d0a1a 0%, #831843 100%)",
          border: "border-pink-400",
        };
      case "hero-red":
        return {
          bg: "bg-[#1a0505]",
          text: "text-white",
          accent: "bg-red-800",
          accentText: "text-white",
          rowBg: "bg-red-900/10",
          rowText: "text-white",
          gradient:
            "radial-gradient(circle at top right, #7f1d1d 0%, #000 100%)",
          border: "border-red-700",
        };
      case "marine-blue":
        return {
          bg: "bg-[#082f49]",
          text: "text-white",
          accent: "bg-cyan-600",
          accentText: "text-white",
          rowBg: "bg-cyan-900/20",
          rowText: "text-white",
          gradient: "linear-gradient(to bottom, #082f49, #000)",
          border: "border-cyan-400",
        };
      case "stealth-black":
        return {
          bg: "bg-black",
          text: "text-white",
          accent: "bg-zinc-800",
          accentText: "text-white",
          rowBg: "bg-zinc-900",
          rowText: "text-white",
          gradient: "none",
          border: "border-zinc-700",
        };
      case "premium-1":
        return {
          bg: "bg-[#0a0a0a]",
          text: "text-white",
          accent: "bg-[#00ffcc]",
          accentText: "text-black",
          rowBg: "bg-[#1a1a1a]",
          rowText: "text-white",
          gradient: "linear-gradient(180deg, #0a0a0a 0%, #000000 100%)",
          border: "border-[#00ffcc]",
        };
      case "premium-2":
        return {
          bg: "bg-[#fdfbf7]",
          text: "text-[#4a3728]",
          accent: "bg-[#4a3728]",
          accentText: "text-white",
          rowBg: "bg-[#f0e6d2]",
          rowText: "text-[#4a3728]",
          gradient:
            "radial-gradient(circle at center, #fdfbf7 0%, #f5ecd1 100%)",
          border: "border-[#4a3728]",
        };
      case "premium-3":
        return {
          bg: "bg-[#1a0505]",
          text: "text-white",
          accent: "bg-red-600",
          accentText: "text-white",
          rowBg: "bg-red-950/40",
          rowText: "text-white",
          gradient: "radial-gradient(circle at center, #450a0a 0%, #000 100%)",
          border: "border-red-500",
        };
      case "premium-4":
        return {
          bg: "bg-[#082f49]",
          text: "text-white",
          accent: "bg-blue-500",
          accentText: "text-white",
          rowBg: "bg-blue-900/30",
          rowText: "text-white",
          gradient: "linear-gradient(135deg, #082f49 0%, #1e3a8a 100%)",
          border: "border-blue-400",
        };
      case "premium-5":
        return {
          bg: "bg-[#064e3b]",
          text: "text-white",
          accent: "bg-green-500",
          accentText: "text-white",
          rowBg: "bg-green-900/30",
          rowText: "text-white",
          gradient: "linear-gradient(to bottom, #064e3b, #022c22)",
          border: "border-green-400",
        };
      case "premium-6":
        return {
          bg: "bg-[#1a0b00]",
          text: "text-orange-500",
          accent: "bg-orange-600",
          accentText: "text-black",
          rowBg: "bg-orange-950/40",
          rowText: "text-white",
          gradient: "radial-gradient(circle at center, #2a1b00 0%, #000 100%)",
          border: "border-orange-500",
        };
      case "premium-7":
        return {
          bg: "bg-[#f0f9ff]",
          text: "text-blue-900",
          accent: "bg-blue-600",
          accentText: "text-white",
          rowBg: "bg-white/80",
          rowText: "text-blue-900",
          gradient: "linear-gradient(to bottom, #f0f9ff, #e0f2fe)",
          border: "border-blue-300",
        };
      case "premium-8":
        return {
          bg: "bg-[#ecfdf5]",
          text: "text-emerald-900",
          accent: "bg-emerald-600",
          accentText: "text-white",
          rowBg: "bg-white/70",
          rowText: "text-emerald-900",
          gradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          border: "border-emerald-400",
        };
      case "golden-glory":
        return {
          gradient: "linear-gradient(135deg, #0f0c05 0%, #1a1508 100%)",
          accent: "bg-[#eab308]",
          accentText: "text-black",
          rowBg: "bg-white/5",
          headerBg: "bg-[#eab308]",
          footerBg: "bg-[#eab308]/20",
        };
      case "velocity-pro":
        return {
          bg: "bg-[#050505]",
          text: "text-white",
          accent: "bg-[#ef4444]",
          accentText: "text-white",
          rowBg: "bg-white/[0.05]",
          rowText: "text-white",
          gradient: "linear-gradient(135deg, #0f0505 0%, #050505 100%)",
          border: "border-[#ef4444]",
        };
      case "solaris-elite":
        return {
          bg: "bg-[#0a0a0a]",
          text: "text-white",
          accent: "bg-[#eab308]",
          accentText: "text-black",
          rowBg: "bg-white/[0.03]",
          rowText: "text-white",
          gradient: "linear-gradient(180deg, #121212 0%, #050505 100%)",
          border: "border-[#eab308]",
        };
      case "frostbite-series":
        return {
          bg: "bg-[#000a12]",
          text: "text-white",
          accent: "bg-[#00d4ff]",
          accentText: "text-black",
          rowBg: "bg-white/[0.07]",
          rowText: "text-white",
          gradient: "linear-gradient(135deg, #001220 0%, #000a12 100%)",
          border: "border-[#00d4ff]",
        };
      case "shadow-ops":
        return {
          bg: "bg-[#0a0f0a]",
          text: "text-white",
          accent: "bg-[#22c55e]",
          accentText: "text-black",
          rowBg: "bg-white/[0.05]",
          rowText: "text-white",
          gradient: "linear-gradient(135deg, #050a05 0%, #0a0f0a 100%)",
          border: "border-[#22c55e]",
        };
      case "krafton-style":
        return {
          bg: "bg-[#05111a]",
          text: "text-white",
          accent: "bg-[#00d4ff]",
          accentText: "text-black",
          rowBg: "bg-[#0c232e]",
          rowText: "text-white",
          gradient: "linear-gradient(180deg, #0a1f2e 0%, #05111a 100%)",
          border: "border-[#00d4ff]",
        };
      default: // classic-dark
        return {
          bg: "bg-[#222]",
          text: "text-white",
          accent: "bg-orange-500",
          accentText: "text-black",
          rowBg: "bg-white/5",
          rowText: "text-white",
          gradient: "radial-gradient(circle at center, #333 0%, #111 100%)",
          border: "border-orange-500",
        };
    }
  };

  const s = getTemplateStyles();
  const isTropicalPro = templateId === "tropical-pro";
  const isHalloweenPro = templateId === "halloween-pro";
  const isPro = isTropicalPro || isHalloweenPro;
  const isFullTemplate = [
    "krafton-style",
    "pmhi-pink",
    "pmgo-sky",
    "pmgo-gold",
    "cyber-glitch",
    "vanguard-premier",
    "nebula-circuit",
    "horizon-series",
  ].includes(templateId);

  const getDimensions = () => {
    if (isPro) {
      if (aspectRatio === "9:16") return "w-[1080px] h-[1920px]";
      if (aspectRatio === "16:9") return "w-[1920px] h-[1080px]";
      if (aspectRatio === "4:3") return "w-[1440px] h-[1080px]";
      if (aspectRatio === "1:1") return "w-[1080px] h-[1080px]";
      return "w-[1080px] h-[2600px]"; // Default pro scroll
    }

    switch (aspectRatio) {
      case "16:9":
        return "w-[1920px] h-[1080px] p-16";
      case "9:16":
        return "w-[1080px] h-[1920px] p-12";
      case "4:3":
        return "w-[1440px] h-[1080px] p-16";
      case "1:1":
      default:
        return "w-[1000px] h-[1000px] p-12";
    }
  };

  return (
    <div
      id="leaderboard-template"
      className={cn(
        "relative overflow-hidden flex flex-col items-center font-sans",
        getDimensions(),
        !customBackgroundImage && s.bg,
        s.text,
      )}
      style={{
        backgroundImage: customBackgroundImage
          ? `url(${customBackgroundImage})`
          : s.gradient,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <style>{`
        #leaderboard-template {
          --font-scale: ${(customFontSize || 100) / 100};
        }
        #leaderboard-template .h1-scale { --font-scale: ${((customFontSize || 100) / 100) * ((h1FontSize || 100) / 100)}; }
        #leaderboard-template .h2-scale { --font-scale: ${((customFontSize || 100) / 100) * ((h2FontSize || 100) / 100)}; }
        #leaderboard-template .h3-scale { --font-scale: ${((customFontSize || 100) / 100) * ((h3FontSize || 100) / 100)}; }
        #leaderboard-template .h4-scale { --font-scale: ${((customFontSize || 100) / 100) * ((h4FontSize || 100) / 100)}; }
        #leaderboard-template .f-scale { --font-scale: ${((customFontSize || 100) / 100) * ((footerFontSize || 100) / 100)}; }
        #leaderboard-template .t-scale { --font-scale: ${((customFontSize || 100) / 100) * ((tableFontSize || 100) / 100)}; }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .cyber-glitch-text {
          animation: glitch 2s infinite linear alternate-reverse;
          text-shadow: 2px 0 #0ff, -2px 0 #f0f;
        }
        .nebula-glow {
          filter: drop-shadow(0 0 15px rgba(168, 85, 247, 0.5));
        }
        
        #leaderboard-template .text-xs { font-size: calc(0.75rem * var(--font-scale)) !important; }
        #leaderboard-template .text-sm { font-size: calc(0.875rem * var(--font-scale)) !important; }
        #leaderboard-template .text-base { font-size: calc(1rem * var(--font-scale)) !important; }
        #leaderboard-template .text-lg { font-size: calc(1.125rem * var(--font-scale)) !important; }
        #leaderboard-template .text-xl { font-size: calc(1.25rem * var(--font-scale)) !important; }
        #leaderboard-template .text-2xl { font-size: calc(1.5rem * var(--font-scale)) !important; }
        #leaderboard-template .text-3xl { font-size: calc(1.875rem * var(--font-scale)) !important; }
        #leaderboard-template .text-4xl { font-size: calc(2.25rem * var(--font-scale)) !important; }
        #leaderboard-template .text-5xl { font-size: calc(3rem * var(--font-scale)) !important; }
        #leaderboard-template .text-6xl { font-size: calc(3.75rem * var(--font-scale)) !important; }
        #leaderboard-template .text-7xl { font-size: calc(4.5rem * var(--font-scale)) !important; }
        #leaderboard-template .text-8xl { font-size: calc(6rem * var(--font-scale)) !important; }
        #leaderboard-template .text-9xl { font-size: calc(8rem * var(--font-scale)) !important; }
        
        /* Arbitrary sizes used in code */
        #leaderboard-template .text-\\[10px\\] { font-size: calc(10px * var(--font-scale)) !important; }
        #leaderboard-template .text-\\[8px\\] { font-size: calc(8px * var(--font-scale)) !important; }
        #leaderboard-template .text-\\[120px\\] { font-size: calc(120px * var(--font-scale)) !important; }
        #leaderboard-template .text-\\[140px\\] { font-size: calc(140px * var(--font-scale)) !important; }
        #leaderboard-template .text-\\[150px\\] { font-size: calc(150px * var(--font-scale)) !important; }
        #leaderboard-template .text-\\[12px\\] { font-size: calc(12px * var(--font-scale)) !important; }
        #leaderboard-template .text-\\[11px\\] { font-size: calc(11px * var(--font-scale)) !important; }
      `}</style>
      {sponsorLogo && (
        <div className="absolute bottom-4 right-4 z-50">
          <img src={sponsorLogo} alt="Sponsor" className="h-10 w-auto rounded-lg shadow-lg border border-white/20" />
        </div>
      )}
      {/* Decorative Elements */}
      {isTropicalPro && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Sky Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-white" />

          {/* Clouds */}
          <div className="absolute top-[10%] left-[-5%] w-64 h-20 bg-white/40 blur-3xl rounded-full animate-pulse" />
          <div className="absolute top-[15%] right-[-10%] w-96 h-32 bg-white/30 blur-[60px] rounded-full" />
          <div className="absolute top-[5%] left-[40%] w-48 h-12 bg-white/20 blur-2xl rounded-full" />

          {/* Birds */}
          <div className="absolute top-[12%] left-[15%] opacity-40">
            <svg
              width="40"
              height="20"
              viewBox="0 0 40 20"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M2 10C10 5 15 5 20 10C25 5 30 5 38 10" />
            </svg>
          </div>
          <div className="absolute top-[8%] left-[25%] opacity-30 scale-75">
            <svg
              width="40"
              height="20"
              viewBox="0 0 40 20"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M2 10C10 5 15 5 20 10C25 5 30 5 38 10" />
            </svg>
          </div>

          {/* Palm Leaves (Corners) */}
          <div className="absolute -top-20 -left-20 w-[600px] h-[600px] opacity-40 rotate-45">
            <div className="w-full h-full text-[#15803d] flex items-center justify-center">
              <svg viewBox="0 0 200 200" fill="currentColor">
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(0 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(30 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(60 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(-30 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(-60 100 100)"
                />
              </svg>
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-40 -rotate-45">
            <div className="w-full h-full text-[#15803d] flex items-center justify-center">
              <svg viewBox="0 0 200 200" fill="currentColor">
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(0 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(30 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(60 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(-30 100 100)"
                />
                <path
                  d="M100 0C100 0 80 40 80 100C80 160 100 200 100 200C100 200 120 160 120 100C120 40 100 0 100 0Z"
                  transform="rotate(-60 100 100)"
                />
              </svg>
            </div>
          </div>

          {/* Bottom Foliage */}
          <div className="absolute -bottom-10 left-0 w-full h-64 bg-gradient-to-t from-[#15803d]/20 to-transparent" />
        </div>
      )}

      {isHalloweenPro && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Spooky Forest Background */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/batthern.png')] opacity-20" />

          {/* Moon */}
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white rounded-full shadow-[0_0_150px_rgba(255,255,255,0.4)] flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] rounded-full" />
            {/* Haunted House Silhouette */}
            <div className="relative z-10 w-80 h-80 text-black opacity-90 mb-12">
              <svg viewBox="0 0 200 200" fill="currentColor">
                <path d="M100 20L40 80V180H160V80L100 20ZM80 160H60V120H80V160ZM140 160H120V120H140V160ZM100 100L80 80H120L100 100Z" />
                <path d="M30 100L10 120V180H50V140L30 100Z" />
                <path d="M170 100L190 120V180H150V140L170 100Z" />
              </svg>
            </div>
          </div>

          {/* Bats */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute opacity-60",
                i % 3 === 0 ? "animate-pulse" : "",
              )}
              style={{
                top: `${5 + Math.random() * 40}%`,
                left: `${Math.random() * 90}%`,
                transform: `scale(${0.4 + Math.random() * 0.8}) rotate(${Math.random() * 40 - 20}deg)`,
              }}
            >
              <svg width="60" height="30" viewBox="0 0 40 20" fill="white">
                <path d="M20 10C15 5 10 5 0 10C5 15 10 15 20 10ZM20 10C25 5 30 5 40 10C35 15 30 15 20 10Z" />
              </svg>
            </div>
          ))}

          {/* Spooky Trees Silhouette */}
          <div className="absolute bottom-0 left-0 w-full h-[800px] bg-gradient-to-t from-black via-black/80 to-transparent opacity-90 flex items-end">
            <div className="w-full h-full flex items-end justify-around px-4">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="w-24 bg-black"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 40% 20%, 45% 20%, 30% 40%, 40% 40%, 20% 70%, 35% 70%, 0% 100%, 100% 100%, 65% 70%, 80% 70%, 60% 40%, 70% 40%, 55% 20%, 60% 20%)",
                    height: `${300 + Math.random() * 400}px`,
                    opacity: 0.7 + Math.random() * 0.3,
                    transform: `translateX(${Math.random() * 40 - 20}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {templateId === "classic-dark" && (
        <>
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-600/20 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 left-0 w-48 h-12 bg-orange-500 -rotate-45 -translate-x-12 translate-y-8 shadow-lg" />
          <div className="absolute top-0 left-0 w-48 h-6 bg-orange-400 -rotate-45 -translate-x-8 translate-y-16 shadow-lg" />
          <div className="absolute top-0 right-0 w-48 h-12 bg-orange-500 rotate-45 translate-x-12 translate-y-8 shadow-lg" />
          <div className="absolute top-0 right-0 w-48 h-6 bg-orange-400 rotate-45 translate-x-8 translate-y-16 shadow-lg" />
          <div className="absolute bottom-0 left-0 w-48 h-12 bg-orange-500 rotate-45 -translate-x-12 -translate-y-8 shadow-lg" />
          <div className="absolute bottom-0 right-0 w-48 h-12 bg-orange-500 -rotate-45 translate-x-12 -translate-y-8 shadow-lg" />
        </>
      )}

      {templateId === "irush-pro" && (
        <>
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#00ffff 1px, transparent 1px)",
              backgroundSize: "15px 15px",
            }}
          />

          {/* Cyan Glow Edges */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ffff]/50 to-transparent shadow-[0_0_15px_#00ffff]" />
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ffff]/50 to-transparent shadow-[0_0_15px_#00ffff]" />

          {/* Corner Decals */}
          <div className="absolute top-12 left-12 w-24 h-24 border-t-2 border-l-2 border-[#00ffff]/20 rounded-tl-3xl" />
          <div className="absolute top-12 right-12 w-24 h-24 border-t-2 border-r-2 border-[#00ffff]/20 rounded-tr-3xl" />
          <div className="absolute bottom-12 left-12 w-24 h-24 border-b-2 border-l-2 border-[#00ffff]/20 rounded-bl-3xl" />
          <div className="absolute bottom-12 right-12 w-24 h-24 border-b-2 border-r-2 border-[#00ffff]/20 rounded-br-3xl" />

          {/* Dotted Lines */}
          <div className="absolute top-0 left-1/4 bottom-0 w-px bg-gradient-to-b from-transparent via-[#00ffff]/10 to-transparent" />
          <div className="absolute top-0 right-1/4 bottom-0 w-px bg-gradient-to-b from-transparent via-[#00ffff]/10 to-transparent" />
        </>
      )}

      {templateId === "professional-pro" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "100px 100px",
            }}
          />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#fbbf24]/50 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#fbbf24]/5 to-transparent" />
          <div className="absolute top-40 -left-20 w-64 h-64 bg-[#fbbf24]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-40 -right-20 w-64 h-64 bg-[#fbbf24]/5 rounded-full blur-[100px]" />
        </>
      )}

      {templateId === "cyber-elite" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
            }}
          />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f43f5e] to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#f43f5e] to-transparent" />

          {/* Neon Scars */}
          <div className="absolute top-1/4 -left-10 w-40 h-px bg-[#f43f5e]/20 rotate-[35deg]" />
          <div className="absolute top-1/3 -right-10 w-60 h-px bg-[#f43f5e]/20 -rotate-[25deg]" />

          {/* Hex Pattern */}
          <div className="absolute top-10 right-10 w-32 h-32 opacity-10 pointer-events-none">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="0.5"
            >
              <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" />
              <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" />
            </svg>
          </div>
        </>
      )}

      {templateId === "modern-blue" && (
        <>
          <div className="absolute top-0 left-0 w-full h-32 bg-blue-600 -skew-y-3 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-blue-600 skew-y-3 translate-y-16" />
        </>
      )}

      {templateId === "neon-purple" && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, #4c1d95 1px, transparent 1px), linear-gradient(to bottom, #4c1d95 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      )}

      {templateId === "stealth-black" && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      )}

      {templateId === "premium-1" && (
        <>
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffcc] shadow-[0_0_20px_#00ffcc]" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-[#00ffcc] opacity-20 blur-3xl" />
          <div className="absolute top-20 left-10 w-40 h-40 border-l-2 border-t-2 border-[#00ffcc] opacity-40" />
          <div className="absolute bottom-20 right-10 w-40 h-40 border-r-2 border-b-2 border-[#00ffcc] opacity-40" />
          {/* Top 3 Highlight Boxes */}
          <div className="absolute top-48 flex gap-4 z-20">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-48 h-24 bg-[#1a1a1a] border border-[#00ffcc]/30 flex flex-col items-center justify-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffcc]" />
                <span className="text-[10px] uppercase opacity-50">
                  #{i + 1} Team
                </span>
                <span className="text-lg font-black truncate w-full text-center px-2">
                  {data[i]?.teamName || "-"}
                </span>
                <div className="mt-1 px-3 py-0.5 bg-[#00ffcc] text-black text-[10px] font-bold">
                  PTS: {data[i]?.totalPoints || "00"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {templateId === "premium-2" && (
        <>
          {/* Pillars */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-[#4a3728]/5 border-r border-[#4a3728]/20 flex flex-col justify-between py-10 items-center">
            <div className="w-12 h-4 bg-[#4a3728]/20 rounded-sm" />
            <div className="w-8 h-full border-x border-[#4a3728]/10" />
            <div className="w-12 h-4 bg-[#4a3728]/20 rounded-sm" />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-[#4a3728]/5 border-l border-[#4a3728]/20 flex flex-col justify-between py-10 items-center">
            <div className="w-12 h-4 bg-[#4a3728]/20 rounded-sm" />
            <div className="w-8 h-full border-x border-[#4a3728]/10" />
            <div className="w-12 h-4 bg-[#4a3728]/20 rounded-sm" />
          </div>
          <div className="absolute top-0 left-0 w-full h-8 bg-[#4a3728]/10 border-b border-[#4a3728]/20" />
        </>
      )}

      {templateId === "premium-3" && (
        <>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, #ef4444 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_#ef4444]" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-red-600 shadow-[0_0_20px_#ef4444]" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        </>
      )}

      {templateId === "premium-4" && (
        <>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-blue-600/30 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-blue-600/30 to-transparent" />
          <div className="absolute top-1/4 -left-20 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full" />
          <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full" />
        </>
      )}

      {templateId === "premium-5" && (
        <>
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
            }}
          />
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          <div className="absolute top-10 left-10 w-20 h-20 border-l-4 border-t-4 border-green-500/30" />
          <div className="absolute bottom-10 right-10 w-20 h-20 border-r-4 border-b-4 border-green-500/30" />
        </>
      )}

      {templateId === "premium-6" && (
        <>
          <div
            className="absolute top-0 left-0 w-full h-full opacity-20"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/batthern.png")',
            }}
          />
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-600/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-orange-600/20 to-transparent" />
          <div className="absolute top-10 right-10 text-6xl opacity-20">🎃</div>
          <div className="absolute bottom-10 left-10 text-6xl opacity-20">
            🦇
          </div>
        </>
      )}

      {templateId === "premium-7" && (
        <>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/snow.png")',
            }}
          />
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-200" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-200" />
          <div className="absolute top-1/2 left-0 w-full h-px bg-blue-100/50" />
        </>
      )}

      {templateId === "krafton-style" && (
        <>
          <div className="absolute inset-0 bg-[#05111a]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 50%, #1e4d6e 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/stardust.png")',
            }}
          />

          {/* Header Section */}
          <div className="relative z-10 w-full flex flex-col items-center pt-12 px-12">
            <div className="w-full flex justify-between items-center mb-8">
              {logo ? (
                <img
                  src={logo}
                  alt=""
                  className="w-24 h-24 object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                />
              ) : (
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center p-2 border border-white/20">
                  <span className="text-white font-black text-2xl italic">
                    LOGO
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center">
                <h1 className="text-7xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] h1-scale">
                  {customHeader1 || "OVERALL STANDINGS"}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="h-[2px] w-12 bg-white/20" />
                  <div className="text-xl font-bold tracking-[0.2em] text-white/70 h2-scale uppercase">
                    {customHeader2 || "QUALIFIERS"} |{" "}
                    {customHeader4 || "R1 - D1"} | {customHeader3 || "GROUP B"}
                  </div>
                  <div className="h-[2px] w-12 bg-white/20" />
                </div>
              </div>
              <div className="w-24" /> {/* Spacer */}
            </div>

            {/* Table Header */}
            <div
              className="w-full grid grid-cols-[60px_60px_1fr_80px_80px_80px_80px_100px] gap-1 px-2 py-3 bg-[#0d2736]/80 backdrop-blur-md border-b-2 border-[#00d4ff]/30 text-[10px] font-black italic text-white/60 tracking-widest uppercase mb-1"
              style={{
                borderBottomColor: customAccentColor
                  ? `${customAccentColor}4d`
                  : undefined,
              }}
            >
              <div className="text-center">RANK</div>
              <div className="text-center">TEAM</div>
              <div className="pl-4">TEAM NAME</div>
              <div className="text-center">MATCHES</div>
              <div className="text-center flex justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div className="text-center">FIN. PTS.</div>
              <div className="text-center">POS. PTS.</div>
              <div
                className="text-center"
                style={{ color: customAccentColor || "#00d4ff" }}
              >
                TOTAL
              </div>
            </div>

            {/* Table Rows */}
            <div className="w-full flex flex-col gap-1 t-scale">
              {pageData.map((team, idx) => {
                const rank = startIdx + idx + 1;
                const isQualified =
                  qualificationCount > 0 && rank <= qualificationCount;
                const isRelegated =
                  disqualificationCount > 0 &&
                  rank > data.length - disqualificationCount;

                return (
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 220, damping: 25 }}
                    key={team.teamName || idx}
                    className={cn(
                      "group relative w-full grid grid-cols-[60px_60px_1fr_80px_80px_80px_80px_100px] gap-1 h-11 items-center transition-all border-l-4",
                      isQualified
                        ? "bg-[#103a3d]/80 shadow-[inset_10px_0_20px_rgba(34,197,94,0.05)]"
                        : isRelegated
                          ? "bg-[#3d1010]/80 shadow-[inset_10px_0_20px_rgba(239,68,68,0.1)]"
                          : "bg-[#0d2736]/40 border-transparent hover:bg-white/5",
                    )}
                    style={{
                      borderLeftColor: isQualified
                        ? customQualifiedColor
                        : isRelegated
                          ? customDisqualifiedColor
                          : undefined,
                    }}
                  >
                    <div
                      className="h-full flex items-center justify-center font-black italic text-xl"
                      style={{
                        color: isQualified
                          ? customQualifiedColor
                          : isRelegated
                            ? customDisqualifiedColor
                            : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {rank}
                    </div>
                    <div className="h-full flex items-center justify-center p-1">
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt=""
                          className="w-8 h-8 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div
                      className={cn(
                        "h-full flex items-center pl-4 font-black italic text-lg tracking-tight uppercase overflow-hidden whitespace-nowrap",
                        isQualified ? "" : "text-white",
                      )}
                      style={{
                        color: isQualified ? customQualifiedColor : undefined,
                      }}
                    >
                      {team.teamName || "-"}
                    </div>
                    <div className="h-full flex items-center justify-center font-bold text-white/60">
                      {team.matchesPlayed || 0}
                    </div>
                    <div className="h-full flex items-center justify-center font-bold text-white/80">
                      {team.wwcd || 0}
                    </div>
                    <div className="h-full flex items-center justify-center font-bold text-white/80 border-l border-white/5">
                      {team.totalKills || 0}
                    </div>
                    <div className="h-full flex items-center justify-center font-bold text-white/80 border-l border-white/5">
                      {team.totalPlacementPoints || 0}
                    </div>
                    <div
                      className={cn(
                        "h-full flex items-center justify-center font-black italic text-2xl border-l border-white/5 relative",
                        isQualified
                          ? "bg-white/5"
                          : isRelegated
                            ? "text-red-400 bg-red-500/10"
                            : "text-cyan-400 bg-cyan-500/5",
                      )}
                      style={{
                        color: isQualified ? customQualifiedColor : undefined,
                      }}
                    >
                      {team.totalPoints || 0}
                    </div>

                    {/* Promotion/Relegation Indicators */}
                    {idx === 0 && (
                      <div className="absolute -left-12 top-0 h-[176px] flex items-center justify-center pointer-events-none">
                        <div
                          className="rotate-270 text-[10px] font-black tracking-[0.5em] uppercase whitespace-nowrap"
                          style={{ color: customQualifiedColor }}
                        >
                          PROMOTION
                        </div>
                      </div>
                    )}
                    {idx === 12 && (
                      <div className="absolute -left-12 top-0 h-[176px] flex items-center justify-center pointer-events-none">
                        <div className="rotate-270 text-[10px] font-black text-red-500 tracking-[0.5em] uppercase whitespace-nowrap">
                          RELEGATION
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="w-full flex items-center justify-between mt-12 px-2 border-t border-white/10 pt-6 f-scale">
              <div className="flex items-center gap-6">
                <div
                  className="text-xl font-black italic tracking-widest"
                  style={{ color: customFooterColor || "#00d4ff" }}
                >
                  FORGING THE FUTURE
                </div>
                <div className="h-px w-24 bg-white/20" />
              </div>

              <div className="flex flex-col items-end">
                <SocialLinks
                  instagram={socialInstagram}
                  youtube={socialYoutube}
                  color={customFooterColor || "#00d4ff"}
                />
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-2">
                  {customFooter || "© 2026 KRAFTON, Inc. All rights reserved."}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {templateId === "pmhi-pink" && (
        <div className="absolute inset-0 bg-[#0a0208] flex flex-col overflow-hidden">
          {/* Neon Gradients */}
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-[#ec4899]/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-[#4f46e5]/10 blur-[120px] rounded-full" />

          <div className="relative z-10 p-8 flex flex-col h-full">
            {/* Header */}
            <div
              className="flex justify-between items-center mb-8 border-b-4 pb-4"
              style={{ borderBottomColor: customHeaderColor || "#ec4899" }}
            >
              <div className="flex flex-col">
                <h1 className="text-6xl font-black tracking-tighter text-white italic h1-scale uppercase leading-tight">
                  {customHeader1 || "OVERALL RANKING"}
                </h1>
                <div className="flex items-center gap-4">
                  <div
                    className="px-3 py-1 text-white font-black text-sm italic"
                    style={{ backgroundColor: customAccentColor || "#ec4899" }}
                  >
                    DAY 1
                  </div>
                  <div className="text-white/60 font-bold uppercase tracking-widest">
                    {customHeader2 || "HONG KONG INVITATIONAL"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {logo && (
                  <img
                    src={logo}
                    alt=""
                    className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                  />
                )}
              </div>
            </div>

            {/* Top 1 Special Card */}
            {data.length > 0 && (
              <div
                className="w-full p-1 rounded-sm mb-6 shadow-[0_0_40px_rgba(236,72,153,0.2)]"
                style={{
                  background: `linear-gradient(to right, ${customAccentColor || "#ec4899"}, #831843)`,
                }}
              >
                <div className="bg-[#1a060f] flex items-center p-4">
                  <div
                    className="w-24 h-24 flex items-center justify-center font-black text-7xl italic border-r border-white/10 pr-6"
                    style={{ color: customAccentColor || "#ec4899" }}
                  >
                    #1
                  </div>
                  <div className="flex-1 flex items-center px-8">
                    {data[0].logo && (
                      <img
                        src={data[0].logo}
                        className="w-20 h-20 object-contain mr-6"
                      />
                    )}
                    <div>
                      <div className="text-4xl font-black text-white italic uppercase">
                        {data[0].teamName}
                      </div>
                      <div
                        className="font-bold text-sm tracking-widest"
                        style={{ color: customAccentColor || "#ec4899" }}
                      >
                        CURRENT MATCH LEADERS
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-12 px-8 border-l border-white/10">
                    <div className="text-center">
                      <div className="text-white/40 text-[10px] font-bold uppercase mb-1">
                        WWCD
                      </div>
                      <div className="text-3xl font-black text-white italic">
                        {data[0].wwcd || 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-white/40 text-[10px] font-bold uppercase mb-1">
                        ELIMS
                      </div>
                      <div className="text-3xl font-black text-white italic">
                        {data[0].totalKills || 0}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-white/40 text-[10px] font-bold uppercase mb-1">
                        TOTAL
                      </div>
                      <div
                        className="text-3xl font-black italic"
                        style={{ color: customAccentColor || "#ec4899" }}
                      >
                        {data[0].totalPoints || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2-Column Table */}
            <div className={cn(
              "flex-1 gap-x-8 gap-y-1 overflow-hidden t-scale",
              isMini ? "flex justify-center" : "grid grid-cols-2"
            )}>
              {[0, 10].map((colOffset) => {
                if (isMini && colOffset !== 0) return null;
                const columnData = isMini ? pageData : pageData.slice(colOffset === 0 ? 0 : 10, colOffset === 0 ? 10 : 20);
                
                return (
                  <div key={colOffset} className={cn("flex flex-col gap-1", isMini ? "w-full max-w-2xl px-12" : "")}>
                    <div
                      className="grid grid-cols-[50px_1fr_40px_40px_40px_60px] gap-2 px-4 py-2 text-white text-[9px] font-black italic uppercase tracking-wider"
                      style={{ backgroundColor: customAccentColor || "#ec4899" }}
                    >
                      <div>RANK</div>
                      <div>TEAM</div>
                      <div className="text-center">WWCD</div>
                      <div className="text-center">ELIMS</div>
                      <div className="text-center">PLACE</div>
                      <div className="text-center">TOTAL</div>
                    </div>
                    {columnData.map((team, idx) => {
                      const rank = startIdx + colOffset + idx + 1;
                      const isQualified =
                        qualificationCount > 0 && rank <= qualificationCount;
                      const isDisqualified =
                        disqualificationCount > 0 &&
                        rank > data.length - disqualificationCount;
                      return (
                        <motion.div
                          layout
                          transition={{ type: "spring", stiffness: 220, damping: 25 }}
                          key={team.teamName || idx}
                          className={cn(
                            "grid grid-cols-[50px_1fr_40px_40px_40px_60px] gap-2 h-9 items-center px-4 transition-all relative overflow-hidden",
                            "bg-white/5 border border-white/5 hover:bg-white/10",
                          )}
                        >
                          {isQualified && (
                            <div
                              className="absolute inset-0 opacity-10 pointer-events-none"
                              style={{ backgroundColor: customQualifiedColor }}
                            />
                          )}
                          {isDisqualified && (
                            <div
                              className="absolute inset-0 opacity-10 pointer-events-none"
                              style={{
                                backgroundColor: customDisqualifiedColor,
                              }}
                            />
                          )}
                          <div className="font-black italic text-white/50 text-sm">
                            #{rank}
                          </div>
                          <div className="flex items-center gap-2 overflow-hidden">
                            {team.logo && (
                              <img
                                src={team.logo}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <div
                              className={cn(
                                "font-black italic text-xs uppercase truncate",
                                isQualified
                                  ? ""
                                  : isDisqualified
                                    ? ""
                                    : "text-white",
                              )}
                              style={{
                                color: isQualified
                                  ? customQualifiedColor
                                  : isDisqualified
                                    ? customDisqualifiedColor
                                    : undefined,
                              }}
                            >
                              {team.teamName}
                            </div>
                          </div>
                          <div className="text-center font-bold text-white/60 text-[10px]">
                            {team.wwcd || 0}
                          </div>
                          <div className="text-center font-bold text-white/60 text-[10px]">
                            {team.totalKills || 0}
                          </div>
                          <div className="text-center font-bold text-white/60 text-[10px]">
                            {team.totalPlacementPoints || 0}
                          </div>
                          <div
                            className={cn(
                              "text-center font-black italic text-sm",
                              isQualified
                                ? ""
                                : isDisqualified
                                  ? ""
                                  : "text-white",
                            )}
                            style={{
                              color: isQualified
                                ? customQualifiedColor
                                : isDisqualified
                                  ? customDisqualifiedColor
                                  : undefined,
                            }}
                          >
                            {team.totalPoints || 0}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between items-end">
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {customFooter || "© 2026 KRAFTON & LIGHTSPEED"}
              </div>
              <SocialLinks
                instagram={socialInstagram}
                youtube={socialYoutube}
                color={customFooterColor || "#ec4899"}
              />
            </div>
          </div>
        </div>
      )}

      {templateId === "pmgo-sky" && (
        <div className="absolute inset-0 bg-[#0c1a2e] flex flex-col overflow-hidden">
          {/* Cloud/Sky Effect */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[#1e3a8a]/40 to-transparent" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% -20%, #60a5fa 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10 flex flex-col h-full p-12">
            <div className="flex justify-between items-start mb-12">
              <div className="flex gap-8 items-center">
                {logo && (
                  <img
                    src={logo}
                    className="w-24 h-24 object-contain filter drop-shadow-lg"
                  />
                )}
                <div className="flex flex-col">
                  <h1 className="text-[90px] font-black tracking-[-0.05em] text-white uppercase leading-[0.8] mb-2 shadow-text">
                    {customHeader1 || "LEADERBOARD"}
                  </h1>
                  <div
                    className="px-4 py-1 self-start transform -skew-x-12"
                    style={{ backgroundColor: customAccentColor || "#60a5fa" }}
                  >
                    <div className="text-[#0c1a2e] font-black italic text-sm tracking-widest">
                      {customHeader2 || "ESPORTS GLOBAL OPEN"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-8">
              {/* Main Table */}
              <div className="flex-[2] bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
                <div
                  className="grid grid-cols-[70px_1fr_80px_80px_100px] bg-white/10 border-b border-white/20 p-4 font-black italic text-[11px] tracking-widest uppercase"
                  style={{ color: customAccentColor || "#60a5fa" }}
                >
                  <div>RANK</div>
                  <div>TEAM</div>
                  <div className="text-center">ELIMS</div>
                  <div className="text-center">PLACE</div>
                  <div className="text-center">TOTAL POINTS</div>
                </div>
                <div className="overflow-y-auto">
                  {pageData.map((team, idx) => {
                    const rank = startIdx + idx + 1;
                    const isQualified =
                      qualificationCount > 0 && rank <= qualificationCount;
                    const isDisqualified =
                      disqualificationCount > 0 &&
                      rank > data.length - disqualificationCount;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "grid grid-cols-[70px_1fr_80px_80px_100px] border-b border-white/5 p-4 items-center hover:bg-white/5 transition-all text-white",
                          isQualified
                            ? "bg-[#60a5fa]/10"
                            : isDisqualified
                              ? "bg-red-500/10"
                              : "",
                        )}
                      >
                        <div className="font-mono text-white/50">#{rank}</div>
                        <div className="flex items-center gap-4">
                          {team.logo && (
                            <img
                              src={team.logo}
                              className="w-8 h-8 object-contain"
                            />
                          )}
                          <div
                            className={cn(
                              "font-black italic text-lg uppercase truncate",
                              isQualified
                                ? ""
                                : isDisqualified
                                  ? ""
                                  : "text-white",
                            )}
                            style={{
                              color: isQualified
                                ? customQualifiedColor
                                : isDisqualified
                                  ? customDisqualifiedColor
                                  : undefined,
                            }}
                          >
                            {team.teamName}
                          </div>
                        </div>
                        <div className="text-center font-bold">
                          {team.totalKills || 0}
                        </div>
                        <div className="text-center font-bold">
                          {team.totalPlacementPoints || 0}
                        </div>
                        <div
                          className={cn(
                            "text-center font-black italic text-xl",
                            isQualified
                              ? ""
                              : isDisqualified
                                ? ""
                                : "text-white",
                          )}
                          style={{
                            color: isQualified
                              ? customQualifiedColor
                              : isDisqualified
                                ? customDisqualifiedColor
                                : undefined,
                          }}
                        >
                          {team.totalPoints || 0}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Panel */}
              <div className="flex-1 flex flex-col gap-4">
                <div
                  className="bg-white p-6 rounded-xl shadow-xl flex flex-col border-b-[8px]"
                  style={{ borderBottomColor: customAccentColor || "#60a5fa" }}
                >
                  <div className="text-[#0c1a2e] font-black italic text-3xl tracking-tighter uppercase mb-6 text-center border-b-2 border-black/5 pb-4">
                    KILLCOUNT
                  </div>
                  <div className="space-y-4">
                    {data.slice(0, 4).map((team, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-[#0c1a2e] text-white p-2 flex flex-col items-center">
                            <div className="text-[8px] font-black uppercase opacity-50">
                              KILL
                            </div>
                            <div className="text-lg font-black">
                              {team.totalKills || 0}
                            </div>
                          </div>
                          <div className="text-[#0c1a2e] font-black italic text-xl uppercase truncate max-w-[120px]">
                            {team.teamName}
                          </div>
                        </div>
                        <div
                          className="w-12 h-1 group-hover:w-full transition-all"
                          style={{
                            backgroundColor: customAccentColor || "#60a5fa",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-black/5 flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div className="text-[10px] font-bold text-black/30 uppercase">
                        PLACE
                      </div>
                      <div className="text-4xl font-black text-[#0c1a2e] italic">
                        #1
                      </div>
                    </div>
                    <div className="w-px h-12 bg-black/5" />
                    <div className="text-center flex-1">
                      <div className="text-[10px] font-bold text-black/30 uppercase">
                        TX KILL
                      </div>
                      <div className="text-4xl font-black text-[#0c1a2e] italic">
                        {data[0]?.totalKills || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-white/5 rounded-xl p-6 flex flex-col items-center justify-center border border-white/10">
                  <div className="text-white/40 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">
                    PLATFORM PARTNER
                  </div>
                  <div className="flex gap-6 opacity-40">
                    <SocialLinks
                      instagram={socialInstagram}
                      youtube={socialYoutube}
                      color={customFooterColor || "white"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                {customFooter || "NO_REPRODUCTION_WITHOUT_CREDIT"}
              </div>
              <div className="h-px bg-white/10 flex-1 mx-12" />
              <div className="flex items-center gap-4">
                <div
                  className="text-xs font-black italic"
                  style={{ color: customFooterColor || "#60a5fa" }}
                >
                  PROXIMA BETA • LEVEL INFINITE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {templateId === "pmgo-gold" && (
        <div className="absolute inset-0 bg-[#3d2e1e] flex flex-col overflow-hidden font-sans">
          {/* Sand/Desert Vibe */}
          <div
            className="absolute inset-0 grayscale opacity-20 contrast-125"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#5c4033]/40 via-transparent to-[#5c4033]/60" />

          {/* Decorative Elements */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-[80%] border-r border-[#d97706]/20 bg-gradient-to-r from-[#d97706]/5 to-transparent" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-48 h-[80%] border-l border-[#d97706]/20 bg-gradient-to-l from-[#d97706]/5 to-transparent" />

          <div className="relative z-10 p-12 flex flex-col items-center h-full">
            {/* Header Box */}
            <div className="w-full max-w-4xl flex flex-col items-center mb-10 text-center">
              <div className="flex items-center gap-8 mb-2">
                <div
                  className="h-px w-24 opacity-40"
                  style={{ backgroundColor: customHeaderColor || "#d97706" }}
                />
                <div
                  className="font-black text-sm tracking-[0.5em] uppercase"
                  style={{ color: customHeaderColor || "#d97706" }}
                >
                  {customHeader2 || "PMGO AFRICA FINALS"}
                </div>
                <div
                  className="h-px w-24 opacity-40"
                  style={{ backgroundColor: customHeaderColor || "#d97706" }}
                />
              </div>
              <h1 className="text-[100px] font-black text-white italic tracking-tighter leading-none h1-scale uppercase drop-shadow-2xl">
                {customHeader1 || "LEADERBOARD"}
              </h1>
              <div
                className="px-8 py-1 mt-4"
                style={{ backgroundColor: customAccentColor || "#d97706" }}
              >
                <div className="text-black font-black italic text-xs tracking-[0.4em] uppercase">
                  {customHeader3 || "OVERALL RANKING"}
                </div>
              </div>
            </div>

            {/* Elegant Table */}
            <div
              className="w-full max-w-5xl bg-[#1a1510]/60 backdrop-blur-md rounded-lg overflow-hidden border shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]"
              style={{ borderColor: (customAccentColor || "#d97706") + "4d" }}
            >
              <div
                className="grid grid-cols-[80px_1fr_80px_80px_80px_100px] p-4 text-[11px] font-black uppercase tracking-[0.2em] border-b"
                style={{
                  backgroundColor: (customAccentColor || "#d97706") + "99",
                  color: customHeaderColor || "#d97706",
                  borderBottomColor: (customAccentColor || "#d97706") + "4d",
                }}
              >
                <div className="text-center">RANK</div>
                <div className="pl-6">TEAM NAME</div>
                <div className="text-center">WWCD</div>
                <div className="text-center">PLACE</div>
                <div className="text-center">ELIMS</div>
                <div className="text-center">TOTAL</div>
              </div>
              <div className="flex flex-col">
                {pageData.map((team, idx) => {
                  const rank = startIdx + idx + 1;
                  const isQualified =
                    qualificationCount > 0 && rank <= qualificationCount;
                  const isDisqualified =
                    disqualificationCount > 0 &&
                    rank > data.length - disqualificationCount;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "grid grid-cols-[80px_1fr_80px_80px_80px_100px] py-3 items-center border-b border-white/5 transition-all text-white/90 hover:bg-[#d97706]/5",
                        idx === 0 && startIdx === 0 && "bg-[#d97706]/10",
                      )}
                    >
                      <div className="text-center font-black italic text-lg opacity-40">
                        #{rank}
                      </div>
                      <div className="flex items-center gap-6 pl-6 overflow-hidden">
                        <div className="w-8 h-8 bg-white/5 rounded-sm p-1 flex items-center justify-center border border-white/10 shrink-0">
                          {team.logo && (
                            <img
                              src={team.logo}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div
                          className={cn(
                            "font-black italic text-xl uppercase truncate",
                            isQualified ? "" : "text-white",
                          )}
                          style={{
                            color: isQualified
                              ? customQualifiedColor
                              : undefined,
                          }}
                        >
                          {team.teamName}
                        </div>
                      </div>
                      <div className="text-center font-bold text-white/50 italic text-sm">
                        {team.wwcd || "-"}
                      </div>
                      <div className="text-center font-bold text-white/50 text-sm">
                        {team.totalPlacementPoints || 0}
                      </div>
                      <div className="text-center font-bold text-white/50 text-sm">
                        {team.totalKills || 0}
                      </div>
                      <div
                        className={cn(
                          "text-center font-black italic text-2xl pr-4",
                          isQualified ? "" : "text-white",
                        )}
                        style={{
                          color: isQualified ? customQualifiedColor : undefined,
                        }}
                      >
                        {team.totalPoints || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gold Footer */}
            <div className="w-full flex justify-between items-center mt-auto pt-10">
              <div className="flex gap-8 grayscale opacity-50">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/e/ea/Logo_Krafton.png"
                  className="h-6 object-contain invert"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Tencent_logo.svg"
                  className="h-6 object-contain invert"
                />
              </div>
              <div className="flex flex-col items-end gap-2">
                <SocialLinks
                  instagram={socialInstagram}
                  youtube={socialYoutube}
                  color={customFooterColor || "#d97706"}
                />
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.4em]"
                  style={{ color: (customFooterColor || "#d97706") + "66" }}
                >
                  {customFooter || "ROAD TO PMGO"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {templateId === "cyber-glitch" && (
        <div className="absolute inset-0 bg-black flex flex-col overflow-hidden font-mono">
          {/* Scanline Effect */}
          <div className="absolute inset-0 z-50 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
          <div className="absolute inset-x-0 top-0 h-px bg-[#f0f] shadow-[0_0_20px_#f0f] animate-pulse" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[#0ff] shadow-[0_0_20px_#0ff] animate-pulse" />

          <div className="relative z-10 flex flex-col h-full p-12">
            <div className="flex justify-between items-end mb-12">
              <div className="flex flex-col">
                <div
                  className="text-[10px] font-bold tracking-[0.8em] uppercase mb-2"
                  style={{ color: customHeaderColor || "#f0f" }}
                >
                  SYSTEM_OVERRIDE_V2.0
                </div>
                <h1 className="text-8xl font-black tracking-tighter text-white italic h1-scale uppercase leading-[0.8] cyber-glitch-text">
                  {customHeader1 || "TERMINAL_RANK"}
                </h1>
                <div className="flex items-center gap-4 mt-4">
                  <div
                    className="px-3 py-1 text-black font-black text-xs italic"
                    style={{ backgroundColor: customAccentColor || "#0ff" }}
                  >
                    SYNC_ACTIVE
                  </div>
                  <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                    {customHeader2 || "NIGHT_CITY_FINALS"}
                  </div>
                </div>
              </div>
              {logo && (
                <img
                  src={logo}
                  className="w-24 h-24 object-contain filter hue-rotate-90 drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                />
              )}
            </div>

            <div className={cn(
              "flex-1 overflow-hidden gap-x-12 gap-y-[2px]",
              isMini ? "flex justify-center" : "grid grid-cols-2"
            )}>
              {[0, 10].map((colOffset) => {
                if (isMini && colOffset !== 0) return null;
                const columnData = isMini ? pageData : pageData.slice(colOffset === 0 ? 0 : 10, colOffset === 0 ? 10 : 20);

                return (
                  <div key={colOffset} className={cn("flex flex-col gap-[2px]", isMini ? "w-full max-w-2xl px-12" : "")}>
                    <div
                      className="grid grid-cols-[50px_1fr_40px_40px_60px] gap-2 px-4 py-2 bg-white/5 border-l-4 text-[9px] font-black uppercase tracking-widest"
                      style={{
                        borderLeftColor: customAccentColor || "#f0f",
                        color: customAccentColor || "#f0f",
                      }}
                    >
                      <div>ID</div>
                      <div>MERCENARY_GROUP</div>
                      <div className="text-center">K</div>
                      <div className="text-center">P</div>
                      <div className="text-center">SCORE</div>
                    </div>
                    {columnData.map((team, idx) => {
                      const rank = startIdx + colOffset + idx + 1;
                      const isQualified =
                        qualificationCount > 0 && rank <= qualificationCount;
                      const isDisqualified =
                        disqualificationCount > 0 &&
                        rank > data.length - disqualificationCount;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "grid grid-cols-[50px_1fr_40px_40px_60px] gap-2 h-9 items-center px-4 transition-all relative border border-white/5",
                            isQualified
                              ? "bg-[#f0f]/10"
                              : isDisqualified
                                ? "bg-red-500/10"
                                : "hover:bg-[#f0f]/10",
                          )}
                        >
                          {isQualified && (
                            <div
                              className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                              style={{ backgroundColor: customQualifiedColor }}
                            />
                          )}
                          {isDisqualified && (
                            <div
                              className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                              style={{
                                backgroundColor: customDisqualifiedColor,
                              }}
                            />
                          )}
                          <div className="font-mono text-white/30 text-xs">
                            {String(rank).padStart(2, "0")}
                          </div>
                          <div className="flex items-center gap-3 overflow-hidden">
                            {team.logo && (
                              <img
                                src={team.logo}
                                className="w-6 h-6 object-contain grayscale brightness-200"
                              />
                            )}
                            <div
                              className={cn(
                                "font-black italic text-xs uppercase truncate",
                                isQualified ? "" : "text-white",
                              )}
                              style={{
                                color: isQualified
                                  ? customQualifiedColor
                                  : undefined,
                              }}
                            >
                              {team.teamName}
                            </div>
                          </div>
                          <div className="text-center font-bold text-white/40 text-[10px]">
                            {team.totalKills || 0}
                          </div>
                          <div className="text-center font-bold text-white/40 text-[10px]">
                            {team.totalPlacementPoints || 0}
                          </div>
                          <div
                            className={cn(
                              "text-center font-black text-sm",
                              isQualified ? "" : "",
                            )}
                            style={{
                              color: isQualified
                                ? customQualifiedColor
                                : customAccentColor || "#0ff",
                            }}
                          >
                            {team.totalPoints || 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div
              className="mt-8 flex justify-between items-center text-[9px] font-bold italic tracking-widest"
              style={{ color: (customFooterColor || "#f0f") + "4d" }}
            >
              <div>{customFooter || "CONNECTION_STABLE // 84.46.89.3947"}</div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#0ff] rounded-full animate-ping" />
                  <span>LIVE_FEED</span>
                </div>
                <SocialLinks
                  instagram={socialInstagram}
                  youtube={socialYoutube}
                  color={customFooterColor || "#f0f"}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {templateId === "vanguard-premier" && (
        <div className="absolute inset-0 bg-[#1a201a] flex flex-col overflow-hidden font-sans">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #2c3e2c 0px, #2c3e2c 1px, transparent 1px, transparent 10px)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-96 h-96 blur-[120px]"
            style={{ backgroundColor: (customAccentColor || "#bef264") + "0d" }}
          />

          <div className="relative z-10 flex flex-col h-full p-12">
            <div className="flex gap-12 items-center mb-16">
              <div className="relative">
                <div
                  className="absolute -inset-4 border-2 skew-x-12"
                  style={{
                    borderColor: (customAccentColor || "#bef264") + "4d",
                  }}
                />
                {logo && (
                  <img src={logo} className="w-24 h-24 object-contain" />
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-9xl font-black italic tracking-tighter text-white h1-scale uppercase leading-[0.7] transform -skew-x-12 mb-4">
                  {customHeader1 || "VANGUARD"}
                </h1>
                <div className="flex items-center gap-6">
                  <div
                    className="text-black px-4 py-1 font-black italic text-sm skew-x-12"
                    style={{ backgroundColor: customAccentColor || "#bef264" }}
                  >
                    {customHeader2 || "PREMIER DIVISION"}
                  </div>
                  <div
                    className="font-black text-xs uppercase tracking-[0.3em]"
                    style={{ color: (customHeaderColor || "#bef264") + "99" }}
                  >
                    SEASON 01 // MATCH DAY 04
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-8">
            <div className={cn(
              "flex-1 flex flex-col gap-2 transition-all",
              isMini ? "w-full max-w-3xl mx-auto" : "flex-[3]"
            )}>
              <div
                className="grid grid-cols-[80px_1fr_60px_60px_80px] bg-white/5 border-b-2 px-6 py-4 font-black italic text-xs uppercase tracking-widest"
                style={{
                  borderBottomColor: customAccentColor || "#bef264",
                  color: customAccentColor || "#bef264",
                }}
              >
                <div>POS</div>
                <div>DEPARTMENT / SQUAD</div>
                <div className="text-center">K</div>
                <div className="text-center">P</div>
                <div className="text-right pr-4">TOTAL_XP</div>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto pr-2">
                {pageData.map((team, idx) => {
                  const rank = startIdx + idx + 1;
                    const isQualified =
                      qualificationCount > 0 && rank <= qualificationCount;
                    const isDisqualified =
                      disqualificationCount > 0 &&
                      rank > data.length - disqualificationCount;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "grid grid-cols-[80px_1fr_60px_60px_80px] h-12 items-center px-6 transition-all group border-l-4",
                          isQualified
                            ? "bg-[#bef264]/10"
                            : isDisqualified
                              ? "bg-red-500/10"
                              : "bg-[#242d24] border border-white/5 hover:bg-[#bef264]/10 hover:border-[#bef264]/30",
                        )}
                        style={{
                          borderLeftColor: isQualified
                            ? customQualifiedColor
                            : isDisqualified
                              ? customDisqualifiedColor
                              : undefined,
                        }}
                      >
                        <div className="font-mono text-white/20 text-lg">
                          #{String(rank).padStart(2, "0")}
                        </div>
                        <div className="flex items-center gap-4 overflow-hidden">
                          {team.logo && (
                            <img
                              src={team.logo}
                              className="w-8 h-8 object-contain opacity-80 group-hover:opacity-100"
                            />
                          )}
                          <div
                            className={cn(
                              "font-black italic text-lg uppercase truncate",
                              isQualified ? "" : "text-white/90",
                            )}
                            style={{
                              color: isQualified
                                ? customQualifiedColor
                                : undefined,
                            }}
                          >
                            {team.teamName}
                          </div>
                        </div>
                        <div className="text-center font-bold text-white/40">
                          {team.totalKills || 0}
                        </div>
                        <div className="text-center font-bold text-white/40">
                          {team.totalPlacementPoints || 0}
                        </div>
                        <div
                          className={cn(
                            "text-right pr-4 font-black italic text-xl",
                            isQualified ? "" : "",
                          )}
                          style={{
                            color: isQualified
                              ? customQualifiedColor
                              : customAccentColor || "#bef264",
                          }}
                        >
                          {team.totalPoints || 0}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div
                  className="bg-[#242d24] p-6 border-l-4 flex flex-col items-center justify-center text-center"
                  style={{ borderLeftColor: customAccentColor || "#bef264" }}
                >
                  <div
                    className="font-black text-[10px] uppercase mb-4"
                    style={{ color: (customAccentColor || "#bef264") + "66" }}
                  >
                    TABLE PEAK
                  </div>
                  <Trophy
                    size={48}
                    className="mb-4"
                    style={{ color: customAccentColor || "#bef264" }}
                  />
                  <div className="text-white font-black italic text-xl uppercase leading-tight mb-2 truncate w-full">
                    {data[0]?.teamName || "-"}
                  </div>
                  <div
                    className="font-black text-3xl"
                    style={{ color: customAccentColor || "#bef264" }}
                  >
                    {data[0]?.totalPoints || 0}
                  </div>
                  <div className="text-white/20 text-[9px] font-bold uppercase mt-2">
                    TOTAL CREDITS
                  </div>
                </div>
                <div className="flex-1 border-2 border-white/5 p-6 flex flex-col justify-end">
                  <SocialLinks
                    instagram={socialInstagram}
                    youtube={socialYoutube}
                    color={customFooterColor || "#bef264"}
                  />
                  <div className="mt-4 text-white/10 text-[8px] font-black uppercase tracking-[0.4em] leading-relaxed">
                    {customFooter || "BROADCAST_AUTH // SECURE_CHANNEL_V8"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {templateId === "nebula-circuit" && (
        <div className="absolute inset-0 bg-[#050510] flex flex-col overflow-hidden text-white font-sans">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-purple-600/5 blur-[150px] rounded-full" />

          <div className="relative z-10 flex flex-col h-full p-12">
            <div className="flex justify-between items-center mb-10">
              <div className="flex flex-col">
                <h1
                  className="text-[100px] font-black tracking-[-0.08em] uppercase leading-[0.7] h1-scale nebula-glow"
                  style={{ color: customHeaderColor || undefined }}
                >
                  {customHeader1 || "NEBULA"}
                </h1>
                <div
                  className="font-bold uppercase tracking-[0.8em] text-[10px] mt-4 h2-scale"
                  style={{ color: customAccentColor || "#a855f7" }}
                >
                  {customHeader2 || "COSMIC TOURNAMENT"}
                </div>
              </div>
              {logo && (
                <img
                  src={logo}
                  className="w-24 h-24 object-contain nebula-glow"
                />
              )}
            </div>

            <div className={cn(
              "flex-1 gap-x-8 gap-y-1 overflow-hidden",
              isMini ? "flex justify-center" : "grid grid-cols-2"
            )}>
              {[0, 10].map((colOffset) => {
                if (isMini && colOffset !== 0) return null;
                const columnData = isMini ? pageData : pageData.slice(colOffset === 0 ? 0 : 10, colOffset === 0 ? 10 : 20);

                return (
                  <div key={colOffset} className={cn("flex flex-col gap-1", isMini ? "w-full max-w-2xl px-12" : "")}>
                    <div className="grid grid-cols-[40px_40px_1fr_40px_40px_50px] items-center px-4 py-2 border-b border-purple-500/30 text-purple-400/50 text-[8px] font-black uppercase tracking-widest">
                      <div>RANK</div>
                      <div>LOGO</div>
                      <div>TEAM NAME</div>
                      <div className="text-center">KILLS</div>
                      <div className="text-center">POS</div>
                      <div className="text-right">TOTAL</div>
                    </div>
                    {columnData.map((team, idx) => {
                      const rank = startIdx + colOffset + idx + 1;
                      const isQualified =
                        qualificationCount > 0 && rank <= qualificationCount;
                      const isDisqualified =
                        disqualificationCount > 0 &&
                        rank > data.length - disqualificationCount;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "group grid grid-cols-[40px_40px_1fr_40px_40px_50px] items-center h-10 transition-all relative overflow-hidden",
                            "bg-white/5 border border-white/5 hover:bg-white/10",
                          )}
                        >
                          {isQualified && (
                            <div
                              className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                              style={{ backgroundColor: customQualifiedColor }}
                            />
                          )}
                          {isDisqualified && (
                            <div
                              className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                              style={{
                                backgroundColor: customDisqualifiedColor,
                              }}
                            />
                          )}
                          <div className="text-center font-black italic text-sm text-white/20 group-hover:text-purple-500/50">
                            #{rank}
                          </div>
                          <div className="flex justify-center p-1">
                            {team.logo && (
                              <img
                                src={team.logo}
                                className="h-6 w-6 object-contain nebula-glow"
                              />
                            )}
                          </div>
                          <div
                            className={cn(
                              "font-black italic text-xs uppercase tracking-tighter truncate px-2",
                              isQualified ? "" : "text-white/90",
                            )}
                            style={{
                              color: isQualified
                                ? customQualifiedColor
                                : isDisqualified
                                  ? customDisqualifiedColor
                                  : undefined,
                            }}
                          >
                            {team.teamName}
                          </div>
                          <div className="text-center text-[10px] font-black opacity-60">
                            {team.totalKills || 0}
                          </div>
                          <div className="text-center text-[10px] font-black opacity-60">
                            {team.totalPlacementPoints || 0}
                          </div>
                          <div
                            className={cn(
                              "text-right font-black italic text-lg pr-2 nebula-glow",
                              isQualified
                                ? ""
                                : isDisqualified
                                  ? ""
                                  : "text-white",
                            )}
                            style={{
                              color: isQualified
                                ? customQualifiedColor
                                : isDisqualified
                                  ? customDisqualifiedColor
                                  : undefined,
                            }}
                          >
                            {team.totalPoints || 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between items-center px-4 border-t border-white/5 pt-6">
              <div
                className="text-white/20 font-black text-[8px] tracking-[0.5em] uppercase f-scale"
                style={{ color: customFooterColor || undefined }}
              >
                {customFooter || "UNIVERSE_SYNC_STABLE"}
              </div>
              <SocialLinks
                instagram={socialInstagram}
                youtube={socialYoutube}
                color={customFooterColor || "white"}
              />
            </div>
          </div>
        </div>
      )}

      {templateId === "horizon-series" && (
        <div className="absolute inset-0 bg-[#f8fafc] flex flex-col overflow-hidden text-slate-900 font-sans">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(#6366f1 1px, transparent 0)",
              backgroundSize: "64px 64px",
            }}
          />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6366f1]/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 flex flex-col h-full p-8">
            <div className="flex justify-between items-start mb-10">
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className="w-12 h-1"
                    style={{ backgroundColor: customAccentColor || "#6366f1" }}
                  />
                  <div
                    className="font-black text-xs tracking-[0.4em] uppercase h2-scale"
                    style={{ color: customAccentColor || "#6366f1" }}
                  >
                    {customHeader2 || "HORIZON PREVIEW"}
                  </div>
                </div>
                <h1
                  className="text-[100px] font-black tracking-[-0.08em] uppercase leading-[0.7] h1-scale"
                  style={{ color: customHeaderColor || "#1e293b" }}
                >
                  {customHeader1 || "SERIES"}
                </h1>
              </div>
              {logo && (
                <img
                  src={logo}
                  className="w-20 h-20 object-contain filter grayscale contrast-200"
                />
              )}
            </div>

            <div className={cn(
              "flex-1 overflow-hidden gap-x-10 gap-y-[1px]",
              isMini ? "flex justify-center" : "grid grid-cols-2"
            )}>
              {[0, 10].map((colOffset) => {
                if (isMini && colOffset !== 0) return null;
                const columnData = isMini ? pageData : pageData.slice(colOffset === 0 ? 0 : 10, colOffset === 0 ? 10 : 20);

                return (
                  <div key={colOffset} className={cn("flex flex-col gap-0.5", isMini ? "w-full max-w-2xl px-12" : "")}>
                    <div
                      className="grid grid-cols-[40px_1fr_40px_40px_60px] items-center px-4 py-2 border-b-2 text-slate-400 text-[8px] font-black uppercase tracking-widest"
                      style={{
                        borderBottomColor: customAccentColor || "#0f172a",
                      }}
                    >
                      <div>RANK</div>
                      <div>PARTICIPANT</div>
                      <div className="text-center">K</div>
                      <div className="text-center">P</div>
                      <div className="text-right">TOTAL</div>
                    </div>
                    {columnData.map((team, idx) => {
                      const rank = startIdx + colOffset + idx + 1;
                      const isQualified =
                        qualificationCount > 0 && rank <= qualificationCount;
                      const isDisqualified =
                        disqualificationCount > 0 &&
                        rank > data.length - disqualificationCount;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "grid grid-cols-[40px_1fr_40px_40px_60px] h-10 items-center px-4 transition-all relative border-b border-slate-100 hover:bg-white",
                          isQualified
                            ? "bg-[#6366f1]/5 shadow-sm"
                            : isDisqualified
                              ? "bg-red-500/5 shadow-sm"
                              : "",
                          )}
                        >
                          {isQualified && (
                            <div
                              className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                              style={{ backgroundColor: customQualifiedColor }}
                            />
                          )}
                          {isDisqualified && (
                            <div
                              className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                              style={{
                                backgroundColor: customDisqualifiedColor,
                              }}
                            />
                          )}
                          <div className="font-mono text-slate-300 text-base font-bold">
                            #{rank}
                          </div>
                          <div className="flex items-center gap-3 overflow-hidden">
                            {team.logo && (
                              <img
                                src={team.logo}
                                className="w-6 h-6 object-contain filter grayscale"
                              />
                            )}
                            <div
                              className={cn(
                                "font-black text-2xl uppercase truncate tracking-tighter text-slate-800 t-scale",
                                isQualified ? "" : isDisqualified ? "" : "",
                              )}
                              style={{
                                color: isQualified
                                  ? customQualifiedColor
                                  : isDisqualified
                                    ? customDisqualifiedColor
                                    : undefined,
                              }}
                            >
                              {team.teamName}
                            </div>
                          </div>
                          <div className="text-center font-bold text-slate-400 text-[10px]">
                            {team.totalKills || 0}
                          </div>
                          <div className="text-center font-bold text-slate-400 text-[10px]">
                            {team.totalPlacementPoints || 0}
                          </div>
                          <div
                            className={cn(
                              "text-right font-black text-xl text-slate-900 italic transform -skew-x-12 t-scale",
                              isQualified ? "" : isDisqualified ? "" : "",
                            )}
                            style={{
                              color: isQualified
                                ? customQualifiedColor
                                : isDisqualified
                                  ? customDisqualifiedColor
                                  : undefined,
                            }}
                          >
                            {team.totalPoints || 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-6 flex justify-between items-center">
              <div
                className="text-slate-300 text-[11px] font-medium tracking-[0.2em] f-scale"
                style={{ color: customFooterColor || undefined }}
              >
                {customFooter || "SERIES OFFICIAL BROADCAST"}
              </div>
              <SocialLinks
                instagram={socialInstagram}
                youtube={socialYoutube}
                color={customFooterColor || "#1e293b"}
              />
            </div>
          </div>
        </div>
      )}

      {templateId === "velocity-pro" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 20px)",
            }}
          />
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#ef4444]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#ef4444]/20 to-transparent" />
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-[#ef4444]/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/2 -right-20 w-80 h-80 bg-[#ef4444]/5 blur-[120px] rounded-full" />
          {/* Slanted lines */}
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
            <div
              className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rotate-[25deg]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, transparent 45%, #ef4444 50%, transparent 55%)",
                backgroundSize: "200px 100%",
              }}
            />
          </div>
        </>
      )}

      {templateId === "solaris-elite" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/black-linen.png")',
            }}
          />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#eab308]/50 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#eab308]/50 to-transparent" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#eab308]/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#eab308]/5 blur-[150px] rounded-full" />
          <div className="absolute inset-0 border-[40px] border-[#eab308]/[0.02] pointer-events-none" />
        </>
      )}

      {templateId === "frostbite-series" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(#00d4ff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.5)]" />
          <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-[#00d4ff]/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-[#00d4ff]/10 blur-[100px] rounded-full" />
          <div className="absolute top-0 right-0 p-8">
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="opacity-20"
            >
              <path
                d="M0 0 L200 0 L200 200 Z"
                fill="none"
                stroke="#00d4ff"
                strokeWidth="0.5"
              />
              <path d="M50 0 L200 150" stroke="#00d4ff" strokeWidth="0.5" />
              <path d="M100 0 L200 100" stroke="#00d4ff" strokeWidth="0.5" />
            </svg>
          </div>
        </>
      )}

      {templateId === "shadow-ops" && (
        <>
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #22c55e 0.5px, transparent 0.5px), linear-gradient(-45deg, #22c55e 0.5px, transparent 0.5px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute top-0 left-0 w-full h-2 bg-[#22c55e]/20" />
          <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-[#22c55e] m-8 opacity-20" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-[#22c55e] m-8 opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#22c55e]/5 blur-[200px] rounded-full" />
          {/* Aim/Crosshair corners */}
          <div className="absolute top-1/2 left-8 w-8 h-px bg-[#22c55e]/40" />
          <div className="absolute top-1/2 right-8 w-8 h-px bg-[#22c55e]/40" />
          <div className="absolute top-8 left-1/2 w-px h-8 bg-[#22c55e]/40" />
          <div className="absolute bottom-8 left-1/2 w-px h-8 bg-[#22c55e]/40" />
        </>
      )}

      {templateId === "premium-8" && (
        <>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/cubes.png")',
            }}
          />
          <div className="absolute top-0 left-0 w-full h-32 bg-emerald-600/10" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-emerald-600/10" />
          <div className="absolute top-5 right-5 text-4xl opacity-20">🌴</div>
        </>
      )}

      {templateId === "republic-utsav" && (
        <>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'url("https://www.transparenttextures.com/patterns/natural-paper.png")',
            }}
          />
          {/* Palm Trees Placeholder */}
          <div className="absolute top-0 left-0 w-80 h-80 text-9xl opacity-40 select-none pointer-events-none">
            🌴
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 text-9xl opacity-40 select-none pointer-events-none transform -scale-x-100">
            🌴
          </div>
          <div className="absolute bottom-40 left-0 w-64 h-64 text-8xl opacity-30 select-none pointer-events-none">
            🌿
          </div>
          <div className="absolute bottom-40 right-0 w-64 h-64 text-8xl opacity-30 select-none pointer-events-none transform -scale-x-100">
            🌿
          </div>
          {/* Birds */}
          <div className="absolute top-10 left-1/4 text-3xl opacity-50">🕊️</div>
          <div className="absolute top-16 left-1/3 text-2xl opacity-40">🕊️</div>
          <div className="absolute top-24 right-1/4 text-2xl opacity-40">
            🕊️
          </div>
          <div className="absolute top-32 right-1/3 text-xl opacity-30">🕊️</div>
        </>
      )}

      {!isFullTemplate && (
        <>
          {/* Header */}
          <div
            className={cn(
              "flex flex-col items-center relative z-10 w-full px-12",
              isPro ? "mt-24 mb-16" : "mt-8 mb-12",
            )}
          >
            {isPro ? (
              <div className="flex flex-col items-center w-full">
                {isTropicalPro ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="text-3xl font-bold tracking-[0.3em] uppercase mb-1 text-sky-900/80 drop-shadow-sm h1-scale">
                      {customHeader1 || "RVNC ESPORTS"}
                    </div>
                    <div className="text-xs tracking-[0.6em] uppercase mb-4 opacity-70 text-sky-900/60 font-bold h2-scale">
                      {customHeader2 || "P R E S E N T S"}
                    </div>

                    <div className="relative mb-4 h3-scale">
                      <h1
                        className="text-[220px] font-black uppercase tracking-tighter text-[#15803d] drop-shadow-[0_15px_15px_rgba(0,0,0,0.3)] text-center leading-none"
                        style={{
                          WebkitTextStroke: "8px white",
                          paintOrder: "stroke fill",
                        }}
                      >
                        {customHeader3 || "30k"}
                      </h1>
                    </div>

                    <h2
                      className="text-8xl font-bold italic tracking-tight text-[#eab308] -mt-12 drop-shadow-[0_6px_6px_rgba(0,0,0,0.3)] text-center h4-scale"
                      style={{ fontFamily: "'Dancing Script', cursive" }}
                    >
                      {customHeader4 || "Grand Finals"}
                    </h2>

                    <div className="mt-12 bg-[#15803d] px-24 py-5 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(21,128,61,0.5)] border-4 border-white/20 t-scale">
                      <span className="text-white font-black tracking-[0.25em] text-5xl uppercase">
                        {customTableTitle || "OVERALL STANDINGS"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <div
                      className="text-3xl font-bold tracking-[0.3em] uppercase mb-1 drop-shadow-sm font-spooky h1-scale"
                      style={{ color: customHeaderColor || "#fbbf24" }}
                    >
                      {customHeader1 || "RVNC ESPORTS"}
                    </div>
                    <div
                      className="text-sm tracking-[0.5em] uppercase mb-4 opacity-80 font-script h2-scale"
                      style={{ color: customAccentColor || "#ffffff" }}
                    >
                      {customHeader2 || "P R E S E N T S"}
                    </div>

                    <div className="relative mb-4 h3-scale">
                      <h1
                        className="text-[160px] font-spooky uppercase tracking-tighter drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] text-center leading-none"
                        style={{
                          WebkitTextStroke: "4px black",
                          paintOrder: "stroke fill",
                          color: customHeaderColor || "#fbbf24",
                        }}
                      >
                        {customHeader3 || "OK REPUBLIC UTSAV"}
                      </h1>
                    </div>

                    <h2
                      className="text-8xl font-script tracking-tight -mt-12 drop-shadow-[0_6px_6px_rgba(0,0,0,0.5)] text-center h4-scale"
                      style={{ color: customAccentColor || "#ffffff" }}
                    >
                      {customHeader4 || "Grand Finals"}
                    </h2>

                    {/* Pumpkins */}
                    <div className="flex gap-12 mt-8">
                      {["🎃", "🎃", "🎃"].map((p, i) => (
                        <div
                          key={i}
                          className="text-9xl drop-shadow-[0_10px_20px_rgba(249,115,22,0.5)] animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        >
                          {p}
                        </div>
                      ))}
                    </div>

                    <div
                      className="mt-12 font-script text-6xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] t-scale"
                      style={{ color: customHeaderColor || "#fbbf24" }}
                    >
                      {customTableTitle || "OVERALL STANDINGS"}
                    </div>
                  </div>
                )}
              </div>
            ) : templateId === "cyber-elite" ? (
              <div className="flex flex-col items-center w-full px-16 pt-10">
                <div className="w-full flex justify-between items-end mb-8 relative">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3 mb-2 h2-scale">
                      <div
                        className="w-12 h-[2px]"
                        style={{
                          backgroundColor: customAccentColor || "#f43f5e",
                        }}
                      />
                      <span
                        className="text-[10px] font-black tracking-[0.5em] uppercase"
                        style={{ color: customAccentColor || "#f43f5e" }}
                      >
                        {customHeader2 || "Cyber Elite League"}
                      </span>
                    </div>
                    <h1 className="text-8xl font-black italic tracking-tighter text-white leading-none uppercase h3-scale">
                      {customHeader3 || "GRAND FINALS"}
                    </h1>
                    <div className="text-xl font-bold tracking-[0.2em] uppercase text-white/40 mt-1 h4-scale">
                      {customHeader4 || "SEASON_01"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <div className="text-[10px] font-mono text-white/40 mb-2 tracking-[0.2em]">
                      SYSTEM_RUNNING_V1.0
                    </div>
                    <div className="px-6 py-2 bg-gradient-to-r from-[#f43f5e] to-[#9f1239] text-white text-xs font-black italic shadow-[0_0_20px_rgba(244,63,94,0.3)] h1-scale">
                      {customHeader1 || "PRO SERIES"}
                    </div>
                  </div>
                </div>
                <div className="w-full h-16 relative mt-4 border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-[#f43f5e]" />
                  <div className="absolute top-0 right-0 w-2 h-full bg-[#f43f5e]" />
                  <div className="flex gap-16 whitespace-nowrap opacity-10 font-black italic text-3xl italic tracking-widest uppercase">
                    <span>{customTableTitle || "OVERALL STANDINGS"}</span>
                    <span>{customTableTitle || "OVERALL STANDINGS"}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-3xl font-black italic tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] t-scale">
                      {customTableTitle || "OVERALL STANDINGS"}
                    </h2>
                  </div>
                </div>
              </div>
            ) : templateId === "velocity-pro" ? (
              <div className="flex flex-col items-center w-full px-12 pt-12 relative">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 text-[180px] font-black italic text-white/[0.03] -translate-x-10 leading-none select-none">
                    VELOCITY
                  </div>
                </div>
                <div className="w-full flex justify-between items-start z-10">
                  <div className="flex flex-col transform -skew-x-12">
                    <div
                      className="transform -skew-x-12 px-4 py-1 text-[10px] font-black italic tracking-widest h1-scale uppercase mb-2"
                      style={{
                        backgroundColor: customAccentColor || "#ef4444",
                        color: "white",
                      }}
                    >
                      {customHeader1 || "ELITE COMPETITION"}
                    </div>
                    <h1 className="text-[120px] font-black italic leading-none tracking-tighter text-white h3-scale">
                      {customHeader3 || "GRAND FINALS"}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 h2-scale">
                      <div className="h-px w-20 bg-white/20" />
                      <span className="text-xl font-bold italic text-white/50">
                        {customHeader2 || "PHASE 01"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end pt-4">
                    {logo ? (
                      <div className="w-32 h-32 bg-white/5 p-4 rounded-xl border border-white/10 rotate-3 shadow-2xl">
                        <img
                          src={logo}
                          alt=""
                          className="w-full h-full object-contain -rotate-3"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-white/10 flex items-center justify-center font-black italic text-[#ef4444] text-2xl rotate-3">
                        V_P
                      </div>
                    )}
                    <div className="mt-4 text-right">
                      <div className="text-[10px] font-mono text-white/40 h4-scale uppercase tracking-tighter">
                        {customHeader4 || "VER: 1.0.4.R"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-12 w-full flex items-center gap-6 z-10">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#ef4444]/50" />
                  <h2
                    className="text-4xl font-black italic tracking-[0.2em] transform -skew-x-12 t-scale"
                    style={{ color: customAccentColor || "white" }}
                  >
                    {customTableTitle || "OVERALL STANDINGS"}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#ef4444]/50" />
                </div>
              </div>
            ) : templateId === "solaris-elite" ? (
              <div className="flex flex-col items-center w-full px-16 pt-16 relative">
                <div className="w-full flex flex-col items-center z-10">
                  <div
                    className="text-sm font-bold tracking-[0.8em] uppercase mb-4 h1-scale"
                    style={{ color: customHeaderColor || "#eab308" }}
                  >
                    {customHeader1 || "TOURNAMENT SUPREMACY"}
                  </div>
                  <div
                    className="h-[1px] w-32 mb-8"
                    style={{
                      backgroundImage: `linear-gradient(to right, transparent, ${customAccentColor || "#eab308"}, transparent)`,
                    }}
                  />

                  <div className="flex items-center gap-12">
                    <div
                      className="h-[2px] w-24 opacity-20"
                      style={{
                        backgroundColor: customAccentColor || "#eab308",
                      }}
                    />
                    <h1 className="text-7xl font-light tracking-[0.3em] text-white uppercase text-center h3-scale">
                      {customHeader3 || "Grand Finals"}
                    </h1>
                    <div
                      className="h-[2px] w-24 opacity-20"
                      style={{
                        backgroundColor: customAccentColor || "#eab308",
                      }}
                    />
                  </div>

                  <div
                    className="text-xl tracking-[0.5em] text-white/40 mt-4 uppercase h2-scale"
                    style={{ color: (customHeaderColor || "#ffffff") + "66" }}
                  >
                    {customHeader2 || "Solaris Series"}
                  </div>

                  <div className="mt-16 w-full flex justify-center py-4 border-y border-white/5 bg-white/[0.02] t-scale">
                    <h2
                      className="text-3xl font-bold tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      style={{ color: customAccentColor || "#eab308" }}
                    >
                      {customTableTitle || "Overall Standings"}
                    </h2>
                  </div>

                  <div className="mt-4 flex gap-8 items-center text-[10px] font-mono tracking-widest text-white/30 h4-scale uppercase">
                    <span>{customHeader4 || "SEASON 2026"}</span>
                    <div className="w-1 h-1 bg-[#eab308] rounded-full" />
                    <span>EXCELLENCE IN ESPORTS</span>
                  </div>
                </div>
              </div>
            ) : templateId === "frostbite-series" ? (
              <div className="flex flex-col items-center w-full px-12 pt-12">
                <div className="w-full flex items-center gap-8 mb-12 border-l-4 border-[#00d4ff] pl-8">
                  {logo && (
                    <img
                      src={logo}
                      alt=""
                      className="w-24 h-24 object-contain filter drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]"
                    />
                  )}
                  <div className="flex flex-col">
                    <div
                      className="text-xl font-bold tracking-[0.4em] uppercase h1-scale"
                      style={{ color: customHeaderColor || "#00d4ff" }}
                    >
                      {customHeader1 || "FROSTBITE SHOWDOWN"}
                    </div>
                    <h1 className="text-8xl font-black tracking-tighter text-white leading-none h3-scale uppercase drop-shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                      {customHeader3 || "GRAND FINALS"}
                    </h1>
                  </div>
                </div>

                <div className="grid grid-cols-2 w-full gap-4 mb-8">
                  <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col items-center">
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1 h2-scale"
                      style={{ color: customAccentColor || "#00d4ff" }}
                    >
                      {customHeader2 || "PHASE"}
                    </div>
                    <div className="text-2xl font-black text-white italic">
                      01
                    </div>
                  </div>
                  <div className="bg-[#00d4ff]/10 backdrop-blur-md border border-[#00d4ff]/30 p-4 rounded-xl flex flex-col items-center col-span-1 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest mb-1 t-scale"
                      style={{ color: customAccentColor || "#00d4ff" }}
                    >
                      {customTableTitle || "STATUS"}
                    </div>
                    <div className="text-2xl font-black text-white italic">
                      OVERALL
                    </div>
                  </div>
                </div>
              </div>
            ) : templateId === "shadow-ops" ? (
              <div className="flex flex-col items-center w-full px-12 pt-12 relative">
                <div
                  className="w-full flex justify-between items-center mb-8 pb-4 border-b-2"
                  style={{
                    borderBottomColor: (customAccentColor || "#22c55e") + "4d",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 flex items-center justify-center font-black text-black"
                      style={{
                        backgroundColor: customAccentColor || "#22c55e",
                      }}
                    >
                      S_O
                    </div>
                    <div className="flex flex-col">
                      <span
                        className="text-[10px] font-black tracking-widest uppercase h1-scale"
                        style={{ color: customHeaderColor || "#22c55e" }}
                      >
                        {customHeader1 || "SHADOW_OPS_COMMAND"}
                      </span>
                      <span className="text-white font-mono text-sm h4-scale">
                        {customHeader4 || "SYS_ACTIVE_SECURED"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-4xl font-black text-white italic h3-scale uppercase">
                      {customHeader3 || "OP_TERMINUS"}
                    </span>
                    <span
                      className="text-xs font-bold tracking-widest uppercase h2-scale"
                      style={{ color: customAccentColor || "#22c55e" }}
                    >
                      {customHeader2 || "MISSION_QUALIFIERS"}
                    </span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-4 gap-1 p-1 bg-white/5 border border-white/10 mb-8 overflow-hidden">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="py-1 px-4 bg-black/40 flex items-center justify-center text-[10px] font-bold text-white/40 tracking-[0.2em] relative group"
                    >
                      <div className="absolute left-0 w-1 h-full bg-[#22c55e] opacity-20" />
                      {i === 0
                        ? customTableTitle || "DATA_STANDINGS"
                        : `SEC_${i.toString().padStart(2, "0")}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : templateId === "professional-pro" ? (
              <div className="flex flex-col items-center w-full px-12 pt-8">
                <div className="w-full flex justify-between items-center mb-12 border-b border-white/10 pb-6 relative">
                  <div className="absolute -bottom-px left-0 w-24 h-[2px] bg-[#fbbf24]" />
                  <div className="flex items-center gap-6">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="w-20 h-20 object-contain drop-shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-[10px] font-black opacity-30">
                        LOGO
                      </div>
                    )}
                    <div className="flex flex-col items-start leading-none">
                      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#fbbf24] mb-2 h1-scale">
                        {customHeader1 || "TOURNAMENT"}
                      </div>
                      <div className="text-3xl font-black uppercase tracking-widest text-white leading-none h3-scale">
                        {customHeader3 || "GRAND FINALS"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-white/40 h2-scale">
                      {customHeader2 || "PHASE 01"}
                    </div>
                    <div className="text-sm font-mono text-[#fbbf24] mt-2 font-bold h4-scale">
                      {customHeader4 || "EST: 2026"}
                    </div>
                  </div>
                </div>
                <div className="w-full text-center relative h-32 flex items-center justify-center -mt-4">
                  <h2 className="text-[120px] font-black uppercase tracking-[0.1em] text-white/[0.03] absolute pointer-events-none whitespace-nowrap overflow-hidden w-full text-center select-none leading-none">
                    {customTableTitle || "OVERALL STANDINGS"}
                  </h2>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="h-px w-8 bg-[#fbbf24]/50" />
                      <span className="text-[10px] font-black tracking-[0.8em] text-[#fbbf24] uppercase">
                        Leaderboard
                      </span>
                      <div className="h-px w-8 bg-[#fbbf24]/50" />
                    </div>
                    <h3 className="text-5xl font-black uppercase tracking-[0.1em] text-white t-scale">
                      {customTableTitle || "OVERALL STANDINGS"}
                    </h3>
                    <div className="flex gap-2 mt-4">
                      <div className="h-1.5 w-1.5 bg-[#fbbf24]" />
                      <div className="h-1.5 w-24 bg-white/10" />
                      <div className="h-1.5 w-1.5 bg-[#fbbf24]" />
                    </div>
                  </div>
                </div>
              </div>
            ) : templateId === "irush-pro" ? (
              <div className="flex flex-col items-center w-full relative">
                {/* Rifle Icon */}
                <div className="absolute top-0 left-0 opacity-80">
                  <svg
                    width="120"
                    height="40"
                    viewBox="0 0 120 40"
                    fill="currentColor"
                    className="text-[#00ffff]"
                  >
                    <path d="M10 20h40l5 5h30l5-5h20v5h-10l-2 5h-15l-3-5h-25l-5 5h-40z" />
                    <path d="M50 15h10v5h-10zM70 15h10v5h-10z" />
                  </svg>
                </div>

                {/* Date */}
                <div className="absolute top-0 right-0 font-mono text-2xl font-bold text-[#00ffff] h4-scale">
                  {customHeader4 || "10/5/2026"}
                </div>

                <div className="text-center mt-4">
                  <h1 className="text-[140px] font-black uppercase tracking-tighter text-white leading-none mb-0 drop-shadow-[0_0_20px_rgba(0,255,255,0.3)] h3-scale">
                    {customHeader3 || "LEADERBORD"}
                  </h1>
                  <div className="text-4xl font-bold tracking-[0.4em] uppercase text-[#00ffff] -mt-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] h1-scale">
                    {customHeader1 || "IRUSH OPEN SCRIMS"}
                  </div>
                  <div className="text-xl font-bold tracking-[0.2em] uppercase text-white/40 mt-1 h2-scale">
                    {customHeader2 || "P R E S E N T S"}
                  </div>
                  <div className="text-xl font-black tracking-[0.1em] uppercase text-[#00ffff] mt-4 t-scale">
                    {customTableTitle || "OVERALL STANDINGS"}
                  </div>
                  <div className="h-1 w-64 bg-gradient-to-r from-transparent via-[#00ffff] to-transparent mx-auto mt-4 opacity-50" />
                </div>
              </div>
            ) : templateId === "republic-utsav" ? (
              <div className="flex flex-col items-center w-full">
                <div className="text-2xl font-black tracking-[0.2em] uppercase mb-1 text-[#15803d] drop-shadow-sm h1-scale">
                  {customHeader1 || "RVNC ESPORTS"}
                </div>
                <div className="text-xs tracking-[0.8em] uppercase mb-8 opacity-80 text-[#15803d] font-bold h2-scale">
                  {customHeader2 || "P R E S E N T S"}
                </div>
                <div className="relative mb-2 h3-scale">
                  <h1
                    className="text-9xl font-black italic uppercase tracking-tighter text-[#15803d] drop-shadow-[0_8px_8px_rgba(0,0,0,0.2)] text-center leading-none"
                    style={{ WebkitTextStroke: "3px white" }}
                  >
                    {customHeader3 || "30k republic utsav"}
                  </h1>
                </div>
                <h2
                  className="text-6xl font-black italic uppercase tracking-tight text-[#84cc16] -mt-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)] text-center h4-scale"
                  style={{ WebkitTextStroke: "1px #15803d" }}
                >
                  {customHeader4 || "grand finals"}
                </h2>

                <div className="mt-16 bg-[#15803d] px-16 py-3 rounded-xl flex items-center gap-6 border-4 border-white/30 shadow-2xl t-scale">
                  <span className="text-white text-3xl">★</span>
                  <span className="text-white font-black tracking-[0.3em] text-3xl">
                    {customTableTitle || "OVERALL STANDINGS"}
                  </span>
                  <span className="text-white text-3xl">★</span>
                </div>
              </div>
            ) : templateId === "golden-glory" ? (
              <div className="flex flex-col items-center w-full relative pt-12 pb-8">
                <div
                  className="absolute -top-12 left-0 right-0 h-40 bg-[#eab308]/90 z-20"
                  style={{
                    clipPath:
                      "polygon(0% 0%, 100% 0%, 100% 25%, 95% 20%, 90% 28%, 85% 22%, 80% 30%, 75% 20%, 70% 28%, 65% 22%, 60% 32%, 55% 25%, 50% 35%, 45% 28%, 40% 38%, 35% 30%, 30% 40%, 25% 32%, 20% 42%, 15% 35%, 10% 45%, 5% 38%, 0% 50%)",
                  }}
                />

                <div className="flex justify-between w-full items-start mb-2 relative z-30 px-12">
                  <div className="flex items-center gap-4">
                    <svg
                      width="120"
                      height="40"
                      viewBox="0 0 100 40"
                      fill="#eab308"
                      className="drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                    >
                      <path d="M5,25 L25,25 L30,22 L65,22 L70,25 L95,25 L95,28 L70,28 L65,31 L30,31 L25,28 L5,28 Z M10,28 L10,38 L15,38 L15,28 Z M75,28 L75,35 L80,35 L80,28 Z" />
                    </svg>
                  </div>

                  <div className="text-center flex flex-col items-center">
                    <h1 className="text-[150px] font-black uppercase tracking-[-0.05em] text-white leading-none mb-0 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] h3-scale">
                      {customHeader3 || "LEADERBORD"}
                    </h1>
                    <div className="text-2xl font-black tracking-[0.6em] uppercase text-[#eab308] -mt-4 pl-[0.6em] h1-scale">
                      {customHeader1 || "IRUSH OPEN SCRIMS"}
                    </div>
                    <div className="text-xl font-bold tracking-[0.4em] uppercase text-[#eab308]/60 mt-1 h2-scale">
                      {customHeader2 || "P R E S E N T S"}
                    </div>
                    <div className="text-xl font-bold tracking-[0.4em] uppercase text-white/40 mt-1 t-scale">
                      {customTableTitle || "OVERALL STANDINGS"}
                    </div>
                  </div>

                  <div className="text-right pt-4 font-mono text-4xl font-black text-white drop-shadow-lg h4-scale">
                    {customHeader4 || "13/5/2026"}
                  </div>
                </div>

                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 800 600"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,100 C150,150 250,50 400,100 C550,150 650,50 800,100 L800,600 L0,600 Z"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,200 C150,250 250,150 400,200 C550,250 650,150 800,200 L800,600 L0,600 Z"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,300 C150,350 250,250 400,300 C550,350 650,250 800,300 L800,600 L0,600 Z"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <>
                {logo && (
                  <div className="w-32 h-32 mb-4 bg-white/10 p-2 rounded-xl border border-white/20 shadow-2xl">
                    <img
                      src={logo}
                      alt="Tournament Logo"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.4em] opacity-40 mb-2 h2-scale">
                    {customHeader2 || group}
                  </div>
                  <h1
                    className={cn(
                      "text-6xl font-black italic uppercase tracking-tighter leading-none drop-shadow-2xl h1-scale",
                      templateId === "minimal-white" ? "text-slate-900" : "",
                    )}
                    style={{ color: customHeaderColor || undefined }}
                  >
                    {customHeader1 || tournament}
                  </h1>
                  <div
                    className="text-4xl font-black italic uppercase mt-2 h3-scale"
                    style={{ color: customAccentColor || undefined }}
                  >
                    {customHeader3 || "GRAND FINALS"}
                  </div>
                  <div className="text-sm font-mono opacity-60 mt-4 uppercase tracking-widest h4-scale">
                    {customHeader4 || "Week 00 Day 00"}
                  </div>
                  <h2
                    className="text-2xl font-bold uppercase tracking-[0.2em] opacity-80 mt-6 h3-scale t-scale"
                    style={{ color: customAccentColor || undefined }}
                  >
                    {customTableTitle || "Overall Standings"}
                  </h2>
                </div>
              </>
            )}
          </div>

          {/* Tables Container */}
          <div
            className={cn(
              "relative z-10 px-8",
              isPro
                ? "w-full flex-1 flex flex-col mt-8"
                : cn(
                    "w-full px-4",
                    isMini ? "flex justify-center mt-2" : "grid grid-cols-2 gap-8 mt-2"
                  ),
              templateId === "premium-1" ? "mt-32" : "",
            )}
          >
            {isPro ? (
              <div
                className={cn(
                  "flex flex-col w-full p-4 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
                  isMini ? "max-w-4xl mx-auto" : "",
                  isTropicalPro ? "bg-[#15803d]" : "bg-yellow-400",
                )}
              >
                <div
                  className={cn(
                    "grid gap-2 font-black uppercase text-xl px-4 py-4 border-b-4 mb-2",
                    isTropicalPro
                      ? "grid-cols-[80px_100px_1fr_80px_80px_80px_80px_80px] text-white border-white/20"
                      : "grid-cols-[80px_100px_1fr_100px_100px_100px_100px_100px] text-black border-black/20",
                  )}
                >
                  <div className="text-center">RANK</div>
                  <div className="text-center">LOGO</div>
                  <div>{isHalloweenPro ? "ESPORTS NAME" : "TEAM NAME"}</div>
                  <div className="text-center">
                    {isHalloweenPro ? "WWCD" : "CD"}
                  </div>
                  <div className="text-center">
                    {isHalloweenPro ? "MATCHES" : "MP"}
                  </div>
                  <div className="text-center">
                    {isHalloweenPro ? "POS.P" : "PP"}
                  </div>
                  <div className="text-center">
                    {isHalloweenPro ? "FIN.P" : "FP"}
                  </div>
                  <div className="text-center">
                    {isHalloweenPro ? "TOTAL" : "TP"}
                  </div>
                </div>
                <div className="flex flex-col gap-2 overflow-hidden">
                  {Array.from({ length: isMini ? 10 : 20 }).map((_, idx) => {
                    const team = pageData[idx];
                    const rank = startIdx + idx + 1;
                    return (
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 220, damping: 25 }}
                        key={team?.teamName || `empty-pro-${idx}`}
                        className={cn(
                          "grid gap-2 items-center h-20 rounded-xl overflow-hidden shadow-sm",
                          isTropicalPro
                            ? "grid-cols-[80px_100px_1fr_80px_80px_80px_80px_80px] bg-[#fdfbf7]"
                            : "grid-cols-[80px_100px_1fr_100px_100px_100px_100px_100px] bg-[#1a0b2e]/80",
                        )}
                      >
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-black text-4xl",
                            isTropicalPro
                              ? "bg-[#15803d] text-white"
                              : "bg-yellow-400 text-black",
                          )}
                        >
                          {rank.toString().padStart(2, "0")}
                        </div>
                        <div className="h-full flex items-center justify-center p-2">
                          {team?.logo ? (
                            <img
                              src={team.logo}
                              alt=""
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-400">
                              LOGO
                            </div>
                          )}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center px-6 font-black uppercase text-3xl truncate",
                            isTropicalPro ? "text-[#15803d]" : "text-white",
                          )}
                        >
                          {team?.teamName || "-"}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold text-3xl border-l",
                            isTropicalPro
                              ? "text-[#15803d] border-gray-200"
                              : "text-white border-white/10",
                          )}
                        >
                          {(team?.wwcd ?? 0).toString().padStart(2, "0")}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold text-3xl border-l",
                            isTropicalPro
                              ? "text-[#15803d] border-gray-200"
                              : "text-white border-white/10",
                          )}
                        >
                          {(team?.matchesPlayed ?? 0)
                            .toString()
                            .padStart(2, "0")}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold text-3xl border-l",
                            isTropicalPro
                              ? "text-[#15803d] border-gray-200"
                              : "text-white border-white/10",
                          )}
                        >
                          {(team?.totalPlacementPoints ?? 0)
                            .toString()
                            .padStart(2, "0")}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold text-3xl border-l",
                            isTropicalPro
                              ? "text-[#15803d] border-gray-200"
                              : "text-white border-white/10",
                          )}
                        >
                          {(team?.totalKills ?? 0).toString().padStart(2, "0")}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-black text-4xl",
                            isTropicalPro
                              ? "bg-[#15803d] text-white"
                              : "bg-yellow-400 text-black",
                          )}
                        >
                          {(team?.totalPoints ?? 0).toString().padStart(2, "0")}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              [leftColumn, rightColumn].map((col, colIdx) => {
                if (isMini && colIdx !== 0) return null;
                return (
                  <div key={colIdx} className={cn("flex flex-col gap-1", isMini ? "w-full max-w-4xl mx-auto px-12" : "")}>
                    <div
                      className={cn(
                      "grid gap-1 text-[10px] font-bold uppercase px-2 mb-1",
                      templateId === "republic-utsav"
                        ? "grid-cols-[40px_30px_1fr_30px_30px_30px_30px_30px] bg-[#15803d] text-white py-2"
                        : templateId === "irush-pro" ||
                            templateId === "professional-pro" ||
                            templateId === "cyber-elite" ||
                            templateId === "golden-glory"
                          ? "grid-cols-[40px_30px_1fr_40px_40px_40px_40px] border-b-2 border-[#00ffff]/30 mb-2 py-1"
                          : "grid-cols-[40px_30px_1fr_40px_40px_40px_40px]",
                      templateId === "premium-1"
                        ? "bg-[#00ffcc] text-black py-1"
                        : templateId === "professional-pro"
                          ? "border-[#fbbf24]/30"
                          : templateId === "cyber-elite"
                            ? "border-[#f43f5e]/30"
                            : templateId === "golden-glory"
                              ? "border-[#eab308]/30 text-[#eab308]"
                              : "opacity-50",
                    )}
                  >
                    <div>
                      {templateId === "republic-utsav" ||
                      templateId === "professional-pro" ||
                      templateId === "cyber-elite" ||
                      templateId === "golden-glory"
                        ? "RANK"
                        : "S#"}
                    </div>
                    <div>
                      {templateId === "republic-utsav" ? "LOGO" : "Logo"}
                    </div>
                    <div>
                      {[
                        "republic-utsav",
                        "irush-pro",
                        "professional-pro",
                        "cyber-elite",
                        "golden-glory",
                        "velocity-pro",
                        "solaris-elite",
                        "frostbite-series",
                        "shadow-ops",
                      ].includes(templateId)
                        ? "TEAM NAME"
                        : "Team Name"}
                    </div>
                    <div className="text-center">
                      {[
                        "republic-utsav",
                        "irush-pro",
                        "professional-pro",
                        "cyber-elite",
                        "golden-glory",
                        "velocity-pro",
                        "solaris-elite",
                        "frostbite-series",
                        "shadow-ops",
                      ].includes(templateId)
                        ? "WWCD"
                        : "MATCH"}
                    </div>
                    <div className="text-center">
                      {[
                        "republic-utsav",
                        "irush-pro",
                        "professional-pro",
                        "cyber-elite",
                        "golden-glory",
                        "velocity-pro",
                        "solaris-elite",
                        "frostbite-series",
                        "shadow-ops",
                      ].includes(templateId)
                        ? "PP"
                        : "PP"}
                    </div>
                    <div className="text-center">
                      {[
                        "republic-utsav",
                        "irush-pro",
                        "professional-pro",
                        "cyber-elite",
                        "golden-glory",
                        "velocity-pro",
                        "solaris-elite",
                        "frostbite-series",
                        "shadow-ops",
                      ].includes(templateId)
                        ? "KP"
                        : "KP"}
                    </div>
                    <div className="text-center">
                      {[
                        "republic-utsav",
                        "irush-pro",
                        "professional-pro",
                        "cyber-elite",
                        "golden-glory",
                        "velocity-pro",
                        "solaris-elite",
                        "frostbite-series",
                        "shadow-ops",
                      ].includes(templateId)
                        ? "TP"
                        : "TP"}
                    </div>
                    {templateId === "republic-utsav" && (
                      <div className="text-center">TP</div>
                    )}
                  </div>
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const team = col[idx];
                    const rank = startIdx + colIdx * 10 + idx + 1;
                    const isQualified =
                      qualificationCount > 0 && rank <= qualificationCount;
                    const isDisqualified =
                      disqualificationCount > 0 &&
                      rank > data.length - disqualificationCount;
                    return (
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 220, damping: 25 }}
                        key={team?.teamName || `empty-col-${colIdx}-${idx}`}
                        className={cn(
                          "grid gap-1 items-center h-10 overflow-hidden relative group transition-all",
                          templateId === "republic-utsav"
                            ? "grid-cols-[40px_30px_1fr_30px_30px_30px_30px_30px]"
                            : templateId === "irush-pro" ||
                                templateId === "professional-pro" ||
                                templateId === "cyber-elite" ||
                                templateId === "golden-glory"
                              ? "grid-cols-[40px_30px_1fr_40px_40px_40px_40px] h-12 mb-0.5"
                              : "grid-cols-[40px_30px_1fr_40px_40px_40px_40px]",
                          s.rowBg,
                          templateId === "premium-2" ? "rounded-full px-1" : "",
                          templateId === "irush-pro" ||
                            templateId === "professional-pro" ||
                            templateId === "cyber-elite" ||
                            templateId === "golden-glory"
                            ? "border border-white/5"
                            : "",
                          isQualified
                            ? "border-l-4"
                            : isDisqualified
                              ? "border-l-4"
                              : "",
                        )}
                        style={{
                          borderLeftColor: isQualified
                            ? customQualifiedColor
                            : isDisqualified
                              ? customDisqualifiedColor
                              : undefined,
                          backgroundColor: isQualified
                            ? customQualifiedColor + "15"
                            : isDisqualified
                              ? customDisqualifiedColor + "15"
                              : undefined,
                        }}
                      >
                        {isQualified && (
                          <div
                            className="absolute inset-y-0 left-0 w-1 pointer-events-none opacity-50"
                            style={{ backgroundColor: customQualifiedColor }}
                          />
                        )}
                        {isDisqualified && (
                          <div
                            className="absolute inset-y-0 left-0 w-1 pointer-events-none opacity-50"
                            style={{ backgroundColor: customDisqualifiedColor }}
                          />
                        )}
                        {[
                          "irush-pro",
                          "professional-pro",
                          "cyber-elite",
                          "golden-glory",
                          "velocity-pro",
                          "solaris-elite",
                          "frostbite-series",
                          "shadow-ops",
                        ].includes(templateId) && (
                          <div
                            className={cn(
                              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                              templateId === "irush-pro"
                                ? "bg-gradient-to-r from-[#00ffff]/5 via-transparent to-transparent"
                                : templateId === "golden-glory"
                                  ? "bg-gradient-to-r from-[#eab308]/10 via-transparent to-transparent"
                                  : templateId === "cyber-elite"
                                    ? "bg-gradient-to-r from-[#f43f5e]/10 via-transparent to-transparent"
                                    : templateId === "velocity-pro"
                                      ? "bg-gradient-to-r from-[#ef4444]/10 via-transparent to-transparent"
                                      : templateId === "frostbite-series"
                                        ? "bg-gradient-to-r from-[#00d4ff]/10 via-transparent to-transparent"
                                        : templateId === "shadow-ops"
                                          ? "bg-gradient-to-r from-[#22c55e]/10 via-transparent to-transparent"
                                          : "bg-white/[0.02]",
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold text-lg",
                            s.accent,
                            s.accentText,
                            templateId === "premium-2"
                              ? "rounded-full w-8 h-8 my-auto ml-1"
                              : "",
                            [
                              "irush-pro",
                              "professional-pro",
                              "cyber-elite",
                              "golden-glory",
                              "velocity-pro",
                              "solaris-elite",
                              "frostbite-series",
                              "shadow-ops",
                            ].includes(templateId)
                              ? "bg-transparent text-white text-xl font-black italic"
                              : "",
                          )}
                        >
                          {rank.toString().padStart(1, "0")}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center p-1",
                            [
                              "irush-pro",
                              "professional-pro",
                              "cyber-elite",
                              "golden-glory",
                              "velocity-pro",
                              "solaris-elite",
                              "frostbite-series",
                              "shadow-ops",
                            ].includes(templateId)
                              ? "bg-transparent"
                              : "bg-white/10",
                          )}
                        >
                          {team?.logo ? (
                            <img
                              src={team.logo}
                              alt=""
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={cn(
                                "w-full h-full rounded-sm",
                                templateId === "irush-pro"
                                  ? "bg-[#00ffff]/10"
                                  : templateId === "cyber-elite"
                                    ? "bg-[#f43f5e]/10"
                                    : templateId === "golden-glory"
                                      ? "bg-[#eab308]/10"
                                      : templateId === "professional-pro"
                                        ? "bg-white/5"
                                        : "bg-black/20",
                              )}
                            />
                          )}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center px-3 font-black uppercase tracking-tighter truncate",
                            templateId === "minimal-white"
                              ? "bg-white"
                              : templateId === "premium-1"
                                ? "bg-transparent text-white"
                                : templateId === "premium-2"
                                  ? "bg-transparent text-lg"
                                  : [
                                        "irush-pro",
                                        "professional-pro",
                                        "cyber-elite",
                                        "golden-glory",
                                        "velocity-pro",
                                        "solaris-elite",
                                        "frostbite-series",
                                        "shadow-ops",
                                      ].includes(templateId)
                                    ? "bg-transparent text-white text-xl tracking-tight font-bold italic"
                                    : "bg-white text-black",
                          )}
                          style={{
                            color: isQualified
                              ? customQualifiedColor
                              : isDisqualified
                                ? customDisqualifiedColor
                                : undefined,
                          }}
                        >
                          {team?.teamName || "-"}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold",
                            templateId === "minimal-white"
                              ? "bg-white border-l border-slate-100"
                              : templateId === "premium-1"
                                ? "bg-white/5 text-white border-l border-white/10"
                                : templateId === "premium-2"
                                  ? "bg-white/40 text-[#4a3728] border-l border-[#4a3728]/10"
                                  : [
                                        "irush-pro",
                                        "professional-pro",
                                        "cyber-elite",
                                        "golden-glory",
                                        "velocity-pro",
                                        "solaris-elite",
                                        "frostbite-series",
                                        "shadow-ops",
                                      ].includes(templateId)
                                    ? "bg-transparent text-white text-xl border-l border-white/5"
                                    : "bg-white text-black border-l border-gray-200",
                          )}
                        >
                          {[
                            "republic-utsav",
                            "irush-pro",
                            "professional-pro",
                            "cyber-elite",
                            "golden-glory",
                            "velocity-pro",
                            "solaris-elite",
                            "frostbite-series",
                            "shadow-ops",
                          ].includes(templateId)
                            ? (team?.wwcd ?? 0).toString().padStart(1, "0")
                            : (team?.matchesPlayed ?? 0)
                                .toString()
                                .padStart(2, "0")}
                        </div>
                        {templateId === "republic-utsav" && (
                          <div className="h-full flex items-center justify-center font-bold bg-white text-black border-l border-gray-200">
                            {(team?.matchesPlayed ?? 0)
                              .toString()
                              .padStart(2, "0")}
                          </div>
                        )}
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold",
                            templateId === "minimal-white"
                              ? "bg-white border-l border-slate-100"
                              : templateId === "premium-1"
                                ? "bg-white/5 text-white border-l border-white/10"
                                : templateId === "premium-2"
                                  ? "bg-white/40 text-[#4a3728] border-l border-[#4a3728]/10"
                                  : [
                                        "irush-pro",
                                        "professional-pro",
                                        "cyber-elite",
                                        "golden-glory",
                                        "velocity-pro",
                                        "solaris-elite",
                                        "frostbite-series",
                                        "shadow-ops",
                                      ].includes(templateId)
                                    ? "bg-white/5 text-white text-xl border-l border-white/5"
                                    : "bg-white text-black border-l border-gray-200",
                          )}
                        >
                          {([
                            "irush-pro",
                            "professional-pro",
                            "cyber-elite",
                            "golden-glory",
                            "velocity-pro",
                            "solaris-elite",
                            "frostbite-series",
                            "shadow-ops",
                          ].includes(templateId)
                            ? (team?.totalPlacementPoints ?? 0)
                            : (team?.totalPlacementPoints ?? 0)
                          )
                            .toString()
                            .padStart(1, "0")}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold",
                            templateId === "minimal-white"
                              ? "bg-white border-l border-slate-100"
                              : templateId === "premium-1"
                                ? "bg-white/5 text-white border-l border-white/10"
                                : templateId === "premium-2"
                                  ? "bg-white/40 text-[#4a3728] border-l border-[#4a3728]/10"
                                  : [
                                        "irush-pro",
                                        "professional-pro",
                                        "cyber-elite",
                                        "golden-glory",
                                        "velocity-pro",
                                        "solaris-elite",
                                        "frostbite-series",
                                        "shadow-ops",
                                      ].includes(templateId)
                                    ? (templateId === "cyber-elite"
                                        ? "bg-[#f43f5e]/10 text-[#f43f5e]"
                                        : templateId === "golden-glory"
                                          ? "bg-[#eab308]/10 text-[#eab308]"
                                          : templateId === "velocity-pro"
                                            ? "bg-[#ef4444]/10 text-[#ef4444]"
                                            : templateId === "frostbite-series"
                                              ? "bg-[#00d4ff]/10 text-[#00d4ff]"
                                              : templateId === "shadow-ops"
                                                ? "bg-[#22c55e]/10 text-[#22c55e]"
                                                : "bg-[#fbbf24]/5 text-[#fbbf24]") +
                                      " text-xl border-l border-white/5"
                                    : "bg-white text-black border-l border-gray-200",
                          )}
                        >
                          {(team?.totalKills ?? 0).toString().padStart(1, "0")}
                        </div>
                        <div
                          className={cn(
                            "h-full flex items-center justify-center font-bold text-xl",
                            templateId === "minimal-white"
                              ? "bg-white border-l border-slate-100"
                              : templateId === "premium-1"
                                ? "bg-[#00ffcc] text-black border-l border-white/10"
                                : templateId === "premium-2"
                                  ? "bg-[#4a3728] text-white border-l border-[#4a3728]/10"
                                  : [
                                        "irush-pro",
                                        "professional-pro",
                                        "cyber-elite",
                                        "golden-glory",
                                        "velocity-pro",
                                        "solaris-elite",
                                        "frostbite-series",
                                        "shadow-ops",
                                      ].includes(templateId)
                                    ? "bg-transparent text-white text-2xl border-l border-white/5"
                                    : "bg-white text-black border-l border-gray-200",
                          )}
                        >
                          {(team?.totalPoints ?? 0).toString().padStart(1, "0")}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })
          )}
          </div>

          {/* Footer */}
          <div
            className={cn(
              "mt-auto w-full flex justify-between items-end px-8 opacity-50 text-[10px] font-mono uppercase tracking-widest relative z-10",
              isPro ? "mb-12" : "mb-4",
            )}
          >
            {isPro ? (
              <div className="w-full flex flex-col items-center">
                {isTropicalPro ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-6">
                      <div className="text-[#15803d] text-5xl">★</div>
                      <div className="flex items-center gap-16">
                        <div className="flex flex-col items-center">
                          <div className="text-sm font-bold uppercase tracking-tighter opacity-60 text-[#15803d]">
                            Battlegrounds
                          </div>
                          <div className="text-3xl font-black uppercase tracking-tighter text-[#15803d]">
                            Mobile India
                          </div>
                        </div>
                        <div className="text-5xl font-black tracking-tighter uppercase text-[#15803d]">
                          KRAFTON
                        </div>
                      </div>
                      <div className="text-[#15803d] text-5xl">★</div>
                    </div>
                    <div
                      className="text-xs opacity-60 uppercase tracking-[0.5em] text-[#15803d] font-bold f-scale"
                      style={{ color: customFooterColor || undefined }}
                    >
                      {customFooter || "BATTLEGROUNDS MOBILE INDIA | KRAFTON"}
                    </div>
                    <SocialLinks
                      instagram={socialInstagram}
                      youtube={socialYoutube}
                      color={customFooterColor || "#15803d"}
                      className="mt-4"
                    />
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    {/* Torn Paper Effect */}
                    <div
                      className="absolute bottom-[-50px] left-0 w-full h-48 bg-white pointer-events-none"
                      style={{
                        clipPath:
                          "polygon(0% 20%, 5% 0%, 10% 25%, 15% 5%, 20% 30%, 25% 10%, 30% 35%, 35% 15%, 40% 40%, 45% 20%, 50% 45%, 55% 25%, 60% 50%, 65% 30%, 70% 55%, 75% 35%, 80% 60%, 85% 40%, 90% 65%, 95% 45%, 100% 70%, 100% 100%, 0% 100%)",
                      }}
                    />
                    <div
                      className="text-4xl font-black relative z-20 mb-2 tracking-widest f-scale"
                      style={{ color: customFooterColor || "#000000" }}
                    >
                      {customFooter || "RVNC ESPORTS"}
                    </div>
                    <SocialLinks
                      instagram={socialInstagram}
                      youtube={socialYoutube}
                      color={customFooterColor || "#000000"}
                      className="relative z-20 mb-6"
                    />
                  </div>
                )}
              </div>
            ) : templateId === "republic-utsav" ? (
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="text-green-800 text-3xl">★</div>
                  <div className="flex items-center gap-12">
                    <div className="flex flex-col items-center">
                      <div className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                        Battlegrounds
                      </div>
                      <div className="text-xl font-black uppercase tracking-tighter">
                        Mobile India
                      </div>
                    </div>
                    <div className="text-3xl font-black tracking-tighter uppercase">
                      KRAFTON
                    </div>
                  </div>
                  <div className="text-green-800 text-3xl">★</div>
                </div>
                <div className="text-[8px] opacity-50 uppercase tracking-widest f-scale mb-2">
                  {customFooter}
                </div>
                <SocialLinks
                  instagram={socialInstagram}
                  youtube={socialYoutube}
                  color="#166534"
                />
              </div>
            ) : templateId === "velocity-pro" ? (
              <div className="w-full flex items-end justify-between px-12 py-8 border-t border-[#ef4444]/20 bg-gradient-to-t from-[#ef4444]/5 to-transparent relative z-10">
                <div className="flex flex-col items-start transform -skew-x-12">
                  <div className="text-2xl font-black italic text-white leading-none">
                    VELOCITY_PRO
                  </div>
                  <div className="text-[8px] font-mono text-white/40 mt-2 tracking-widest">
                    {customFooter || "© 2026 HIGH SPEED ESPORTS"}
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-end mr-4">
                    <div className="text-[10px] font-black text-[#ef4444] uppercase tracking-widest mb-1">
                      Stay Connected
                    </div>
                    <SocialLinks
                      instagram={socialInstagram}
                      youtube={socialYoutube}
                      color="#ef4444"
                    />
                  </div>
                  <div className="w-14 h-14 bg-[#ef4444] rounded-sm flex items-center justify-center font-black italic text-white text-3xl transform skew-x-12 rotate-3 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    V
                  </div>
                </div>
              </div>
            ) : templateId === "solaris-elite" ? (
              <div className="w-full flex flex-col items-center px-16 py-12 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-12 mb-6">
                  <div className="text-xl font-bold text-white tracking-[0.5em] uppercase">
                    KRAFTON
                  </div>
                  <div className="w-1 h-1 bg-[#eab308] rounded-full" />
                  <div className="text-xl font-bold text-white tracking-[0.5em] uppercase">
                    TENCENT
                  </div>
                </div>
                <div className="text-[10px] font-light text-white/40 tracking-[0.3em] uppercase mb-6 f-scale text-center max-w-2xl px-8 leading-relaxed">
                  {customFooter ||
                    "This competition is not affiliated with or sponsored by Krafton, Inc. or its licensors."}
                </div>
                <SocialLinks
                  instagram={socialInstagram}
                  youtube={socialYoutube}
                  color="#eab308"
                />
              </div>
            ) : templateId === "frostbite-series" ? (
              <div className="w-full flex items-center justify-between px-12 py-10 border-t border-[#00d4ff]/20 bg-[#00d4ff]/[0.02] relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full border-2 border-[#00d4ff]/30 flex items-center justify-center backdrop-blur-md">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-black text-[#00d4ff] text-xl">
                      FB
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-xl font-black text-white italic tracking-tighter uppercase f-scale">
                      {customFooter || "FROSTBITE SHOWDOWN"}
                    </div>
                    <div className="text-[10px] font-mono text-[#00d4ff] tracking-widest mt-1 opacity-50">
                      EST_2026_COLD_OPS
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    Global Network
                  </div>
                  <SocialLinks
                    instagram={socialInstagram}
                    youtube={socialYoutube}
                    color="#00d4ff"
                  />
                </div>
              </div>
            ) : templateId === "shadow-ops" ? (
              <div className="w-full flex flex-col px-12 py-8 bg-black/40 border-t-2 border-[#22c55e]/20 relative z-10">
                <div className="justify-between flex items-center mb-6">
                  <div className="flex flex-col">
                    <div className="text-2xl font-black text-[#22c55e] tracking-tighter uppercase leading-none f-scale">
                      {customFooter || "SHADOW_OPS_LEAGUE"}
                    </div>
                    <div className="text-[10px] font-mono text-white/30 mt-2 tracking-[0.2em] uppercase leading-none">
                      Security_Protocol_Active // 256bit_Encryption
                    </div>
                  </div>
                  <SocialLinks
                    instagram={socialInstagram}
                    youtube={socialYoutube}
                    color="#22c55e"
                  />
                </div>
                <div className="w-full h-px bg-white/5 relative">
                  <div className="absolute top-0 left-0 w-1/4 h-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="mt-4 flex justify-between items-center text-[8px] font-black text-white/20 tracking-[0.5em] uppercase">
                  <span>SYSTEM_V4.02</span>
                  <span>SECURED_TRANSMISSION</span>
                  <span>CMD_STANDBY</span>
                </div>
              </div>
            ) : templateId === "golden-glory" ? (
              <div className="w-full flex items-end justify-between px-10 py-6 relative">
                <div className="flex items-center gap-6 relative z-10">
                  <div className="flex flex-col items-start">
                    <div className="text-3xl font-black tracking-tighter text-white">
                      KRAFTON
                    </div>
                    <div className="text-[8px] opacity-40 text-white leading-none mt-1 whitespace-nowrap">
                      © 2022 KRAFTON, Inc. All rights reserved. | 2018-2022
                      Tencent, All rights reserved.
                    </div>
                  </div>
                  <div className="flex items-center gap-4 opacity-70 grayscale brightness-200">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                        <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                      </svg>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full rounded bg-white/20 flex items-center justify-center text-[8px] font-black text-black text-center leading-[0.8] px-0.5">
                        LEVEL INFINITE
                      </div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center border border-white/20 rounded">
                      <div className="text-[6px] font-black leading-tight text-center">
                        LIGHTSPEED
                        <br />
                        STUDIOS
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex flex-col items-center z-10">
                  <div className="w-16 h-16 bg-[#eab308] rounded-2xl flex items-center justify-center shadow-[0_5px_15px_rgba(234,179,8,0.4)] rotate-45 border-4 border-black/20">
                    <div className="-rotate-45 font-black text-[#1a1508] text-2xl tracking-tighter">
                      IR
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end relative z-10">
                  <div className="bg-[#eab308] px-8 py-2 rounded-lg flex flex-col items-center shadow-lg border border-white/20">
                    <div className="text-[10px] font-black tracking-[0.2em] text-[#1a1508] uppercase f-scale">
                      {customFooter || "FOLLOW US"}
                    </div>
                    <SocialLinks
                      instagram={socialInstagram}
                      youtube={socialYoutube}
                      color="#1a1508"
                      className="mt-2"
                    />
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="#eab308" className="w-3.3 h-3.3">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                </svg>
              </div>
            ) : templateId === "cyber-elite" ? (
              <div className="w-full flex items-center justify-between px-16 py-8 border-t border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white flex items-center justify-center rounded-lg">
                      <span className="text-[#0a0a0c] font-black text-2xl italic">
                        CE
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xl font-black tracking-tighter text-white italic leading-none">
                        CYBER ELITE
                      </div>
                      <div className="text-[8px] opacity-30 mt-1 tracking-[0.2em]">
                        PLATFORM_STABLE_V4
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-3 border border-white/20 rotate-45"
                      />
                    ))}
                  </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                  <div className="text-[8px] font-mono text-white/20 whitespace-nowrap">
                    AUTHENTIC_LEADERBOARD_ENCRYPTED
                  </div>
                  <div className="text-xs font-black text-[#f43f5e] mt-2 italic tracking-[0.4em] f-scale">
                    {customFooter || "© 2026 CYBER ELITE"}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right flex flex-col items-end">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      {customFooter || "FOLLOW_STREAM"}
                    </div>
                    <SocialLinks
                      instagram={socialInstagram}
                      youtube={socialYoutube}
                      color="#ffffff"
                      className="mt-1"
                    />
                  </div>
                  <div className="w-12 h-12 border-2 border-[#f43f5e] rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 bg-[#f43f5e] rounded-full" />
                  </div>
                </div>
              </div>
            ) : templateId === "professional-pro" ? (
              <div className="w-full flex items-center justify-between px-12 py-6 border-t border-white/10 mt-12 bg-white/5">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-start leading-none">
                    <div className="text-xl font-black text-white italic">
                      PRO LEAGUE
                    </div>
                    <div className="text-[8px] tracking-widest opacity-40 mt-1">
                      THE ARENA OF CHAMPIONS
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-6 bg-[#fbbf24] skew-x-12" />
                    <div className="w-1.5 h-6 bg-white/20 skew-x-12" />
                    <div className="w-1.5 h-6 bg-white/10 skew-x-12" />
                  </div>
                </div>
                <div className="text-center absolute left-1/2 -translate-x-1/2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                    CHAMPIONSHIP SERIES
                  </div>
                  <div className="text-xs font-mono text-[#fbbf24] mt-1 f-scale">
                    {customFooter || "© 2026 PROFESSIONAL ESPORTS"}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right flex flex-col items-end">
                    <SocialLinks
                      instagram={socialInstagram}
                      youtube={socialYoutube}
                      color="#fbbf24"
                    />
                  </div>
                  <div className="w-10 h-10 border border-[#fbbf24] flex items-center justify-center text-[#fbbf24] font-black italic rounded-sm rotate-45">
                    <span className="-rotate-45">P</span>
                  </div>
                </div>
              </div>
            ) : templateId === "irush-pro" ? (
              <div className="w-full flex items-center justify-between relative px-4 py-2 border-t border-[#00ffff]/20">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-start">
                    <div className="text-3xl font-black tracking-tighter text-white">
                      KRAFTON
                    </div>
                    <div className="text-[8px] opacity-40">
                      © 2022 KRAFTON, Inc. All rights reserved.
                    </div>
                  </div>
                  <div className="flex gap-4 opacity-50 contrast-125 grayscale brightness-200">
                    <div className="w-6 h-6 border rounded-full flex items-center justify-center text-[8px] font-bold">
                      L
                    </div>
                    <div className="w-6 h-6 border rounded-full flex items-center justify-center text-[8px] font-bold">
                      S
                    </div>
                  </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-[#001f24] p-3 rounded-full border border-[#00ffff]/30 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                  <div className="w-12 h-12 border-2 border-[#00ffff]/40 rounded-full flex items-center justify-center font-black text-[#00ffff] text-xl">
                    IR
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-sm font-bold tracking-[0.2em] text-[#00ffff] f-scale mb-2">
                    {customFooter || "FOLLOW US"}
                  </div>
                  <SocialLinks
                    instagram={socialInstagram}
                    youtube={socialYoutube}
                    color="#00ffff"
                  />
                </div>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "px-4 py-2 font-bold rounded-tr-xl f-scale flex flex-col items-start gap-1",
                    s.accent,
                    s.accentText,
                  )}
                  style={{
                    backgroundColor: customAccentColor || undefined,
                    color: customFooterColor || undefined,
                  }}
                >
                  <div>{customFooter || "By RVNC INFERENO"}</div>
                  <SocialLinks
                    instagram={socialInstagram}
                    youtube={socialYoutube}
                    color={customFooterColor || "white"}
                  />
                </div>
                <div className="flex flex-col items-end">
                  {(templateId === "premium-1" ||
                    templateId === "premium-2") && (
                    <div
                      className={cn(
                        "font-black text-xs mb-1 uppercase",
                        templateId === "premium-1"
                          ? "text-[#00ffcc]"
                          : "text-[#4a3728]",
                      )}
                    >
                      {gameType}
                    </div>
                  )}
                  <div className="text-2xl font-black italic">RVNC</div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- Components ---

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("app-theme");
    return saved === "dark";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", isDarkMode ? "dark" : "light");
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const [slots, setSlots] = useState<SlotEntry[]>(() => {
    const saved = localStorage.getItem("br-slots");
    return saved
      ? JSON.parse(saved)
      : Array.from({ length: 12 }, (_, i) => ({
          id: Math.random().toString(36).substr(2, 9),
          slotNumber: i + 1,
          teamName: "",
        }));
  });

  const duplicateAppTeamNames = React.useMemo(() => {
    const counts: Record<string, number> = {};
    slots.forEach((s) => {
      const name = (s.teamName || "").trim().toLowerCase();
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.keys(counts).filter((name) => counts[name] > 1);
  }, [slots]);

  const [matchHistory, setMatchHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem("br-history");
    return saved ? JSON.parse(saved) : [];
  });

  const [gameType, setGameType] = useState<GameType>("Scarfall");
  const [tournamentType, setTournamentType] = useState<string>(
    TOURNAMENT_TYPES[0],
  );
  const [customTournamentName, setCustomTournamentName] = useState("");
  const [groupName, setGroupName] = useState<string>(GROUPS[0]);
  const [customGroupName, setCustomGroupName] = useState("");
  const [customHeader1, setCustomHeader1] = useState("RVNC ESPORTS");
  const [customHeader2, setCustomHeader2] = useState("P R E S E N T S");
  const [customHeader3, setCustomHeader3] = useState("30k republic utsav");
  const [customHeader4, setCustomHeader4] = useState("grand finals");
  const [customTableTitle, setCustomTableTitle] = useState("OVERALL STANDINGS");
  const [customFooter, setCustomFooter] = useState(
    "© 2022 KRAFTON, Inc. All rights reserved.",
  );
  const [socialInstagram, setSocialInstagram] = useState("@IRUSH.OFFICAL");
  const [socialYoutube, setSocialYoutube] = useState("IRUSH ESPORTS");
  const [qualificationCount, setQualificationCount] = useState(4);
  const [customQualifiedColor, setCustomQualifiedColor] = useState("#22c55e");
  const [disqualificationCount, setDisqualificationCount] = useState(0);
  const [customDisqualifiedColor, setCustomDisqualifiedColor] =
    useState("#ef4444");
  const [limitTab, setLimitTab] = useState<
    "qualification" | "disqualification"
  >("qualification");
  const [customHeaderColor, setCustomHeaderColor] = useState("");
  const [customFooterColor, setCustomFooterColor] = useState("");
  const [customAccentColor, setCustomAccentColor] = useState("");
  const [h1FontSize, setH1FontSize] = useState<number>(100);
  const [h2FontSize, setH2FontSize] = useState<number>(100);
  const [h3FontSize, setH3FontSize] = useState<number>(100);
  const [h4FontSize, setH4FontSize] = useState<number>(100);
  const [footerFontSize, setFooterFontSize] = useState<number>(100);
  const [tableFontSize, setTableFontSize] = useState<number>(100);
  const [aspectRatio, setAspectRatio] = useState<
    "1:1" | "16:9" | "9:16" | "4:3"
  >("1:1");
  const [selectedTextTarget, setSelectedTextTarget] = useState<
    "all" | "h1" | "h2" | "h3" | "h4" | "footer" | "table"
  >("all");
  const [customFontSize, setCustomFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("br-custom-font-size");
    return saved ? parseInt(saved) : 100;
  });
  const [customBackgroundImage, setCustomBackgroundImage] = useState<
    string | null
  >(() => {
    return localStorage.getItem("br-custom-bg") || null;
  });
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [leaderboardOverrides, setLeaderboardOverrides] = useState<
    Record<string, Partial<LeaderboardEntry>>
  >({});

  // --- Undo/Redo stacks for leaderboardOverrides ---
  const [overridesHistory, setOverridesHistory] = useState<Record<string, Partial<LeaderboardEntry>>[]>([]);
  const [overridesRedoStack, setOverridesRedoStack] = useState<Record<string, Partial<LeaderboardEntry>>[]>([]);

  // --- Undo/Redo stacks for importedLeaderboard ---
  const [importedHistory, setImportedHistory] = useState<LeaderboardEntry[][]>([]);
  const [importedRedoStack, setImportedRedoStack] = useState<LeaderboardEntry[][]>([]);

  // --- Ref tracking of last committed state to rate-limit inputs like teamName or kills typing ---
  const lastStatePushedRef = useRef<{
    target: "overrides" | "imported";
    teamKeyOrIdx: string | number;
    field: string;
    timestamp: number;
  } | null>(null);

  const pushOverridesToHistory = (
    currentOverrides: Record<string, Partial<LeaderboardEntry>>,
    teamKey: string,
    field: string
  ) => {
    const now = Date.now();
    const last = lastStatePushedRef.current;

    if (
      last &&
      last.target === "overrides" &&
      last.teamKeyOrIdx === teamKey &&
      last.field === field &&
      now - last.timestamp < 1500
    ) {
      last.timestamp = now;
      return;
    }

    setOverridesHistory(prev => [...prev, JSON.parse(JSON.stringify(currentOverrides))]);
    setOverridesRedoStack([]); // Clear Redo
    lastStatePushedRef.current = {
      target: "overrides",
      teamKeyOrIdx: teamKey,
      field,
      timestamp: now
    };
  };

  const pushImportedToHistory = (
    currentImported: LeaderboardEntry[],
    idx: number,
    field: string
  ) => {
    const now = Date.now();
    const last = lastStatePushedRef.current;

    if (
      last &&
      last.target === "imported" &&
      last.teamKeyOrIdx === idx &&
      last.field === field &&
      now - last.timestamp < 1500
    ) {
      last.timestamp = now;
      return;
    }

    setImportedHistory(prev => [...prev, JSON.parse(JSON.stringify(currentImported))]);
    setImportedRedoStack([]); // Clear Redo
    lastStatePushedRef.current = {
      target: "imported",
      teamKeyOrIdx: idx,
      field,
      timestamp: now
    };
  };

  const handleUndoOverrides = () => {
    if (overridesHistory.length === 0) return;
    const previous = overridesHistory[overridesHistory.length - 1];
    setOverridesRedoStack(prev => [...prev, JSON.parse(JSON.stringify(leaderboardOverrides))]);
    setLeaderboardOverrides(previous);
    setOverridesHistory(prev => prev.slice(0, prev.length - 1));
    lastStatePushedRef.current = null;
  };

  const handleRedoOverrides = () => {
    if (overridesRedoStack.length === 0) return;
    const next = overridesRedoStack[overridesRedoStack.length - 1];
    setOverridesHistory(prev => [...prev, JSON.parse(JSON.stringify(leaderboardOverrides))]);
    setLeaderboardOverrides(next);
    setOverridesRedoStack(prev => prev.slice(0, prev.length - 1));
    lastStatePushedRef.current = null;
  };

  const handleUndoImported = () => {
    if (importedHistory.length === 0) return;
    const previous = importedHistory[importedHistory.length - 1];
    setImportedRedoStack(prev => [...prev, JSON.parse(JSON.stringify(importedLeaderboard))]);
    setImportedLeaderboard(previous);
    setImportedHistory(prev => prev.slice(0, prev.length - 1));
    lastStatePushedRef.current = null;
  };

  const handleRedoImported = () => {
    if (importedRedoStack.length === 0) return;
    const next = importedRedoStack[importedRedoStack.length - 1];
    setImportedHistory(prev => [...prev, JSON.parse(JSON.stringify(importedLeaderboard))]);
    setImportedLeaderboard(next);
    setImportedRedoStack(prev => prev.slice(0, prev.length - 1));
    lastStatePushedRef.current = null;
  };
  const [manualMatchTeams, setManualMatchTeams] = useState<MatchResult[]>([]);
  const [manualLeaderboardTeams, setManualLeaderboardTeams] = useState<
    LeaderboardEntry[]
  >([]);
  const [showManualTeamModal, setShowManualTeamModal] = useState(false);
  const [showBulkTeamModal, setShowBulkTeamModal] = useState(false);
  const [editingManualTeam, setEditingManualTeam] =
    useState<LeaderboardEntry | null>(null);
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);
  const [editingManualMatchTeam, setEditingManualMatchTeam] =
    useState<MatchResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("current");
  const [leaderboardSubView, setLeaderboardSubView] = useState<
    "overall" | "matches" | "stats" | "progression"
  >("overall");
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [matchSearchTerm, setMatchSearchTerm] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);
  const [currentTemplatePage, setCurrentTemplatePage] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("classic-dark");
  const [tournamentLogo, setTournamentLogo] = useState<string | undefined>(
    () => {
      return localStorage.getItem("br-tournament-logo") || undefined;
    },
  );
  const [sponsorLogo, setSponsorLogo] = useState<string | undefined>(
    () => {
      return localStorage.getItem("br-sponsor-logo") || undefined;
    },
  );
  const [screenshots, setScreenshots] = useState<
    {
      id: string;
      data: string;
      status: "pending" | "processing" | "done" | "error";
      results?: MatchResult[];
    }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [isProcessingSlots, setIsProcessingSlots] = useState(false);
  const [slotUploadMode, setSlotUploadMode] = useState<"team" | "player">(
    "team",
  );
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [templateDataOverride, setTemplateDataOverride] = useState<
    LeaderboardEntry[] | null
  >(null);
  const [importedLeaderboard, setImportedLeaderboard] = useState<
    LeaderboardEntry[]
  >(() => {
    const saved = localStorage.getItem("br-imported-leaderboard");
    return saved ? JSON.parse(saved) : [];
  });
  const [isMini, setIsMini] = useState(false);
  const [bulkTeamsText, setBulkTeamsText] = useState("");
  const [standingsPasteText, setStandingsPasteText] = useState("");
  const [showStandingsPasteSection, setShowStandingsPasteSection] = useState(false);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [pointSystem, setPointSystem] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem("br-point-system");
    return saved
      ? JSON.parse(saved)
      : {
          1: 10,
          2: 6,
          3: 5,
          4: 4,
          5: 3,
          6: 2,
          7: 1,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
          12: 0,
          13: 0,
          14: 0,
          15: 0,
          16: 0,
        };
  });
  const [pointsPerKill, setPointsPerKill] = useState<number>(() => {
    const saved = localStorage.getItem("br-points-per-kill");
    return saved ? parseInt(saved) : 1;
  });
  const [showScoringSettings, setShowScoringSettings] = useState(false);
  const slotFileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const standingsCsvFileInputRef = useRef<HTMLInputElement>(null);
  const prevSlotsRef = useRef<SlotEntry[]>([]);

  const [isAuthorized, setIsAuthorized] = useState(() => {
    const auth = sessionStorage.getItem("app-auth") === "true";
    const timestamp = sessionStorage.getItem("app-auth-timestamp");
    if (auth && timestamp) {
      const now = Date.now();
      const loginTime = parseInt(timestamp);
      if (now - loginTime < 30 * 60 * 1000) {
        return true;
      } else {
        sessionStorage.removeItem("app-auth");
        sessionStorage.removeItem("app-auth-timestamp");
        return false;
      }
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const safeFetchJson = async (res: Response): Promise<any> => {
    const contentType = res.headers.get("content-type") || "";
    
    // Explicitly handle 429 even before checking content-type
    if (res.status === 429) {
      throw new Error("Quota exceeded: You've reached your daily free-tier limit for AI requests (20/day). Please try again tomorrow, or use the manual text/CSV input methods below to avoid quota usage!");
    }

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      if (
        text.includes("<!DOCTYPE") ||
        text.includes("<html") ||
        text.toLowerCase().includes("the page c") ||
        text.toLowerCase().includes("not found")
      ) {
        throw new Error(
          "Server API returned an HTML error page instead of JSON. This usually means the server is offline or not configured for dynamic backend execution. Please check your dynamic server backend or continue with manual text/pasting input options!"
        );
      }
      throw new Error(`Server API response was not JSON: ${text.substring(0, 150)}`);
    }
    try {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err: any) {
      if (err instanceof Error) throw err;
      throw new Error("Failed to parse response JSON from server.");
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      const checkInterval = setInterval(() => {
        const timestamp = sessionStorage.getItem("app-auth-timestamp");
        if (timestamp) {
          const now = Date.now();
          const loginTime = parseInt(timestamp);
          if (now - loginTime > 30 * 60 * 1000) {
            setIsAuthorized(false);
            sessionStorage.removeItem("app-auth");
            sessionStorage.removeItem("app-auth-timestamp");
            alert("Session expired after 30 minutes. Please login again.");
          }
        }
      }, 60000); // Check every minute
      return () => clearInterval(checkInterval);
    }
  }, [isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "8446893947") {
      setIsAuthorized(true);
      const now = Date.now().toString();
      sessionStorage.setItem("app-auth", "true");
      sessionStorage.setItem("app-auth-timestamp", now);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const ScoringPresets = {
    BGMI_10PT: {
      1: 10,
      2: 6,
      3: 5,
      4: 4,
      5: 3,
      6: 2,
      7: 1,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
    },
    BGMI_15PT: {
      1: 15,
      2: 12,
      3: 10,
      4: 8,
      5: 6,
      6: 4,
      7: 2,
      8: 1,
      9: 1,
      10: 1,
      11: 1,
      12: 1,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
    },
    ESPORTS_CUSTOM: {
      1: 20,
      2: 14,
      3: 10,
      4: 8,
      5: 7,
      6: 6,
      7: 5,
      8: 4,
      9: 3,
      10: 2,
      11: 1,
      12: 1,
      13: 1,
      14: 1,
      15: 1,
      16: 1,
    },
  };

  const applyScoringPreset = (presetKey: keyof typeof ScoringPresets) => {
    setPointSystem(ScoringPresets[presetKey]);
    setShowScoringSettings(false);
    alert(`Applied ${presetKey.replace("_", " ")} scoring system!`);
  };

  const recalculateAllTotalPoints = () => {
    if (viewMode === "import") {
      const updated = importedLeaderboard.map((item) => ({
        ...item,
        totalPoints:
          item.totalKills * pointsPerKill + item.totalPlacementPoints,
      }));
      setImportedLeaderboard(
        updated.sort(
          (a, b) =>
            b.totalPoints - a.totalPoints ||
            b.totalPlacementPoints - a.totalPlacementPoints,
        ),
      );
    } else if (results) {
      const updated = results.map((item) => ({
        ...item,
        totalPoints: item.kills * pointsPerKill + item.placementPoints,
      }));
      setResults(
        updated.sort(
          (a, b) => b.totalPoints - a.totalPoints || a.rank - b.rank,
        ),
      );
    }
    alert("Recalculated all total points based on current scoring settings!");
  };

  const getMatchStats = () => {
    const data =
      viewMode === "import" ? importedLeaderboard : aggregateLeaderboard();
    if (data.length === 0) return null;

    const sortedByKills = [...data].sort((a, b) => b.totalKills - a.totalKills);
    const sortedByWWCD = [...data].sort(
      (a, b) => (b.wwcd || 0) - (a.wwcd || 0),
    );

    return {
      bestTeam: data[0],
      topFragger: sortedByKills[0],
      mostWWCD: sortedByWWCD[0],
      totalKills: data.reduce((acc, curr) => acc + curr.totalKills, 0),
      avgKillsPerTeam: (
        data.reduce((acc, curr) => acc + curr.totalKills, 0) / data.length
      ).toFixed(1),
    };
  };

  const compressImage = (
    base64Str: string,
    maxWidth = 1200,
    maxHeight = 1200,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    });
  };

  useEffect(() => {
    localStorage.setItem("br-slots", JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    const prevSlots = prevSlotsRef.current;
    if (prevSlots && prevSlots.length > 0 && slots && slots.length > 0) {
      slots.forEach((currentSlot) => {
        const matchingPrevSlot = prevSlots.find((s) => s.id === currentSlot.id);
        if (matchingPrevSlot) {
          const oldName = matchingPrevSlot.teamName?.trim();
          const newName = currentSlot.teamName?.trim();
          if (
            oldName &&
            newName &&
            oldName.toLowerCase() !== newName.toLowerCase()
          ) {
            setMatchHistory((prevHistory) =>
              prevHistory.map((match) => ({
                ...match,
                results: match.results.map((res) => {
                  if (res.teamName.trim().toLowerCase() === oldName.toLowerCase()) {
                    return { ...res, teamName: currentSlot.teamName };
                  }
                  return res;
                }),
              })),
            );
          }
        }
      });
    }
    prevSlotsRef.current = slots.map((s) => ({ ...s }));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem("br-history", JSON.stringify(matchHistory));
  }, [matchHistory]);

  useEffect(() => {
    localStorage.setItem(
      "br-imported-leaderboard",
      JSON.stringify(importedLeaderboard),
    );
  }, [importedLeaderboard]);

  useEffect(() => {
    if (tournamentLogo) {
      localStorage.setItem("br-tournament-logo", tournamentLogo);
    } else {
      localStorage.removeItem("br-tournament-logo");
    }
  }, [tournamentLogo]);

  useEffect(() => {
    if (sponsorLogo) {
      localStorage.setItem("br-sponsor-logo", sponsorLogo);
    } else {
      localStorage.removeItem("br-sponsor-logo");
    }
  }, [sponsorLogo]);

  useEffect(() => {
    localStorage.setItem("br-point-system", JSON.stringify(pointSystem));
  }, [pointSystem]);

  useEffect(() => {
    localStorage.setItem("br-points-per-kill", pointsPerKill.toString());
  }, [pointsPerKill]);

  useEffect(() => {
    if (customBackgroundImage) {
      localStorage.setItem("br-custom-bg", customBackgroundImage);
    } else {
      localStorage.removeItem("br-custom-bg");
    }
  }, [customBackgroundImage]);

  useEffect(() => {
    if (customFontSize) {
      localStorage.setItem("br-custom-font-size", customFontSize.toString());
    }
  }, [customFontSize]);

  const handleSlotFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingSlots(true);
    const allExtractedSlots: any[] = [];
    let errorOccurred = false;
    let lastErrorMsg = "";

    for (const file of files) {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      try {
        const compressedBase64 = await compressImage(fileData);
        const base64Data = compressedBase64.split(",")[1];

        const res = await fetch("/api/gemini/extract-slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Data, gameType }),
        });

        const data = await safeFetchJson(res);
        if (Array.isArray(data.results)) {
          allExtractedSlots.push(...data.results);
        }
      } catch (err: any) {
        console.error("Failed to process one of the slot list images:", err);
        errorOccurred = true;
        lastErrorMsg = err?.message || "Unknown error";
      }

      // Add delay between requests to avoid rate limits (429)
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (allExtractedSlots.length > 0) {
      setSlots((prevSlots) => {
        const updatedSlots = [...prevSlots];
        allExtractedSlots.forEach((extracted) => {
          const slotIndex = updatedSlots.findIndex(
            (s) => s.slotNumber === extracted.slotNumber,
          );
          if (slotIndex !== -1) {
            if (slotUploadMode === "team") {
              // Update team name
              updatedSlots[slotIndex] = {
                ...updatedSlots[slotIndex],
                teamName:
                  extracted.teamName || updatedSlots[slotIndex].teamName,
              };
            } else {
              // Only update players if found, preserve existing teamName and logo
              if (extracted.players) {
                updatedSlots[slotIndex] = {
                  ...updatedSlots[slotIndex],
                  players: extracted.players,
                };
              }
            }
          } else if (slotUploadMode === "team") {
            // If slot doesn't exist and we are in team mode, maybe add it?
            // For now, let's just stick to existing slots or adding new ones if needed
            updatedSlots.push({
              id: Math.random().toString(36).substr(2, 9),
              slotNumber: extracted.slotNumber,
              teamName: extracted.teamName,
              players: extracted.players,
            });
          }
        });
        return updatedSlots.sort((a, b) => a.slotNumber - b.slotNumber);
      });
    } else {
      if (errorOccurred && (lastErrorMsg.includes("Quota") || lastErrorMsg.includes("429") || lastErrorMsg.includes("limit"))) {
        alert("AI Quota Exceeded: Your Gemini daily free-tier usage limit of 20 requests has been reached. Please wait a while or use the 'Quick Bulk Auto Fill' text area above to add your slots/teams directly by copy-pasting!");
      } else {
        alert(
          `Failed to extract any ${slotUploadMode === "team" ? "team" : "player"} data. ${errorOccurred ? lastErrorMsg : "Please try clearer images."}`,
        );
      }
    }

    setIsProcessingSlots(false);
    if (slotFileInputRef.current) slotFileInputRef.current.value = "";
  };

  const findColumnIndex = (headersList: string[], candidates: string[]) => {
    const cleanHeaders = headersList.map((h) =>
      h
        .toLowerCase()
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/[\s_-]/g, ""),
    );

    // 1. Exact match / candidate inclusion
    let idx = cleanHeaders.findIndex((h) => candidates.includes(h));
    if (idx !== -1) return idx;

    // 2. Substring match
    idx = cleanHeaders.findIndex((h) =>
      candidates.some((c) => h.includes(c) || c.includes(h)),
    );
    return idx;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          alert("Selected file is empty.");
          return;
        }

        const parsedRows = parseCSV(text);
        if (parsedRows.length === 0) {
          alert("Could not parse any rows from the CSV file.");
          return;
        }

        let headers = parsedRows[0];
        let hasHeader = false;

        let slotIdx = -1;
        let teamIdx = -1;
        let playersIdx = -1;
        let logoIdx = -1;

        // Check if first row contains headers
        const possibleSlots = ["slot", "slotnumber", "slotno", "no", "rank", "id", "sn", "sno", "srno"];
        const possibleTeams = ["team", "teamname", "name", "squad", "squadname", "teams", "club", "tean", "teen"];
        const possiblePlayers = ["players", "playernames", "members", "player", "lineup"];
        const possibleLogos = ["logo", "logo_url", "image", "logourl", "teamlogo", "url", "avatar", "icon"];

        slotIdx = findColumnIndex(headers, possibleSlots);
        teamIdx = findColumnIndex(headers, possibleTeams);
        playersIdx = findColumnIndex(headers, possiblePlayers);
        logoIdx = findColumnIndex(headers, possibleLogos);

        const isHeaderRow = slotIdx !== -1 || teamIdx !== -1 || playersIdx !== -1 || logoIdx !== -1;

        let startRow = 0;
        if (isHeaderRow) {
          hasHeader = true;
          startRow = 1;
        } else {
          // Guess columns based on position if no headers matched:
          if (parsedRows[0].length >= 1) {
            const firstVal = parsedRows[0][0];
            const isNum = !isNaN(Number(firstVal)) && firstVal !== "";
            if (isNum) {
              slotIdx = 0;
              teamIdx = 1;
              if (parsedRows[0].length >= 3) playersIdx = 2;
              if (parsedRows[0].length >= 4) logoIdx = 3;
            } else {
              teamIdx = 0;
              if (parsedRows[0].length >= 2) playersIdx = 1;
              if (parsedRows[0].length >= 3) logoIdx = 2;
            }
          }
        }

        const newSlots: SlotEntry[] = [];
        const rowsToProcess = parsedRows.slice(startRow);

        rowsToProcess.forEach((row, index) => {
          if (row.length === 0 || row.join("").trim() === "") return;

          let slotNumber = index + 1;
          if (
            slotIdx !== -1 &&
            row[slotIdx] !== undefined &&
            row[slotIdx] !== ""
          ) {
            const parsedNum = parseInt(row[slotIdx].replace(/^["']|["']$/g, "").trim(), 10);
            if (!isNaN(parsedNum)) {
              slotNumber = parsedNum;
            }
          }

          let teamName = "";
          if (teamIdx !== -1 && row[teamIdx] !== undefined) {
            teamName = row[teamIdx].replace(/^["']|["']$/g, "").trim();
          }

          if (!teamName) return;

          let players = "";
          if (playersIdx !== -1 && row[playersIdx] !== undefined) {
            players = row[playersIdx].replace(/^["']|["']$/g, "").trim();
          }

          let logo = "";
          if (logoIdx !== -1 && row[logoIdx] !== undefined) {
            logo = row[logoIdx].replace(/^["']|["']$/g, "").trim();
          }

          newSlots.push({
            id: Math.random().toString(36).substring(2, 9),
            slotNumber,
            teamName,
            players: players || undefined,
            logo: logo || undefined,
          });
        });

        if (newSlots.length > 0) {
          newSlots.sort((a, b) => a.slotNumber - b.slotNumber);
          setSlots(newSlots);
          alert(
            `Imported ${newSlots.length} team(s) from CSV. Slots list updated!`,
          );
        } else {
          alert("No valid team names could be extracted from the CSV file.");
        }
      } catch (err) {
        console.error("CSV parse error:", err);
        alert("Failed to parse CSV. Please ensure the formatting is correct.");
      }
    };
    reader.readAsText(file);

    if (csvFileInputRef.current) {
      csvFileInputRef.current.value = "";
    }
  };

  const parseCSV = (text: string): string[][] => {
    let cleanText = text;

    // 1. Strip UTF-8 BOM if present
    cleanText = cleanText.replace(/^\uFEFF/, "");

    // 2. Extract contents of codeblocks if present (e.g. ```csv ... ``` or just ``` ... ```)
    const codeBlockRegex = /```(?:csv|tsv|text)?\r?\n([\s\S]*?)\r?\n```/;
    const match = cleanText.match(codeBlockRegex);
    if (match && match[1]) {
      cleanText = match[1];
    } else {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\r?\n/, "");
      cleanText = cleanText.replace(/\r?\n```$/, "");
    }
    
    cleanText = cleanText.trim();

    // 3. Autodetect the primary delimiter: comma, semicolon, or tab
    const rawLines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return [];

    let commaCount = 0;
    let semicolonCount = 0;
    let tabCount = 0;

    const sampleLines = rawLines.slice(0, 10);
    sampleLines.forEach(line => {
      commaCount += (line.match(/,/g) || []).length;
      semicolonCount += (line.match(/;/g) || []).length;
      tabCount += (line.match(/\t/g) || []).length;
    });

    let delimiter = ",";
    if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = "\t";
    } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ";";
    }

    // 4. Parse columns safely (handling quotes and escaped content)
    const parsedRows: string[][] = [];
    let currentRow: string[] = [];
    let inQuotes = false;
    let currentValue = "";

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentValue.trim());
        currentValue = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        currentRow.push(currentValue.trim());
        parsedRows.push(currentRow);
        currentRow = [];
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    if (currentValue || currentRow.length > 0) {
      currentRow.push(currentValue.trim());
      parsedRows.push(currentRow);
    }

    // 5. Clean Quotes & Trim cells, filter out noise lines (conversational lines)
    const validRows = parsedRows.map(row => 
      row.map(cell => cell.trim().replace(/^["']|["']$/g, "").trim())
    ).filter(row => row.some(cell => cell !== ""));

    if (validRows.length === 0) return [];

    const columnCounts = validRows.map(row => row.length);
    const countsMap: Record<number, number> = {};
    let maxFreq = 0;
    let modeColumnCount = 2;

    columnCounts.forEach(count => {
      if (count < 2) return;
      countsMap[count] = (countsMap[count] || 0) + 1;
      if (countsMap[count] > maxFreq) {
        maxFreq = countsMap[count];
        modeColumnCount = count;
      }
    });

    return validRows.filter(row => {
      const cleanCellCount = row.filter(cell => cell !== "").length;
      return row.length >= Math.max(2, modeColumnCount - 1) && cleanCellCount > 0;
    });
  };

  const downloadCSVTemplate = () => {
    const headers = "Slot,Team Name,Players,Logo URL";
    const example1 = '1,Team Soul,"Mortal, Regaltos, Viper, Aman",https://i.ibb.co/example1.png';
    const example2 = '2,GodLike,"Jonathan, ClutchGod, Zgod, Neyo",https://i.ibb.co/example2.png';
    const csvContent = `${headers}\n${example1}\n${example2}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    if (link.download !== undefined) {
      link.setAttribute("href", url);
      link.setAttribute("download", "teams_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  const processStandingsText = (text: string): boolean => {
    if (!text || !text.trim()) {
      alert("Selected or pasted text is empty.");
      return false;
    }

    try {
      const parsedRows = parseCSV(text);
      if (parsedRows.length === 0) {
        alert("Could not parse any rows from the data.");
        return false;
      }

      let headers = parsedRows[0];
      let hasHeader = false;

      let rankIdx = -1;
      let teamIdx = -1;
      let logoIdx = -1;
      let matchesIdx = -1;
      let wwcdIdx = -1;
      let killsIdx = -1;
      let placementIdx = -1;
      let totalIdx = -1;

      // Check columns with extra permissive candidate mappings for AI and OCR resilience
      const possibleRanks = ["rank", "position", "pos", "sn", "no", "rnk", "place", "srno"];
      const possibleTeams = ["team", "teamname", "name", "team_name", "teams", "squad", "club", "tean", "teen"];
      const possibleLogos = ["logo", "logo_url", "image", "logourl", "teamlogo", "url", "avatar", "icon"];
      const possibleMatches = ["matches", "matchesplayed", "match", "mp", "played", "gp", "games", "m", "matche"];
      const possibleWwcd = ["wwcd", "chicken", "wins", "win", "ww", "cw", "chickendinner", "wwco", "wwcd/"];
      const possibleKills = ["kills", "totalkills", "kill", "elims", "eliminations", "frags", "kp", "killpoints", "kil", "kils", "kiil"];
      const possiblePlacements = ["placement", "placementpoints", "placepoints", "pp", "placements", "placment"];
      const possibleTotals = ["total", "totalpoints", "pts", "points", "score", "tot", "totl", "tatal"];

      rankIdx = findColumnIndex(headers, possibleRanks);
      teamIdx = findColumnIndex(headers, possibleTeams);
      logoIdx = findColumnIndex(headers, possibleLogos);
      matchesIdx = findColumnIndex(headers, possibleMatches);
      wwcdIdx = findColumnIndex(headers, possibleWwcd);
      killsIdx = findColumnIndex(headers, possibleKills);
      placementIdx = findColumnIndex(headers, possiblePlacements);
      totalIdx = findColumnIndex(headers, possibleTotals);

      const isHeaderRow =
        rankIdx !== -1 ||
        teamIdx !== -1 ||
        logoIdx !== -1 ||
        matchesIdx !== -1 ||
        wwcdIdx !== -1 ||
        killsIdx !== -1 ||
        placementIdx !== -1 ||
        totalIdx !== -1;

      let startRow = 0;
      if (isHeaderRow) {
        hasHeader = true;
        startRow = 1;
      } else {
        // Default positional guess if no header row matches:
        rankIdx = 0;
        teamIdx = 1;
        matchesIdx = 2;
        wwcdIdx = 3;
        killsIdx = 4;
        placementIdx = 5;
        totalIdx = 6;
        logoIdx = 7;
      }

      const newStandings: LeaderboardEntry[] = [];
      const rowsToProcess = parsedRows.slice(startRow);

      rowsToProcess.forEach((row, index) => {
        if (row.length === 0 || row.join("").trim() === "") return;

        let teamName = "";
        if (teamIdx !== -1 && row[teamIdx] !== undefined) {
          teamName = row[teamIdx].replace(/^["']|["']$/g, "").trim();
        }

        if (!teamName) return;

        let matchesPlayed = 0;
        if (matchesIdx !== -1 && row[matchesIdx] !== undefined && row[matchesIdx] !== "") {
          const parsedNum = parseInt(row[matchesIdx].replace(/^["']|["']$/g, "").trim(), 10);
          if (!isNaN(parsedNum)) matchesPlayed = parsedNum;
        }

        let wwcd = 0;
        if (wwcdIdx !== -1 && row[wwcdIdx] !== undefined && row[wwcdIdx] !== "") {
          const parsedNum = parseInt(row[wwcdIdx].replace(/^["']|["']$/g, "").trim(), 10);
          if (!isNaN(parsedNum)) wwcd = parsedNum;
        }

        let totalKills = 0;
        if (killsIdx !== -1 && row[killsIdx] !== undefined && row[killsIdx] !== "") {
          const parsedNum = parseInt(row[killsIdx].replace(/^["']|["']$/g, "").trim(), 10);
          if (!isNaN(parsedNum)) totalKills = parsedNum;
        }

        let totalPlacementPoints = 0;
        if (placementIdx !== -1 && row[placementIdx] !== undefined && row[placementIdx] !== "") {
          const parsedNum = parseInt(row[placementIdx].replace(/^["']|["']$/g, "").trim(), 10);
          if (!isNaN(parsedNum)) totalPlacementPoints = parsedNum;
        }

        let totalPoints = 0;
        if (totalIdx !== -1 && row[totalIdx] !== undefined && row[totalIdx] !== "") {
          const parsedNum = parseInt(row[totalIdx].replace(/^["']|["']$/g, "").trim(), 10);
          if (!isNaN(parsedNum)) totalPoints = parsedNum;
        } else {
          // Auto calculate points if not provided explicitly in total column
          totalPoints = totalKills * pointsPerKill + totalPlacementPoints;
        }

        let logo = "";
        if (logoIdx !== -1 && row[logoIdx] !== undefined) {
          logo = row[logoIdx].replace(/^["']|["']$/g, "").trim();
        }

        newStandings.push({
          teamName,
          logo: logo || undefined,
          matchesPlayed,
          wwcd,
          totalKills,
          totalPlacementPoints,
          totalPoints,
        });
      });

      if (newStandings.length > 0) {
        newStandings.sort((a, b) => b.totalPoints - a.totalPoints || b.totalPlacementPoints - a.totalPlacementPoints);
        setImportedLeaderboard(newStandings);
        localStorage.setItem("br-imported-leaderboard", JSON.stringify(newStandings));
        alert(`Successfully imported ${newStandings.length} teams into the standings leaderboard!`);
        return true;
      } else {
        alert("No valid team data could be parsed from the pasted text/CSV.");
        return false;
      }
    } catch (err) {
      console.error("Standings parse error:", err);
      alert("Failed to parse data. Please check formatting.");
      return false;
    }
  };

  const handleStandingsCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        alert("Selected file is empty.");
        return;
      }
      processStandingsText(text);
    };
    reader.readAsText(file);

    if (standingsCsvFileInputRef.current) {
      standingsCsvFileInputRef.current.value = "";
    }
  };

  const downloadStandingsCSVTemplate = () => {
    const headers = "Rank,Team Name,Matches Played,WWCD,Total Kills,Total Placement Points,Total Points,Logo URL";
    const example1 = '1,Team Soul,5,2,30,45,75,https://i.ibb.co/example1.png';
    const example2 = '2,GodLike,5,1,25,35,60,https://i.ibb.co/example2.png';
    const csvContent = `${headers}\n${example1}\n${example2}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    if (link.download !== undefined) {
      link.setAttribute("href", url);
      link.setAttribute("download", "standings_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  const handleImportTable = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImport(true);
    const reader = new FileReader();
    const fileData = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    try {
      const compressedBase64 = await compressImage(fileData);
      const base64Data = compressedBase64.split(",")[1];

      const res = await fetch("/api/gemini/import-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data, gameType }),
      });

      const data = await safeFetchJson(res);
      const extracted = data.results;

      if (Array.isArray(extracted) && extracted.length > 0) {
        // Try to match logos from existing slots
        const withLogos = extracted
          .map((item) => {
            const slot = slots.find(
              (s) =>
                s.teamName.trim().toLowerCase() ===
                item.teamName.trim().toLowerCase(),
            );
            return { ...item, logo: slot?.logo };
          })
          .sort(
            (a, b) =>
              b.totalPoints - a.totalPoints ||
              b.totalPlacementPoints - a.totalPlacementPoints ||
              (b.wwcd || 0) - (a.wwcd || 0) ||
              b.totalKills - a.totalKills,
          );
        setImportedLeaderboard(withLogos);
        alert("Points table imported successfully! You can now edit it.");
      } else {
        alert(
          "Failed to extract data from the image. Please try a clearer screenshot.",
        );
      }
    } catch (err: any) {
      console.error("Failed to import table:", err);
      const errMsg = err?.message || "Please try again.";
      if (errMsg.includes("Quota") || errMsg.includes("429") || errMsg.includes("limit")) {
        alert("AI Quota Exceeded: Your Gemini daily free-tier usage limit of 20 requests has been reached. Please print/copy your overall standings and paste them directly in the 'Paste CSV / Excel Text Directly' section!");
      } else {
        alert(`Error processing the image: ${errMsg}`);
      }
    }

    setIsProcessingImport(false);
    if (importFileInputRef.current) importFileInputRef.current.value = "";
  };

  const handleManualEditImport = (
    idx: number,
    field: keyof LeaderboardEntry,
    value: string | number,
  ) => {
    pushImportedToHistory(importedLeaderboard, idx, field as string);
    const newLeaderboard = [...importedLeaderboard];
    const item = { ...newLeaderboard[idx] };

    if (field === "teamName" || field === "logo") {
      (item as any)[field] = value;
    } else {
      const numVal = parseInt(value as string) || 0;
      (item as any)[field] = numVal;

      // Recalculate total points if kills or placement points changed
      if (field === "totalKills" || field === "totalPlacementPoints") {
        item.totalPoints =
          item.totalKills * pointsPerKill + item.totalPlacementPoints;
      }
    }

    newLeaderboard[idx] = item;
    setImportedLeaderboard(
      newLeaderboard.sort(
        (a, b) =>
          b.totalPoints - a.totalPoints ||
          b.totalPlacementPoints - a.totalPlacementPoints ||
          b.wwcd - a.wwcd ||
          b.totalKills - a.totalKills,
      ),
    );
  };

  const handleAddImportRow = () => {
    pushImportedToHistory(importedLeaderboard, -1, "add_row");
    const newRow: LeaderboardEntry = {
      teamName: "New Team",
      matchesPlayed: 0,
      wwcd: 0,
      totalKills: 0,
      totalPlacementPoints: 0,
      totalPoints: 0,
    };
    setImportedLeaderboard([...importedLeaderboard, newRow]);
  };

  const handleRemoveImportRow = (idx: number) => {
    pushImportedToHistory(importedLeaderboard, idx, "remove_row");
    setImportedLeaderboard(importedLeaderboard.filter((_, i) => i !== idx));
  };

  const handleBackgroundUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const fileData = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    setImageToCrop(fileData);
    setShowCropModal(true);
    if (bgFileInputRef.current) bgFileInputRef.current.value = "";
  };

  const handleAddSlot = () => {
    const nextNum =
      slots.length > 0 ? Math.max(...slots.map((s) => s.slotNumber)) + 1 : 1;
    setSlots([
      ...slots,
      {
        id: Math.random().toString(36).substr(2, 9),
        slotNumber: nextNum,
        teamName: "",
      },
    ]);
  };

  const handleUpdateSlot = (
    id: string,
    field: "teamName" | "players",
    value: string,
  ) => {
    setSlots(slots.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleLogoUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const compressed = await compressImage(base64, 200, 200);
        setSlots(
          slots.map((s) => (s.id === id ? { ...s, logo: compressed } : s)),
        );
      } catch (err) {
        console.error("Logo upload failed:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSlot = (id: string) => {
    setSlots(slots.filter((s) => s.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 10 - screenshots.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshots((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            status: "pending",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
  };

  const processScreenshots = async () => {
    if (screenshots.length === 0) return;
    setIsProcessing(true);
    setError(null);

    let allNewResults: MatchResult[] = [];

    for (const screenshot of screenshots) {
      if (screenshot.status === "done") continue;

      setScreenshots((prev) =>
        prev.map((s) =>
          s.id === screenshot.id ? { ...s, status: "processing" } : s,
        ),
      );

      try {
        const compressedData = await compressImage(screenshot.data);
        const base64Data = compressedData.split(",")[1];

        const res = await fetch("/api/gemini/extract-match-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data,
            gameType,
            slots,
            pointSystem,
            pointsPerKill
          }),
        });

        const data = await safeFetchJson(res);
        const results = data.results;

        if (Array.isArray(results)) {
          const matchResults = results.map((r: any) => {
            // Recalculate points in code to avoid Gemini math errors
            const placementPoints = pointSystem[r.rank] || 0;
            const totalPoints = placementPoints + r.kills * pointsPerKill;
            return {
              ...r,
              placementPoints,
              totalPoints,
              wwcd: r.rank === 1 ? 1 : 0,
            };
          });

          // Check for duplicate ranks
          const ranks = matchResults.map((r) => r.rank);
          const duplicateRanks = ranks.filter(
            (item, index) => ranks.indexOf(item) !== index,
          );
          if (duplicateRanks.length > 0) {
            setError(
              `Warning: Duplicate ranks detected (${duplicateRanks.join(", ")}). Please check the results manually.`,
            );
          }

          allNewResults = [...allNewResults, ...matchResults];
          setScreenshots((prev) =>
            prev.map((s) =>
              s.id === screenshot.id
                ? { ...s, status: "done", results: matchResults }
                : s,
            ),
          );
        } else {
          throw new Error("No results found in image");
        }
      } catch (err: any) {
        console.error(err);
        setScreenshots((prev) =>
          prev.map((s) =>
            s.id === screenshot.id ? { ...s, status: "error" } : s,
          ),
        );
        const errorMessage = err?.message || "Unknown error";
        if (
          errorMessage.toLowerCase().includes("quota") ||
          errorMessage.toLowerCase().includes("limit") ||
          errorMessage.includes("429")
        ) {
          setError(
            "AI Quota Exceeded: Your Gemini daily free-tier usage limit of 20 requests has been reached. Please wait a while or use 'Add Manual Result' / text paste mode to input your achievements without AI quotas!"
          );
        } else if (
          errorMessage.includes("Rpc failed") ||
          errorMessage.includes("xhr error")
        ) {
          setError(
            `Network error: The image might be too large or the connection was interrupted. Retrying with a smaller image...`,
          );
        } else {
          setError(`Failed to process screenshot: ${errorMessage}`);
        }
      }

      // Add delay between requests to avoid rate limits (429)
      await new Promise((r) => setTimeout(r, 2000));
    }

    setIsProcessing(false);
    if (allNewResults.length > 0) {
      const merged: Record<string, MatchResult> = {};

      allNewResults.forEach((res) => {
        const name = res.teamName.trim();
        if (!merged[name]) {
          merged[name] = { ...res };
        } else {
          // Merge logic: Take MAX kills (to avoid double counting overlapping screenshots),
          // keep best rank/placement points
          merged[name].kills = Math.max(merged[name].kills, res.kills);
          if (res.rank < merged[name].rank) {
            merged[name].rank = res.rank;
            merged[name].placementPoints = res.placementPoints;
            merged[name].wwcd = res.rank === 1 ? 1 : 0;
          }
          merged[name].totalPoints =
            merged[name].placementPoints + merged[name].kills * pointsPerKill;
        }
      });

      const finalResults = Object.values(merged).sort(
        (a, b) => b.totalPoints - a.totalPoints || a.rank - b.rank,
      );
      setResults(finalResults);
    }
  };

  const saveMatchToHistory = () => {
    if (!results || results.length === 0) return;

    const finalTournamentName =
      tournamentType === "Custom"
        ? customTournamentName || "Custom"
        : tournamentType;
    const finalGroupName =
      groupName === "Custom" ? customGroupName || "Custom" : groupName;

    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      gameType,
      tournamentType: finalTournamentName,
      groupName: finalGroupName,
      timestamp: Date.now(),
      results: results,
    };

    setMatchHistory([...matchHistory, newEntry]);
    setResults(null);
    setScreenshots([]);
    alert(
      `Saved match to ${gameType} - ${finalTournamentName} (${finalGroupName}) history!`,
    );
  };

  const clearHistory = () => {
    const finalTournamentName =
      tournamentType === "Custom"
        ? customTournamentName || "Custom"
        : tournamentType;
    const finalGroupName =
      groupName === "Custom" ? customGroupName || "Custom" : groupName;
    setMatchHistory(
      matchHistory.filter(
        (h) =>
          !(
            h.gameType === gameType &&
            h.tournamentType === finalTournamentName &&
            h.groupName === finalGroupName
          ),
      ),
    );
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatchHistory(matchHistory.filter((h) => h.id !== matchId));
  };

  const handleEditMatchHistoryResult = (
    matchId: string,
    idx: number,
    field: keyof MatchResult,
    value: string | number,
  ) => {
    setMatchHistory((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;

        const newResults = [...match.results];
        const item = { ...newResults[idx] };

        if (field === "teamName") {
          item.teamName = value as string;
        } else {
          const numVal = parseInt(value as string) || 0;
          (item as any)[field] = numVal;

          // Recalculate points if rank, kills, or placementPoints changed
          if (
            field === "rank" ||
            field === "kills" ||
            field === "placementPoints"
          ) {
            if (field === "rank") {
              const r = item.rank;
              item.placementPoints = pointSystem[r] || 0;
              // Auto-update WWCD if rank changes
              if (
                item.wwcd === undefined ||
                item.wwcd === (newResults[idx].rank === 1 ? 1 : 0)
              ) {
                item.wwcd = r === 1 ? 1 : 0;
              }
            }

            item.totalPoints =
              item.placementPoints + item.kills * pointsPerKill;
          }
        }

        newResults[idx] = item;
        return { ...match, results: newResults };
      }),
    );
  };

  const handleManualEdit = (
    idx: number,
    field: keyof MatchResult,
    value: string | number,
    isManual: boolean = false,
  ) => {
    const source = isManual ? manualMatchTeams : results || [];
    const setter = isManual ? setManualMatchTeams : setResults;

    if (source.length === 0) return;
    const newItems = [...source];
    const item = { ...newItems[idx] };

    if (field === "teamName") {
      item.teamName = value as string;
    } else {
      const numVal = parseInt(value as string) || 0;
      (item as any)[field] = numVal;

      // Recalculate points if rank, kills, or placementPoints changed
      if (
        field === "rank" ||
        field === "kills" ||
        field === "placementPoints"
      ) {
        if (field === "rank") {
          const r = item.rank;
          item.placementPoints = pointSystem[r] || 0;
          // Auto-update WWCD if rank changes and it hasn't been manually edited yet
          if (
            item.wwcd === undefined ||
            item.wwcd === (newItems[idx].rank === 1 ? 1 : 0)
          ) {
            item.wwcd = r === 1 ? 1 : 0;
          }
        }

        item.totalPoints = item.placementPoints + item.kills * pointsPerKill;
      }
    }

    newItems[idx] = item;
    setter(
      newItems.sort((a, b) => b.totalPoints - a.totalPoints || a.rank - b.rank),
    );
  };

  const downloadLeaderboardImage = async () => {
    const node = document.getElementById("leaderboard-template");
    if (node && !isDownloadingImage) {
      setIsDownloadingImage(true);
      try {
        // Wait a bit for any pending renders
        await new Promise((resolve) => setTimeout(resolve, 500));

        const options = {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
          skipAutoScale: true,
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
        };

        // html-to-image sometimes needs a "warm-up" call
        await toPng(node, options);

        // Actual capture
        const dataUrl = await toPng(node, options);

        if (!dataUrl || dataUrl.length < 100) {
          throw new Error("Generated image is empty or too small");
        }

        const link = document.createElement("a");
        link.download = `leaderboard_page${currentTemplatePage + 1}_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Image generation failed:", err);
        alert("Failed to generate image. Please try again.");
      } finally {
        setIsDownloadingImage(false);
      }
    }
  };

  const aggregateLeaderboard = (): LeaderboardEntry[] => {
    const finalTournamentName =
      tournamentType === "Custom"
        ? customTournamentName || "Custom"
        : tournamentType;
    const finalGroupName =
      groupName === "Custom" ? customGroupName || "Custom" : groupName;
    const filteredHistory = matchHistory.filter(
      (h) =>
        h.gameType === gameType &&
        h.tournamentType === finalTournamentName &&
        h.groupName === finalGroupName,
    );
    const aggregation: Record<string, LeaderboardEntry> = {};

    filteredHistory.forEach((match) => {
      match.results.forEach((res) => {
        const normalizedResName = res.teamName.trim().toLowerCase();
        if (!aggregation[normalizedResName]) {
          const teamSlot = slots.find(
            (s) => s.teamName.trim().toLowerCase() === normalizedResName,
          );
          aggregation[normalizedResName] = {
            teamName: res.teamName,
            logo: teamSlot?.logo,
            matchesPlayed: 0,
            wwcd: 0,
            totalKills: 0,
            totalPlacementPoints: 0,
            totalPoints: 0,
          };
        }
        aggregation[normalizedResName].matchesPlayed += 1;
        // Use manual WWCD if available, otherwise default to 1 if rank 1
        aggregation[normalizedResName].wwcd +=
          res.wwcd !== undefined ? res.wwcd : res.rank === 1 ? 1 : 0;
        aggregation[normalizedResName].totalKills += res.kills;
        aggregation[normalizedResName].totalPlacementPoints +=
          res.placementPoints;
        aggregation[normalizedResName].totalPoints += res.totalPoints;
      });
    });

    manualLeaderboardTeams.forEach((manualTeam) => {
      const normalizedName = manualTeam.teamName.trim().toLowerCase();
      if (!aggregation[normalizedName]) {
        aggregation[normalizedName] = { ...manualTeam };
      } else {
        aggregation[normalizedName].matchesPlayed += manualTeam.matchesPlayed;
        aggregation[normalizedName].wwcd += manualTeam.wwcd;
        aggregation[normalizedName].totalKills += manualTeam.totalKills;
        aggregation[normalizedName].totalPlacementPoints +=
          manualTeam.totalPlacementPoints;
        aggregation[normalizedName].totalPoints += manualTeam.totalPoints;
      }
    });

    return Object.values(aggregation)
      .map((entry) => {
        const overrides = leaderboardOverrides[entry.teamName];
        if (overrides) {
          return { ...entry, ...overrides };
        }
        return entry;
      })
      .sort(
        (a, b) =>
          b.totalPoints - a.totalPoints ||
          b.totalPlacementPoints - a.totalPlacementPoints ||
          b.wwcd - a.wwcd ||
          b.totalKills - a.totalKills,
      );
  };

  const downloadTable = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Get headers from the first object
    const headers = Object.keys(data[0]).join(",");

    // Create CSV rows, escaping values with quotes to handle commas
    const csvRows = data.map((row) => {
      return Object.values(row)
        .map((val) => {
          const escaped = ("" + val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",");
    });

    const csvContent = headers + "\n" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    if (link.download !== undefined) {
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up the URL object after a longer delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  const leaderboardData = aggregateLeaderboard();

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-[#05111a] flex items-center justify-center z-[100] px-4 font-sans">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #1e4d6e 0%, transparent 70%)",
          }}
        />
        <div className="bg-[#0a232e] border-2 border-[#00d4ff]/30 p-8 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,212,255,0.1)] relative z-10 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-[#00d4ff]/10 rounded-full flex items-center justify-center mb-4 border border-[#00d4ff]/20">
              <Shield size={40} className="text-[#00d4ff]" />
            </div>
            <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase text-center">
              SYSTEM ACCESS <span className="text-[#00d4ff]">RESTRICTED</span>
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">
              Enter Credentials to Proceed
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="ENTER ACCESS KEY"
                className={cn(
                  "w-full bg-black/40 border-2 px-4 py-4 text-white font-mono text-center tracking-[0.5em] rounded-xl outline-none transition-all",
                  authError
                    ? "border-red-500 animate-pulse"
                    : "border-white/10 focus:border-[#00d4ff]",
                )}
              />
              {authError && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                  Invalid Access Key. Access Denied.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-[#00d4ff] hover:bg-white text-black font-black italic py-4 rounded-xl transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              Authorize Node
            </button>
          </form>

          <div className="mt-8 flex justify-between items-center text-[8px] font-black text-white/20 tracking-[0.3em] uppercase">
            <span>SECURED_TRANSMISSION</span>
            <div className="w-1 h-1 bg-[#00d4ff] rounded-full" />
            <span>ENCRYPTED_SESSION</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-300",
      isDarkMode
        ? "bg-[#0a0a0a] text-[#E4E3E0] selection:bg-[#E4E3E0] selection:text-[#0a0a0a]"
        : "bg-[#E4E3E0] text-[#141414] selection:bg-[#141414] selection:text-[#E4E3E0]"
    )}>
      {/* Header */}
      <header className={cn(
        "border-b p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors",
        isDarkMode ? "border-white/10" : "border-[#141414]"
      )}>
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic font-serif">
            Point Table
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-1">
            <p className="text-xs opacity-60 font-mono uppercase tracking-widest">
              Automated Tournament Scrutiny v1.0
            </p>
            <div className={cn(
              "flex border text-[10px] font-mono uppercase transition-colors",
              isDarkMode ? "border-white/20" : "border-[#141414]"
            )}>
              <button
                onClick={() => setGameType("Scarfall")}
                className={cn(
                  "px-2 py-0.5 transition-colors",
                  gameType === "Scarfall"
                    ? (isDarkMode ? "bg-[#E4E3E0] text-[#0a0a0a]" : "bg-[#141414] text-[#E4E3E0]")
                    : (isDarkMode ? "hover:bg-white/10" : "hover:bg-[#141414]/10"),
                )}
              >
                Scarfall
              </button>
              <button
                onClick={() => setGameType("BGMI")}
                className={cn(
                  "px-2 py-0.5 border-l transition-colors",
                  isDarkMode ? "border-white/20" : "border-[#141414]",
                  gameType === "BGMI"
                    ? (isDarkMode ? "bg-[#E4E3E0] text-[#0a0a0a]" : "bg-[#141414] text-[#E4E3E0]")
                    : (isDarkMode ? "hover:bg-white/10" : "hover:bg-[#141414]/10"),
                )}
              >
                BGMI
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                className={cn(
                  "cursor-pointer bg-transparent border p-1 transition-colors",
                  isDarkMode
                    ? "border-white/20 hover:bg-white/10"
                    : "border-[#141414] hover:bg-[#141414]/10"
                )}
                title="Upload Tournament Logo"
              >
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const compressed = await compressImage(
                          reader.result as string,
                          400,
                          400,
                        );
                        setTournamentLogo(compressed);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {tournamentLogo ? (
                  <img
                    src={tournamentLogo}
                    alt="Logo"
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <ImagePlus size={14} />
                )}
              </label>
              {tournamentLogo && (
                <button
                  onClick={() => setTournamentLogo(undefined)}
                  className="text-[#141414]/40 hover:text-red-600 transition-colors"
                  title="Remove Logo"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tournamentType}
                onChange={(e) => setTournamentType(e.target.value)}
                className={cn(
                  "bg-transparent border text-[10px] font-mono uppercase px-2 py-0.5 outline-none transition-colors",
                  isDarkMode ? "border-white/20" : "border-[#141414]"
                )}
              >
                {TOURNAMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {tournamentType === "Custom" && (
                <input
                  type="text"
                  value={customTournamentName}
                  onChange={(e) => setCustomTournamentName(e.target.value)}
                  placeholder="Tournament Name..."
                  className="bg-transparent border-b border-[#141414] text-[10px] font-mono px-2 py-0.5 outline-none w-32"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={cn(
                  "bg-transparent border text-[10px] font-mono uppercase px-2 py-0.5 outline-none transition-colors",
                  isDarkMode ? "border-white/20" : "border-[#141414]"
                )}
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {groupName === "Custom" && (
                <input
                  type="text"
                  value={customGroupName}
                  onChange={(e) => setCustomGroupName(e.target.value)}
                  placeholder="Group Name..."
                  className="bg-transparent border-b border-[#141414] text-[10px] font-mono px-2 py-0.5 outline-none w-32"
                />
              )}
            </div>
          </div>
        </div>

        <nav className={cn(
          "flex gap-2 border p-1",
          isDarkMode ? "border-white/20 bg-white/5" : "border-[#141414] bg-[#141414]/5"
        )}>
          <button
            onClick={() => setViewMode("current")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
              viewMode === "current"
                ? (isDarkMode ? "bg-[#E4E3E0] text-[#0a0a0a]" : "bg-[#141414] text-[#E4E3E0]")
                : (isDarkMode ? "hover:bg-white/10" : "hover:bg-[#141414]/10"),
            )}
          >
            Current Match
          </button>
          <button
            onClick={() => setViewMode("leaderboard")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
              viewMode === "leaderboard"
                ? (isDarkMode ? "bg-[#E4E3E0] text-[#0a0a0a]" : "bg-[#141414] text-[#E4E3E0]")
                : (isDarkMode ? "hover:bg-white/10" : "hover:bg-[#141414]/10"),
            )}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setViewMode("import")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
              viewMode === "import"
                ? (isDarkMode ? "bg-[#E4E3E0] text-[#0a0a0a]" : "bg-[#141414] text-[#E4E3E0]")
                : (isDarkMode ? "hover:bg-white/10" : "hover:bg-[#141414]/10"),
            )}
          >
            Import Table
          </button>
          <div className="ml-auto flex items-center border-l border-current/10 pl-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1 px-3 text-xs font-bold uppercase tracking-wider transition-all hover:bg-current/10 flex items-center gap-2"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span className="hidden sm:inline">
                {isDarkMode ? "Light" : "Dark"}
              </span>
            </button>
          </div>
        </nav>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-88px)]">
        {/* Left Panel: Slot List */}
        <section className={cn(
          "lg:col-span-3 border-r p-6 overflow-y-auto max-h-[calc(100vh-88px)] transition-colors",
          isDarkMode ? "border-white/10" : "border-[#141414]"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-serif italic uppercase opacity-50 flex items-center gap-2">
              <Users size={14} />
              Slot List
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSlots(
                    Array.from({ length: 12 }, (_, i) => ({
                      id: Math.random().toString(36).substr(2, 9),
                      slotNumber: i + 1,
                      teamName: "",
                    })),
                  )
                }
                className="p-1 hover:text-blue-600 transition-all"
                title="Reset to 12 Slots"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={() => setSlots([])}
                className="p-1 text-red-600 hover:bg-red-50 transition-all"
                title="Clear All Slots"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => {
                  setSlotUploadMode("team");
                  setTimeout(() => slotFileInputRef.current?.click(), 0);
                }}
                disabled={isProcessingSlots}
                className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] border border-transparent hover:border-[#141414] transition-all flex flex-col items-center gap-0.5"
                title="Import Team Names"
              >
                {isProcessingSlots && slotUploadMode === "team" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                <span className="text-[8px] font-bold uppercase">Teams</span>
              </button>
              <button
                onClick={() => {
                  setSlotUploadMode("player");
                  setTimeout(() => slotFileInputRef.current?.click(), 0);
                }}
                disabled={isProcessingSlots}
                className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] border border-transparent hover:border-[#141414] transition-all flex flex-col items-center gap-0.5"
                title="Import Player Names"
              >
                {isProcessingSlots && slotUploadMode === "player" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Users size={16} />
                )}
                <span className="text-[8px] font-bold uppercase">Players</span>
              </button>
              <button
                onClick={handleAddSlot}
                className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] border border-transparent hover:border-[#141414] transition-all"
                title="Add Slot"
              >
                <Plus size={18} />
              </button>
            </div>
            <input
              type="file"
              ref={slotFileInputRef}
              onChange={handleSlotFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {/* Bulk Team Manager Button */}
          <button
            onClick={() => setShowBulkTeamModal(true)}
            className={cn(
              "w-full mb-4 py-3 px-4 text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all duration-150 transform active:scale-[0.98] group border",
              isDarkMode
                ? "bg-[#1b1b1b] hover:bg-neutral-800 text-white border-white/10 shadow-orange-500/5 hover:border-white/20"
                : "bg-white hover:bg-gray-100 text-[#141414] border-[#141414]/15 shadow-[#141414]/5 hover:border-[#141414]"
            )}
          >
            <Settings size={15} className="group-hover:rotate-45 transition-transform duration-300 text-orange-500" />
            <span>Centralized Bulk Team Manager</span>
          </button>

          {/* Quick Bulk Auto Fill Textarea */}
          <div className={cn(
            "p-3 border mb-5 rounded-xl transition-all shadow-sm",
            isDarkMode ? "border-white/10 bg-white/5" : "border-[#141414]/10 bg-gray-50/50"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 flex items-center gap-1">
                <Users size={12} /> Auto Fill Slots
              </span>
              <span className="text-[8px] font-mono opacity-60 uppercase">
                1 Team Per Line
              </span>
            </div>
            <textarea
              value={bulkTeamsText}
              onChange={(e) => setBulkTeamsText(e.target.value)}
              placeholder="Copy/paste slot-wise team names here:&#10;Ex:&#10;Team Soul&#10;TX&#10;GodLike&#10;Entity"
              rows={5}
              className={cn(
                "w-full text-xs font-mono p-2.5 border outline-none resize-y rounded-lg transition-colors bg-transparent",
                isDarkMode
                  ? "border-white/10 focus:border-white/30 text-white placeholder-white/20"
                  : "border-[#141414]/20 focus:border-[#141414] text-black placeholder-black/30"
              )}
            />
            <button
              onClick={() => {
                if (!bulkTeamsText.trim()) return;

                const lines = bulkTeamsText.split(/\r?\n/);
                
                setSlots((prevSlots) => {
                  const updatedSlots = [...prevSlots];
                  const parsedTeams: string[] = [];
                  
                  lines.forEach(line => {
                    const trimmed = line.trim();
                    if (!trimmed) return;

                    // Automatically strip leading numbering/prefixes (e.g. "1.", "1 -", "01:", "1. ", "01 ")
                    const cleanName = trimmed.replace(/^\d+[\s\.\-:\s#]+\s*/, "").trim();
                    if (cleanName) {
                      parsedTeams.push(cleanName);
                    } else if (trimmed) {
                      parsedTeams.push(trimmed);
                    }
                  });

                  parsedTeams.forEach((teamName, idx) => {
                    const slotNum = idx + 1;
                    const existingIdx = updatedSlots.findIndex(s => s.slotNumber === slotNum);
                    if (existingIdx !== -1) {
                      updatedSlots[existingIdx] = {
                        ...updatedSlots[existingIdx],
                        teamName: teamName
                      };
                    } else {
                      updatedSlots.push({
                        id: Math.random().toString(36).substring(2, 9),
                        slotNumber: slotNum,
                        teamName: teamName
                      });
                    }
                  });

                  return updatedSlots.sort((a, b) => a.slotNumber - b.slotNumber);
                });

                setBulkTeamsText("");
              }}
              className="mt-2.5 w-full py-2 text-[10px] font-black uppercase tracking-wider bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white transition-all rounded-lg shadow-lg shadow-orange-500/10 flex items-center justify-center gap-1.5"
            >
              <Plus size={12} /> Add Teams (Auto Fill Slots)
            </button>
          </div>



          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={cn(
                  "group flex flex-col gap-2 p-3 border transition-all",
                  isDarkMode
                    ? "border-white/5 bg-white/5 hover:bg-white/10"
                    : "border-[#141414]/10 bg-white/50 hover:bg-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center border font-mono text-xs shrink-0 transition-colors",
                    isDarkMode
                      ? "border-white/20 bg-white text-black"
                      : "border-[#141414] bg-[#141414] text-[#E4E3E0]"
                  )}>
                    {slot.slotNumber}
                  </div>

                  {/* Logo Upload */}
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      id={`logo-${slot.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(slot.id, e)}
                    />
                    <label
                      htmlFor={`logo-${slot.id}`}
                      className={cn(
                        "w-8 h-8 border flex items-center justify-center cursor-pointer transition-all overflow-hidden",
                        isDarkMode
                          ? "border-white/10 bg-white/5 hover:bg-white/10"
                          : "border-[#141414]/20 bg-white hover:bg-[#141414]/5"
                      )}
                    >
                      {slot.logo ? (
                        <img
                          src={slot.logo}
                          alt="Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon size={14} className="opacity-30" />
                      )}
                    </label>
                    {slot.logo && (
                      <button
                        onClick={() =>
                          setSlots(
                            slots.map((s) =>
                              s.id === slot.id ? { ...s, logo: undefined } : s,
                            ),
                          )
                        }
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-700 transition-colors z-10"
                        title="Remove Logo"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={slot.teamName ?? ""}
                    onChange={(e) =>
                      handleUpdateSlot(slot.id, "teamName", e.target.value)
                    }
                    placeholder="Team Name..."
                    className={cn(
                      "flex-1 bg-transparent border-b outline-none py-1 px-2 text-sm font-bold transition-colors",
                      slot.teamName?.trim() && duplicateAppTeamNames.includes(slot.teamName.trim().toLowerCase())
                        ? "border-red-500 text-red-500"
                        : isDarkMode
                        ? "border-white/10 focus:border-white/40 text-white"
                        : "border-[#141414]/20 focus:border-[#141414] text-[#141414]"
                    )}
                  />
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    className={cn(
                      "p-1 transition-all",
                      isDarkMode
                        ? "text-red-400/30 hover:text-red-400 hover:bg-red-900/20"
                        : "text-red-600/30 hover:text-red-600 hover:bg-red-50"
                    )}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Players Input */}
                <div className="pl-10">
                  <input
                    type="text"
                    value={slot.players || ""}
                    onChange={(e) =>
                      handleUpdateSlot(slot.id, "players", e.target.value)
                    }
                    placeholder="Players (e.g. Player1, Player2...)"
                    className={cn(
                      "w-full bg-transparent border-b outline-none py-0.5 px-2 text-[10px] font-mono transition-colors italic opacity-60 focus:opacity-100",
                      isDarkMode
                        ? "border-white/10 focus:border-white/20 text-white/70"
                        : "border-[#141414]/10 focus:border-[#141414]/40 text-[#141414]"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Panel: Dynamic Content */}
        <section className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 overflow-hidden">
          {viewMode === "current" ? (
            <>
              {/* Middle: Upload & Preview */}
              <div className={cn(
                "lg:col-span-4 border-r p-6 flex flex-col gap-6 overflow-y-auto transition-colors",
                isDarkMode ? "border-white/10" : "border-[#141414]"
              )}>
                {/* Step 1: Slot List Setup */}
                <div className={cn(
                  "p-4 border transition-all mb-2",
                  isDarkMode
                    ? "border-white/20 bg-white/5 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                    : "border-[#141414] bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
                )}>
                  <h2 className="text-sm font-serif italic uppercase mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users size={14} />
                      Step 1: Slot List Setup
                    </span>
                    {slots.some((s) => s.teamName) && (
                      <span className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded",
                        isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"
                      )}>
                        {slots.filter((s) => s.teamName).length} Teams Set
                      </span>
                    )}
                  </h2>
                  <div
                    onClick={() => {
                      setSlotUploadMode("player");
                      setTimeout(() => slotFileInputRef.current?.click(), 0);
                    }}
                    className={cn(
                      "border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer transition-all group",
                      isDarkMode
                        ? "border-white/10 bg-white/5 hover:border-white/30"
                        : "border-[#141414]/20 bg-[#141414]/5 hover:border-[#141414]"
                    )}
                  >
                    {isProcessingSlots ? (
                      <Loader2
                        className={cn(
                          "animate-spin mb-2",
                          isDarkMode ? "text-white" : "text-[#141414]"
                        )}
                        size={24}
                      />
                    ) : (
                      <Users
                        className={cn(
                          "mb-2 opacity-30 group-hover:opacity-100",
                          isDarkMode ? "text-white" : "text-[#141414]"
                        )}
                        size={24}
                      />
                    )}
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isDarkMode ? "text-white" : "text-[#141414]"
                    )}>
                      Upload Player Screenshots
                    </p>
                    <p className="text-[10px] opacity-50 mt-1 text-[#141414]">
                      Detect player names for existing slots (Multiple allowed)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-serif italic uppercase opacity-50 flex items-center gap-2">
                    <Upload size={14} />
                    Step 2: {gameType} Match Results ({screenshots.length}/10)
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowManualMatchModal(true)}
                      className="text-[10px] font-mono uppercase underline opacity-50 hover:opacity-100"
                    >
                      Add Team
                    </button>
                    {screenshots.length > 0 && !isProcessing && (
                      <button
                        onClick={() => {
                          setScreenshots([]);
                          setResults(null);
                          setManualMatchTeams([]);
                        }}
                        className="text-[10px] font-mono uppercase underline opacity-50 hover:opacity-100"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Area */}
                {screenshots.length < 10 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#141414]/30 flex flex-col items-center justify-center cursor-pointer hover:border-[#141414] transition-all p-8 group"
                  >
                    <Upload className="mx-auto mb-4 opacity-30" size={32} />
                    <p className="text-sm font-medium">
                      Click to upload screenshots
                    </p>
                    <p className="text-xs opacity-50 mt-2 font-mono uppercase">
                      Up to 10 images at once
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>
                )}

                {/* Screenshot Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {screenshots.map((s) => (
                    <div
                      key={s.id}
                      className="relative aspect-video border border-[#141414] bg-white group overflow-hidden"
                    >
                      <img
                        src={s.data}
                        alt="Match"
                        className="w-full h-full object-cover"
                      />

                      {/* Status Overlay */}
                      <div
                        className={cn(
                          "absolute inset-0 flex items-center justify-center transition-opacity",
                          s.status === "processing"
                            ? "bg-black/40 opacity-100"
                            : s.status === "done"
                              ? "bg-green-500/20 opacity-100"
                              : s.status === "error"
                                ? "bg-red-500/20 opacity-100"
                                : "bg-black/40 opacity-0 group-hover:opacity-100",
                        )}
                      >
                        {s.status === "processing" && (
                          <Loader2
                            className="text-white animate-spin"
                            size={24}
                          />
                        )}
                        {s.status === "done" && (
                          <Trophy className="text-green-600" size={24} />
                        )}
                        {s.status === "error" && (
                          <AlertCircle className="text-red-600" size={24} />
                        )}
                        {s.status === "pending" && !isProcessing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeScreenshot(s.id);
                            }}
                            className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  disabled={
                    screenshots.length === 0 ||
                    isProcessing ||
                    !screenshots.some((s) => s.status === "pending")
                  }
                  onClick={processScreenshots}
                  className={cn(
                    "w-full py-4 bg-[#141414] text-[#E4E3E0] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98]",
                    (screenshots.length === 0 ||
                      isProcessing ||
                      !screenshots.some((s) => s.status === "pending")) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing Batch...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Process{" "}
                      {
                        screenshots.filter((s) => s.status === "pending").length
                      }{" "}
                      Images
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mt-auto p-4 border border-[#141414]/10 bg-[#141414]/5 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest opacity-50">
                      Scoring System
                    </h3>
                    <button
                      onClick={() => setShowScoringSettings(true)}
                      className="text-[10px] font-bold uppercase text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <Settings size={10} />
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
                    {Object.entries(pointSystem)
                      .slice(0, 8)
                      .map(([rank, pts]) => (
                        <div key={rank} className="flex justify-between">
                          <span>
                            {rank}
                            {rank === "1"
                              ? "st"
                              : rank === "2"
                                ? "nd"
                                : rank === "3"
                                  ? "rd"
                                  : "th"}
                          </span>
                          <span>{pts} pts</span>
                        </div>
                      ))}
                    <div className="col-span-2 mt-1 pt-1 border-t border-[#141414]/10 flex justify-between">
                      <span>Per Elimination</span>{" "}
                      <span>
                        {pointsPerKill} pt{pointsPerKill !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Point Table */}
              <div className="lg:col-span-5 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-serif italic uppercase opacity-50 flex items-center gap-2">
                    <TableIcon size={14} />
                    Current Match Results
                  </h2>
                  {results && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const currentMatchData: LeaderboardEntry[] =
                            results.map((r) => {
                              const teamSlot = slots.find(
                                (s) =>
                                  s.teamName.trim().toLowerCase() ===
                                  r.teamName.trim().toLowerCase(),
                              );
                              return {
                                teamName: r.teamName,
                                logo: teamSlot?.logo,
                                wwcd: r.wwcd ?? (r.rank === 1 ? 1 : 0),
                                matchesPlayed: 1,
                                totalKills: r.kills,
                                totalPlacementPoints: r.placementPoints,
                                totalPoints: r.totalPoints,
                              };
                            });
                          setTemplateDataOverride(currentMatchData);
                          setShowTemplate(true);
                        }}
                        className="p-1.5 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center gap-2 px-3"
                        title="Generate Image for this Match"
                      >
                        <ImageIcon size={14} />
                        <span className="text-[10px] font-bold uppercase">
                          Generate Image
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          downloadTable(results, `match_${Date.now()}`)
                        }
                        className="p-1.5 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                        title="Export CSV"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={saveMatchToHistory}
                        className="px-3 py-1 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                      >
                        Save Batch to History
                      </button>
                    </div>
                  )}
                </div>

                {!results ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                    <TableIcon size={64} strokeWidth={1} />
                    <p className="mt-4 font-serif italic">
                      No data generated yet
                    </p>
                  </div>
                ) : (
                  <div className="border border-[#141414]">
                    <div className="grid grid-cols-12 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest p-3">
                      <div className="col-span-1">#</div>
                      <div className="col-span-1">Logo</div>
                      <div className="col-span-3 flex items-center gap-1">
                        Team Name{" "}
                        <span className="text-[8px] opacity-40">(Edit)</span>
                      </div>
                      <div className="col-span-1 text-center font-bold">MVP</div>
                      <div className="col-span-1 text-center font-bold">WWCD</div>
                      <div className="col-span-1 text-center flex items-center justify-center gap-1">
                        Kills{" "}
                        <span className="text-[8px] opacity-40">(Edit)</span>
                      </div>
                      <div className="col-span-2 text-center flex items-center justify-center gap-1">
                        Place{" "}
                        <span className="text-[8px] opacity-40">(Edit)</span>
                      </div>
                      <div className="col-span-2 text-right">Total</div>
                    </div>
                    <div className="divide-y divide-[#141414]">
                      {(results
                        ? [...results, ...manualMatchTeams].sort(
                            (a, b) =>
                              b.totalPoints - a.totalPoints || a.rank - b.rank,
                          )
                        : manualMatchTeams
                      ).map((row, idx, combinedArray) => {
                        const isManual = manualMatchTeams.some(
                          (t) => t.teamName === row.teamName,
                        );
                        const manualIdx = isManual
                          ? manualMatchTeams.findIndex(
                              (t) => t.teamName === row.teamName,
                            )
                          : -1;
                        const resultIdx =
                          !isManual && results
                            ? results.findIndex(
                                (t) => t.teamName === row.teamName,
                              )
                            : -1;

                        const maxKillsInMatch = Math.max(...combinedArray.map((r) => r.kills || 0), 0);
                        const isMVP = maxKillsInMatch > 0 && row.kills === maxKillsInMatch;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "grid grid-cols-12 p-3 items-center hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group relative",
                              idx === 0 && "bg-yellow-50/50",
                              isMVP && "border-l-4 border-amber-500 bg-amber-500/5",
                            )}
                          >
                            <div className="col-span-1 font-mono text-xs opacity-50 group-hover:opacity-100">
                              <input
                                type="number"
                                value={row.rank ?? ""}
                                onChange={(e) =>
                                  handleManualEdit(
                                    isManual ? manualIdx : resultIdx,
                                    "rank",
                                    e.target.value,
                                    isManual,
                                  )
                                }
                                className="w-full bg-transparent outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-1">
                              {slots.find(
                                (s) =>
                                  s.teamName.trim().toLowerCase() ===
                                  (row.teamName || "").trim().toLowerCase(),
                              )?.logo ? (
                                <img
                                  src={
                                    slots.find(
                                      (s) =>
                                        s.teamName.trim().toLowerCase() ===
                                        (row.teamName || "").trim().toLowerCase(),
                                    )?.logo
                                  }
                                  alt=""
                                  className="w-5 h-5 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-5 h-5 bg-black/5 rounded-sm" />
                              )}
                            </div>
                            <div className="col-span-3 font-bold text-sm flex items-center gap-2">
                              {idx === 0 && (
                                <Trophy size={14} className="text-yellow-600" />
                              )}
                              <input
                                type="text"
                                value={row.teamName ?? ""}
                                onChange={(e) =>
                                  handleManualEdit(
                                    isManual ? manualIdx : resultIdx,
                                    "teamName",
                                    e.target.value,
                                    isManual,
                                  )
                                }
                                className="w-full bg-transparent outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1"
                              />
                              {isManual && (
                                <button
                                  onClick={() => {
                                    setEditingManualMatchTeam(row);
                                    setShowManualMatchModal(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-orange-500 transition-all"
                                  title="Edit Manual Result"
                                >
                                  <Settings size={12} />
                                </button>
                              )}
                            </div>
                            <div className="col-span-1 text-center flex items-center justify-center">
                              {isMVP ? (
                                <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-0.5" title="Most Kills (MVP)">
                                  👑 MVP
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs font-mono">-</span>
                              )}
                            </div>
                            <div className="col-span-1 text-center font-mono text-xs">
                              <input
                                type="number"
                                value={row.wwcd ?? (row.rank === 1 ? 1 : 0) ?? 0}
                                onChange={(e) =>
                                  handleManualEdit(
                                    isManual ? manualIdx : resultIdx,
                                    "wwcd",
                                    e.target.value,
                                    isManual,
                                  )
                                }
                                className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-1 text-center font-mono text-sm">
                              <input
                                type="number"
                                value={row.kills ?? 0}
                                onChange={(e) =>
                                  handleManualEdit(
                                    isManual ? manualIdx : resultIdx,
                                    "kills",
                                    e.target.value,
                                    isManual,
                                  )
                                }
                                className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-[#141414]/20 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-2 text-center font-mono text-sm">
                              <input
                                type="number"
                                value={row.placementPoints ?? 0}
                                onChange={(e) =>
                                  handleManualEdit(
                                    isManual ? manualIdx : resultIdx,
                                    "placementPoints",
                                    e.target.value,
                                    isManual,
                                  )
                                }
                                className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-[#141414]/20 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-2 text-right font-bold text-sm">
                              {row.totalPoints}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : viewMode === "leaderboard" ? (
            /* Leaderboard View */
            <div className="lg:col-span-9 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-serif italic uppercase opacity-50 flex items-center gap-2">
                    <Trophy size={14} />
                    {gameType} -{" "}
                    {tournamentType === "Custom"
                      ? customTournamentName || "Custom"
                      : tournamentType}{" "}
                    (
                    {groupName === "Custom"
                      ? customGroupName || "Custom"
                      : groupName}
                    ) Leaderboard
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => {
                        setLeaderboardSubView("overall");
                        setCustomHeader1("RVNC ESPORTS");
                        setCustomHeader2("P R E S E N T S");
                      }}
                      className={cn(
                        "text-[10px] font-mono uppercase tracking-widest pb-1 border-b-2 transition-all",
                        leaderboardSubView === "overall"
                          ? "border-[#141414] opacity-100"
                          : "border-transparent opacity-40 hover:opacity-100",
                      )}
                    >
                      Overall
                    </button>
                    <button
                      onClick={() => setLeaderboardSubView("matches")}
                      className={cn(
                        "text-[10px] font-mono uppercase tracking-widest pb-1 border-b-2 transition-all",
                        leaderboardSubView === "matches"
                          ? "border-[#141414] opacity-100"
                          : "border-transparent opacity-40 hover:opacity-100",
                      )}
                    >
                      Match-wise
                    </button>
                    <button
                      onClick={() => setLeaderboardSubView("stats")}
                      className={cn(
                        "text-[10px] font-mono uppercase tracking-widest pb-1 border-b-2 transition-all",
                        leaderboardSubView === "stats"
                          ? "border-[#141414] opacity-100"
                          : "border-transparent opacity-40 hover:opacity-100",
                      )}
                    >
                      Stats Summary
                    </button>
                    <button
                      onClick={() => setLeaderboardSubView("progression")}
                      className={cn(
                        "text-[10px] font-mono uppercase tracking-widest pb-1 border-b-2 transition-all",
                        leaderboardSubView === "progression"
                          ? "border-[#141414] opacity-100"
                          : "border-transparent opacity-40 hover:opacity-100",
                      )}
                    >
                      Tournament Progression
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[9px] font-mono uppercase opacity-40">
                      Style:
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="bg-transparent border border-[#141414] text-[10px] font-mono uppercase px-2 py-1 outline-none hover:bg-[#141414]/5 transition-colors"
                    >
                      {TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bgFileInputRef.current?.click()}
                      className={cn(
                        "p-1.5 border border-[#141414] transition-all flex items-center gap-2 px-3",
                        customBackgroundImage
                          ? "bg-[#141414] text-[#E4E3E0]"
                          : "hover:bg-[#141414] hover:text-[#E4E3E0]",
                      )}
                      title="Upload Background Wallpaper"
                    >
                      <ImagePlus size={14} />
                      <span className="text-[10px] font-bold uppercase">
                        {customBackgroundImage ? "BG Active" : "Set BG"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setTemplateDataOverride(null);
                        setCustomHeader1("RVNC ESPORTS");
                        setCustomHeader2("P R E S E N T S");
                        setCurrentTemplatePage(0);
                        setShowTemplate(true);
                      }}
                      className="p-1.5 border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 transition-all flex items-center gap-2 px-4 shadow-sm"
                      title="Generate Overall Leaderboard Image"
                    >
                      <ImageIcon size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Generate Image
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        downloadTable(
                          leaderboardData,
                          `${gameType}_leaderboard`,
                        )
                      }
                      className="p-1.5 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                      title="Export CSV"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => setShowManualTeamModal(true)}
                      className="px-3 py-1 border border-[#141414] text-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                    >
                      Add Team
                    </button>
                    <button
                      onClick={() => {
                        pushOverridesToHistory(leaderboardOverrides, "all", "reset");
                        setLeaderboardOverrides({});
                      }}
                      className="px-3 py-1 border border-[#141414] text-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                    >
                      Reset Edits
                    </button>
                    <button
                      onClick={handleUndoOverrides}
                      disabled={overridesHistory.length === 0}
                      className={cn(
                        "px-3 py-1 border border-[#141414] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
                        overridesHistory.length === 0
                          ? "opacity-30 cursor-not-allowed text-gray-400 bg-gray-100/50"
                          : "text-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0]"
                      )}
                      title="Undo last manual override edit (Ctrl+Z)"
                    >
                      <Undo size={11} />
                      Undo
                    </button>
                    <button
                      onClick={handleRedoOverrides}
                      disabled={overridesRedoStack.length === 0}
                      className={cn(
                        "px-3 py-1 border border-[#141414] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5",
                        overridesRedoStack.length === 0
                          ? "opacity-30 cursor-not-allowed text-gray-400 bg-gray-100/50"
                          : "text-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0]"
                      )}
                      title="Redo manual override edit (Ctrl+Y)"
                    >
                      <Redo size={11} />
                      Redo
                    </button>
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1 border border-red-600 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                    >
                      Clear History
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Summary Panel */}
              {getMatchStats() && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="flex items-center gap-2 text-[#141414]/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                      <Trophy size={12} className="text-orange-500" />
                      Table Leader
                    </div>
                    <div className="text-[#141414] font-mono text-lg truncate">
                      {getMatchStats()?.bestTeam.teamName}
                    </div>
                    <div className="text-orange-600 font-bold text-xs">
                      {getMatchStats()?.bestTeam.totalPoints} Total Points
                    </div>
                  </div>
                  <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="flex items-center gap-2 text-[#141414]/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                      <Target size={12} className="text-blue-500" />
                      Top Fraggers
                    </div>
                    <div className="text-[#141414] font-mono text-lg truncate">
                      {getMatchStats()?.topFragger.teamName}
                    </div>
                    <div className="text-blue-600 font-bold text-xs">
                      {getMatchStats()?.topFragger.totalKills} Eliminations
                    </div>
                  </div>
                  <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="flex items-center gap-2 text-[#141414]/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                      <Shield size={12} className="text-green-500" />
                      Chicken Dinners
                    </div>
                    <div className="text-[#141414] font-mono text-lg truncate">
                      {getMatchStats()?.mostWWCD?.teamName || "-"}
                    </div>
                    <div className="text-green-600 font-bold text-xs">
                      {getMatchStats()?.mostWWCD?.wwcd || 0} Victories
                    </div>
                  </div>
                  <div className="bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="flex items-center gap-2 text-[#141414]/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                      <Activity size={12} className="text-[#141414]" />
                      Combat Metrics
                    </div>
                    <div className="text-[#141414] font-mono text-lg">
                      {getMatchStats()?.totalKills} Combined Kills
                    </div>
                    <div className="text-gray-500 font-bold text-xs">
                      {getMatchStats()?.avgKillsPerTeam} Kills/Team Avg
                    </div>
                  </div>
                </div>
              )}

              {leaderboardData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                  <Trophy size={64} strokeWidth={1} />
                  <p className="mt-4 font-serif italic">
                    No history available for {gameType} -{" "}
                    {tournamentType === "Custom"
                      ? customTournamentName || "Custom"
                      : tournamentType}{" "}
                    (
                    {groupName === "Custom"
                      ? customGroupName || "Custom"
                      : groupName}
                    )
                  </p>
                </div>
              ) : leaderboardSubView === "overall" ? (
                <div className="border border-[#141414]">
                  <div className="grid grid-cols-12 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest p-3">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-1">Logo</div>
                    <div className="col-span-3">Team Name</div>
                    <div className="col-span-1 text-center">MP</div>
                    <div className="col-span-1 text-center">WWCD</div>
                    <div className="col-span-1 text-center">Kills</div>
                    <div className="col-span-2 text-center">Place</div>
                    <div className="col-span-2 text-right mr-1">Total</div>
                  </div>
                  <div className="divide-y divide-[#141414]">
                    {leaderboardData.map((row, idx) => {
                      const isManual = manualLeaderboardTeams.some(
                        (t) => t.teamName === row.teamName,
                      );
                      const rank = idx + 1;
                      const isQualified = rank <= qualificationCount;
                      const isRelegated =
                        rank > (leaderboardData.length > 12 ? 12 : 999);
                      const isExpanded = !!expandedTeams[row.teamName];
                      
                      const teamSlot = slots.find(
                        (s) => (s.teamName || "").trim().toLowerCase() === row.teamName.trim().toLowerCase()
                      );
                      const roster = teamSlot?.players
                        ? teamSlot.players.split(",").map((p) => p.trim()).filter(Boolean)
                        : [];

                      const finalTournamentType =
                        tournamentType === "Custom"
                          ? customTournamentName || "Custom"
                          : tournamentType;
                      const finalGroupName =
                        groupName === "Custom" ? customGroupName || "Custom" : groupName;

                      const teamMatches = [...matchHistory]
                        .filter(
                          (h) =>
                            h.gameType === gameType &&
                            h.tournamentType === finalTournamentType &&
                            h.groupName === finalGroupName
                        )
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .map((match, mIdx) => {
                          const result = match.results.find(
                            (r) => (r.teamName || "").trim().toLowerCase() === row.teamName.trim().toLowerCase()
                          );
                          return {
                            matchIndex: mIdx + 1,
                            result: result || null,
                          };
                        });

                      return (
                        <React.Fragment key={idx}>
                          <div
                            className={cn(
                              "grid grid-cols-12 p-3 items-center hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer transition-colors group select-none",
                              idx === 0 && "bg-yellow-50/50",
                              isQualified &&
                                "border-l-4 border-green-500 bg-green-50/20",
                              isRelegated &&
                                "border-l-4 border-red-500 bg-red-50/20",
                              isExpanded && "bg-orange-500/5 dark:bg-orange-500/5"
                            )}
                            onClick={() => {
                              setExpandedTeams((prev) => ({
                                ...prev,
                                [row.teamName]: !prev[row.teamName],
                              }));
                            }}
                          >
                            <div className="col-span-1 font-mono text-xs opacity-50 group-hover:opacity-100 flex items-center gap-1.5">
                              <span className="shrink-0 text-[#141414] dark:text-[#E4E3E0] opacity-60">
                                {isExpanded ? (
                                  <ChevronUp size={12} className="text-orange-500 font-bold" />
                                ) : (
                                  <ChevronDown size={12} className="opacity-40 group-hover:opacity-100" />
                                )}
                              </span>
                              <span>{idx + 1}</span>
                            </div>
                            <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                              {row.logo ? (
                                <img
                                  src={row.logo}
                                  alt=""
                                  className="w-5 h-5 object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-5 h-5 bg-black/5 rounded-sm" />
                              )}
                            </div>
                            <div className="col-span-3 font-bold text-sm flex items-center gap-2">
                              {idx === 0 && (
                                <Trophy size={14} className="text-yellow-600 shrink-0" />
                              )}
                              <span className="truncate">{row.teamName}</span>
                              {isManual && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingManualTeam(row);
                                    setShowManualTeamModal(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-orange-500 transition-all"
                                  title="Edit Manual Team"
                                >
                                  <Settings size={12} />
                                </button>
                              )}
                            </div>
                            <div className="col-span-1 text-center font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={row.matchesPlayed ?? 0}
                                onChange={(e) => {
                                  pushOverridesToHistory(leaderboardOverrides, row.teamName, "matchesPlayed");
                                  const newOverrides = {
                                    ...leaderboardOverrides,
                                  };
                                  newOverrides[row.teamName] = {
                                    ...newOverrides[row.teamName],
                                    matchesPlayed: Number(e.target.value),
                                  };
                                  setLeaderboardOverrides(newOverrides);
                                }}
                                className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-1 text-center font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={row.wwcd ?? 0}
                                onChange={(e) => {
                                  pushOverridesToHistory(leaderboardOverrides, row.teamName, "wwcd");
                                  const newOverrides = {
                                    ...leaderboardOverrides,
                                  };
                                  newOverrides[row.teamName] = {
                                    ...newOverrides[row.teamName],
                                    wwcd: Number(e.target.value),
                                  };
                                  setLeaderboardOverrides(newOverrides);
                                }}
                                className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-1 text-center font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={row.totalKills ?? 0}
                                onChange={(e) => {
                                  pushOverridesToHistory(leaderboardOverrides, row.teamName, "totalKills");
                                  const val = Number(e.target.value);
                                  const newOverrides = {
                                    ...leaderboardOverrides,
                                  };
                                  const currentPlacementPoints =
                                    row.totalPlacementPoints;
                                  newOverrides[row.teamName] = {
                                    ...newOverrides[row.teamName],
                                    totalKills: val,
                                    totalPoints:
                                      val * pointsPerKill +
                                      currentPlacementPoints,
                                  };
                                  setLeaderboardOverrides(newOverrides);
                                }}
                                className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-2 text-center font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={row.totalPlacementPoints ?? 0}
                                onChange={(e) => {
                                  pushOverridesToHistory(leaderboardOverrides, row.teamName, "totalPlacementPoints");
                                  const val = Number(e.target.value);
                                  const newOverrides = {
                                    ...leaderboardOverrides,
                                  };
                                  const currentKills = row.totalKills;
                                  newOverrides[row.teamName] = {
                                    ...newOverrides[row.teamName],
                                    totalPlacementPoints: val,
                                    totalPoints:
                                      currentKills * pointsPerKill + val,
                                  };
                                  setLeaderboardOverrides(newOverrides);
                                }}
                                className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1"
                              />
                            </div>
                            <div className="col-span-2 text-right font-bold text-sm" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={row.totalPoints ?? 0}
                                onChange={(e) => {
                                  pushOverridesToHistory(leaderboardOverrides, row.teamName, "totalPoints");
                                  const newOverrides = {
                                    ...leaderboardOverrides,
                                  };
                                  newOverrides[row.teamName] = {
                                    ...newOverrides[row.teamName],
                                    totalPoints: Number(e.target.value),
                                  };
                                  setLeaderboardOverrides(newOverrides);
                                }}
                                className="w-full bg-transparent text-right outline-none focus:ring-1 focus:ring-orange-500/50 rounded px-1 mr-1"
                              />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="bg-[#fcfcfc] dark:bg-[#111] p-5 border-l-4 border-orange-500 border-t border-b border-[#141414]/10 dark:border-white/10 text-[#141414] dark:text-[#E4E3E0]">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                {/* Left Section: Team Info & Roster */}
                                <div className="md:col-span-4 space-y-4 md:border-r border-[#141414]/10 dark:border-white/10 pr-0 md:pr-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
                                      {row.logo ? (
                                        <img
                                          src={row.logo}
                                          alt=""
                                          className="w-full h-full object-contain"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <Shield className="text-gray-400" size={20} />
                                      )}
                                    </div>
                                    <div>
                                      <div className="text-[9px] font-mono opacity-50 uppercase tracking-widest font-black">
                                        {teamSlot ? `Slot #${String(teamSlot.slotNumber).padStart(2, '0')}` : "Unassigned Slot"}
                                      </div>
                                      <h4 className="text-base font-serif italic font-bold uppercase tracking-tight truncate leading-tight">
                                        {row.teamName}
                                      </h4>
                                    </div>
                                  </div>

                                  {/* Roster list */}
                                  <div>
                                    <h5 className="text-[10px] font-mono tracking-widest uppercase opacity-45 font-black mb-2 flex items-center gap-1.5">
                                      <User size={11} className="text-orange-500" /> Registered Lineup / Roster
                                    </h5>
                                    {roster.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        {roster.map((player, pIdx) => (
                                          <div
                                            key={pIdx}
                                            className="px-3 py-1.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-lg flex items-center gap-2"
                                          >
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                            <span className="text-[11px] font-bold font-mono tracking-tight truncate">
                                              {player}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 rounded-xl text-center">
                                        <p className="text-[10px] opacity-50">No roster members registered.</p>
                                        <p className="text-[9px] opacity-40 mt-0.5">Define team players under the 'Slots' tab.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Center Section: High-level analytics and metrics */}
                                <div className="md:col-span-4 space-y-4 md:border-r border-[#141414]/10 dark:border-white/10 pr-0 md:pr-6">
                                  <div>
                                    <h5 className="text-[10px] font-mono tracking-widest uppercase opacity-45 font-black mb-2.5 flex items-center gap-1.5">
                                      <Activity size={11} className="text-orange-500" /> Performance Ratios
                                    </h5>
                                    
                                    <div className="space-y-3">
                                      {/* Points distribution ratio */}
                                      <div>
                                        <div className="flex justify-between text-[10px] font-mono font-bold mb-1 opacity-70">
                                          <span>Kills vs. Placement</span>
                                          <span>
                                            {(row.totalKills ?? 0) * pointsPerKill} : {row.totalPlacementPoints ?? 0} PTS
                                          </span>
                                        </div>
                                        {(row.totalPoints ?? 0) > 0 ? (
                                          <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex">
                                            <div
                                              style={{ width: `${Math.min(100, (((row.totalKills ?? 0) * pointsPerKill) / (row.totalPoints || 1)) * 100)}%` }}
                                              className="h-full bg-orange-500"
                                              title={`${(((row.totalKills ?? 0) * pointsPerKill) / (row.totalPoints || 1) * 100).toFixed(0)}% Kill contribution`}
                                            />
                                            <div
                                              style={{ width: `${Math.min(100, ((row.totalPlacementPoints ?? 0) / (row.totalPoints || 1)) * 100)}%` }}
                                              className="h-full bg-blue-500"
                                              title={`${((row.totalPlacementPoints ?? 0) / (row.totalPoints || 1) * 100).toFixed(0)}% Placement contribution`}
                                            />
                                          </div>
                                        ) : (
                                          <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full" />
                                        )}
                                        <div className="flex justify-between items-center text-[9px] font-mono font-extrabold mt-1">
                                          <span className="text-orange-500">■ KILLS ({((row.totalPoints ?? 0) > 0 ? (((row.totalKills ?? 0) * pointsPerKill) / row.totalPoints) * 100 : 0).toFixed(0)}%)</span>
                                          <span className="text-blue-500">■ PLACEMENT ({((row.totalPoints ?? 0) > 0 ? ((row.totalPlacementPoints ?? 0) / row.totalPoints) * 100 : 0).toFixed(0)}%)</span>
                                        </div>
                                      </div>

                                      {/* Performance averages */}
                                      <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl">
                                          <div className="text-[9px] font-mono opacity-50 uppercase font-black">Avg Kills / Match</div>
                                          <div className="text-sm font-bold font-serif italic text-orange-500">
                                            {((row.totalKills ?? 0) / (row.matchesPlayed || 1)).toFixed(1)}
                                          </div>
                                        </div>
                                        <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl">
                                          <div className="text-[9px] font-mono opacity-50 uppercase font-black">WWCD Rate</div>
                                          <div className="text-sm font-bold font-serif italic text-blue-500">
                                            {(row.matchesPlayed ?? 0) > 0 ? `${(((row.wwcd ?? 0) / row.matchesPlayed) * 100).toFixed(0)}%` : "0%"}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Right Section: Match Wise Kill Stats */}
                                <div className="md:col-span-4 space-y-3">
                                  <h5 className="text-[10px] font-mono tracking-widest uppercase opacity-45 font-black flex items-center gap-1.5">
                                    <Sword size={11} className="text-orange-500" /> Match-Specific Logs
                                  </h5>

                                  {teamMatches.length > 0 ? (
                                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                      {teamMatches.map((tl, mIdx) => {
                                        const r = tl.result;
                                        return (
                                          <div
                                            key={mIdx}
                                            className="px-3 py-1.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-lg flex items-center justify-between"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono text-[9px] bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-black">
                                                M{tl.matchIndex}
                                              </span>
                                              {r?.wwcd ? (
                                                <span className="text-[9px] bg-yellow-500 text-black px-1 rounded font-black uppercase tracking-wider scale-90">
                                                  WWCD
                                                </span>
                                              ) : r?.rank ? (
                                                <span className="font-mono text-[9px] opacity-65">
                                                  #{r.rank} Place
                                                </span>
                                              ) : (
                                                <span className="font-mono text-[9px] opacity-40">
                                                  N/A
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs">
                                              <span className="font-mono shrink-0">
                                                {r ? `${r.kills} K` : "0 K"}
                                              </span>
                                              <span className="font-bold text-orange-500 font-mono text-[10px] shrink-0">
                                                {r ? `+${r.totalPoints} PTS` : "0 PTS"}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-black/[0.01] dark:bg-white/[0.01] border border-dashed border-black/10 dark:border-white/10 rounded-xl text-center py-6">
                                      <p className="text-[10px] opacity-40">No individual matches logged yet.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : leaderboardSubView === "matches" ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Search by team or tournament type..."
                    value={matchSearchTerm}
                    onChange={(e) => setMatchSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-2 text-xs font-mono uppercase text-white outline-none"
                  />
                  {matchHistory
                    .filter(
                      (h) =>
                        h.gameType === gameType &&
                        h.tournamentType ===
                          (tournamentType === "Custom"
                            ? customTournamentName || "Custom"
                            : tournamentType) &&
                        h.groupName ===
                          (groupName === "Custom"
                            ? customGroupName || "Custom"
                            : groupName) &&
                        (matchSearchTerm === "" ||
                          h.results.some((r) =>
                            r.teamName
                              .toLowerCase()
                              .includes(matchSearchTerm.toLowerCase()),
                          ) ||
                          h.tournamentType
                            .toLowerCase()
                            .includes(matchSearchTerm.toLowerCase())),
                    )
                    .map((match, mIdx) => (
                      <div key={match.id} className="border border-[#141414]">
                        <div className="bg-[#141414] text-[#E4E3E0] p-3 flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <h3 className="text-xs font-mono uppercase tracking-widest font-bold">
                              Match {mIdx + 1}
                            </h3>
                            <span className="text-[10px] opacity-60 font-mono">
                              {new Date(match.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const transformed = match.results.map((res) => {
                                  const teamSlot = slots.find(
                                    (s) =>
                                      s.teamName.trim().toLowerCase() ===
                                      res.teamName.trim().toLowerCase(),
                                  );
                                  return {
                                    teamName: res.teamName,
                                    logo: teamSlot?.logo,
                                    matchesPlayed: 1,
                                    wwcd:
                                      res.wwcd !== undefined
                                        ? res.wwcd
                                        : res.rank === 1
                                          ? 1
                                          : 0,
                                    totalKills: res.kills,
                                    totalPlacementPoints: res.placementPoints,
                                    totalPoints: res.totalPoints,
                                  };
                                });
                                setTemplateDataOverride(transformed);
                                setCustomHeader1(`MATCH ${mIdx + 1}`);
                                setCustomHeader2(
                                  new Date(match.timestamp).toLocaleDateString(),
                                );
                                setCurrentTemplatePage(0);
                                setShowTemplate(true);
                              }}
                              className="text-orange-500 hover:text-orange-400 transition-colors p-1"
                              title="Generate Match Image"
                            >
                              <ImageIcon size={14} />
                            </button>
                            <button
                              onClick={() =>
                                downloadTable(
                                  match.results,
                                  `${gameType}_Match_${mIdx + 1}`,
                                )
                              }
                              className="text-white opacity-40 hover:opacity-100 transition-all p-1"
                              title="Download Match CSV"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() =>
                                setEditingMatchId(
                                  editingMatchId === match.id ? null : match.id,
                                )
                              }
                              className={cn(
                                "transition-colors p-1",
                                editingMatchId === match.id
                                  ? "text-green-500 hover:text-green-400"
                                  : "text-blue-500 hover:text-blue-400",
                              )}
                              title={
                                editingMatchId === match.id
                                  ? "Done Editing"
                                  : "Edit Match"
                              }
                            >
                              {editingMatchId === match.id ? (
                                <Check size={14} />
                              ) : (
                                <Edit2 size={14} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteMatch(match.id)}
                              className="text-red-500 hover:text-red-400 transition-colors p-1"
                              title="Delete Match"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 bg-[#141414]/5 text-[10px] font-mono uppercase tracking-widest p-3 border-b border-[#141414]">
                          <div className="col-span-1">Rank</div>
                          <div className="col-span-1">Logo</div>
                          <div className="col-span-3">Team Name</div>
                          <div className="col-span-1 text-center">MVP</div>
                          <div className="col-span-2 text-center">Kills</div>
                          <div className="col-span-2 text-center">Place</div>
                          <div className="col-span-2 text-right">Total</div>
                        </div>
                        <div className="divide-y divide-[#141414]/10">
                          {match.results.map((row, rIdx) => {
                            const matchMaxKills = Math.max(...match.results.map((r) => r.kills || 0), 0);
                            const isMVP = matchMaxKills > 0 && row.kills === matchMaxKills;
                            return (
                              <div
                                key={rIdx}
                                className={cn(
                                  "grid grid-cols-12 p-3 items-center text-sm relative",
                                  isMVP && "border-l-4 border-amber-500 bg-amber-500/5",
                                )}
                              >
                                <div className="col-span-1 font-mono text-xs opacity-50">
                                  {editingMatchId === match.id ? (
                                    <input
                                      type="number"
                                      value={row.rank ?? ""}
                                      onChange={(e) =>
                                        handleEditMatchHistoryResult(
                                          match.id,
                                          rIdx,
                                          "rank",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-transparent outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1"
                                    />
                                  ) : (
                                    row.rank
                                  )}
                                </div>
                                <div className="col-span-1">
                                  {slots.find(
                                    (s) =>
                                      s.teamName.trim().toLowerCase() ===
                                      (row.teamName || "").trim().toLowerCase(),
                                  )?.logo ? (
                                    <img
                                      src={
                                        slots.find(
                                          (s) =>
                                            s.teamName.trim().toLowerCase() ===
                                            (row.teamName || "").trim().toLowerCase(),
                                        )?.logo
                                      }
                                      alt=""
                                      className="w-4 h-4 object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-4 h-4 bg-black/5 rounded-sm" />
                                  )}
                                </div>
                                <div className="col-span-3 font-bold truncate">
                                  {editingMatchId === match.id ? (
                                    <input
                                      type="text"
                                      value={row.teamName ?? ""}
                                      onChange={(e) =>
                                        handleEditMatchHistoryResult(
                                          match.id,
                                          rIdx,
                                          "teamName",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-transparent outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1"
                                    />
                                  ) : (
                                    row.teamName
                                  )}
                                </div>
                                <div className="col-span-1 text-center flex items-center justify-center">
                                  {isMVP ? (
                                    <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-0.5" title="Most Kills (MVP)">
                                      👑 MVP
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs font-mono">-</span>
                                  )}
                                </div>
                                <div className="col-span-2 text-center font-mono">
                                  {editingMatchId === match.id ? (
                                    <input
                                      type="number"
                                      value={row.kills ?? 0}
                                      onChange={(e) =>
                                        handleEditMatchHistoryResult(
                                          match.id,
                                          rIdx,
                                          "kills",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1"
                                    />
                                  ) : (
                                    row.kills
                                  )}
                                </div>
                                <div className="col-span-2 text-center font-mono">
                                  {editingMatchId === match.id ? (
                                    <input
                                      type="number"
                                      value={row.placementPoints ?? 0}
                                      onChange={(e) =>
                                        handleEditMatchHistoryResult(
                                          match.id,
                                          rIdx,
                                          "placementPoints",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1"
                                    />
                                  ) : (
                                    row.placementPoints
                                  )}
                                </div>
                                <div className="col-span-2 text-right font-bold">
                                  {editingMatchId === match.id ? (
                                    <input
                                      type="number"
                                      value={row.totalPoints ?? 0}
                                      onChange={(e) =>
                                        handleEditMatchHistoryResult(
                                          match.id,
                                          rIdx,
                                          "totalPoints",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full bg-transparent text-right outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1"
                                    />
                                  ) : (
                                    row.totalPoints
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              ) : leaderboardSubView === "stats" ? (
                <StatsSummary leaderboardData={leaderboardData} />
              ) : (
                <TournamentProgression
                  matchHistory={matchHistory}
                  gameType={gameType}
                  tournamentType={tournamentType}
                  groupName={groupName}
                  customTournamentName={customTournamentName}
                  customGroupName={customGroupName}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          ) : (
            /* Import Table View */
            <div className="lg:col-span-9 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-serif italic uppercase opacity-50 flex items-center gap-2">
                  <Upload size={14} />
                  Import Overall Standings
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => importFileInputRef.current?.click()}
                    disabled={isProcessingImport}
                    className="p-1.5 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center gap-2 px-3"
                  >
                    {isProcessingImport ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span className="text-[10px] font-bold uppercase">
                      Upload Standings Image
                    </span>
                  </button>
                  <input
                    type="file"
                    ref={importFileInputRef}
                    onChange={handleImportTable}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    onClick={() => setShowStandingsPasteSection(!showStandingsPasteSection)}
                    className={cn(
                      "p-1.5 border transition-all flex items-center gap-2 px-3",
                      showStandingsPasteSection
                        ? "border-[#141414] bg-[#141414] text-[#E4E3E0] dark:bg-white dark:text-black dark:border-white"
                        : "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-black"
                    )}
                    title="Paste CSV or Spreadsheet data directly as text"
                  >
                    <FileText size={14} />
                    <span className="text-[10px] font-bold uppercase">
                      Paste CSV/Excel Text
                    </span>
                  </button>

                  {importedLeaderboard.length > 0 && (
                    <>
                      <button
                        onClick={handleAddImportRow}
                        className="p-1.5 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center gap-2 px-3"
                      >
                        <Plus size={14} />
                        <span className="text-[10px] font-bold uppercase">
                          Add Row
                        </span>
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] font-mono uppercase opacity-40">
                            Style:
                          </label>
                          <select
                            value={selectedTemplate}
                            onChange={(e) =>
                              setSelectedTemplate(e.target.value)
                            }
                            className="bg-transparent border border-[#141414] text-[10px] font-mono uppercase px-2 py-1 outline-none hover:bg-[#141414]/5 transition-colors"
                          >
                            {TEMPLATES.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => bgFileInputRef.current?.click()}
                          className={cn(
                            "p-1.5 border border-[#141414] transition-all flex items-center gap-2 px-3",
                            customBackgroundImage
                              ? "bg-[#141414] text-[#E4E3E0]"
                              : "hover:bg-[#141414] hover:text-[#E4E3E0]",
                          )}
                          title="Upload Background Wallpaper"
                        >
                          <ImagePlus size={14} />
                          <span className="text-[10px] font-bold uppercase">
                            {customBackgroundImage ? "BG Active" : "Set BG"}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setTemplateDataOverride(importedLeaderboard);
                            setCurrentTemplatePage(0);
                            setShowTemplate(true);
                          }}
                          className="p-1.5 border border-[#141414] bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 transition-all flex items-center gap-2 px-4 shadow-sm"
                        >
                          <ImageIcon size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            Generate Image
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            pushImportedToHistory(importedLeaderboard, -1, "clear_all");
                            setImportedLeaderboard([]);
                          }}
                          className="p-1.5 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 px-3"
                        >
                          <Trash2 size={14} />
                          <span className="text-[10px] font-bold uppercase">
                            Clear
                          </span>
                        </button>

                        <button
                          onClick={handleUndoImported}
                          disabled={importedHistory.length === 0}
                          className={cn(
                            "p-1.5 border border-[#141414] transition-all flex items-center gap-1 px-3",
                            importedHistory.length === 0
                              ? "opacity-30 cursor-not-allowed text-gray-400 bg-gray-100/50"
                              : "text-black bg-white hover:bg-[#141414] hover:text-[#E4E3E0] dark:text-gray-300 dark:bg-black/10 dark:hover:bg-white dark:hover:text-black"
                          )}
                          title="Undo last manual edit"
                        >
                          <Undo size={12} />
                          <span className="text-[10px] font-bold uppercase">Undo</span>
                        </button>
                        <button
                          onClick={handleRedoImported}
                          disabled={importedRedoStack.length === 0}
                          className={cn(
                            "p-1.5 border border-[#141414] transition-all flex items-center gap-1 px-3",
                            importedRedoStack.length === 0
                              ? "opacity-30 cursor-not-allowed text-gray-400 bg-gray-100/50"
                              : "text-black bg-white hover:bg-[#141414] hover:text-[#E4E3E0] dark:text-gray-300 dark:bg-black/10 dark:hover:bg-white dark:hover:text-black"
                          )}
                          title="Redo manual edit"
                        >
                          <Redo size={12} />
                          <span className="text-[10px] font-bold uppercase">Redo</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {importedLeaderboard.length === 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* Left Column: Upload local screenshot */}
                  <div className="h-full flex flex-col items-center justify-center p-8 py-14 border-2 border-dashed border-[#141414]/20 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] space-y-6">
                    <div className="flex items-center gap-4 text-gray-500">
                      <Upload size={48} strokeWidth={1.5} />
                    </div>
                    <div className="text-center max-w-sm px-4">
                      <p className="font-serif italic text-base text-[#141414] dark:text-gray-200 font-bold">
                        Upload Standings Image
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                        Upload an image/screenshot of your overall standings or points table for AI-powered auto OCR detection.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 w-full px-4">
                      <button
                        onClick={() => importFileInputRef.current?.click()}
                        className="px-6 py-2.5 bg-[#141414] text-[#E4E3E0] dark:bg-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-600 dark:hover:text-white active:scale-95 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm rounded"
                      >
                        <Upload size={14} />
                        Upload Standings Image
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Paste CSV/Excel text directly */}
                  <div className="p-6 border border-blue-200 bg-blue-50/10 dark:border-blue-500/20 dark:bg-blue-950/5 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                      <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                      <div>
                        <h3 className="text-sm font-bold font-serif italic">
                          Paste CSV / Excel Text Directly
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                          Paste cells copied from Excel/Sheets or AI. Headers like Rank, Team, Matches, Kills, Points will detect automatically!
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={standingsPasteText}
                      onChange={(e) => setStandingsPasteText(e.target.value)}
                      placeholder="Paste your CSV or spreadsheet data here. Example:

Team Name, Matches, WWCD, Kills, Place Points, Total Points
Team Soul, 5, 2, 30, 45, 75
GodLike, 5, 1, 23, 30, 53

(Tabs, commas, and semicolons are supported automatically)"
                      className="w-full h-44 p-3 text-xs bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg outline-none font-mono focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder:opacity-40"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setStandingsPasteText("")}
                        className="px-4 py-1.5 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                      >
                        Clear Text
                      </button>
                      <button
                        onClick={() => {
                          const success = processStandingsText(standingsPasteText);
                          if (success) {
                            setStandingsPasteText("");
                          }
                        }}
                        className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        Parse & Auto Fill
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-6">
                  {/* Collapsible Direct Paste input shown at the top of table when toggled */}
                  {showStandingsPasteSection && (
                    <div className="p-6 border border-dashed border-blue-200 bg-blue-50/10 dark:border-blue-500/20 dark:bg-blue-950/5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                          <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                          <div>
                            <h3 className="text-xs font-bold font-serif italic">
                              Paste CSV / Excel Text Directly
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                              This will replace your current standings. Autodetects all columns.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowStandingsPasteSection(false)}
                          className="text-[10px] text-gray-400 hover:text-black dark:hover:text-white uppercase font-bold"
                        >
                          Hide Panel
                        </button>
                      </div>

                      <textarea
                        value={standingsPasteText}
                        onChange={(e) => setStandingsPasteText(e.target.value)}
                        placeholder="Paste your CSV or spreadsheet data here. Example:
Team Name, Matches, WWCD, Kills, Place Points, Total Points
Team Soul, 5, 2, 30, 45, 75
GodLike, 5, 1, 23, 30, 53"
                        className="w-full h-32 p-3 text-xs bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg outline-none font-mono focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder:opacity-40"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setStandingsPasteText("")}
                          className="px-4 py-1.5 border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                        >
                          Clear Text
                        </button>
                        <button
                          onClick={() => {
                            const success = processStandingsText(standingsPasteText);
                            if (success) {
                              setStandingsPasteText("");
                              setShowStandingsPasteSection(false);
                            }
                          }}
                          className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          Parse & Auto Fill
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border border-[#141414]">
                  <div className="grid grid-cols-12 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest p-3">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-1">Logo</div>
                    <div className="col-span-2">
                      Team Name{" "}
                      <span className="text-[8px] opacity-40">(Edit)</span>
                    </div>
                    <div className="col-span-1 text-center">
                      CD <span className="text-[8px] opacity-40">(Edit)</span>
                    </div>
                    <div className="col-span-1 text-center">
                      MP <span className="text-[8px] opacity-40">(Edit)</span>
                    </div>
                    <div className="col-span-2 text-center">
                      Kills{" "}
                      <span className="text-[8px] opacity-40">(Edit)</span>
                    </div>
                    <div className="col-span-2 text-center">
                      Place{" "}
                      <span className="text-[8px] opacity-40">(Edit)</span>
                    </div>
                    <div className="col-span-1 text-right">Total</div>
                    <div className="col-span-1 text-right">Action</div>
                  </div>
                  <div className="divide-y divide-[#141414]">
                    {importedLeaderboard.map((row, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "grid grid-cols-12 p-3 items-center hover:bg-[#141414]/5 transition-colors group",
                          idx === 0 && "bg-yellow-50/50",
                        )}
                      >
                        <div className="col-span-1 font-mono text-xs opacity-50">
                          {idx + 1}
                        </div>
                        <div className="col-span-1">
                          {row.logo ? (
                            <img
                              src={row.logo}
                              alt=""
                              className="w-5 h-5 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-black/5 rounded-sm" />
                          )}
                        </div>
                        <div className="col-span-2 font-bold text-sm flex items-center gap-2">
                          {idx === 0 && (
                            <Trophy size={14} className="text-yellow-600" />
                          )}
                          <input
                            type="text"
                            value={row.teamName ?? ""}
                            onChange={(e) =>
                              handleManualEditImport(
                                idx,
                                "teamName",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent outline-none focus:ring-1 focus:ring-[#141414]/20 rounded px-1"
                          />
                        </div>
                        <div className="col-span-1 text-center font-mono text-sm">
                          <input
                            type="number"
                            value={row.wwcd ?? 0}
                            onChange={(e) =>
                              handleManualEditImport(
                                idx,
                                "wwcd",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-[#141414]/20 rounded px-1"
                          />
                        </div>
                        <div className="col-span-1 text-center font-mono text-sm">
                          <input
                            type="number"
                            value={row.matchesPlayed ?? 0}
                            onChange={(e) =>
                              handleManualEditImport(
                                idx,
                                "matchesPlayed",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-[#141414]/20 rounded px-1"
                          />
                        </div>
                        <div className="col-span-2 text-center font-mono text-sm">
                          <input
                            type="number"
                            value={row.totalKills ?? 0}
                            onChange={(e) =>
                              handleManualEditImport(
                                idx,
                                "totalKills",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-[#141414]/20 rounded px-1"
                          />
                        </div>
                        <div className="col-span-2 text-center font-mono text-sm">
                          <input
                            type="number"
                            value={row.totalPlacementPoints ?? 0}
                            onChange={(e) =>
                              handleManualEditImport(
                                idx,
                                "totalPlacementPoints",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent text-center outline-none focus:ring-1 focus:ring-[#141414]/20 rounded px-1"
                          />
                        </div>
                        <div className="col-span-1 text-right font-bold text-sm">
                          <input
                            type="number"
                            value={row.totalPoints ?? 0}
                            onChange={(e) =>
                              handleManualEditImport(
                                idx,
                                "totalPoints",
                                e.target.value,
                              )
                            }
                            className="w-full bg-transparent text-right outline-none focus:ring-1 focus:ring-[#141414]/20 rounded px-1"
                          />
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => handleRemoveImportRow(idx)}
                            className="p-1 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}{" "}
        </section>

        {/* Template Modal */}
        {showTemplate && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-xl">
            <div className="min-h-screen flex flex-col items-center justify-start py-6 px-4 sm:px-6 md:py-10">
              <div className="relative w-full max-w-7xl flex flex-col gap-6 md:gap-8">
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-white text-xl font-serif italic uppercase tracking-[0.3em] opacity-80">
                    Leaderboard Designer
                  </h2>
                  <button
                    onClick={() => {
                      setShowTemplate(false);
                      setTemplateDataOverride(null);
                    }}
                    className="text-white hover:text-orange-500 transition-colors bg-white/10 p-2 rounded-full"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Preview */}
                  <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        Live Preview
                      </h3>
                      <span className="text-[10px] text-orange-500 font-mono">
                        {aspectRatio === "16:9"
                          ? "1920 x 1080 PX"
                          : aspectRatio === "9:16"
                            ? "1080 x 1920 PX"
                            : aspectRatio === "4:3"
                              ? "1440 x 1080 PX"
                              : aspectRatio === "1:1"
                                ? "1000 x 1000 PX"
                                : selectedTemplate === "tropical-pro" ||
                                    selectedTemplate === "halloween-pro"
                                  ? "1080 x 2600 PX"
                                  : "1000 x 1000 PX"}
                      </span>
                    </div>

                    {/* Pagination Controls */}
                    {!isMini && (templateDataOverride || leaderboardData).length > 20 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mr-2">
                          Slides:
                        </span>
                        {Array.from({
                          length: Math.ceil(
                            (templateDataOverride || leaderboardData).length /
                              20,
                          ),
                        }).map((_, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => setCurrentTemplatePage(pIdx)}
                            className={cn(
                              "px-3 py-1 text-[10px] font-black border transition-all rounded-md",
                              currentTemplatePage === pIdx
                                ? "bg-orange-500 border-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10",
                            )}
                          >
                            PAGE {pIdx + 1}
                          </button>
                        ))}
                        <span className="ml-auto text-[10px] text-white/30 font-mono">
                          Showing teams {currentTemplatePage * 20 + 1} -{" "}
                          {Math.min(
                            (currentTemplatePage + 1) * 20,
                            (templateDataOverride || leaderboardData).length,
                          )}
                        </span>
                      </div>
                    )}

                    {isMini && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mr-2">
                          View:
                        </span>
                        <div className="px-3 py-1 text-[10px] font-black border bg-orange-500/10 border-orange-500/30 text-orange-400 rounded-md">
                          MINI VERSION (TOP 10)
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "w-full overflow-hidden bg-white/5 rounded-2xl border border-white/10 shadow-2xl relative flex justify-center",
                        aspectRatio === "16:9"
                          ? "aspect-video"
                          : aspectRatio === "9:16"
                            ? "aspect-[9/16]"
                            : aspectRatio === "4:3"
                              ? "aspect-[4/3]"
                              : selectedTemplate === "tropical-pro" ||
                                  selectedTemplate === "halloween-pro"
                                ? "aspect-[1080/2600]"
                                : "aspect-square",
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0 origin-top transition-transform duration-500",
                          aspectRatio === "16:9"
                            ? "scale-[0.2] sm:scale-[0.3] md:scale-[0.35] lg:scale-[0.4] xl:scale-[0.5] 2xl:scale-[0.6]"
                            : aspectRatio === "9:16"
                              ? "scale-[0.15] sm:scale-[0.22] md:scale-[0.28] lg:scale-[0.32] xl:scale-[0.38] 2xl:scale-[0.45]"
                              : aspectRatio === "4:3"
                                ? "scale-[0.25] sm:scale-[0.35] md:scale-[0.45] lg:scale-[0.55] xl:scale-[0.65] 2xl:scale-[0.75]"
                                : selectedTemplate === "tropical-pro" ||
                                    selectedTemplate === "halloween-pro"
                                  ? "scale-[0.12] sm:scale-[0.18] md:scale-[0.22] lg:scale-[0.28] xl:scale-[0.32] 2xl:scale-[0.38]"
                                  : "scale-[0.3] sm:scale-[0.45] md:scale-[0.55] lg:scale-[0.65] xl:scale-[0.8] 2xl:scale-100",
                        )}
                      >
                        <div className="mb-4">
                            <LeaderboardChart matchHistory={matchHistory} />
                        </div>
                        <LeaderboardTemplate
                          data={templateDataOverride || leaderboardData}
                          tournament={
                            tournamentType === "Custom"
                              ? customTournamentName || "Custom"
                              : tournamentType
                          }
                          group={
                            groupName === "Custom"
                              ? customGroupName || "Custom"
                              : groupName
                          }
                          templateId={selectedTemplate}
                          logo={tournamentLogo}
                          sponsorLogo={sponsorLogo}
                          gameType={gameType}
                          customHeader1={customHeader1}
                          customHeader2={customHeader2}
                          customHeader3={customHeader3}
                          customHeader4={customHeader4}
                          customTableTitle={customTableTitle}
                          customFooter={customFooter}
                          socialInstagram={socialInstagram}
                          socialYoutube={socialYoutube}
                          qualificationCount={qualificationCount}
                          customQualifiedColor={customQualifiedColor}
                          disqualificationCount={disqualificationCount}
                          customDisqualifiedColor={customDisqualifiedColor}
                          customHeaderColor={customHeaderColor}
                          customFooterColor={customFooterColor}
                          customAccentColor={customAccentColor}
                          customBackgroundImage={customBackgroundImage}
                          customFontSize={customFontSize}
                          h1FontSize={h1FontSize}
                          h2FontSize={h2FontSize}
                          h3FontSize={h3FontSize}
                          h4FontSize={h4FontSize}
                          footerFontSize={footerFontSize}
                          tableFontSize={tableFontSize}
                          currentPage={currentTemplatePage}
                          aspectRatio={aspectRatio}
                          isMini={isMini}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 sticky top-10">
                    <div className="bg-[#1a1a1a] p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-8">
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-50">
                            Select Style
                          </h3>
                          <span className="text-[10px] text-orange-500 font-mono">
                            {TEMPLATES.length} Styles
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {TEMPLATES.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedTemplate(t.id)}
                              className={cn(
                                "group px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-2",
                                selectedTemplate === t.id
                                  ? "bg-white text-black border-white shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                                  : "bg-white/5 text-white border-white/5 hover:border-white/20 hover:bg-white/10",
                              )}
                            >
                              <div
                                className="w-6 h-6 rounded-full border border-white/10 shadow-inner transition-transform group-hover:scale-110"
                                style={{ backgroundColor: t.color }}
                              />
                              <span className="text-center leading-tight truncate w-full">
                                {t.name}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Aspect Ratio Selection */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                          <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-50 mb-4">
                            Aspect Ratio
                          </h3>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { id: "1:1", label: "1:1", sub: "Square" },
                              { id: "16:9", label: "16:9", sub: "Landscape" },
                              { id: "9:16", label: "9:16", sub: "Portrait" },
                              { id: "4:3", label: "4:3", sub: "Classic" },
                            ].map((ratio) => (
                              <button
                                key={ratio.id}
                                onClick={() => setAspectRatio(ratio.id as any)}
                                className={cn(
                                  "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all",
                                  aspectRatio === ratio.id
                                    ? "bg-orange-500 border-orange-500 text-black shadow-lg"
                                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10",
                                )}
                              >
                                <span className="text-[10px] font-black">
                                  {ratio.label}
                                </span>
                                <span
                                  className={cn(
                                    "text-[7px] uppercase font-bold",
                                    aspectRatio === ratio.id
                                      ? "text-black/60"
                                      : "text-white/20",
                                  )}
                                >
                                  {ratio.sub}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Limit Settings */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                          <div className="flex bg-white/5 p-1 rounded-lg mb-6">
                            <button
                              onClick={() => setLimitTab("qualification")}
                              className={cn(
                                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                                limitTab === "qualification"
                                  ? "bg-orange-500 text-black shadow-lg"
                                  : "text-white/40 hover:text-white",
                              )}
                            >
                              Qualification
                            </button>
                            <button
                              onClick={() => setLimitTab("disqualification")}
                              className={cn(
                                "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                                limitTab === "disqualification"
                                  ? "bg-red-500 text-white shadow-lg"
                                  : "text-white/40 hover:text-white",
                              )}
                            >
                              Disqualification
                            </button>
                          </div>

                          {limitTab === "qualification" ? (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key="qual"
                            >
                              <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-50 mb-4">
                                Qualification Limit (Row Count)
                              </h3>
                              <div className="flex items-center gap-4 mb-6">
                                <input
                                  type="range"
                                  min="0"
                                  max="20"
                                  value={qualificationCount}
                                  onChange={(e) =>
                                    setQualificationCount(
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="flex-1 accent-orange-500"
                                />
                                <span className="text-white font-black text-xl w-8 text-center">
                                  {qualificationCount}
                                </span>
                              </div>

                              <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-50 mb-4">
                                Qualified Team Color
                              </h3>
                              <div className="flex items-center gap-4">
                                <input
                                  type="color"
                                  value={customQualifiedColor}
                                  onChange={(e) =>
                                    setCustomQualifiedColor(e.target.value)
                                  }
                                  className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer rounded-lg overflow-hidden"
                                />
                                <input
                                  type="text"
                                  value={customQualifiedColor}
                                  onChange={(e) =>
                                    setCustomQualifiedColor(e.target.value)
                                  }
                                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono flex-1 uppercase"
                                />
                              </div>
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {[
                                  "#22c55e",
                                  "#ef4444",
                                  "#3b82f6",
                                  "#eab308",
                                  "#ec4899",
                                  "#ffffff",
                                ].map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => setCustomQualifiedColor(c)}
                                    className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              key="disqual"
                            >
                              <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-50 mb-4">
                                Disqualification Limit (Row Count)
                              </h3>
                              <div className="flex items-center gap-4 mb-6">
                                <input
                                  type="range"
                                  min="0"
                                  max="20"
                                  value={disqualificationCount}
                                  onChange={(e) =>
                                    setDisqualificationCount(
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="flex-1 accent-red-500"
                                />
                                <span className="text-white font-black text-xl w-8 text-center">
                                  {disqualificationCount}
                                </span>
                              </div>

                              <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-50 mb-4">
                                Disqualified Team Color
                              </h3>
                              <div className="flex items-center gap-4">
                                <input
                                  type="color"
                                  value={customDisqualifiedColor}
                                  onChange={(e) =>
                                    setCustomDisqualifiedColor(e.target.value)
                                  }
                                  className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer rounded-lg overflow-hidden"
                                />
                                <input
                                  type="text"
                                  value={customDisqualifiedColor}
                                  onChange={(e) =>
                                    setCustomDisqualifiedColor(e.target.value)
                                  }
                                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono flex-1 uppercase"
                                />
                              </div>
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {[
                                  "#ef4444",
                                  "#f97316",
                                  "#7f1d1d",
                                  "#450a0a",
                                  "#ffffff",
                                  "#000000",
                                ].map((c) => (
                                  <button
                                    key={c}
                                    onClick={() =>
                                      setCustomDisqualifiedColor(c)
                                    }
                                    className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Custom Header/Footer Inputs for All Templates */}
                        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-6">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <h3 className="text-white text-xs font-bold uppercase tracking-widest opacity-50">
                                Customize Style
                              </h3>
                              <p className="text-[8px] text-white/30 uppercase mt-1">
                                Edit header and footer text
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  if (selectedTemplate === "tropical-pro") {
                                    setCustomHeader1("RVNC ESPORTS PRESENTS");
                                    setCustomHeader2("day 1 day 2");
                                    setCustomHeader3("30k");
                                    setCustomHeader4("Grand Finals");
                                    setCustomFooter(
                                      "BATTLEGROUNDS MOBILE INDIA | KRAFTON",
                                    );
                                  } else if (
                                    selectedTemplate === "halloween-pro"
                                  ) {
                                    setCustomHeader1("RVNC ESPORTS");
                                    setCustomHeader2("P R E S E N T S");
                                    setCustomHeader3("OK REPUBLIC UTSAV");
                                    setCustomHeader4("Grand Finals");
                                    setCustomFooter("RVNC ESPORTS");
                                  } else if (
                                    selectedTemplate === "republic-utsav"
                                  ) {
                                    setCustomHeader1("RVNC ESPORTS");
                                    setCustomHeader2("P R E S E N T S");
                                    setCustomHeader3("30k republic utsav");
                                    setCustomHeader4("grand finals");
                                    setCustomFooter(
                                      "© 2022 KRAFTON, Inc. All rights reserved.",
                                    );
                                  } else {
                                    setCustomHeader1(
                                      tournamentType === "Custom"
                                        ? customTournamentName || "RVNC ESPORTS"
                                        : tournamentType,
                                    );
                                    setCustomHeader2(
                                      groupName === "Custom"
                                        ? customGroupName || "P R E S E N T S"
                                        : groupName,
                                    );
                                    setCustomHeader3("OVERALL STANDINGS");
                                    setCustomHeader4("Week 00 Day 00");
                                    setCustomFooter("By RVNC INFERENO");
                                  }
                                  setCustomTableTitle("OVERALL STANDINGS");
                                }}
                                className="text-[10px] text-orange-500 hover:text-orange-400 font-bold uppercase tracking-widest"
                              >
                                Reset Text
                              </button>
                              <div className="w-px h-3 bg-white/10" />
                              <button
                                onClick={() => {
                                  setCustomHeaderColor("");
                                  setCustomFooterColor("");
                                  setCustomAccentColor("");
                                  setCustomFontSize(100);
                                  setCustomBackgroundImage(null);
                                }}
                                className="text-[10px] text-orange-500 hover:text-orange-400 font-bold uppercase tracking-widest"
                              >
                                Reset Styles
                              </button>
                              <Settings className="text-orange-500" size={14} />
                            </div>
                          </div>

                          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between group hover:bg-orange-500/20 transition-all cursor-pointer" onClick={() => setIsMini(!isMini)}>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                isMini ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40" : "bg-white/5 text-white/40"
                              )}>
                                <Activity size={20} />
                              </div>
                              <div>
                                <h3 className="text-white text-xs font-bold uppercase tracking-widest">
                                  Mini Version (Top 10)
                                </h3>
                                <p className="text-[8px] text-white/40 uppercase mt-0.5">
                                  Show only the first 10 teams in a single page
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-12 h-6 rounded-full relative transition-colors duration-300",
                              isMini ? "bg-orange-500" : "bg-white/10"
                            )}>
                              <div className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                                isMini ? "left-7" : "left-1"
                              )} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-40 text-white">
                                Header Line 1 (Top)
                              </label>
                              <input
                                type="text"
                                value={customHeader1}
                                onChange={(e) =>
                                  setCustomHeader1(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 transition-colors"
                                placeholder="RVNC ESPORTS"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-40 text-white">
                                Header Line 2 (Banner Info)
                              </label>
                              <input
                                type="text"
                                value={customHeader2}
                                onChange={(e) =>
                                  setCustomHeader2(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 transition-colors"
                                placeholder="P R E S E N T S"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-40 text-white">
                                Header Line 3 (Main Title)
                              </label>
                              <input
                                type="text"
                                value={customHeader3}
                                onChange={(e) =>
                                  setCustomHeader3(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 transition-colors"
                                placeholder="30k"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-40 text-white">
                                Header Line 4 (Sub Title)
                              </label>
                              <input
                                type="text"
                                value={customHeader4}
                                onChange={(e) =>
                                  setCustomHeader4(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 transition-colors"
                                placeholder="grand finals"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-40 text-white">
                                Table Title
                              </label>
                              <input
                                type="text"
                                value={customTableTitle}
                                onChange={(e) =>
                                  setCustomTableTitle(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 transition-colors"
                                placeholder="OVERALL STANDINGS"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase opacity-40 text-white">
                                Footer Copyright
                              </label>
                              <input
                                type="text"
                                value={customFooter}
                                onChange={(e) =>
                                  setCustomFooter(e.target.value)
                                }
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 transition-colors"
                                placeholder="© 2022 KRAFTON, Inc. All rights reserved."
                              />
                            </div>

                            <div className="space-y-4 pt-2 bg-white/5 p-4 rounded-xl border border-white/10">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-white/40">
                                  Select Text to Resize
                                </label>
                                <div className="grid grid-cols-3 gap-1">
                                  {[
                                    { id: "all", label: "All Text" },
                                    { id: "h1", label: "Header 1" },
                                    { id: "h2", label: "Header 2" },
                                    { id: "h3", label: "Header 3" },
                                    { id: "h4", label: "Header 4" },
                                    { id: "table", label: "Table Data" },
                                    { id: "footer", label: "Footer" },
                                  ].map((target) => (
                                    <button
                                      key={target.id}
                                      onClick={() =>
                                        setSelectedTextTarget(target.id as any)
                                      }
                                      className={cn(
                                        "px-2 py-1.5 rounded text-[9px] font-bold uppercase transition-all border",
                                        selectedTextTarget === target.id
                                          ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
                                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10",
                                      )}
                                    >
                                      {target.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <label className="text-[11px] font-bold uppercase text-white shadow-sm">
                                      {selectedTextTarget === "all"
                                        ? "Overall Font Scaling"
                                        : selectedTextTarget === "h1"
                                          ? "Header 1 Size"
                                          : selectedTextTarget === "h2"
                                            ? "Header 2 Size"
                                            : selectedTextTarget === "h3"
                                              ? "Header 3 Size"
                                              : selectedTextTarget === "h4"
                                                ? "Header 4 Size"
                                                : selectedTextTarget === "table"
                                                  ? "Table Rows Font Size"
                                                  : "Footer Font Size"}
                                    </label>
                                    <p className="text-[8px] text-white/30 uppercase">
                                      {selectedTextTarget === "all"
                                        ? "Resize all template text"
                                        : "Fine-tune specific text size"}
                                    </p>
                                  </div>
                                  <span className="text-[12px] font-mono text-orange-500 font-black bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                    {selectedTextTarget === "all"
                                      ? customFontSize
                                      : selectedTextTarget === "h1"
                                        ? h1FontSize
                                        : selectedTextTarget === "h2"
                                          ? h2FontSize
                                          : selectedTextTarget === "h3"
                                            ? h3FontSize
                                            : selectedTextTarget === "h4"
                                              ? h4FontSize
                                              : selectedTextTarget === "table"
                                                ? tableFontSize
                                                : footerFontSize}
                                    %
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min="50"
                                  max="250"
                                  step="1"
                                  value={
                                    selectedTextTarget === "all"
                                      ? customFontSize
                                      : selectedTextTarget === "h1"
                                        ? h1FontSize
                                        : selectedTextTarget === "h2"
                                          ? h2FontSize
                                          : selectedTextTarget === "h3"
                                            ? h3FontSize
                                            : selectedTextTarget === "h4"
                                              ? h4FontSize
                                              : selectedTextTarget === "table"
                                                ? tableFontSize
                                                : footerFontSize
                                  }
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (selectedTextTarget === "all")
                                      setCustomFontSize(val);
                                    else if (selectedTextTarget === "h1")
                                      setH1FontSize(val);
                                    else if (selectedTextTarget === "h2")
                                      setH2FontSize(val);
                                    else if (selectedTextTarget === "h3")
                                      setH3FontSize(val);
                                    else if (selectedTextTarget === "h4")
                                      setH4FontSize(val);
                                    else if (selectedTextTarget === "table")
                                      setTableFontSize(val);
                                    else if (selectedTextTarget === "footer")
                                      setFooterFontSize(val);
                                  }}
                                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
                                />
                                <div className="flex justify-between text-[8px] text-white/20 font-black uppercase tracking-tighter">
                                  <span>Small</span>
                                  <span>Default (100)</span>
                                  <span>Large</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2">
                              <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase opacity-40 text-white">
                                  Header Color
                                </label>
                                <input
                                  type="color"
                                  value={customHeaderColor || "#fbbf24"}
                                  onChange={(e) =>
                                    setCustomHeaderColor(e.target.value)
                                  }
                                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase opacity-40 text-white">
                                  Accent Color
                                </label>
                                <input
                                  type="color"
                                  value={customAccentColor || "#ffffff"}
                                  onChange={(e) =>
                                    setCustomAccentColor(e.target.value)
                                  }
                                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-bold uppercase opacity-40 text-white">
                                  Footer Color
                                </label>
                                <input
                                  type="color"
                                  value={customFooterColor || "#000000"}
                                  onChange={(e) =>
                                    setCustomFooterColor(e.target.value)
                                  }
                                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="pt-2">
                              <div className="space-y-4">
                                <label className="text-[9px] font-bold uppercase opacity-40 text-white">
                                  Social Links & Background
                                </label>

                                <div className="flex flex-col gap-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                  <label className="text-[10px] text-white/40 uppercase font-black">
                                    Sponsor Logo
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = async () => {
                                          setSponsorLogo(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="text-[10px] text-white/40"
                                  />
                                </div>

                                <div className="flex flex-col gap-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                  <label className="text-[10px] text-white/40 uppercase font-black">
                                    Social Instagram
                                  </label>
                                  <input
                                    type="text"
                                    value={socialInstagram}
                                    onChange={(e) =>
                                      setSocialInstagram(e.target.value)
                                    }
                                    className="w-full bg-transparent border-none text-white text-sm focus:outline-none transition-all font-bold p-0"
                                    placeholder="@IRUSH.OFFICAL"
                                  />
                                </div>

                                <div className="flex flex-col gap-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                  <label className="text-[10px] text-white/40 uppercase font-black">
                                    Social Youtube
                                  </label>
                                  <input
                                    type="text"
                                    value={socialYoutube}
                                    onChange={(e) =>
                                      setSocialYoutube(e.target.value)
                                    }
                                    className="w-full bg-transparent border-none text-white text-sm focus:outline-none transition-all font-bold p-0"
                                    placeholder="IRUSH ESPORTS"
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] text-white/40 uppercase font-black mb-1">
                                    Template Wallpaper
                                  </label>
                                  <button
                                    onClick={() =>
                                      bgFileInputRef.current?.click()
                                    }
                                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                  >
                                    {customBackgroundImage ? (
                                      <ImageIcon
                                        size={14}
                                        className="text-orange-500"
                                      />
                                    ) : (
                                      <ImagePlus size={14} />
                                    )}
                                    {customBackgroundImage
                                      ? "Change Background"
                                      : "Upload Background"}
                                  </button>
                                  {customBackgroundImage && (
                                    <button
                                      onClick={() =>
                                        setCustomBackgroundImage(null)
                                      }
                                      className="text-[8px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest self-end"
                                    >
                                      Remove Background
                                    </button>
                                  )}
                                  <input
                                    type="file"
                                    ref={bgFileInputRef}
                                    onChange={handleBackgroundUpload}
                                    accept="image/*"
                                    className="hidden"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
                        <button
                          onClick={downloadLeaderboardImage}
                          disabled={isDownloadingImage}
                          className={cn(
                            "w-full py-5 bg-orange-500 text-black font-black uppercase tracking-widest hover:bg-orange-400 active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-3 rounded-2xl text-sm",
                            isDownloadingImage &&
                              "opacity-50 cursor-not-allowed",
                          )}
                        >
                          {isDownloadingImage ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <Download size={20} />
                          )}
                          {isDownloadingImage
                            ? "Creating Image..."
                            : "Download PNG"}
                        </button>
                        <div className="flex flex-col items-center gap-2 text-[9px] text-white/30 uppercase tracking-[0.2em] text-center">
                          <div className="flex items-center gap-3">
                            <span>PNG</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span>High Res</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span>
                              {selectedTemplate === "tropical-pro" ||
                              selectedTemplate === "halloween-pro"
                                ? "9:16 Ratio"
                                : "1:1 Ratio"}
                            </span>
                          </div>
                          <p>Crafted by RVNC INFERENO</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Match Team Modal */}
        {showManualMatchModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#E4E3E0] w-full max-w-md border border-[#141414] shadow-2xl overflow-hidden">
              <div className="bg-[#141414] p-4 flex items-center justify-between">
                <h2 className="text-[#E4E3E0] text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <Plus size={14} />
                  {editingManualMatchTeam
                    ? "Edit Manual Match Result"
                    : "Add Manual Result to Current Match"}
                </h2>
                <button
                  onClick={() => {
                    setShowManualMatchModal(false);
                    setEditingManualMatchTeam(null);
                  }}
                  className="text-[#E4E3E0] hover:text-orange-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const teamName = formData.get("teamName") as string;
                  const rank = parseInt(formData.get("rank") as string) || 0;
                  const kills = parseInt(formData.get("kills") as string) || 0;
                  const placementPoints =
                    parseInt(formData.get("placementPoints") as string) || 0;
                  const totalPoints = kills * pointsPerKill + placementPoints;

                  const newTeam: MatchResult = {
                    rank,
                    teamName,
                    kills,
                    placementPoints,
                    totalPoints,
                  };

                  if (editingManualMatchTeam) {
                    setManualMatchTeams((prev) =>
                      prev.map((t) =>
                        t.teamName === editingManualMatchTeam.teamName
                          ? newTeam
                          : t,
                      ),
                    );
                  } else {
                    setManualMatchTeams((prev) => [...prev, newTeam]);
                  }

                  setShowManualMatchModal(false);
                  setEditingManualMatchTeam(null);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                    Team Name
                  </label>
                  <input
                    name="teamName"
                    type="text"
                    defaultValue={editingManualMatchTeam?.teamName || ""}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Enter team name"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                      Rank
                    </label>
                    <input
                      name="rank"
                      type="number"
                      defaultValue={editingManualMatchTeam?.rank || 0}
                      className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                      Kills
                    </label>
                    <input
                      name="kills"
                      type="number"
                      defaultValue={editingManualMatchTeam?.kills || 0}
                      className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                      Place Pts
                    </label>
                    <input
                      name="placementPoints"
                      type="number"
                      defaultValue={
                        editingManualMatchTeam?.placementPoints || 0
                      }
                      className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  {editingManualMatchTeam && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualMatchTeams((prev) =>
                          prev.filter(
                            (t) =>
                              t.teamName !== editingManualMatchTeam.teamName,
                          ),
                        );
                        setShowManualMatchModal(false);
                        setEditingManualMatchTeam(null);
                      }}
                      className="px-4 py-2 border border-red-600 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                    >
                      Delete Team
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                  >
                    {editingManualMatchTeam ? "Update Result" : "Add Result"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manual Team Modal */}
        {showManualTeamModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#E4E3E0] w-full max-w-md border border-[#141414] shadow-2xl overflow-hidden">
              <div className="bg-[#141414] p-4 flex items-center justify-between">
                <h2 className="text-[#E4E3E0] text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <Plus size={14} />
                  {editingManualTeam
                    ? "Edit Manual Team"
                    : "Add Manual Team to Leaderboard"}
                </h2>
                <button
                  onClick={() => {
                    setShowManualTeamModal(false);
                    setEditingManualTeam(null);
                  }}
                  className="text-[#E4E3E0] hover:text-orange-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const teamName = formData.get("teamName") as string;
                  const matchesPlayed =
                    parseInt(formData.get("matchesPlayed") as string) || 0;
                  const wwcd = parseInt(formData.get("wwcd") as string) || 0;
                  const totalKills =
                    parseInt(formData.get("totalKills") as string) || 0;
                  const totalPlacementPoints =
                    parseInt(formData.get("totalPlacementPoints") as string) ||
                    0;
                  const totalPoints =
                    totalKills * pointsPerKill + totalPlacementPoints;

                  const newTeam: LeaderboardEntry = {
                    teamName,
                    matchesPlayed,
                    wwcd,
                    totalKills,
                    totalPlacementPoints,
                    totalPoints,
                    logo: editingManualTeam?.logo,
                  };

                  if (editingManualTeam) {
                    setManualLeaderboardTeams((prev) =>
                      prev.map((t) =>
                        t.teamName === editingManualTeam.teamName ? newTeam : t,
                      ),
                    );
                  } else {
                    setManualLeaderboardTeams((prev) => [...prev, newTeam]);
                  }

                  setShowManualTeamModal(false);
                  setEditingManualTeam(null);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                    Team Name
                  </label>
                  <input
                    name="teamName"
                    type="text"
                    defaultValue={editingManualTeam?.teamName || ""}
                    required
                    className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Enter team name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                      Matches Played
                    </label>
                    <input
                      name="matchesPlayed"
                      type="number"
                      defaultValue={editingManualTeam?.matchesPlayed || 0}
                      className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                      WWCD (Wins)
                    </label>
                    <input
                      name="wwcd"
                      type="number"
                      defaultValue={editingManualTeam?.wwcd || 0}
                      className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                      Total Kills
                    </label>
                    <input
                      name="totalKills"
                      type="number"
                      defaultValue={editingManualTeam?.totalKills || 0}
                      className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                      Placement Pts
                    </label>
                    <input
                      name="totalPlacementPoints"
                      type="number"
                      defaultValue={
                        editingManualTeam?.totalPlacementPoints || 0
                      }
                      className="w-full px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  {editingManualTeam && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualLeaderboardTeams((prev) =>
                          prev.filter(
                            (t) => t.teamName !== editingManualTeam.teamName,
                          ),
                        );
                        setShowManualTeamModal(false);
                        setEditingManualTeam(null);
                      }}
                      className="px-4 py-2 border border-red-600 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                    >
                      Delete Team
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                  >
                    {editingManualTeam ? "Update Team" : "Add Team"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Team Manager Modal */}
        <BulkTeamModal
          isOpen={showBulkTeamModal}
          onClose={() => setShowBulkTeamModal(false)}
          slots={slots}
          onUpdateSlots={(updatedSlots) => setSlots(updatedSlots)}
          isDarkMode={isDarkMode}
          compressImage={compressImage}
        />

        {/* Scoring Settings Modal */}
        {showScoringSettings && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#E4E3E0] w-full max-w-md border border-[#141414] shadow-2xl overflow-hidden">
              <div className="bg-[#141414] p-4 flex items-center justify-between">
                <h2 className="text-[#E4E3E0] text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <Settings size={14} />
                  Scoring System Configuration
                </h2>
                <button
                  onClick={() => setShowScoringSettings(false)}
                  className="text-[#E4E3E0] hover:text-orange-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">
                    Quick Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => applyScoringPreset("BGMI_10PT")}
                      className="px-3 py-1 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold rounded hover:bg-orange-600 transition-colors"
                    >
                      BGMI 10PT
                    </button>
                    <button
                      onClick={() => applyScoringPreset("BGMI_15PT")}
                      className="px-3 py-1 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold rounded hover:bg-orange-600 transition-colors"
                    >
                      BGMI 15PT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase opacity-50 block mb-3">
                    Points Per Elimination (Kill)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={pointsPerKill}
                      onChange={(e) =>
                        setPointsPerKill(parseInt(e.target.value) || 0)
                      }
                      className="w-20 px-3 py-2 bg-white border border-[#141414] font-mono text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                    <span className="text-xs font-serif italic text-[#141414]/60">
                      Points awarded for each kill
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase opacity-50 block mb-3">
                    Placement Points (By Rank)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(pointSystem).map(([rank, pts]) => (
                      <div
                        key={rank}
                        className="flex items-center justify-between gap-2 p-2 bg-white border border-[#141414]/10 rounded"
                      >
                        <span className="text-[10px] font-mono w-8">
                          {rank}
                          {rank === "1"
                            ? "st"
                            : rank === "2"
                              ? "nd"
                              : rank === "3"
                                ? "rd"
                                : "th"}
                        </span>
                        <input
                          type="number"
                          value={pts}
                          onChange={(e) =>
                            setPointSystem((prev) => ({
                              ...prev,
                              [parseInt(rank)]: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-16 px-2 py-1 bg-transparent border-b border-[#141414]/20 font-mono text-xs text-right outline-none focus:border-orange-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#141414]/10">
                  <button
                    onClick={() => {
                      setPointSystem({
                        1: 15,
                        2: 12,
                        3: 10,
                        4: 8,
                        5: 6,
                        6: 4,
                        7: 2,
                        8: 1,
                        9: 1,
                        10: 1,
                        11: 0,
                        12: 0,
                        13: 0,
                        14: 0,
                        15: 0,
                        16: 0,
                      });
                      setPointsPerKill(1);
                    }}
                    className="text-[10px] font-bold uppercase text-red-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={10} />
                    Reset to Standard Defaults
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#141414]/5 border-t border-[#141414]/10 flex justify-end">
                <button
                  onClick={() => setShowScoringSettings(false)}
                  className="px-6 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showCropModal && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          aspect={(() => {
            const isPro =
              selectedTemplate === "tropical-pro" ||
              selectedTemplate === "halloween-pro";
            if (aspectRatio === "16:9") return 16 / 9;
            if (aspectRatio === "9:16") return 9 / 16;
            if (aspectRatio === "4:3") return 4 / 3;
            if (aspectRatio === "1:1") return 1;
            if (isPro) return 1080 / 2600;
            return 1;
          })()}
          onDone={(cropped) => {
            setCustomBackgroundImage(cropped);
            setShowCropModal(false);
            setImageToCrop(null);
          }}
          onCancel={() => {
            setShowCropModal(false);
            setImageToCrop(null);
          }}
        />
      )}
    </div>
  );
}
