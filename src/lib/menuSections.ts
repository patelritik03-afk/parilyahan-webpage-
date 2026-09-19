import type { MenuItem } from "./types";

export const MENU_SECTIONS = [
  "Starter",
  "Soup",
  "Salad",
  "Noodles",
  "Main Course",
  "International Main Course",
  "Rice",
  "Best Dishes",
  "Special Dish",
  "Dessert",
  "Ice Cream",
  "Drinks",
] as const;

export type MenuGroup = {
  category: string;
  dishes: { name: string; description: string }[];
};

export function itemsToGroups(items: MenuItem[]): MenuGroup[] {
  const groups: MenuGroup[] = [];
  for (const item of items) {
    let group = groups.find((g) => g.category === item.category);
    if (!group) {
      group = { category: item.category, dishes: [] };
      groups.push(group);
    }
    group.dishes.push({ name: item.name, description: item.description ?? "" });
  }
  return groups;
}

export function groupsToItems(groups: MenuGroup[]): MenuItem[] {
  return groups.flatMap((group) =>
    group.dishes
      .filter((dish) => dish.name.trim())
      .map((dish) => ({
        category: group.category.trim(),
        name: dish.name.trim(),
        description: dish.description.trim(),
      }))
  );
}
