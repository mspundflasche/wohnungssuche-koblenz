"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { VERDICT_COLOR, INK } from "@/lib/colors";
import { fmtEur, OFFER_LABEL } from "@/lib/format";
import type { Listing, Verdict } from "@/lib/types";

/*
  Grundkarte:
  - Ohne Schlüssel: OpenStreetMap-Standardkacheln (kein API-Schlüssel nötig, Namensnennung Pflicht,
    nur normales Anzeigen – kein Vorladen ganzer Gebiete, siehe operations.osmfoundation.org/policies/tiles).
  - Mit NEXT_CARTO_BASEMAP_KEY (vom Server übergeben): ruhigere CARTO-Karte „Voyager“
    (kostenloser Schlüssel unter carto.com/basemaps/apikey).
*/
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende';

function basemapFor(cartoKey: string | null) {
  if (cartoKey) {
    return {
      url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`,
      attribution: `${OSM_ATTRIBUTION}, &copy; <a href="https://carto.com/attribution/">CARTO</a>`,
      className: "",
    };
  }
  return {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM_ATTRIBUTION,
    // etwas entsättigt, damit die farbigen Pins hervortreten
    className: "karte-ruhig",
  };
}

export interface MapProps {
  listings: Listing[];
  verdicts: Map<string, Verdict>;
  center: [number, number];
  radiusKm: number;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  /** CARTO-Schlüssel aus NEXT_CARTO_BASEMAP_KEY; ohne Schlüssel OpenStreetMap. */
  basemapKey: string | null;
}

function AttributionPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  }, [map]);
  return null;
}

function FlyToSelected({ listing }: { listing: Listing | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (listing?.lat != null && listing.lng != null) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const zoom = Math.max(map.getZoom(), 12);
      if (reduce) map.setView([listing.lat, listing.lng], zoom);
      else map.flyTo([listing.lat, listing.lng], zoom, { duration: 0.6 });
    }
  }, [listing, map]);
  return null;
}

export default function ListingMap({ listings, verdicts, center, radiusKm, selectedId, hoveredId, onSelect, basemapKey }: MapProps) {
  const basemap = basemapFor(basemapKey);
  const located = listings.filter((l) => l.lat != null && l.lng != null);
  const selected = located.find((l) => l.id === selectedId);
  // Hervorgehobene Pins zuletzt zeichnen, damit sie oben liegen.
  const ordered = [...located].sort((a, b) => {
    const ra = a.id === selectedId || a.id === hoveredId ? 1 : 0;
    const rb = b.id === selectedId || b.id === hoveredId ? 1 : 0;
    return ra - rb;
  });

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom className="h-full w-full" attributionControl>
      <TileLayer key={basemap.url} url={basemap.url} attribution={basemap.attribution} maxZoom={19} className={basemap.className} />
      <Circle
        center={center}
        radius={radiusKm * 1000}
        pathOptions={{ color: INK.rhein, weight: 1.5, fillColor: INK.rhein, fillOpacity: 0.04, interactive: false }}
      />
      {ordered.map((l) => {
        const v = verdicts.get(l.id) ?? "unbewertet";
        const active = l.id === selectedId || l.id === hoveredId;
        return (
          <CircleMarker
            key={`${l.id}-${active ? "a" : "n"}`}
            center={[l.lat!, l.lng!]}
            radius={active ? 10 : 7}
            pathOptions={{
              color: active ? INK.primary : "#ffffff",
              weight: active ? 3 : 2,
              fillColor: VERDICT_COLOR[v],
              fillOpacity: l.status === "weg" ? 0.45 : 1,
            }}
            eventHandlers={{ click: () => onSelect(l.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]} className="karten-tooltip">
              <strong>{fmtEur(l.offer_type === "miete" ? (l.price_warm ?? l.price) : l.price)}</strong>{" "}
              <span>{OFFER_LABEL[l.offer_type]}</span>
              <br />
              {l.title.length > 48 ? `${l.title.slice(0, 46)}…` : l.title}
            </Tooltip>
          </CircleMarker>
        );
      })}
      <AttributionPrefix />
      <FlyToSelected listing={selected} />
    </MapContainer>
  );
}
