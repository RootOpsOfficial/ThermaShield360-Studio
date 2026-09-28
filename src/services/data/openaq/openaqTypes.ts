export interface OpenAqMeasurement {
  parameter: string;
  value: number;
  unit: string;
  lastUpdated: string;
}

export interface OpenAqRawData {
  locationId: string | number;
  locationName: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  measurements: OpenAqMeasurement[];
  pm25?: number; // ug/m3
  pm10?: number; // ug/m3
  o3?: number;   // ppm or ug/m3
  aqiEstimated?: number;
}
