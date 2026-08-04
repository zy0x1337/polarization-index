import NewsApp from "@/components/NewsApp";

export const revalidate = 1800;

export default function Home() {
  return <NewsApp />;
}
