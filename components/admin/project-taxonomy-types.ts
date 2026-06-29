export type ProjectTaxonomyType =
  | "SECTOR"
  | "LOCATION"
  | "DELIVERED_SERVICE";

export type ProjectTaxonomyOption = {
  id: string;
  type: ProjectTaxonomyType;
  label: string;
  slug: string | null;
  icon: string | null;
  introEyebrow: string | null;
  introTitle: string | null;
  intro: string | null;
  active: boolean;
  translations?: {
    locale: string;
    label: string | null;
    slug: string | null;
    introEyebrow: string | null;
    introTitle: string | null;
    intro: string | null;
  }[];
};

export type ProjectTaxonomyRow = ProjectTaxonomyOption & {
  usageCount: number;
};

export const projectTaxonomyIconOptions = [
  { value: "palette", label: "Palette" },
  { value: "museum", label: "Musee" },
  { value: "restaurant", label: "Restaurant" },
  { value: "localBar", label: "Bar" },
  { value: "architecture", label: "Architecture" },
  { value: "storefront", label: "Boutique" },
  { value: "autoAwesome", label: "Creation" },
  { value: "category", label: "Categorie" },
] as const;

export type ProjectTaxonomyIcon = (typeof projectTaxonomyIconOptions)[number]["value"];
