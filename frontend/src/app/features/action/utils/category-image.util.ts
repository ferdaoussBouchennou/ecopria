/** Image catégorie : URL définie par l’admin (API), sinon placeholder neutre. */
export const CATEGORY_IMAGE_PLACEHOLDER = '/assets/logo.png';

export function getCategoryImageUrl(
  _name: string,
  imageUrl?: string | null
): string {
  const url = imageUrl?.trim();
  return url || CATEGORY_IMAGE_PLACEHOLDER;
}
