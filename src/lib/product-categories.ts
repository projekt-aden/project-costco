import {
  Beef, Milk, Apple, Croissant, Coffee, Cookie, Snowflake,
  SprayCan, Tv, Pill, Wine, Fish, Egg, Wheat,
  Shirt, Baby, Dog, Flame, Droplets, ShoppingBag,
  type LucideIcon,
} from 'lucide-react'

export interface Category {
  key: string
  label: string
  icon: LucideIcon
  color: string
  bg: string
}

// Order matters: more specific categories first, broad ones (produce) last
const categories: { keywords: string[]; category: Category }[] = [
  {
    keywords: ['salmon', 'shrimp', 'tuna', 'tilapia', 'cod', 'crab', 'lobster', 'mahi', 'scallop', 'clam', 'mussel', 'sardine', 'anchov', 'seafood', 'trout', 'halibut', 'swordfish', 'bass', 'crawfish', 'oyster'],
    category: { key: 'seafood', label: 'Seafood', icon: Fish, color: 'text-cyan-700', bg: 'bg-cyan-50' },
  },
  {
    keywords: ['beef', 'steak', 'ground beef', 'pork', 'lamb', 'chicken', 'turkey', 'sausage', 'bacon', 'ham', 'meat', 'ribs', 'brisket', 'roast', 'tenderloin', 'sirloin', 'chuck', 'patties', 'hot dog', 'jerky', 'salami', 'prosciutto'],
    category: { key: 'meat', label: 'Meat', icon: Beef, color: 'text-red-700', bg: 'bg-red-50' },
  },
  {
    keywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'cottage', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'brie', 'gouda', 'ricotta', 'sour cream', 'half & half', 'creamer', 'whip'],
    category: { key: 'dairy', label: 'Dairy', icon: Milk, color: 'text-blue-700', bg: 'bg-blue-50' },
  },
  {
    keywords: ['egg'],
    category: { key: 'eggs', label: 'Eggs', icon: Egg, color: 'text-amber-700', bg: 'bg-amber-50' },
  },
  {
    keywords: ['vitamin', 'supplement', 'protein', 'medicine', 'allergy', 'ibuprofen', 'tylenol', 'advil', 'probiotic', 'melatonin', 'collagen', 'calcium', 'zinc', 'omega', 'glucosamine', 'fish oil'],
    category: { key: 'health', label: 'Health', icon: Pill, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  },
  {
    keywords: ['wine', 'beer', 'vodka', 'whiskey', 'tequila', 'rum', 'gin', 'bourbon', 'champagne', 'prosecco', 'alcohol', 'liquor', 'spirits', 'ale', 'lager', 'ipa', 'merlot', 'cabernet', 'chardonnay', 'pinot'],
    category: { key: 'alcohol', label: 'Alcohol', icon: Wine, color: 'text-purple-700', bg: 'bg-purple-50' },
  },
  {
    keywords: ['coffee', 'tea', 'water bottle', 'juice', 'soda', 'sparkling', 'lemonade', 'drink', 'beverage', 'kombucha', 'smoothie', 'cider', 'cocoa', 'espresso', 'k-cup'],
    category: { key: 'beverages', label: 'Beverages', icon: Coffee, color: 'text-amber-800', bg: 'bg-amber-50' },
  },
  {
    keywords: ['frozen', 'ice cream', 'popsicle', 'freezer'],
    category: { key: 'frozen', label: 'Frozen', icon: Snowflake, color: 'text-sky-700', bg: 'bg-sky-50' },
  },
  {
    keywords: ['bread', 'bagel', 'muffin', 'croissant', 'roll', 'buns', 'tortilla', 'pita', 'cake', 'pie', 'danish', 'donut', 'scone', 'baguette', 'ciabatta', 'bakery'],
    category: { key: 'bakery', label: 'Bakery', icon: Croissant, color: 'text-orange-700', bg: 'bg-orange-50' },
  },
  {
    keywords: ['chip', 'cracker', 'pretzel', 'popcorn', 'nut', 'almond', 'cashew', 'pistachio', 'peanut', 'trail mix', 'snack', 'cookie', 'granola', 'bar', 'candy', 'chocolate', 'gummy', 'dried fruit'],
    category: { key: 'snacks', label: 'Snacks', icon: Cookie, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  },
  {
    keywords: ['rice', 'pasta', 'flour', 'oat', 'cereal', 'quinoa', 'grain', 'noodle', 'wheat', 'pancake'],
    category: { key: 'grains', label: 'Grains', icon: Wheat, color: 'text-amber-800', bg: 'bg-amber-50' },
  },
  {
    keywords: ['sauce', 'oil', 'vinegar', 'spice', 'seasoning', 'salt', 'pepper', 'ketchup', 'mustard', 'mayo', 'dressing', 'marinade', 'syrup', 'honey', 'sugar', 'cooking'],
    category: { key: 'pantry', label: 'Pantry', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
  },
  {
    keywords: ['detergent', 'soap', 'cleaner', 'bleach', 'sponge', 'trash bag', 'paper towel', 'tissue', 'napkin', 'foil', 'wrap', 'ziploc', 'glad', 'lysol', 'wipe', 'clorox', 'tide', 'downy', 'cascade', 'dishwasher'],
    category: { key: 'household', label: 'Household', icon: SprayCan, color: 'text-teal-700', bg: 'bg-teal-50' },
  },
  {
    keywords: ['shampoo', 'conditioner', 'body wash', 'lotion', 'deodorant', 'toothpaste', 'toothbrush', 'floss', 'razor', 'sunscreen', 'moisturizer', 'bath'],
    category: { key: 'personal', label: 'Personal Care', icon: Droplets, color: 'text-pink-700', bg: 'bg-pink-50' },
  },
  {
    keywords: ['tv', 'laptop', 'phone', 'tablet', 'headphone', 'speaker', 'camera', 'battery', 'charger', 'cable', 'usb', 'hdmi', 'bluetooth', 'wifi', 'smart', 'electronic'],
    category: { key: 'electronics', label: 'Electronics', icon: Tv, color: 'text-indigo-700', bg: 'bg-indigo-50' },
  },
  {
    keywords: ['shirt', 'pant', 'jacket', 'sock', 'underwear', 'shorts', 'dress', 'sweater', 'hoodie', 'jeans', 'legging', 'apparel', 'clothing'],
    category: { key: 'clothing', label: 'Clothing', icon: Shirt, color: 'text-violet-700', bg: 'bg-violet-50' },
  },
  {
    keywords: ['diaper', 'wipe baby', 'formula', 'baby', 'infant', 'toddler'],
    category: { key: 'baby', label: 'Baby', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-50' },
  },
  {
    keywords: ['dog', 'cat', 'pet', 'kibble', 'litter', 'treat pet', 'puppy', 'kitten'],
    category: { key: 'pets', label: 'Pets', icon: Dog, color: 'text-stone-700', bg: 'bg-stone-100' },
  },
  // Produce last — its keywords are broad and would match other categories
  {
    keywords: ['apple', 'banana', 'orange', 'berry', 'blueberry', 'strawberry', 'raspberry', 'grape', 'melon', 'mango', 'avocado', 'lemon', 'lime', 'peach', 'pear', 'tomato', 'lettuce', 'spinach', 'broccoli', 'carrot', 'onion', 'potato', 'pepper', 'cucumber', 'celery', 'corn', 'mushroom', 'garlic', 'salad', 'kale', 'cabbage', 'zucchini', 'squash', 'fruit', 'vegetable', 'produce'],
    category: { key: 'produce', label: 'Produce', icon: Apple, color: 'text-green-700', bg: 'bg-green-50' },
  },
]

const fallback: Category = {
  key: 'other',
  label: 'Other',
  icon: ShoppingBag,
  color: 'text-text-3',
  bg: 'bg-surface-3',
}

export function matchCategory(description: string): Category {
  const lower = description.toLowerCase()
  for (const { keywords, category } of categories) {
    for (const kw of keywords) {
      if (matchesKeyword(lower, kw)) return category
    }
  }
  return fallback
}

/** Match keyword with word-start boundary: "egg" matches "eggs" but not "veggie" */
function matchesKeyword(text: string, keyword: string): boolean {
  let start = 0
  while (true) {
    const idx = text.indexOf(keyword, start)
    if (idx === -1) return false
    // Check that keyword starts at a word boundary (start of string or after non-alpha)
    const before = idx > 0 ? text[idx - 1] : ' '
    if (!/[a-z]/.test(before)) return true
    start = idx + 1
  }
}
