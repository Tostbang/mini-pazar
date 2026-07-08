import type { Metadata } from "next";
import { FavoritesList } from "./_components/favorites-list";

export const metadata: Metadata = {
  title: "Favorilerim",
};

export default function FavoritesPage() {
  return <FavoritesList />;
}