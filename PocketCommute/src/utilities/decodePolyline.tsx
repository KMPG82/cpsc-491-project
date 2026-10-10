import polyline from "@mapbox/polyline";

type Coordinate = {
  latitude: number;
  longitude: number;
};

//decodes  encoded polyline into map coordinates
export const decodePolyline = (encodedPolyline: string): Coordinate[] => {
  return polyline.decode(encodedPolyline).map(([latitude, longitude]) => ({
    latitude,
    longitude,
  }));
};
