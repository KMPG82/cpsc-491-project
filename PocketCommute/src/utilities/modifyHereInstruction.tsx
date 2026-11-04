import { convertToMiles } from "./conversions";

//takes out the "Go for [meters]" part of HERE route instruction
export const modifyHereInstruction = (instruction: string | undefined) => {
  if (!instruction) {
    return instruction;
  } else {
    return instruction.replace(
      /Go for ([\d.]+) m/,
      (matchedSegment, distanceInMeters) =>
        `Go for ${convertToMiles(Number(distanceInMeters))} mi`,
    );
  }
};
