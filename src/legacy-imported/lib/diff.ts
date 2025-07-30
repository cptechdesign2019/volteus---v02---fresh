// src/lib/diff.ts

import type { QuoteOption, QuoteArea, QuoteItem, LaborCategory } from './types';

/**
 * Generates a human-readable summary of changes between two versions of a quote's options.
 * @param originalOptions - The snapshot of options before changes.
 * @param currentOptions - The current, edited options.
 * @param revisionNumber - The current revision number.
 * @returns A formatted string summarizing the changes.
 */
export function generateDiffSummary(originalOptions: QuoteOption[], currentOptions: QuoteOption[], revisionNumber?: number): string {
  const changes: string[] = [];
  const originalMap = new Map(originalOptions.map(opt => [opt.id, opt]));
  const currentMap = new Map(currentOptions.map(opt => [opt.id, opt]));

  // Check for added/removed options
  for (const currentOpt of currentOptions) {
    if (!originalMap.has(currentOpt.id)) {
      changes.push(`- Added new option: "${currentOpt.name}"`);
    }
  }
  for (const originalOpt of originalOptions) {
    if (!currentMap.has(originalOpt.id)) {
      changes.push(`- Removed option: "${originalOpt.name}"`);
    }
  }

  // Compare common options
  for (const currentOpt of currentOptions) {
    const originalOpt = originalMap.get(currentOpt.id);
    if (!originalOpt) continue;

    const optionChanges: string[] = [];

    // Compare areas
    const originalAreas = new Map(originalOpt.areas.map(a => [a.id, a]));
    const currentAreas = new Map(currentOpt.areas.map(a => [a.id, a]));

    for (const currentArea of currentOpt.areas) {
      if (!originalAreas.has(currentArea.id)) {
        optionChanges.push(`- Added area: "${currentArea.name}"`);
      }
    }
    for (const originalArea of originalOpt.areas) {
      if (!currentAreas.has(originalArea.id)) {
        optionChanges.push(`- Removed area: "${originalArea.name}"`);
      }
    }

    // Compare items within common areas
    for (const currentArea of currentOpt.areas) {
        const originalArea = originalAreas.get(currentArea.id);
        if (!originalArea) continue;

        const originalItems = new Map(originalArea.items.map(i => [i.id, i]));
        const currentItems = new Map(currentArea.items.map(i => [i.id, i]));

        for (const currentItem of currentArea.items) {
            const originalItem = originalItems.get(currentItem.id);
            if (!originalItem) {
                optionChanges.push(`- In "${currentArea.name}": Added ${currentItem.quantity}x ${currentItem.name}`);
            } else if (originalItem.quantity !== currentItem.quantity) {
                optionChanges.push(`- In "${currentArea.name}": Changed quantity of ${currentItem.name} from ${originalItem.quantity} to ${currentItem.quantity}`);
            }
        }
        for (const originalItem of originalArea.items) {
            if (!currentItems.has(originalItem.id)) {
                optionChanges.push(`- In "${currentArea.name}": Removed ${originalItem.name}`);
            }
        }
    }

    // Compare labor
    for (const currentLabor of currentOpt.laborCategories) {
        const originalLabor = originalOpt.laborCategories.find(l => l.id === currentLabor.id);
        if (originalLabor && originalLabor.estimatedTechDays !== currentLabor.estimatedTechDays) {
            optionChanges.push(`- Changed labor for "${currentLabor.name}" from ${originalLabor.estimatedTechDays} to ${currentLabor.estimatedTechDays} days`);
        }
    }
    
    // Compare Scope of Work
    if (originalOpt.scopeOfWork !== currentOpt.scopeOfWork) {
      optionChanges.push('- Updated the Scope of Work.');
    }

    if (optionChanges.length > 0) {
      // This line is removed to flatten the change list as requested.
      // changes.push(`Changes in option "${currentOpt.name}":`);
      changes.push(...optionChanges);
    }
  }

  if (changes.length === 0) {
    return '';
  }

  const revisionHeader = revisionNumber ? `Summary for Revision ${revisionNumber}:` : 'Summary of changes:';
  return `${revisionHeader}\n\n${changes.join('\n')}`;
}
