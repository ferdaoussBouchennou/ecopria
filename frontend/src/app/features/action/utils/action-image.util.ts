import { ActionSummary } from '../models/action.model';
import { getCategoryImageUrl } from './category-image.util';

export function getActionCardImage(
  action: Pick<ActionSummary, 'photoUrls' | 'categoryName' | 'categoryImageUrl'>
): string {
  const photo = action.photoUrls?.[0]?.trim();
  if (photo) {
    return photo;
  }
  return getCategoryImageUrl(action.categoryName, action.categoryImageUrl);
}
