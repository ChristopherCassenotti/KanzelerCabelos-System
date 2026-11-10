import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { RouteMapDto } from "../../types/schedule";
import { decodePolyline } from "../../utils/polyline";

interface RouteMapCardProps {
  routeMap?: RouteMapDto | null;
  loading?: boolean;
}

function FitRoute({ points }: { points: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
  }, [map, points]);

  return null;
}

function number(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function RouteMapCard({ routeMap, loading = false }: RouteMapCardProps) {
  const polyline = useMemo(() => {
    if (!routeMap?.rotaPolyline) return [];
    try {
      return decodePolyline(routeMap.rotaPolyline, 6);
    } catch {
      return [];
    }
  }, [routeMap?.rotaPolyline]);

  const points = useMemo(() => {
    const result: Array<[number, number]> = [];
    const partidaLat = number(routeMap?.partida.lat);
    const partidaLng = number(routeMap?.partida.lng);
    if (partidaLat !== null && partidaLng !== null) result.push([partidaLat, partidaLng]);

    for (const stop of routeMap?.paradas ?? []) {
      const lat = number(stop.contato.lat);
      const lng = number(stop.contato.lng);
      if (lat !== null && lng !== null) result.push([lat, lng]);
    }

    return result;
  }, [routeMap]);

  const center = points[0] ?? [-26.23, -51.08];

  return (
    <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5">
        <h2 className="kanzler-display text-[14.5px] font-semibold">Mapa da rota</h2>
        <span className="truncate text-[10.5px] text-[var(--kanzler-muted-2)]">saída: {routeMap?.partida.nome ?? "-"}</span>
      </div>

      <div className="h-[310px] bg-[#eef2f5] xl:h-[330px]">
        {loading ? (
          <div className="h-full animate-pulse bg-[var(--kanzler-canvas)]" />
        ) : !routeMap || points.length === 0 ? (
          <div className="grid h-full place-items-center px-5 text-center text-[12px] text-[var(--kanzler-muted)]">
            Crie a rota e adicione visitas com localização para visualizar o trajeto.
          </div>
        ) : (
          <MapContainer center={center} zoom={10} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitRoute points={polyline.length > 1 ? polyline : points} />

            {polyline.length > 1 && (
              <Polyline positions={polyline} pathOptions={{ weight: 4, opacity: 0.72 }} />
            )}

            {(() => {
              const lat = number(routeMap.partida.lat);
              const lng = number(routeMap.partida.lng);
              if (lat === null || lng === null) return null;
              return (
                <CircleMarker center={[lat, lng]} radius={8} pathOptions={{ weight: 3, fillOpacity: 1 }}>
                  <Popup><strong>Saída</strong><br />{routeMap.partida.nome}</Popup>
                </CircleMarker>
              );
            })()}

            {routeMap.paradas.map((stop) => {
              const lat = number(stop.contato.lat);
              const lng = number(stop.contato.lng);
              if (lat === null || lng === null) return null;
              return (
                <CircleMarker key={`${stop.contato.id}-${stop.ordem}`} center={[lat, lng]} radius={7} pathOptions={{ weight: 2, fillOpacity: 0.95 }}>
                  <Popup>
                    <strong>{stop.ordem}. {stop.contato.nome}</strong>
                    <br />{stop.hora?.slice(0, 5) || "Sem horário"}
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </section>
  );
}
