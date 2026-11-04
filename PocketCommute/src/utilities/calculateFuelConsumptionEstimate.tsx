import { convertToMiles } from "./conversions";

//using 25.6 as the average mpg according to: https://afdc.energy.gov/data/10310
const MPG = 25.6;

//calculates estimated fuel consumption
export const calculateFuelConsumptionEstimate = (
  distanceMeters: number,
): number => {
  const distanceMiles = convertToMiles(distanceMeters);

  const estimatedFuelConsumption = Number((distanceMiles / MPG).toFixed(2));

  return estimatedFuelConsumption;
};
