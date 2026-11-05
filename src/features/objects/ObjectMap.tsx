import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress, type MapPoint } from "./geocode";

const pin = L.divIcon({
  className: "object-pin",
  html: "<span></span>",
  iconSize: [18, 18],
  iconAnchor: [9, 18],
});

export default function ObjectMap({ address }: { address: string }) {
  const [point, setPoint] = useState<MapPoint | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing" | "error"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPoint(null);
    geocodeAddress(address)
      .then((next) => {
        if (cancelled) return;
        setPoint(next);
        setStatus(next ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="object-map" aria-label="Карта объекта">
      {status === "ready" && point ? (
        <>
          <MapContainer
            center={[point.lat, point.lng]}
            zoom={16}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[point.lat, point.lng]} icon={pin} />
          </MapContainer>
          <a
            className="object-map__open"
            href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=17/${point.lat}/${point.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Открыть карту
          </a>
        </>
      ) : (
        <div className="object-map__status">
          {status === "loading" ? (
            <>
              <Loader2 className="spin" size={18} />
              Ищем адрес на карте…
            </>
          ) : status === "error" ? (
            "Карта сейчас недоступна"
          ) : (
            "Адрес не найден на карте"
          )}
        </div>
      )}
    </div>
  );
}
