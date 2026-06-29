export type StudioValueData = {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  order: number;
  active: boolean;
  translations: {
    locale: string;
    title: string | null;
    description: string | null;
  }[];
};
