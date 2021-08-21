export const immediateBeforeId = (id: string): string => {
  const [firstPart, secondPart] = id.split("-");

  if (secondPart !== "0") {
    const immediateBeforeSecondPart = parseInt(secondPart) - 1;
    return `${firstPart}-${immediateBeforeSecondPart}`;
  }

  const immediateBeforeFirstPart = parseInt(firstPart) - 1;
  return `${immediateBeforeFirstPart}-999`;
};

export const calculateIdWithTimeToKeep = (id: string, timeBefore: number): string => {
  if (!timeBefore || timeBefore === 0) return id;

  const [firstPart] = id.split("-");

  const fistPartInTime = parseInt(firstPart);
  return `${fistPartInTime - timeBefore}-0`;
};
