//convert a distance in meters to miles
export const convertToMiles = (distanceInMeters: number): number => {
  //1 mile = 1609.344 meters
  let distanceInMiles = Number((distanceInMeters / 1609.344).toFixed(2));
  return distanceInMiles;
};

//convert a time in seconds to minutes
export const convertToMinutes = (timeInSeconds: number): number => {
  //1 minute = 60 seconds
  let timeInMinutes = Math.round(timeInSeconds / 60);
  return timeInMinutes;
};

//convert fuel consumption to gallons, google gives microliters and here gives liters
export const convertToGallons = (
  fuel: number,
  unit: "microliters" | "liters",
): number => {
  let fuelInLiters = fuel;
  if (unit === "microliters") {
    //1 liter = 1,000,000 microliters
    fuelInLiters = fuel / 1000000;
  }

  //1 gallon = 3.785411784 liters
  let fuelInGallons = Number((fuelInLiters / 3.785411784).toFixed(2));
  return fuelInGallons;
};
