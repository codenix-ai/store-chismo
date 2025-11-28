// Utility helpers to safely resolve image URLs from various shapes
export const isHttpUrl = (value: any): boolean => {
  return typeof value === "string" && value.startsWith("http");
};

export const resolveImageUrl = (img: any): string => {
  const defaultPlaceholder = "/file.svg";
  if (!img) return defaultPlaceholder;

  if (typeof img === "string") {
    return isHttpUrl(img)
      ? img
      : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${img}`;
  }

  if (typeof img === "object") {
    // Common possible fields
    const candidate =
      img.url || img.src || img.image || img.path || img.file || img.key;
    if (typeof candidate === "string") {
      return isHttpUrl(candidate)
        ? candidate
        : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${candidate}`;
    }
  }

  return defaultPlaceholder;
};

export default resolveImageUrl;
