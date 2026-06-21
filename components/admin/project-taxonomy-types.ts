export type ProjectTaxonomyType =
  | "SECTOR"
  | "LOCATION"
  | "DELIVERED_SERVICE";

export type ProjectTaxonomyOption = {
  id: string;
  type: ProjectTaxonomyType;
  label: string;
  labelEn: string;
  active: boolean;
};

export type ProjectTaxonomyRow = ProjectTaxonomyOption & {
  usageCount: number;
};
