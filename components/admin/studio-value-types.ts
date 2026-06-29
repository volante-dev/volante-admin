export type StudioValueData = {
  id: string;
  title: string;
  description: string;
  order: number;
  active: boolean;
  translations: {
    locale: string;
    title: string | null;
    description: string | null;
  }[];
};
