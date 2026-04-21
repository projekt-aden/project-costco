import { describe, it, expect } from 'vitest'
import { matchCategory } from '../lib/product-categories'

describe('matchCategory', () => {
  it('matches meat products', () => {
    expect(matchCategory('USDA CHOICE BEEF RIBEYE STEAK').key).toBe('meat')
    expect(matchCategory('KS CHICKEN BREAST').key).toBe('meat')
    expect(matchCategory('PORK TENDERLOIN').key).toBe('meat')
    expect(matchCategory('TURKEY BURGERS').key).toBe('meat')
    expect(matchCategory('BACON THICK SLICED').key).toBe('meat')
  })

  it('matches seafood', () => {
    expect(matchCategory('ATLANTIC SALMON FILLET').key).toBe('seafood')
    expect(matchCategory('WILD CAUGHT SHRIMP').key).toBe('seafood')
    expect(matchCategory('AHI TUNA STEAKS').key).toBe('seafood')
  })

  it('matches dairy', () => {
    expect(matchCategory('KS ORGANIC MILK 2%').key).toBe('dairy')
    expect(matchCategory('TILLAMOOK CHEDDAR CHEESE').key).toBe('dairy')
    expect(matchCategory('GREEK YOGURT VANILLA').key).toBe('dairy')
    expect(matchCategory('KS BUTTER UNSALTED').key).toBe('dairy')
  })

  it('matches produce', () => {
    expect(matchCategory('ORGANIC BANANA').key).toBe('produce')
    expect(matchCategory('SPINACH BUNCH').key).toBe('produce')
    expect(matchCategory('AVOCADO HASS').key).toBe('produce')
    expect(matchCategory('BLUEBERRY PACK').key).toBe('produce')
  })

  it('matches bakery', () => {
    expect(matchCategory('ARTISAN BREAD LOAF').key).toBe('bakery')
    expect(matchCategory('KS MUFFINS BLUEBERRY').key).toBe('bakery')
    expect(matchCategory('CROISSANT 12PK').key).toBe('bakery')
  })

  it('matches beverages', () => {
    expect(matchCategory('KS COLOMBIAN COFFEE').key).toBe('beverages')
    expect(matchCategory('SPARKLING WATER').key).toBe('beverages')
    expect(matchCategory('ORANGE JUICE').key).toBe('beverages')
  })

  it('matches alcohol', () => {
    expect(matchCategory('KS PROSECCO').key).toBe('alcohol')
    expect(matchCategory('CRAFT BEER IPA 24PK').key).toBe('alcohol')
    expect(matchCategory('CABERNET SAUVIGNON').key).toBe('alcohol')
  })

  it('matches snacks', () => {
    expect(matchCategory('KS TRAIL MIX').key).toBe('snacks')
    expect(matchCategory('KETTLE COOKED CHIPS').key).toBe('snacks')
    expect(matchCategory('MIXED NUTS UNSALTED').key).toBe('snacks')
    expect(matchCategory('DARK CHOCOLATE BAR').key).toBe('snacks')
  })

  it('matches frozen', () => {
    expect(matchCategory('FROZEN VEGGIE MIX').key).toBe('frozen')
    expect(matchCategory('FROZEN PIZZA 4PK').key).toBe('frozen')
  })

  it('matches household', () => {
    expect(matchCategory('TIDE PODS DETERGENT').key).toBe('household')
    expect(matchCategory('BOUNTY PAPER TOWEL').key).toBe('household')
    expect(matchCategory('CLOROX DISINFECTING WIPES').key).toBe('household')
  })

  it('matches health', () => {
    expect(matchCategory('KIRKLAND VITAMIN D3').key).toBe('health')
    expect(matchCategory('FISH OIL SUPPLEMENT').key).toBe('health')
    expect(matchCategory('WHEY PROTEIN POWDER').key).toBe('health')
  })

  it('matches electronics', () => {
    expect(matchCategory('SAMSUNG TV 65"').key).toBe('electronics')
    expect(matchCategory('USB-C CHARGER CABLE').key).toBe('electronics')
  })

  it('returns fallback for unknown products', () => {
    const cat = matchCategory('RANDOM ITEM XYZ 123')
    expect(cat.key).toBe('other')
    expect(cat.label).toBe('Other')
  })

  it('is case-insensitive', () => {
    expect(matchCategory('ORGANIC MILK').key).toBe('dairy')
    expect(matchCategory('organic milk').key).toBe('dairy')
    expect(matchCategory('Organic Milk').key).toBe('dairy')
  })

  it('returns category with all required fields', () => {
    const cat = matchCategory('SALMON FILLET')
    expect(cat).toHaveProperty('key')
    expect(cat).toHaveProperty('label')
    expect(cat).toHaveProperty('icon')
    expect(cat).toHaveProperty('color')
    expect(cat).toHaveProperty('bg')
    expect(cat.icon).toBeDefined()
  })
})
