export type MasonryLayoutItem = {
  id: string;
  portfolioSize: "NORMAL" | "HERO";
};

export type DesktopMasonryPlacement = {
  columnStart: number;
  rowStart: number;
  columnSpan: 1 | 2;
  rowSpan: 1 | 2;
};

const placeNormalRows = (
  items: MasonryLayoutItem[],
  rowStart: number,
  placements: Map<string, DesktopMasonryPlacement>,
) => {
  items.forEach((item, index) => {
    placements.set(item.id, {
      columnStart: (index % 4) + 1,
      rowStart: rowStart + Math.floor(index / 4),
      columnSpan: 1,
      rowSpan: 1,
    });
  });
  return rowStart + Math.ceil(items.length / 4);
};

export const getDesktopMasonryPlacements = (
  items: MasonryLayoutItem[],
) => {
  const placements = new Map<string, DesktopMasonryPlacement>();
  let index = 0;
  let row = 1;
  let heroIndex = 0;

  while (index < items.length) {
    const current = items[index];

    if (current.portfolioSize === "NORMAL") {
      const normals: MasonryLayoutItem[] = [];
      while (
        index < items.length &&
        items[index].portfolioSize === "NORMAL"
      ) {
        normals.push(items[index]);
        index += 1;
      }
      row = placeNormalRows(normals, row, placements);
      continue;
    }

    const heroOnLeft = heroIndex % 2 === 0;
    placements.set(current.id, {
      columnStart: heroOnLeft ? 1 : 3,
      rowStart: row,
      columnSpan: 2,
      rowSpan: 2,
    });
    index += 1;

    const followingNormals: MasonryLayoutItem[] = [];
    while (
      index < items.length &&
      items[index].portfolioSize === "NORMAL"
    ) {
      followingNormals.push(items[index]);
      index += 1;
    }

    const oppositeColumn = heroOnLeft ? 3 : 1;
    followingNormals.slice(0, 4).forEach((item, normalIndex) => {
      placements.set(item.id, {
        columnStart: oppositeColumn + (normalIndex % 2),
        rowStart: row + Math.floor(normalIndex / 2),
        columnSpan: 1,
        rowSpan: 1,
      });
    });

    row += 2;
    row = placeNormalRows(followingNormals.slice(4), row, placements);
    heroIndex += 1;
  }

  return placements;
};
