export interface WpCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent: number;
}

export interface WpPost {
  id: number;
  date: string;
  slug: string;
  link: string;
  categories: number[];
  title: { rendered: string };
}
