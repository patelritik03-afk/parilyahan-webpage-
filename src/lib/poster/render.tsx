import "server-only";
import { ImageResponse } from "next/og";
import type { MenuItem } from "@/lib/types";
import { itemsToGroups } from "@/lib/menuSections";
import { loadPosterAssets } from "./assets";
import { POSTER_H, POSTER_W } from "./constants";
import { posterDateLabel } from "./dates";
import { layoutMenu, type PosterGroup } from "./layout";
import PosterTemplate, { type Fit } from "./PosterTemplate";

// Draws the poster for one day's menu and returns the PNG bytes.
// The left side is fixed artwork; only the date, weekday and menu on the right change.
export async function renderPosterPng(date: string, items: MenuItem[]): Promise<ArrayBuffer> {
  const assets = await loadPosterAssets();

  const groups: PosterGroup[] = itemsToGroups(items)
    .map((group) => ({
      category: group.category,
      dishes: group.dishes.map((dish) => dish.name.trim()).filter(Boolean),
    }))
    .filter((group) => group.category && group.dishes.length > 0);

  const layout = layoutMenu(groups, (text, size, font) => assets.measureFont(text, size, font));
  if (!layout.fits) console.warn(`Poster for ${date}: menu is very long, text was shrunk to the minimum size`);

  const fit: Fit = (text, maxWidth, maxSize, font) => {
    const width = assets.measureFont(text, maxSize, font);
    return width <= maxWidth ? maxSize : Math.floor((maxSize * maxWidth) / width);
  };

  const image = new ImageResponse(
    (
      <PosterTemplate
        date={posterDateLabel(date)}
        layout={layout}
        logo={assets.logo}
        collage={assets.collage}
        fit={fit}
      />
    ),
    { width: POSTER_W, height: POSTER_H, fonts: assets.fonts }
  );

  // Reading the body here makes any drawing error surface now, so the route can answer with a clean 500.
  return image.arrayBuffer();
}
