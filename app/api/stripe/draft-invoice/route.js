import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const RENTAL_TYPE_LABELS = {
  wingboost: 'Abonnement Wingboost',
  ponctuel: 'Location Ponctuelle',
  journee: 'Location 1 Journée',
  demi_matin: 'Location ½ Journée (Matin)',
  demi_aprem: 'Location ½ Journée (Après-midi)',
};

const getPricePerDay = (reference) => {
  if (reference.includes('PACK')) return 40;
  if (reference.includes('WING') || reference.includes('FOIL') || reference.includes('KITE')) return 25;
  if (reference.includes('BOARD') || reference.includes('TWINTIP')) return 20;
  if (reference.includes('NEOPRENE') || reference.includes('COMBINAISON')) return 10;
  return 10;
};

const PRICING_GRIDS = {
  'LOK-BOARDBAG-OPT': { 0.5: 12.5, 1: 18.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-PACK-KITE': { 0.5: 92.5, 1: 98.75, 2: 167.33, 3: 229.84, 4: 254.87, 5: 267.39, 6: 279.9, 7: 306.17, 8: 306.17, 9: 318.6, 10: 336.11, 11: 348.62, 12: 348.63, 13: 348.64, 14: 354.89, 15: 354.9, 16: 354.9, 17: 354.9, 18: 354.9, 19: 354.9, 20: 354.9, 21: 361.14, 22: 361.14, 23: 361.14, 24: 361.14, 25: 361.14, 26: 361.14, 27: 361.14, 28: 361.14, 29: 361.14, 30: 361.14, 31: 361.14 },
  'LOK-PACK-2AILES-BARRE': { 0.5: 92.5, 1: 98.75, 2: 167.33, 3: 229.84, 4: 254.87, 5: 267.39, 6: 279.9, 7: 306.17, 8: 306.17, 9: 318.6, 10: 336.11, 11: 348.62, 12: 348.63, 13: 348.64, 14: 354.89, 15: 354.9, 16: 354.9, 17: 354.9, 18: 354.9, 19: 354.9, 20: 354.9, 21: 361.14, 22: 361.14, 23: 361.14, 24: 361.14, 25: 361.14, 26: 361.14, 27: 361.14, 28: 361.14, 29: 361.14, 30: 361.14, 31: 361.14 },
  'LOK-TWINTIP-OPT-CS': { 0.5: 0, 1: 25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-TWINTIP-OPT': { 0.5: 18.75, 1: 25, 2: 43.7, 3: 56.21, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 62.47, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 74.98, 15: 74.98, 16: 74.98, 17: 74.98, 18: 74.98, 19: 74.98, 20: 74.98, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-BOARD-TWINTIP': { 0.5: 35, 1: 37.5, 2: 43.7, 3: 49.97, 4: 56.22, 5: 62.47, 6: 68.73, 7: 81.23, 8: 81.23, 9: 87.46, 10: 93.71, 11: 99.96, 12: 106.21, 13: 112.46, 14: 149.96, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 162.45, 22: 162.45, 23: 162.45, 24: 162.45, 25: 162.45, 26: 162.45, 27: 162.45, 28: 162.45, 29: 162.45, 30: 162.45, 31: 162.45 },
  'LOK-BOARD-FOIL-WING': { 0.5: 67.5, 1: 73.75, 2: 123.62, 3: 173.63, 4: 198.65, 5: 223.66, 6: 236.17, 7: 258.68, 8: 258.68, 9: 268.63, 10: 0, 11: 286.14, 12: 286.15, 13: 286.16, 14: 286.16, 15: 286.17, 16: 286.17, 17: 286.17, 18: 286.17, 19: 286.17, 20: 286.17, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-BOARD': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 184.95, 8: 184.95, 9: 189.91, 10: 0, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.69, 17: 223.69, 18: 223.69, 19: 223.69, 20: 223.69, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-FOIL': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 184.95, 8: 184.95, 9: 189.91, 10: 0, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.69, 17: 223.69, 18: 223.69, 19: 223.69, 20: 223.69, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-AILE': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 184.95, 8: 184.95, 9: 189.91, 10: 0, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.69, 17: 223.69, 18: 223.69, 19: 223.69, 20: 223.69, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-2WING-AILE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-2AILE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 68.72, 10: 0, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-HARNAIS-CULOTTE': { 0.5: 18.75, 1: 23.75, 2: 31.22, 3: 41.22, 4: 56.22, 5: 71.22, 6: 86.22, 7: 116.22, 8: 116.22, 9: 116.2, 10: 116.2, 11: 116.21, 12: 116.21, 13: 116.21, 14: 116.22, 15: 116.22, 16: 116.22, 17: 116.22, 18: 116.22, 19: 116.22, 20: 116.22, 21: 116.22, 22: 116.22, 23: 116.22, 24: 116.22, 25: 116.22, 26: 116.22, 27: 116.22, 28: 116.22, 29: 116.22, 30: 116.22, 31: 116.22 },
  'LOK-3AILE-SANSBARRE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-2AILE-SANSBARRE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-3AILE-SANSBARRE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 68.72, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 87.47, 22: 87.47, 23: 87.47, 24: 87.47, 25: 87.47, 26: 87.47, 27: 87.47, 28: 87.47, 29: 87.47, 30: 87.47, 31: 87.47 },
  'LOK-AILE-SANSBARRE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 68.72, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 87.47, 22: 87.47, 23: 87.47, 24: 87.47, 25: 87.47, 26: 87.47, 27: 87.47, 28: 87.47, 29: 87.47, 30: 87.47, 31: 87.47 },
  'LOK-COMBINAISON-OPT': { 0.5: 46.25, 1: 23.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-NEOPRENE-COMBINAISON': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.24, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-PACK-WING-GONFLABLE': { 0.5: 86.25, 1: 98.75, 2: 173.57, 3: 236.09, 4: 286.1, 5: 336.11, 6: 373.62, 7: 398.65, 8: 398.65, 9: 398.57, 10: 0, 11: 436.08, 12: 436.1, 13: 436.11, 14: 442.37, 15: 442.38, 16: 442.38, 17: 442.38, 18: 442.38, 19: 442.38, 20: 442.38, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-PACK-WING-RIGIDE': { 0.5: 86.25, 1: 98.75, 2: 173.57, 3: 236.09, 4: 286.1, 5: 336.11, 6: 373.62, 7: 398.65, 8: 398.65, 9: 398.57, 10: 0, 11: 436.08, 12: 436.1, 13: 436.11, 14: 442.37, 15: 442.38, 16: 442.38, 17: 442.38, 18: 442.38, 19: 442.38, 20: 442.38, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-PACK-WING-DEBUTANT': { 0.5: 43.75, 1: 48.75, 2: 86.16, 3: 123.66, 4: 161.17, 5: 198.67, 6: 236.17, 7: 286.18, 8: 286.18, 9: 311.11, 10: 0, 11: 348.62, 12: 361.12, 13: 373.63, 14: 386.14, 15: 386.14, 16: 386.14, 17: 386.14, 18: 386.14, 19: 386.14, 20: 386.14, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-CAGOULE-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 22.49, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 34.99, 29: 34.99, 30: 34.99, 31: 34.99 },
  'LOK-NEOPRENE-CAGOULE': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-CHAUSSONS-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 22.49, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 34.99, 29: 34.99, 30: 34.99, 31: 34.99 },
  'LOK-NEOPRENE-CHAUSSONS': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-GANTS-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 22.49, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 34.99, 29: 34.99, 30: 34.99, 31: 34.99 },
  'LOK-NEOPRENE-GANTS': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-HARNAIS-CEINTURE-OPT': { 0.5: 18.75, 1: 23.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-HARNAIS-CEINTURE': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 58.72, 5: 73.72, 6: 88.72, 7: 118.72, 8: 118.72, 9: 118.7, 10: 118.7, 11: 118.71, 12: 118.71, 13: 118.71, 14: 118.71, 15: 118.72, 16: 118.72, 17: 118.72, 18: 118.72, 19: 118.72, 20: 118.72, 21: 118.71, 22: 118.71, 23: 118.71, 24: 118.71, 25: 118.71, 26: 118.71, 27: 118.71, 28: 118.71, 29: 118.71, 30: 118.71, 31: 118.71 },
  'LOK-VESTENEOPRENE-OPT': { 0.5: 12.5, 1: 18.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-NEOPRENE-VESTE': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.24, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-BOARDBAG': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.24, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-CASQUE-OPT': { 0.5: 6.25, 1: 7.5, 2: 7.49, 3: 7.49, 4: 7.5, 5: 7.5, 6: 7.5, 7: 11.25, 8: 11.25, 9: 11.24, 10: 11.25, 11: 11.25, 12: 11.25, 13: 11.25, 14: 17.49, 15: 17.5, 16: 17.5, 17: 17.5, 18: 17.5, 19: 17.5, 20: 17.5, 21: 28.74, 22: 28.74, 23: 28.74, 24: 28.74, 25: 28.74, 26: 28.74, 27: 28.74, 28: 28.74, 29: 28.74, 30: 28.74, 31: 28.74 },
  'LOK-PROT-CASQUE': { 0.5: 11.25, 1: 18.75, 2: 22.48, 3: 24.98, 4: 27.49, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-GILET-OPT': { 0.5: 6.25, 1: 6.25, 2: 7.49, 3: 7.49, 4: 7.5, 5: 7.5, 6: 7.5, 7: 11.25, 8: 11.25, 9: 11.24, 10: 11.25, 11: 11.25, 12: 11.25, 13: 11.25, 14: 17.49, 15: 17.5, 16: 17.5, 17: 17.5, 18: 17.5, 19: 17.5, 20: 17.5, 21: 24.99, 22: 24.99, 23: 24.99, 24: 24.99, 25: 24.99, 26: 24.99, 27: 24.99, 28: 24.99, 29: 24.99, 30: 24.99, 31: 24.99 },
  'LOK-PROT-GILET': { 0.5: 11.25, 1: 18.75, 2: 22.48, 3: 24.98, 4: 27.49, 5: 31.24, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-HARNAIS-CULOTTE-OPT': { 0.5: 6.25, 1: 6.25, 2: 9.99, 3: 12.49, 4: 14.99, 5: 16.24, 6: 17.49, 7: 18.75, 8: 18.75, 9: 18.74, 10: 22.49, 11: 22.49, 12: 22.49, 13: 22.49, 14: 26.24, 15: 26.24, 16: 26.24, 17: 26.24, 18: 26.24, 19: 26.24, 20: 26.24, 21: 29.99, 22: 29.99, 23: 29.99, 24: 29.99, 25: 29.99, 26: 29.99, 27: 29.99, 28: 29.99, 29: 29.99, 30: 29.99, 31: 29.99 },
  'LOK-INITIATION-FOIL-TRACTE': { 0.5: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-BARRE': { 0.5: 36.25, 1: 36.25, 2: 37.46, 3: 43.72, 4: 49.97, 5: 56.23, 6: 62.48, 7: 74.98, 8: 74.98, 9: 81.21, 10: 87.46, 11: 112.46, 12: 112.46, 13: 112.46, 14: 112.47, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 149.96, 22: 149.96, 23: 149.96, 24: 149.96, 25: 149.96, 26: 149.96, 27: 149.96, 28: 149.96, 29: 149.96, 30: 149.96, 31: 149.96 },
  'LOK-KITEFOIL': { 0.5: 73.75, 1: 86.25, 2: 136.11, 3: 173.63, 4: 198.65, 5: 223.66, 6: 236.17, 7: 258.68, 8: 258.68, 9: 267.38, 10: 273.64, 11: 286.14, 12: 286.15, 13: 286.16, 14: 286.16, 15: 298.67, 16: 298.67, 17: 298.67, 18: 298.67, 19: 298.67, 20: 298.67, 21: 298.66, 22: 298.66, 23: 298.66, 24: 298.66, 25: 298.66, 26: 298.66, 27: 298.66, 28: 298.66, 29: 298.66, 30: 298.66, 31: 298.66 },
  'LOK-STRAPLESS': { 0.5: 48.75, 1: 48.75, 2: 73.67, 3: 86.19, 4: 98.7, 5: 111.2, 6: 123.71, 7: 153.71, 8: 153.71, 9: 158.68, 10: 161.18, 11: 186.18, 12: 186.19, 13: 186.19, 14: 186.19, 15: 211.19, 16: 211.19, 17: 211.19, 18: 211.19, 19: 211.19, 20: 211.19, 21: 211.19, 22: 211.19, 23: 211.19, 24: 211.19, 25: 211.19, 26: 211.19, 27: 211.19, 28: 211.19, 29: 211.19, 30: 211.19, 31: 211.19 },
  'LOK-PADDLE': { 0.5: 18.75, 1: 50, 2: 49.95, 3: 49.97, 4: 49.97, 5: 56.23, 6: 62.48, 7: 74.98, 8: 74.98, 9: 81.21, 10: 87.46, 11: 112.46, 12: 112.46, 13: 149.95, 14: 149.96, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 162.45, 22: 162.45, 23: 162.45, 24: 162.45, 25: 162.45, 26: 162.45, 27: 162.45, 28: 162.45, 29: 162.45, 30: 162.45, 31: 162.45 },
  'LOK-SURF': { 0.5: 31.25, 1: 37.5, 2: 43.7, 3: 56.21, 4: 68.71, 5: 81.22, 6: 93.72, 7: 109.97, 8: 109.97, 9: 113.7, 10: 117.45, 11: 121.2, 12: 121.21, 13: 121.21, 14: 121.21, 15: 146.21, 16: 146.21, 17: 146.21, 18: 146.21, 19: 146.21, 20: 146.21, 21: 146.21, 22: 146.21, 23: 146.21, 24: 146.21, 25: 146.21, 26: 146.21, 27: 146.21, 28: 146.21, 29: 146.21, 30: 146.21, 31: 146.21 },
  'LOK-AILE-BARRE': { 0.5: 70, 1: 73.75, 2: 123.62, 3: 173.63, 4: 198.65, 5: 211.16, 6: 223.67, 7: 243.69, 8: 243.69, 9: 256.13, 10: 261.14, 11: 273.65, 12: 273.65, 13: 273.66, 14: 279.92, 15: 279.92, 16: 279.92, 17: 279.92, 18: 279.92, 19: 279.92, 20: 279.92, 21: 279.92, 22: 279.92, 23: 279.92, 24: 279.92, 25: 279.92, 26: 279.92, 27: 279.92, 28: 279.92, 29: 279.92, 30: 279.92, 31: 279.92 },
};

function calcDurationDays(booking) {
  const type = booking.rental_type;
  if (type === 'demi_matin' || type === 'demi_aprem') return 0.5;
  if (!booking.start_date || !booking.end_date) return 1;
  const ms = new Date(booking.end_date) - new Date(booking.start_date);
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

function durationToVariantTitle(days) {
  if (days <= 0.5) return 'Demi-journée';
  if (days === 1) return '1 jour';
  return `${days} jours`;
}

async function fetchShopifyVariantBySku(sku, days) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
  const token = process.env.SHOPIFY_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const query = `
    {
      productVariants(first: 50, query: "sku:${sku}") {
        edges {
          node {
            id
            sku
            price
            title
            product {
              title
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(`https://${domain}/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query }),
    });
    
    if (!res.ok) return null;
    
    const { data } = await res.json();
    const variants = data?.productVariants?.edges?.map(e => e.node) || [];
    
    if (variants.length === 0) return null;

    const targetTitle = durationToVariantTitle(days).toLowerCase();
    let variant = variants.find(v => v.title.toLowerCase() === targetTitle || v.title.toLowerCase().replace('-', '') === targetTitle.replace('-', ''));
    
    if (!variant && days > 1) {
      const dayVariants = variants
        .map(v => {
          const m = v.title.toLowerCase().match(/^(\d+)\s+jours?$/);
          return m ? { ...v, days: parseInt(m[1]) } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.days - b.days);
      variant = dayVariants.find(v => v.days >= days) || dayVariants[dayVariants.length - 1];
    }
    
    if (!variant) {
      // If no exact match, fallback to the first variant if it exists
      if (variants.length > 0) variant = variants[0];
      else return null;
    }
    
    return {
      price: variant.price,
      title: `${variant.product?.title || 'Location'} — ${variant.title}`,
    };
  } catch (error) {
    console.error('Erreur fetchShopifyVariantBySku:', error);
    return null;
  }
}

export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId manquant' }, { status: 400 });

    const stripeKey = process.env.STRIPE_INVOICE_KEY || process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
    }
    const stripe = new Stripe(stripeKey);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', bookingId)
      .single();
    if (bookingError || !booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });

    const customer = booking.customers || {};
    if (!customer.email) {
      return NextResponse.json({ error: "Impossible de créer une facture Stripe : Le client n'a pas d'adresse email enregistrée." }, { status: 400 });
    }

    const { data: bookingItems } = await supabaseAdmin
      .from('booking_items')
      .select('*, equipment(*)')
      .eq('booking_id', bookingId);

    const typeLabel = RENTAL_TYPE_LABELS[booking.rental_type] || 'Location';
    const days = calcDurationDays(booking);

    let durationStr = '';
    if (booking.start_date && booking.end_date) {
      const s = new Date(booking.start_date).toLocaleDateString('fr-FR');
      const e = new Date(booking.end_date).toLocaleDateString('fr-FR');
      if (booking.rental_type === 'demi_matin' || booking.rental_type === 'demi_aprem') {
        durationStr = `le ${s}`;
      } else if (s === e) {
        durationStr = `le ${s}`;
      } else {
        durationStr = `du ${s} au ${e}`;
      }
    }

    // 1. Find or create Stripe customer
    let stripeCustomer;
    const existingStripeCustomers = await stripe.customers.list({ email: customer.email, limit: 1 });
    if (existingStripeCustomers.data.length > 0) {
      stripeCustomer = existingStripeCustomers.data[0];
    } else {
      stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        phone: customer.phone || undefined,
      });
    }

    const isHalfDay = booking.rental_type === 'demi_matin' || booking.rental_type === 'demi_aprem';

    let lineItems = [];
    if (bookingItems && bookingItems.length > 0) {
      for (const bi of bookingItems) {
        const lokSku = (bi.equipment?.reference?.startsWith('LOK') ? bi.equipment.reference : null)
          || bi.equipment?.collection;
        
        if (lokSku && lokSku.startsWith('LOK')) {
          const shopifyVariant = await fetchShopifyVariantBySku(lokSku, days);
          if (shopifyVariant && shopifyVariant.price) {
            lineItems.push({
              title: `Location: ${shopifyVariant.title}`,
              price: parseFloat(shopifyVariant.price),
            });
          } else {
            // Fallback to PRICING_GRIDS if Shopify fetch fails
            let itemPrice = 0;
            let gridDays = days;
            if (gridDays > 31) gridDays = 31;
            
            if (PRICING_GRIDS[lokSku]) {
              const grid = PRICING_GRIDS[lokSku];
              itemPrice = isHalfDay ? grid[0.5] : (grid[Math.floor(gridDays)] || grid[31]);
            } else {
              const pricePerDay = getPricePerDay(lokSku);
              itemPrice = isHalfDay ? Math.round(pricePerDay * 0.6) : pricePerDay * days;
            }
            
            lineItems.push({
              title: `Location: ${bi.equipment?.name || lokSku}`,
              price: itemPrice,
            });
          }
        }
      }
    }
    
    // If no specific priced items were found (e.g. no LOK- SKUs), fallback to the booking's total amount
    if (lineItems.length === 0) {
      lineItems = [{
        title: `${typeLabel} ${durationStr}`,
        price: booking.total_amount || 0,
      }];
    }

    // 2. Create Stripe Invoice Items
    let hasPrice = false;
    for (const item of lineItems) {
      if (item.price > 0) {
        hasPrice = true;
        await stripe.invoiceItems.create({
          customer: stripeCustomer.id,
          amount: Math.round(item.price * 100),
          currency: 'eur',
          description: item.title,
        });
      }
    }
    
    // If NO items have a price > 0, create a 0€ item
    if (!hasPrice) {
       // On crée une ligne à 0€ par défaut. Le gérant pourra modifier le montant
       // directement dans le tableau de bord Stripe avant de l'envoyer.
       await stripe.invoiceItems.create({
          customer: stripeCustomer.id,
          amount: 0,
          currency: 'eur',
          description: `${typeLabel} ${durationStr}`,
        });
    }

    const note = [
      `Réf: ${booking.reference || bookingId}`,
      `Type: ${typeLabel}`,
      durationStr ? `Période: ${durationStr}` : '',
    ].filter(Boolean).join(' | ');

    // 3. Create Stripe Invoice (Draft)
    const invoice = await stripe.invoices.create({
      customer: stripeCustomer.id,
      collection_method: 'send_invoice',
      days_until_due: 0,
      description: note,
      metadata: {
        booking_id: bookingId,
      }
    });

    // We do NOT finalize it so the user can review it and click "Send" on Stripe
    // We open the Stripe dashboard directly on this draft invoice.
    
    // Check if we are using a test key to adapt the URL
    const isTest = stripeKey.startsWith('sk_test_');
    const dashboardUrl = `https://dashboard.stripe.com/${isTest ? 'test/' : ''}invoices/${invoice.id}`;

    return NextResponse.json({
      id: invoice.id,
      url: dashboardUrl,
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur Stripe Draft Invoice:', error);
    return NextResponse.json({ error: 'Erreur Stripe: ' + error.message }, { status: 500 });
  }
}
