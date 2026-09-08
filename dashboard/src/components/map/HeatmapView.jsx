'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink, Layers, ArrowRight } from 'lucide-react';
import StatusBadge from '../badges/StatusBadge';
import PriorityBadge from '../badges/PriorityBadge';

// Helper to update map view programmatically
function SetViewOnClick({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 13);
    }
  }, [coords, map]);
  return null;
}

export default function HeatmapView({ reports, selectedPriority, selectedStatus }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[650px] rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-pulse text-xs font-semibold text-slate-400">
        Loading interactive operations heatmap...
      </div>
    );
  }

  // Center on Bengaluru / Ward 7 area
  const centerCoords = [12.955, 77.625];

  // Create custom marker icons based on priority & status
  const createMarkerIcon = (priority, status) => {
    let pinColor = '#2563EB'; // default blue
    let dotPulse = '';

    if (status === 'resolved') {
      pinColor = '#10B981'; // emerald
    } else if (status === 'rejected') {
      pinColor = '#64748B'; // slate
    } else if (priority === 'high') {
      pinColor = '#EF4444'; // red
      dotPulse = '<span class="pulse-ring"></span>';
    } else if (priority === 'medium') {
      pinColor = '#F59E0B'; // amber
    }

    const html = `
      <div class="custom-pin-wrapper" style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${dotPulse}
        <div style="width: 26px; height: 26px; background-color: ${pinColor}; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;">
          !
        </div>
      </div>
      <style>
        .pulse-ring {
          position: absolute;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.4);
          animation: map-pulse 1.5s infinite ease-out;
        }
        @keyframes map-pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      </style>
    `;

    return L.divIcon({
      html,
      className: '',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18],
    });
  };

  return (
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <MapContainer
        center={centerCoords}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Clustered Density Hotspots (High issue zones) */}
        <Circle
          center={[12.9719, 77.6412]} // Indiranagar Cluster
          radius={700}
          pathOptions={{
            color: '#EF4444',
            fillColor: '#EF4444',
            fillOpacity: 0.15,
            weight: 1.5,
          }}
        />
        <Circle
          center={[12.9345, 77.6251]} // Koramangala Cluster
          radius={850}
          pathOptions={{
            color: '#F59E0B',
            fillColor: '#F59E0B',
            fillOpacity: 0.12,
            weight: 1.5,
          }}
        />

        {/* Render Issue Markers */}
        {reports.map((report) => {
          if (!report.location?.latitude || !report.location?.longitude) return null;

          return (
            <Marker
              key={report.id}
              position={[report.location.latitude, report.location.longitude]}
              icon={createMarkerIcon(report.priority, report.status)}
            >
              <Popup>
                <div className="w-64 p-0">
                  {/* Image header */}
                  <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/75 text-white">
                        {report.reportNumber}
                      </span>
                    </div>
                  </div>

                  {/* Body info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={report.status} />
                      <PriorityBadge priority={report.priority} />
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {report.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      📍 {report.address}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <Link
                        href={`/report/${report.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <span>Open Review Console</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend Overlay */}
      <div className="absolute bottom-5 left-5 z-[500] p-3 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-1.5">
        <p className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
          Marker Legend
        </p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white"></span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 border border-white"></span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">Low Priority / Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">Resolved Issue</span>
        </div>
      </div>
    </div>
  );
}
