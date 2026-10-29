import type { SecurityType } from '@/shared/api/contracts'

export interface SecurityFixture {
  id: string
  code: string
  name: string
  type: SecurityType
  sector: string
  country: string
  currency: string
  exchange: string
  last: number
  previousClose: number
  volume: number
  /** Other ways users type the security in the command bar, e.g. "ECMR 6.25 2029". */
  aliases?: string[]
}

/** Sample figures from the spec mockups (section 9); they are not market data. */
// prettier-ignore
export const SECURITY_FIXTURES: SecurityFixture[] = [
  { id: 'SEMC', code: 'SEMC', name: 'Société des Eaux Minérales du Cameroun', type: 'equity', sector: 'Beverages', country: 'CM', currency: 'XAF', exchange: 'BVMAC', last: 52500, previousClose: 51900, volume: 96 },
  { id: 'SAFACAM', code: 'SAFACAM', name: 'Société Africaine Forestière et Agricole du Cameroun', type: 'equity', sector: 'Agribusiness', country: 'CM', currency: 'XAF', exchange: 'BVMAC', last: 38900, previousClose: 39100, volume: 74 },
  { id: 'SOCAPALM', code: 'SOCAPALM', name: 'Société Camerounaise de Palmeraies', type: 'equity', sector: 'Agribusiness', country: 'CM', currency: 'XAF', exchange: 'BVMAC', last: 41200, previousClose: 41200, volume: 218 },
  { id: 'SIAT', code: 'SIAT', name: 'SIAT Gabon', type: 'equity', sector: 'Agribusiness', country: 'GA', currency: 'XAF', exchange: 'BVMAC', last: 18500, previousClose: 18700, volume: 355 },
  { id: 'BANGE', code: 'BANGE', name: 'Banque Nationale de Guinée Équatoriale', type: 'equity', sector: 'Banking', country: 'GQ', currency: 'XAF', exchange: 'BVMAC', last: 26750, previousClose: 26200, volume: 412 },
  { id: 'REGIONALE', code: 'REGIONALE', name: 'La Régionale', type: 'equity', sector: 'Banking', country: 'CM', currency: 'XAF', exchange: 'BVMAC', last: 17400, previousClose: 17300, volume: 1530 },
  { id: 'SCG-RE', code: 'SCG-RE', name: 'Société Commerciale Gabonaise de Réassurance', type: 'equity', sector: 'Insurance', country: 'GA', currency: 'XAF', exchange: 'BVMAC', last: 21900, previousClose: 21960, volume: 640 },
  { id: 'ECMR-6.25-2029', code: 'ECMR 6.25% 29', name: 'Republic of Cameroon 6.25% 2025-2029', type: 'bond', sector: 'Sovereign', country: 'CM', currency: 'XAF', exchange: 'BVMAC', last: 101.4, previousClose: 101.35, volume: 1200, aliases: ['ECMR 6.25 2029'] },
  { id: 'GAB-6.50-2028', code: 'GAB 6.50% 28', name: 'Gabonese Republic 6.50% 2028', type: 'bond', sector: 'Sovereign', country: 'GA', currency: 'XAF', exchange: 'BVMAC', last: 99.85, previousClose: 99.95, volume: 800, aliases: ['GAB 6.50 2028'] },
]
