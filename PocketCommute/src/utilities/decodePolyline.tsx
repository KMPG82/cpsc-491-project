import polyline from "@mapbox/polyline";
import { decode } from "@here/flexpolyline";

type Coordinate = {
  latitude: number;
  longitude: number;
};

//decodes Google's encoded polyline into map coordinates
export const decodeGooglePolyline = (encodedPolyline: string): Coordinate[] => {
  return polyline.decode(encodedPolyline).map(([latitude, longitude]) => ({
    latitude,
    longitude,
  }));
};

//decodes HERE's encoded polyline into map coordinates
export const decodeHerePolyline = (encodedPolyline: string): Coordinate[] => {
  const decoded = decode(encodedPolyline);

  return decoded.polyline.map(([latitude, longitude]) => ({
    latitude,
    longitude,
  }));
};
