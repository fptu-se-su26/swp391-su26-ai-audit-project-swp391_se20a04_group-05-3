import React, { useState } from "react";
import { ZoomIn, ZoomOut, Compass, MapPin, Navigation } from "lucide-react";
import { EcoStore } from "../../types";

interface MockMapProps {
  stores: EcoStore[];
  userLocation: { city: string; district: string; address: string };
  selectedStoreId: string | null;
  onMarkerClick: (storeId: string) => void;
}

export const MockMap: React.FC<MockMapProps> = ({
  stores,
  userLocation,
  selectedStoreId,
  onMarkerClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState(13);

  // Filter stores by current city
  const cityStores = stores.filter((s) => s.city === userLocation.city);

  // Map geographic coordinates to SVG viewport coordinates (0 to 100)
  const getCoordinates = (lat?: number, lng?: number) => {
    if (!lat || !lng) return { x: 50, y: 50 };

    if (userLocation.city === "Đà Nẵng") {
      // Longitude range: 108.12 to 108.28
      // Latitude range: 15.98 to 16.12
      const x = ((lng - 108.12) / (108.28 - 108.12)) * 100;
      const y = 100 - ((lat - 15.98) / (16.12 - 15.98)) * 100;
      return { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) };
    } else if (userLocation.city === "Hà Nội") {
      // Thạch Thất is quite far west, so range: 105.5 to 105.85
      // Latitude range: 20.95 to 21.05
      const x = ((lng - 105.5) / (105.85 - 105.5)) * 100;
      const y = 100 - ((lat - 20.95) / (21.05 - 20.95)) * 100;
      return { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) };
    } else {
      // Lâm Đồng range: 108.35 to 108.5
      // Latitude range: 11.95 to 12.08
      const x = ((lng - 108.35) / (108.5 - 108.35)) * 100;
      const y = 100 - ((lat - 11.95) / (12.08 - 11.95)) * 100;
      return { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) };
    }
  };

  // Mock User Location Pin coordinate based on district
  const getUserPinCoords = () => {
    if (userLocation.city === "Đà Nẵng") {
      switch (userLocation.district) {
        case "Hải Châu": return { x: 55, y: 50 };
        case "Thanh Khê": return { x: 45, y: 48 };
        case "Sơn Trà": return { x: 75, y: 35 };
        case "Ngũ Hành Sơn": return { x: 70, y: 70 };
        case "Liên Chiểu": return { x: 25, y: 25 };
        case "Cẩm Lệ": return { x: 48, y: 68 };
        case "Hòa Vang": return { x: 20, y: 75 };
        default: return { x: 50, y: 55 };
      }
    } else if (userLocation.city === "Hà Nội") {
      switch (userLocation.district) {
        case "Thạch Thất": return { x: 15, y: 65 };
        case "Cầu Giấy": return { x: 60, y: 40 };
        case "Hoàn Kiếm": return { x: 80, y: 35 };
        case "Đống Đa": return { x: 70, y: 50 };
        default: return { x: 50, y: 50 };
      }
    } else {
      switch (userLocation.district) {
        case "Đà Lạt": return { x: 60, y: 60 };
        case "Lạc Dương": return { x: 50, y: 40 };
        case "Bảo Lộc": return { x: 30, y: 80 };
        default: return { x: 50, y: 50 };
      }
    }
  };

  const userPin = getUserPinCoords();

  return (
    <div className="bg-stone-950 border border-stone-850 rounded-2xl overflow-hidden relative shadow-lg">
      
      {/* Top Map bar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="bg-stone-950/85 backdrop-blur border border-stone-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-stone-300 font-mono">
          <Compass className="h-4.5 w-4.5 text-emerald-400 animate-spin" style={{ animationDuration: "10s" }} />
          <span>{userLocation.city} Zoom: {zoomLevel}00m</span>
        </div>
      </div>

      {/* Map Control Buttons */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
          className="p-2 rounded-xl bg-stone-950/85 backdrop-blur border border-stone-800 text-stone-300 hover:text-white cursor-pointer transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(10, z - 1))}
          className="p-2 rounded-xl bg-stone-950/85 backdrop-blur border border-stone-800 text-stone-300 hover:text-white cursor-pointer transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* Stylized Vector Terrain depending on Selected City */}
      <div className="w-full h-80 relative select-none bg-stone-900 overflow-hidden transition-colors duration-500">
        
        {/* SVG Drawing Layer representing maps */}
        <svg className="absolute inset-0 w-full h-full opacity-60 text-emerald-500/20" xmlns="http://www.w3.org/2000/svg">
          {userLocation.city === "Đà Nẵng" ? (
            <>
              {/* Sea Coast Coastline */}
              <path d="M 80,0 Q 75,50 85,100 L 100,100 L 100,0 Z" fill="rgba(14, 165, 233, 0.15)" />
              {/* Han River */}
              <path d="M 55,100 Q 52,70 56,50 T 54,0" fill="none" stroke="rgba(14, 165, 233, 0.25)" strokeWidth="18" strokeLinecap="round" />
              {/* Dragon Bridge (Cầu Rồng) */}
              <line x1="45" y1="52" x2="65" y2="51" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="4" />
              {/* Major Roads Grid */}
              <line x1="0" y1="48" x2="100" y2="48" stroke="rgba(120,113,108, 0.15)" strokeWidth="2" />
              <line x1="30" y1="0" x2="30" y2="100" stroke="rgba(120,113,108, 0.15)" strokeWidth="2" />
              <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(120,113,108, 0.15)" strokeWidth="2" />
            </>
          ) : userLocation.city === "Hà Nội" ? (
            <>
              {/* West Lake (Hồ Tây) */}
              <ellipse cx="65" cy="28" rx="14" ry="10" fill="rgba(14, 165, 233, 0.12)" />
              {/* Hoan Kiem Lake */}
              <ellipse cx="80" cy="50" rx="6" ry="4" fill="rgba(14, 165, 233, 0.18)" />
              {/* Red River */}
              <path d="M 0,15 Q 40,20 60,35 T 100,75" fill="none" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="25" />
              {/* Roads */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(120,113,108, 0.15)" strokeWidth="2" />
              <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(120,113,108, 0.15)" strokeWidth="2" />
            </>
          ) : (
            <>
              {/* Mountain Silhouettes */}
              <path d="M 0,80 Q 20,40 40,65 T 80,50 T 100,70 L 100,100 L 0,100 Z" fill="rgba(16, 185, 129, 0.08)" />
              <path d="M 0,90 Q 30,55 60,75 T 100,85 L 100,100 L 0,100 Z" fill="rgba(16, 185, 129, 0.05)" />
              {/* Lakes */}
              <ellipse cx="60" cy="65" rx="8" ry="5" fill="rgba(14, 165, 233, 0.15)" />
              {/* Roads */}
              <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(120,113,108, 0.15)" strokeWidth="2" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(120,113,108, 0.15)" strokeWidth="2" />
            </>
          )}
        </svg>

        {/* Dynamic District Green Zones */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* User Current Position Pin */}
        <div
          style={{ left: `${userPin.x}%`, top: `${userPin.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
        >
          {/* Pulse Ring */}
          <div className="absolute -inset-2.5 bg-blue-500/30 rounded-full animate-ping pointer-events-none" style={{ animationDuration: "3s" }} />
          <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg relative cursor-help">
            <Navigation className="h-2.5 w-2.5 text-white fill-current" />
          </div>
          {/* User Location Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-stone-950/90 border border-stone-850 text-white text-[9px] px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
            Vị trí của bạn ({userLocation.district})
          </div>
        </div>

        {/* Store Pins (Markers) */}
        {cityStores.map((store) => {
          const coords = getCoordinates(store.latitude, store.longitude);
          const isSelected = selectedStoreId === store.id;

          return (
            <div
              key={store.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
              onClick={() => onMarkerClick(store.id)}
            >
              {/* Outer pulsing ring for selected pin */}
              {isSelected ? (
                <div className="absolute -inset-3.5 bg-emerald-500/30 rounded-full animate-ping pointer-events-none" />
              ) : (
                <div className="absolute -inset-2 bg-emerald-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}

              {/* Pin Leaf Icon */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xl border-2 transition-all ${
                  isSelected
                    ? "bg-emerald-500 border-white text-black scale-110 animate-map-pulse"
                    : "bg-stone-900 border-stone-700 text-emerald-400 group-hover:border-emerald-500 group-hover:scale-105"
                }`}
              >
                <MapPin className="h-4 w-4 fill-current" />
              </div>

              {/* Store Map label tag */}
              <div
                className={`absolute left-full ml-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg shadow-lg border text-[8px] font-bold whitespace-nowrap transition-all pointer-events-none ${
                  isSelected
                    ? "bg-emerald-500 border-white text-black opacity-100"
                    : "bg-stone-950/95 border-stone-850 text-stone-200 opacity-60 group-hover:opacity-100"
                }`}
              >
                {store.name.replace("Nhà Vườn ", "").replace("Cửa Hàng ", "").replace("Hợp Tác Xã ", "")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Footer Legend info */}
      <div className="p-3 bg-stone-950 border-t border-stone-850 flex justify-between items-center text-[9px] text-stone-400 font-mono">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full border border-white" />
            Vị trí của bạn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
            Nhà vườn đối tác
          </span>
        </div>
        <span>Bản đồ sinh thái GreenMap v1.0</span>
      </div>
    </div>
  );
};
