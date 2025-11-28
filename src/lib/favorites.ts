export interface FavoriteItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  category: string;
  addedAt: string;
}

class FavoritesService {
  private storageKey = "emprendyup_favorites";

  getFavorites(): FavoriteItem[] {
    if (typeof window === "undefined") return [];

    try {
      const favorites = localStorage.getItem(this.storageKey);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error("Error loading favorites:", error);
      return [];
    }
  }

  addFavorite(item: Omit<FavoriteItem, "addedAt">): void {
    try {
      const favorites = this.getFavorites();
      const existingIndex = favorites.findIndex(
        (fav) => fav.productId === item.productId
      );

      if (existingIndex === -1) {
        const newFavorite: FavoriteItem = {
          ...item,
          addedAt: new Date().toISOString(),
        };
        favorites.push(newFavorite);
        localStorage.setItem(this.storageKey, JSON.stringify(favorites));

        // Trigger storage event to update favorites count
        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  }

  removeFavorite(productId: string): void {
    try {
      const favorites = this.getFavorites();
      const updatedFavorites = favorites.filter(
        (fav) => fav.productId !== productId
      );
      localStorage.setItem(this.storageKey, JSON.stringify(updatedFavorites));

      // Trigger storage event to update favorites count
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  }

  isFavorite(productId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some((fav) => fav.productId === productId);
  }

  toggleFavorite(item: Omit<FavoriteItem, "addedAt">): boolean {
    const isFav = this.isFavorite(item.productId);

    if (isFav) {
      this.removeFavorite(item.productId);
      return false;
    } else {
      this.addFavorite(item);
      return true;
    }
  }

  clearFavorites(): void {
    try {
      localStorage.removeItem(this.storageKey);
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error clearing favorites:", error);
    }
  }

  getFavoritesCount(): number {
    return this.getFavorites().length;
  }
}

export const favoritesService = new FavoritesService();
