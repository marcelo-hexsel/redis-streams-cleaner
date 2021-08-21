export const immediateBeforeId = (id: string) => {
  const [firstPart, secondPart] = id.split("-");

  if (secondPart !== "0") {
    const immediateBeforeSecondPart = parseInt(secondPart) - 1;
    return `${firstPart}-${immediateBeforeSecondPart}`;
  }

  const immediateBeforeFirstPart = parseInt(firstPart) - 1;
  return `${immediateBeforeFirstPart}-999`;
};
