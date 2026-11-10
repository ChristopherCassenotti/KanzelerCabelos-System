import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { MapContact, MapStatus } from "../../types/map";
import type { RouteMapDto } from "../../types/schedule";
import { buildWhatsAppUrl } from "../../utils/contact";
import { decodePolyline } from "../../utils/polyline";

interface GlobalMapCanvasProps {
  contacts: MapContact[];
  route?: RouteMapDto | null;
  focusCityId?: string | null;
  onOpenContact: (contactId: string) => void;
  onAddToRoute: (contact: MapContact) => void;
  canAddToRoute: boolean;
  busyContactId?: string | null;
  loading?: boolean;
}

const statusColors: Record<MapStatus, string> = {
  lead: "#8b9aae",
  avaliacao_agendada: "#2e6bff",
  comprado: "#137a54",
  recompra: "#c87309",
  perdido: "#c33b3b",
};

const statusLabels: Record<MapStatus, string> = {
  lead: "Lead",
  avaliacao_agendada: "Avaliação agendada",
  comprado: "Comprado",
  recompra: "Pronta p/ recompra",
  perdido: "Perdido",
};

function number(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function knownStatus(value: string): MapStatus {
  if (value === "lead" || value === "avaliacao_agendada" || value === "comprado" || value === "recompra" || value === "perdido") {
    return value;
  }
  return "lead";
}

function FitMap({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  const signature = points.map(([lat, lng]) => `${lat.toFixed(5)}:${lng.toFixed(5)}`).join("|");

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 11, { animate: false });
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [34, 34],
      maxZoom: 12,
      animate: false,
    });
  }, [map, signature]);

  return null;
}

function FocusCity({ cityId, contacts }: { cityId?: string | null; contacts: MapContact[] }) {
  const map = useMap();

  useEffect(() => {
    if (!cityId) return;

    const points = contacts
      .filter((contact) => contact.cidade.id === cityId)
      .map((contact) => {
        const lat = number(contact.lat);
        const lng = number(contact.lng);
        return lat !== null && lng !== null ? ([lat, lng] as [number, number]) : null;
      })
      .filter((point): point is [number, number] => point !== null);

    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo(points[0], 12, { duration: 0.55 });
      return;
    }

    map.flyToBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 12,
      duration: 0.55,
    });
  }, [cityId, contacts, map]);

  return null;
}

export function GlobalMapCanvas({
  contacts,
  route,
  focusCityId,
  onOpenContact,
  onAddToRoute,
  canAddToRoute,
  busyContactId,
  loading = false,
}: GlobalMapCanvasProps) {
  const routePolyline = useMemo(() => {
    if (!route?.rotaPolyline) return [];
    try {
      return decodePolyline(route.rotaPolyline, 6);
    } catch {
      return [];
    }
  }, [route?.rotaPolyline]);

  const contactPoints = useMemo(
    () => contacts
      .map((contact) => {
        const lat = number(contact.lat);
        const lng = number(contact.lng);
        return lat !== null && lng !== null ? ([lat, lng] as [number, number]) : null;
      })
      .filter((point): point is [number, number] => point !== null),
    [contacts],
  );

  const routePoints = useMemo(() => {
    const points: Array<[number, number]> = [];
    const startLat = number(route?.partida.lat);
    const startLng = number(route?.partida.lng);
    if (startLat !== null && startLng !== null) points.push([startLat, startLng]);

    for (const stop of route?.paradas ?? []) {
      const lat = number(stop.contato.lat);
      const lng = number(stop.contato.lng);
      if (lat !== null && lng !== null) points.push([lat, lng]);
    }

    return points;
  }, [route]);

  const fitPoints = routePolyline.length > 1
    ? [...contactPoints, ...routePolyline]
    : [...contactPoints, ...routePoints];

  const center = fitPoints[0] ?? [-26.6, -51.2];

  if (loading) {
    return <div className="h-full w-full animate-pulse bg-[#eef2f5]" />;
  }

  return (
    <MapContainer
      center={center}
      zoom={7}
      className="h-full w-full"
      scrollWheelZoom
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitMap points={fitPoints} />
      <FocusCity cityId={focusCityId} contacts={contacts} />

      {routePolyline.length > 1 && (
        <Polyline
          positions={routePolyline}
          pathOptions={{ color: "#0e1a2b", weight: 4, opacity: 0.68, dashArray: "10 7" }}
        />
      )}

      {route && (() => {
        const lat = number(route.partida.lat);
        const lng = number(route.partida.lng);
        if (lat === null || lng === null) return null;
        return (
          <CircleMarker
            center={[lat, lng]}
            radius={9}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#0e1a2b", fillOpacity: 1 }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <strong>Ponto de saída</strong>
                <div>{route.partida.nome} - {route.partida.uf}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })()}

      {(route?.paradas ?? []).map((stop) => {
        const lat = number(stop.contato.lat);
        const lng = number(stop.contato.lng);
        if (lat === null || lng === null) return null;
        return (
          <CircleMarker
            key={`route-${stop.contato.id}-${stop.ordem}`}
            center={[lat, lng]}
            radius={10}
            pathOptions={{ color: "#0e1a2b", weight: 3, fillColor: "#ffffff", fillOpacity: 0.7 }}
          >
            <Popup>
              <strong>Parada {stop.ordem}</strong>
              <br />{stop.contato.nome}
              {stop.hora ? <><br />{stop.hora.slice(0, 5)}</> : null}
            </Popup>
          </CircleMarker>
        );
      })}

      {contacts.map((contact) => {
        const lat = number(contact.lat);
        const lng = number(contact.lng);
        if (lat === null || lng === null) return null;

        const status = knownStatus(contact.statusMapa || contact.status);
        const whatsapp = buildWhatsAppUrl(contact.telefone);

        return (
          <CircleMarker
            key={contact.id}
            center={[lat, lng]}
            radius={7}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: statusColors[status],
              fillOpacity: 1,
            }}
          >
            <Popup minWidth={230}>
              <div className="space-y-2 text-[12px]">
                <div>
                  <strong className="text-[13px]">{contact.nome}</strong>
                  <div className="text-slate-500">{contact.cidade.nome} - {contact.cidade.uf}</div>
                  {contact.endereco ? <div className="mt-0.5 text-slate-500">{contact.endereco}</div> : null}
                </div>

                <div className="inline-flex rounded-full px-2 py-1 text-[10px] font-semibold" style={{ color: statusColors[status], background: `${statusColors[status]}18` }}>
                  {statusLabels[status]}
                </div>

                {contact.recompra ? (
                  <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-[10.5px] text-amber-800">
                    Próxima recompra: {contact.recompra.proximaRecompra}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenContact(contact.id)}
                    className="rounded-lg bg-[#2e6bff] px-2.5 py-1.5 text-[10.5px] font-semibold text-white"
                  >
                    Abrir ficha
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddToRoute(contact)}
                    disabled={busyContactId === contact.id}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyContactId === contact.id
                      ? "Adicionando..."
                      : canAddToRoute
                        ? "Adicionar à rota"
                        : "Abrir agenda"}
                  </button>
                  {whatsapp ? (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-slate-700 no-underline"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

export { statusColors, statusLabels };
