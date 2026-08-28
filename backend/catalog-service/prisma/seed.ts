import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in .env');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});
/*
|--------------------------------------------------------------------------
| RESTAURANTS
|--------------------------------------------------------------------------
| These IDs belong to the Organization Service.
|
| Replace these with the REAL Restaurant UUIDs from your
| Organization Service database.
|--------------------------------------------------------------------------
*/

const restaurants = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'FoodMatrix Indiranagar',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'FoodMatrix Whitefield',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'FoodMatrix Koramangala',
  },
];

/*
|--------------------------------------------------------------------------
| CATEGORIES
|--------------------------------------------------------------------------
*/

const categories = [
  {
    name: 'South Indian Breakfast',
    sortOrder: 1,
  },
  {
    name: 'Dosa Specials',
    sortOrder: 2,
  },
  {
    name: 'North Indian Starters',
    sortOrder: 3,
  },
  {
    name: 'Tandoor',
    sortOrder: 4,
  },
  {
    name: 'Paneer & Vegetarian Curries',
    sortOrder: 5,
  },
  {
    name: 'Chicken & Non-Veg Curries',
    sortOrder: 6,
  },
  {
    name: 'Biryani & Rice',
    sortOrder: 7,
  },
  {
    name: 'Indian Breads',
    sortOrder: 8,
  },
  {
    name: 'Combos & Thali',
    sortOrder: 9,
  },
  {
    name: 'Street Food',
    sortOrder: 10,
  },
  {
    name: 'Beverages',
    sortOrder: 11,
  },
  {
    name: 'Desserts',
    sortOrder: 12,
  },
];

/*
|--------------------------------------------------------------------------
| MODIFIER GROUPS
|--------------------------------------------------------------------------
*/

const modifierGroups = [
  {
    name: 'Dosa Extras',
    sortOrder: 1,
    minSelections: 0,
    maxSelections: 4,
    modifiers: [
      {
        name: 'Extra Butter',
        extraPrice: 20,
        sortOrder: 1,
      },
      {
        name: 'Extra Masala',
        extraPrice: 20,
        sortOrder: 2,
      },
      {
        name: 'Cheese',
        extraPrice: 40,
        sortOrder: 3,
      },
      {
        name: 'Paneer',
        extraPrice: 50,
        sortOrder: 4,
      },
    ],
  },

  {
    name: 'Biryani Options',
    sortOrder: 2,
    minSelections: 0,
    maxSelections: 3,
    modifiers: [
      {
        name: 'Extra Egg',
        extraPrice: 30,
        sortOrder: 1,
      },
      {
        name: 'Extra Rice',
        extraPrice: 40,
        sortOrder: 2,
      },
      {
        name: 'Extra Chicken',
        extraPrice: 80,
        sortOrder: 3,
      },
    ],
  },

  {
    name: 'Rice Extras',
    sortOrder: 3,
    minSelections: 0,
    maxSelections: 2,
    modifiers: [
      {
        name: 'Extra Ghee',
        extraPrice: 20,
        sortOrder: 1,
      },
      {
        name: 'Extra Rice',
        extraPrice: 40,
        sortOrder: 2,
      },
    ],
  },

  {
    name: 'Spice Level',
    sortOrder: 4,
    minSelections: 1,
    maxSelections: 1,
    modifiers: [
      {
        name: 'Mild',
        extraPrice: 0,
        sortOrder: 1,
      },
      {
        name: 'Medium',
        extraPrice: 0,
        sortOrder: 2,
      },
      {
        name: 'Spicy',
        extraPrice: 0,
        sortOrder: 3,
      },
    ],
  },

  {
    name: 'Bread Extras',
    sortOrder: 5,
    minSelections: 0,
    maxSelections: 3,
    modifiers: [
      {
        name: 'Extra Butter',
        extraPrice: 20,
        sortOrder: 1,
      },
      {
        name: 'Extra Garlic',
        extraPrice: 20,
        sortOrder: 2,
      },
      {
        name: 'Cheese',
        extraPrice: 40,
        sortOrder: 3,
      },
    ],
  },
];

/*
|--------------------------------------------------------------------------
| MENU ITEMS
|--------------------------------------------------------------------------
*/

const menuItems = [
  // SOUTH INDIAN BREAKFAST

  {
    category: 'South Indian Breakfast',
    name: 'Idli',
    sku: 'SID-IDL-001',
    description:
      'Soft steamed rice cakes served with sambar and coconut chutney.',
    price: 79,
  },

  {
    category: 'South Indian Breakfast',
    name: 'Medu Vada',
    sku: 'SID-VAD-001',
    description:
      'Crispy lentil fritters served with sambar and coconut chutney.',
    price: 89,
  },

  {
    category: 'South Indian Breakfast',
    name: 'Idli Vada Combo',
    sku: 'SID-CMB-001',
    description: 'Two idlis and one medu vada served with sambar and chutney.',
    price: 109,
  },

  {
    category: 'South Indian Breakfast',
    name: 'Ven Pongal',
    sku: 'SID-PON-001',
    description:
      'Rice and moong dal cooked with pepper, cumin, ginger and ghee.',
    price: 119,
  },

  {
    category: 'South Indian Breakfast',
    name: 'Vegetable Upma',
    sku: 'SID-UPM-001',
    description:
      'Semolina upma prepared with vegetables and traditional tempering.',
    price: 99,
  },

  {
    category: 'South Indian Breakfast',
    name: 'Poori Masala',
    sku: 'SID-POO-001',
    description: 'Fluffy puris served with South Indian potato masala.',
    price: 129,
  },

  {
    category: 'South Indian Breakfast',
    name: 'Set Dosa',
    sku: 'SID-DOS-001',
    description: 'Soft fluffy dosas served with vegetable saagu and chutney.',
    price: 129,
    modifierGroups: ['Dosa Extras'],
  },

  {
    category: 'South Indian Breakfast',
    name: 'Kesari Bath',
    sku: 'SID-KES-001',
    description:
      'Saffron flavored semolina sweet prepared with ghee and cardamom.',
    price: 89,
  },

  // DOSA

  {
    category: 'Dosa Specials',
    name: 'Plain Dosa',
    sku: 'DOS-PLA-001',
    description:
      'Crispy golden rice and lentil dosa served with sambar and chutney.',
    price: 99,
    modifierGroups: ['Dosa Extras'],
  },

  {
    category: 'Dosa Specials',
    name: 'Masala Dosa',
    sku: 'DOS-MAS-001',
    description: 'Crispy dosa filled with seasoned potato masala.',
    price: 139,
    modifierGroups: ['Dosa Extras'],
  },

  {
    category: 'Dosa Specials',
    name: 'Mysore Masala Dosa',
    sku: 'DOS-MYS-001',
    description: 'Crispy dosa spread with spicy red chutney and potato masala.',
    price: 159,
    modifierGroups: ['Dosa Extras'],
  },

  {
    category: 'Dosa Specials',
    name: 'Butter Masala Dosa',
    sku: 'DOS-BUT-001',
    description: 'Masala dosa roasted with butter.',
    price: 169,
    modifierGroups: ['Dosa Extras'],
  },

  {
    category: 'Dosa Specials',
    name: 'Paneer Masala Dosa',
    sku: 'DOS-PAN-001',
    description: 'Crispy dosa filled with paneer and spiced potato masala.',
    price: 189,
    modifierGroups: ['Dosa Extras'],
  },

  {
    category: 'Dosa Specials',
    name: 'Cheese Masala Dosa',
    sku: 'DOS-CHE-001',
    description: 'Masala dosa layered with melted cheese.',
    price: 179,
    modifierGroups: ['Dosa Extras'],
  },

  {
    category: 'Dosa Specials',
    name: 'Ghee Roast Dosa',
    sku: 'DOS-GHE-001',
    description: 'Extra crispy dosa roasted generously with ghee.',
    price: 169,
    modifierGroups: ['Dosa Extras'],
  },

  // STARTERS

  {
    category: 'North Indian Starters',
    name: 'Paneer Tikka',
    sku: 'STR-PAN-001',
    description: 'Char-grilled paneer marinated with yogurt and Indian spices.',
    price: 259,
  },

  {
    category: 'North Indian Starters',
    name: 'Achari Paneer Tikka',
    sku: 'STR-PAN-002',
    description: 'Paneer tikka marinated with tangy achari spices.',
    price: 279,
  },

  {
    category: 'North Indian Starters',
    name: 'Hara Bhara Kebab',
    sku: 'STR-VEG-001',
    description: 'Spinach, peas and potato kebabs served with mint chutney.',
    price: 219,
  },

  {
    category: 'North Indian Starters',
    name: 'Veg Seekh Kebab',
    sku: 'STR-VEG-002',
    description: 'Mixed vegetable seekh kebabs seasoned with aromatic spices.',
    price: 229,
  },

  {
    category: 'North Indian Starters',
    name: 'Chicken Tikka',
    sku: 'STR-CHK-001',
    description:
      'Boneless chicken marinated in yogurt and spices and grilled in tandoor.',
    price: 299,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'North Indian Starters',
    name: 'Chicken Malai Tikka',
    sku: 'STR-CHK-002',
    description:
      'Creamy chicken tikka prepared with cheese, cream and mild spices.',
    price: 329,
  },

  {
    category: 'North Indian Starters',
    name: 'Chicken 65',
    sku: 'STR-CHK-003',
    description: 'Crispy fried chicken tossed with curry leaves and spices.',
    price: 279,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'North Indian Starters',
    name: 'Chilli Paneer',
    sku: 'STR-IND-001',
    description: 'Paneer tossed with peppers, onion and chilli sauce.',
    price: 249,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'North Indian Starters',
    name: 'Gobi Manchurian',
    sku: 'STR-IND-002',
    description:
      'Crispy cauliflower tossed in sweet and spicy Manchurian sauce.',
    price: 219,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'North Indian Starters',
    name: 'Crispy Corn',
    sku: 'STR-VEG-003',
    description: 'Crispy corn tossed with chilli, onion and herbs.',
    price: 199,
    modifierGroups: ['Spice Level'],
  },

  // TANDOOR

  {
    category: 'Tandoor',
    name: 'Tandoori Chicken Half',
    sku: 'TND-CHK-001',
    description: 'Half chicken marinated in yogurt and tandoori spices.',
    price: 349,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Tandoor',
    name: 'Tandoori Chicken Full',
    sku: 'TND-CHK-002',
    description: 'Whole chicken marinated with traditional tandoori spices.',
    price: 599,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Tandoor',
    name: 'Chicken Seekh Kebab',
    sku: 'TND-CHK-003',
    description: 'Minced chicken kebabs with herbs and Indian spices.',
    price: 299,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Tandoor',
    name: 'Fish Tikka',
    sku: 'TND-FSH-001',
    description:
      'Fish fillets marinated with lemon, yogurt and tandoori spices.',
    price: 349,
    modifierGroups: ['Spice Level'],
  },

  // VEGETARIAN CURRIES

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Paneer Butter Masala',
    sku: 'CUR-PAN-001',
    description: 'Paneer cooked in rich tomato, butter and cream gravy.',
    price: 279,
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Kadai Paneer',
    sku: 'CUR-PAN-002',
    description: 'Paneer cooked with onion, capsicum and kadai spices.',
    price: 269,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Palak Paneer',
    sku: 'CUR-PAN-003',
    description: 'Paneer cubes simmered in smooth spinach gravy.',
    price: 269,
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Shahi Paneer',
    sku: 'CUR-PAN-004',
    description: 'Paneer cooked in rich cashew, cream and tomato gravy.',
    price: 289,
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Matar Paneer',
    sku: 'CUR-PAN-005',
    description: 'Paneer and peas cooked in onion tomato gravy.',
    price: 259,
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Dal Tadka',
    sku: 'CUR-DAL-001',
    description: 'Yellow lentils finished with garlic, cumin and ghee.',
    price: 199,
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Dal Makhani',
    sku: 'CUR-DAL-002',
    description: 'Slow-cooked black lentils finished with butter and cream.',
    price: 229,
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Chana Masala',
    sku: 'CUR-VEG-001',
    description: 'Chickpeas cooked with onion, tomato and aromatic spices.',
    price: 189,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Mix Veg Curry',
    sku: 'CUR-VEG-002',
    description: 'Seasonal vegetables cooked in mildly spiced gravy.',
    price: 209,
  },

  {
    category: 'Paneer & Vegetarian Curries',
    name: 'Malai Kofta',
    sku: 'CUR-VEG-003',
    description: 'Paneer and vegetable dumplings in creamy gravy.',
    price: 289,
  },

  // NON-VEG CURRIES

  {
    category: 'Chicken & Non-Veg Curries',
    name: 'Butter Chicken',
    sku: 'CUR-CHK-001',
    description: 'Tandoori chicken pieces in buttery tomato cream gravy.',
    price: 329,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Chicken & Non-Veg Curries',
    name: 'Chicken Tikka Masala',
    sku: 'CUR-CHK-002',
    description: 'Grilled chicken tikka cooked in spiced onion tomato gravy.',
    price: 339,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Chicken & Non-Veg Curries',
    name: 'Kadai Chicken',
    sku: 'CUR-CHK-003',
    description: 'Chicken cooked with capsicum, onion and kadai masala.',
    price: 329,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Chicken & Non-Veg Curries',
    name: 'Chicken Curry',
    sku: 'CUR-CHK-004',
    description:
      'Traditional chicken curry with onion, tomato and Indian spices.',
    price: 299,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Chicken & Non-Veg Curries',
    name: 'Andhra Chicken Curry',
    sku: 'CUR-CHK-005',
    description:
      'Spicy South Indian chicken curry with curry leaves and spices.',
    price: 319,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Chicken & Non-Veg Curries',
    name: 'Mutton Rogan Josh',
    sku: 'CUR-MUT-001',
    description: 'Slow-cooked mutton in aromatic Kashmiri-style gravy.',
    price: 399,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Chicken & Non-Veg Curries',
    name: 'Mutton Curry',
    sku: 'CUR-MUT-002',
    description: 'Tender mutton cooked with onion, tomato and Indian spices.',
    price: 389,
    modifierGroups: ['Spice Level'],
  },

  // BIRYANI

  {
    category: 'Biryani & Rice',
    name: 'Steamed Rice',
    sku: 'RIC-STD-001',
    description: 'Steamed long-grain rice.',
    price: 99,
    modifierGroups: ['Rice Extras'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Jeera Rice',
    sku: 'RIC-JEA-001',
    description: 'Basmati rice tempered with cumin and whole spices.',
    price: 139,
    modifierGroups: ['Rice Extras'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Vegetable Pulao',
    sku: 'RIC-PUL-001',
    description: 'Fragrant basmati rice cooked with seasonal vegetables.',
    price: 159,
    modifierGroups: ['Rice Extras'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Vegetable Biryani',
    sku: 'BIR-VEG-001',
    description:
      'Layered basmati rice cooked with vegetables and biryani spices.',
    price: 219,
    modifierGroups: ['Biryani Options'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Paneer Biryani',
    sku: 'BIR-PAN-001',
    description: 'Fragrant basmati biryani layered with spiced paneer.',
    price: 249,
    modifierGroups: ['Biryani Options'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Chicken Biryani',
    sku: 'BIR-CHK-001',
    description:
      'Aromatic basmati rice cooked with marinated chicken and spices.',
    price: 299,
    modifierGroups: ['Biryani Options'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Chicken Dum Biryani',
    sku: 'BIR-CHK-002',
    description:
      'Hyderabadi-style chicken dum biryani slow-cooked with saffron and spices.',
    price: 329,
    modifierGroups: ['Biryani Options'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Mutton Biryani',
    sku: 'BIR-MUT-001',
    description: 'Tender mutton layered with basmati rice and aromatic spices.',
    price: 399,
    modifierGroups: ['Biryani Options'],
  },

  {
    category: 'Biryani & Rice',
    name: 'Egg Biryani',
    sku: 'BIR-EGG-001',
    description: 'Basmati biryani served with spiced boiled eggs.',
    price: 229,
    modifierGroups: ['Biryani Options'],
  },

  // BREADS

  {
    category: 'Indian Breads',
    name: 'Tandoori Roti',
    sku: 'BRD-ROT-001',
    description: 'Whole wheat flatbread cooked in tandoor.',
    price: 35,
  },

  {
    category: 'Indian Breads',
    name: 'Butter Roti',
    sku: 'BRD-ROT-002',
    description: 'Tandoori roti finished with butter.',
    price: 45,
  },

  {
    category: 'Indian Breads',
    name: 'Plain Naan',
    sku: 'BRD-NAN-001',
    description: 'Soft leavened naan cooked in tandoor.',
    price: 59,
    modifierGroups: ['Bread Extras'],
  },

  {
    category: 'Indian Breads',
    name: 'Butter Naan',
    sku: 'BRD-NAN-002',
    description: 'Soft naan brushed with butter.',
    price: 69,
    modifierGroups: ['Bread Extras'],
  },

  {
    category: 'Indian Breads',
    name: 'Garlic Naan',
    sku: 'BRD-NAN-003',
    description: 'Naan topped with garlic, coriander and butter.',
    price: 89,
    modifierGroups: ['Bread Extras'],
  },

  {
    category: 'Indian Breads',
    name: 'Cheese Naan',
    sku: 'BRD-NAN-004',
    description: 'Soft naan stuffed with melted cheese.',
    price: 119,
    modifierGroups: ['Bread Extras'],
  },

  {
    category: 'Indian Breads',
    name: 'Lachha Paratha',
    sku: 'BRD-PAR-001',
    description: 'Layered flaky Indian flatbread.',
    price: 79,
  },

  {
    category: 'Indian Breads',
    name: 'Aloo Paratha',
    sku: 'BRD-PAR-002',
    description: 'Whole wheat flatbread stuffed with spiced potato.',
    price: 109,
  },

  {
    category: 'Indian Breads',
    name: 'Paneer Paratha',
    sku: 'BRD-PAR-003',
    description: 'Whole wheat flatbread stuffed with seasoned paneer.',
    price: 129,
  },

  // COMBOS

  {
    category: 'Combos & Thali',
    name: 'South Indian Breakfast Combo',
    sku: 'CMB-SID-001',
    description: 'Idli, vada, mini dosa, sambar and coconut chutney.',
    price: 199,
  },

  {
    category: 'Combos & Thali',
    name: 'North Indian Veg Thali',
    sku: 'CMB-THL-001',
    description:
      'Two vegetable curries, dal, rice, roti, salad, curd and dessert.',
    price: 249,
  },

  {
    category: 'Combos & Thali',
    name: 'North Indian Chicken Thali',
    sku: 'CMB-THL-002',
    description:
      'Chicken curry, vegetable curry, dal, rice, roti, salad and dessert.',
    price: 299,
  },

  {
    category: 'Combos & Thali',
    name: 'Paneer Meal Combo',
    sku: 'CMB-PAN-001',
    description: 'Paneer curry, two rotis, jeera rice, dal and salad.',
    price: 279,
  },

  {
    category: 'Combos & Thali',
    name: 'Chicken Meal Combo',
    sku: 'CMB-CHK-001',
    description: 'Chicken curry, two rotis, jeera rice, dal and salad.',
    price: 329,
  },

  // STREET FOOD

  {
    category: 'Street Food',
    name: 'Samosa',
    sku: 'STF-SAM-001',
    description: 'Crispy pastry filled with spiced potato and peas.',
    price: 30,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Street Food',
    name: 'Samosa Chaat',
    sku: 'STF-SAM-002',
    description: 'Samosa topped with chickpeas, yogurt, chutneys and sev.',
    price: 99,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Street Food',
    name: 'Pav Bhaji',
    sku: 'STF-PAV-001',
    description: 'Spiced vegetable mash served with buttered pav.',
    price: 149,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Street Food',
    name: 'Vada Pav',
    sku: 'STF-VAD-001',
    description: 'Spiced potato fritter served in pav with chutneys.',
    price: 79,
  },

  {
    category: 'Street Food',
    name: 'Pani Puri',
    sku: 'STF-PAN-001',
    description: 'Crispy puris filled with spiced potato and flavored water.',
    price: 79,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Street Food',
    name: 'Dahi Puri',
    sku: 'STF-DAH-001',
    description: 'Crispy puris topped with potato, yogurt, chutneys and sev.',
    price: 109,
  },

  {
    category: 'Street Food',
    name: 'Bhel Puri',
    sku: 'STF-BHE-001',
    description: 'Puffed rice mixed with vegetables, sev and chutneys.',
    price: 89,
  },

  {
    category: 'Street Food',
    name: 'Paneer Kathi Roll',
    sku: 'STF-ROL-001',
    description: 'Spiced paneer wrapped in paratha with onion and chutney.',
    price: 179,
    modifierGroups: ['Spice Level'],
  },

  {
    category: 'Street Food',
    name: 'Chicken Kathi Roll',
    sku: 'STF-ROL-002',
    description:
      'Tandoori chicken wrapped in paratha with onion and mint chutney.',
    price: 199,
    modifierGroups: ['Spice Level'],
  },

  // BEVERAGES

  {
    category: 'Beverages',
    name: 'Masala Chai',
    sku: 'BEV-TEA-001',
    description: 'Indian tea brewed with milk and aromatic spices.',
    price: 49,
  },

  {
    category: 'Beverages',
    name: 'Filter Coffee',
    sku: 'BEV-COF-001',
    description: 'Traditional South Indian filter coffee with milk.',
    price: 69,
  },

  {
    category: 'Beverages',
    name: 'Cold Coffee',
    sku: 'BEV-COF-002',
    description: 'Chilled creamy coffee blended with milk.',
    price: 129,
  },

  {
    category: 'Beverages',
    name: 'Sweet Lassi',
    sku: 'BEV-LAS-001',
    description: 'Traditional chilled yogurt drink sweetened with sugar.',
    price: 99,
  },

  {
    category: 'Beverages',
    name: 'Mango Lassi',
    sku: 'BEV-LAS-002',
    description: 'Yogurt drink blended with ripe mango.',
    price: 119,
  },

  {
    category: 'Beverages',
    name: 'Masala Buttermilk',
    sku: 'BEV-BUT-001',
    description: 'Chilled buttermilk with ginger, chilli and curry leaves.',
    price: 69,
  },

  {
    category: 'Beverages',
    name: 'Fresh Lime Soda',
    sku: 'BEV-LIM-001',
    description: 'Fresh lime juice mixed with chilled soda.',
    price: 79,
  },

  {
    category: 'Beverages',
    name: 'Mango Shake',
    sku: 'BEV-SHK-001',
    description: 'Thick creamy mango milkshake.',
    price: 139,
  },

  {
    category: 'Beverages',
    name: 'Badam Milk',
    sku: 'BEV-MLK-001',
    description: 'Milk blended with almonds and saffron.',
    price: 119,
  },

  {
    category: 'Beverages',
    name: 'Mineral Water',
    sku: 'BEV-WAT-001',
    description: 'Packaged drinking water.',
    price: 30,
  },

  // DESSERTS

  {
    category: 'Desserts',
    name: 'Gulab Jamun',
    sku: 'DES-GUL-001',
    description: 'Soft milk dumplings soaked in warm sugar syrup.',
    price: 99,
  },

  {
    category: 'Desserts',
    name: 'Rasmalai',
    sku: 'DES-RAS-001',
    description: 'Soft chenna dumplings served in saffron milk.',
    price: 129,
  },

  {
    category: 'Desserts',
    name: 'Gajar Halwa',
    sku: 'DES-GAJ-001',
    description: 'Slow-cooked carrot pudding made with milk and ghee.',
    price: 129,
  },

  {
    category: 'Desserts',
    name: 'Kesar Kulfi',
    sku: 'DES-KUL-001',
    description:
      'Traditional Indian ice cream flavored with saffron and cardamom.',
    price: 129,
  },

  {
    category: 'Desserts',
    name: 'Jalebi',
    sku: 'DES-JAL-001',
    description: 'Crispy spirals soaked in fragrant sugar syrup.',
    price: 99,
  },

  {
    category: 'Desserts',
    name: 'Rabri',
    sku: 'DES-RAB-001',
    description: 'Reduced sweetened milk flavored with cardamom and saffron.',
    price: 139,
  },
];

/*
|--------------------------------------------------------------------------
| INGREDIENTS
|--------------------------------------------------------------------------
*/
const ingredients = [
  {
    name: 'Rice',
    uom: 'kg',
  },
  {
    name: 'Basmati Rice',
    uom: 'kg',
  },
  {
    name: 'Urad Dal',
    uom: 'kg',
  },
  {
    name: 'Toor Dal',
    uom: 'kg',
  },
  {
    name: 'Moong Dal',
    uom: 'kg',
  },
  {
    name: 'Chickpeas',
    uom: 'kg',
  },
  {
    name: 'Rajma',
    uom: 'kg',
  },
  {
    name: 'Paneer',
    uom: 'kg',
  },
  {
    name: 'Chicken',
    uom: 'kg',
  },
  {
    name: 'Mutton',
    uom: 'kg',
  },
  {
    name: 'Fish',
    uom: 'kg',
  },
  {
    name: 'Egg',
    uom: 'piece',
  },
  {
    name: 'Potato',
    uom: 'kg',
  },
  {
    name: 'Onion',
    uom: 'kg',
  },
  {
    name: 'Tomato',
    uom: 'kg',
  },
  {
    name: 'Capsicum',
    uom: 'kg',
  },
  {
    name: 'Spinach',
    uom: 'kg',
  },
  {
    name: 'Green Peas',
    uom: 'kg',
  },
  {
    name: 'Carrot',
    uom: 'kg',
  },
  {
    name: 'Cauliflower',
    uom: 'kg',
  },
  {
    name: 'Green Chilli',
    uom: 'kg',
  },
  {
    name: 'Ginger',
    uom: 'kg',
  },
  {
    name: 'Garlic',
    uom: 'kg',
  },
  {
    name: 'Coriander',
    uom: 'kg',
  },
  {
    name: 'Mint',
    uom: 'kg',
  },
  {
    name: 'Curry Leaves',
    uom: 'kg',
  },
  {
    name: 'Lemon',
    uom: 'kg',
  },
  {
    name: 'Curd',
    uom: 'litre',
  },
  {
    name: 'Milk',
    uom: 'litre',
  },
  {
    name: 'Cream',
    uom: 'litre',
  },
  {
    name: 'Butter',
    uom: 'kg',
  },
  {
    name: 'Ghee',
    uom: 'litre',
  },
  {
    name: 'Cheddar Cheese',
    uom: 'kg',
  },
  {
    name: 'Mozzarella Cheese',
    uom: 'kg',
  },
  {
    name: 'Wheat Flour',
    uom: 'kg',
  },
  {
    name: 'Maida',
    uom: 'kg',
  },
  {
    name: 'Besan',
    uom: 'kg',
  },
  {
    name: 'Rava',
    uom: 'kg',
  },
  {
    name: 'Oil',
    uom: 'litre',
  },
  {
    name: 'Sugar',
    uom: 'kg',
  },
  {
    name: 'Salt',
    uom: 'kg',
  },
  {
    name: 'Chilli Powder',
    uom: 'kg',
  },
  {
    name: 'Turmeric Powder',
    uom: 'kg',
  },
  {
    name: 'Coriander Powder',
    uom: 'kg',
  },
  {
    name: 'Garam Masala',
    uom: 'kg',
  },
  {
    name: 'Biryani Masala',
    uom: 'kg',
  },
  {
    name: 'Tandoori Masala',
    uom: 'kg',
  },
  {
    name: 'Cumin',
    uom: 'kg',
  },
  {
    name: 'Black Pepper',
    uom: 'kg',
  },
  {
    name: 'Cardamom',
    uom: 'kg',
  },
  {
    name: 'Cardamom Powder',
    uom: 'kg',
  },
  {
    name: 'Cinnamon',
    uom: 'kg',
  },
  {
    name: 'Cloves',
    uom: 'kg',
  },
  {
    name: 'Cashew',
    uom: 'kg',
  },
  {
    name: 'Almond',
    uom: 'kg',
  },
  {
    name: 'Saffron',
    uom: 'kg',
  },
  {
    name: 'Corn Flour',
    uom: 'kg',
  },
  {
    name: 'Coconut',
    uom: 'kg',
  },
  {
    name: 'Tamarind',
    uom: 'kg',
  },
  {
    name: 'Dosa Batter',
    uom: 'kg',
  },
  {
    name: 'Potato Masala',
    uom: 'kg',
  },
  {
    name: 'Sambar',
    uom: 'litre',
  },
  {
    name: 'Coconut Chutney',
    uom: 'litre',
  },
  {
    name: 'Tomato Chutney',
    uom: 'litre',
  },
  {
    name: 'Tamarind Chutney',
    uom: 'litre',
  },
  {
    name: 'Mint Chutney',
    uom: 'litre',
  },
  {
    name: 'Green Chutney',
    uom: 'litre',
  },
  {
    name: 'Pav',
    uom: 'piece',
  },
  {
    name: 'Bread',
    uom: 'piece',
  },
  {
    name: 'Puffed Rice',
    uom: 'kg',
  },
  {
    name: 'Sev',
    uom: 'kg',
  },
  {
    name: 'Papdi',
    uom: 'kg',
  },
  {
    name: 'Khoya',
    uom: 'kg',
  },
  {
    name: 'Jalebi Batter',
    uom: 'kg',
  },
  {
    name: 'Cocoa Powder',
    uom: 'kg',
  },
  {
    name: 'Soy Sauce',
    uom: 'litre',
  },
  {
    name: 'Chilli Sauce',
    uom: 'litre',
  },
  {
    name: 'Vinegar',
    uom: 'litre',
  },
  {
    name: 'Ginger Garlic Paste',
    uom: 'kg',
  },
  {
    name: 'Kasuri Methi',
    uom: 'kg',
  },
  {
    name: 'Food Color',
    uom: 'kg',
  },
  {
    name: 'Corn',
    uom: 'kg',
  },
  {
    name: 'Yogurt',
    uom: 'litre',
  },
  {
    name: 'Beans',
    uom: 'kg',
  },
  {
    name: 'Pani',
    uom: 'litre',
  },
  {
    name: 'Mango',
    uom: 'kg',
  },
  {
    name: 'Mineral Water',
    uom: 'litre',
  },
];

/*
|--------------------------------------------------------------------------
| RECIPES
|--------------------------------------------------------------------------
|
| quantityNeeded uses the ingredient's UOM.
| kg = kilograms
| litre = litres
| piece = individual pieces
|
|--------------------------------------------------------------------------
*/

const recipes = [
  // ============================================================
  // SOUTH INDIAN BREAKFAST
  // ============================================================

  // IDLI
  {
    menuSku: 'SID-IDL-001',
    ingredient: 'Rice',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'SID-IDL-001',
    ingredient: 'Urad Dal',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'SID-IDL-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'SID-IDL-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.05,
  },

  // MEDU VADA
  {
    menuSku: 'SID-VAD-001',
    ingredient: 'Urad Dal',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'SID-VAD-001',
    ingredient: 'Onion',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'SID-VAD-001',
    ingredient: 'Green Chilli',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'SID-VAD-001',
    ingredient: 'Oil',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'SID-VAD-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'SID-VAD-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.05,
  },

  // IDLI VADA COMBO
  {
    menuSku: 'SID-CMB-001',
    ingredient: 'Rice',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'SID-CMB-001',
    ingredient: 'Urad Dal',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'SID-CMB-001',
    ingredient: 'Oil',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'SID-CMB-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'SID-CMB-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.06,
  },

  // VEN PONGAL
  {
    menuSku: 'SID-PON-001',
    ingredient: 'Rice',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'SID-PON-001',
    ingredient: 'Moong Dal',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'SID-PON-001',
    ingredient: 'Ghee',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'SID-PON-001',
    ingredient: 'Black Pepper',
    quantityNeeded: 0.003,
  },
  {
    menuSku: 'SID-PON-001',
    ingredient: 'Cumin',
    quantityNeeded: 0.003,
  },
  {
    menuSku: 'SID-PON-001',
    ingredient: 'Ginger',
    quantityNeeded: 0.005,
  },

  // VEGETABLE UPMA
  {
    menuSku: 'SID-UPM-001',
    ingredient: 'Rava',
    quantityNeeded: 0.09,
  },
  {
    menuSku: 'SID-UPM-001',
    ingredient: 'Carrot',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'SID-UPM-001',
    ingredient: 'Green Peas',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'SID-UPM-001',
    ingredient: 'Onion',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'SID-UPM-001',
    ingredient: 'Green Chilli',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'SID-UPM-001',
    ingredient: 'Oil',
    quantityNeeded: 0.015,
  },

  // POORI MASALA
  {
    menuSku: 'SID-POO-001',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'SID-POO-001',
    ingredient: 'Potato',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'SID-POO-001',
    ingredient: 'Onion',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'SID-POO-001',
    ingredient: 'Green Chilli',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'SID-POO-001',
    ingredient: 'Oil',
    quantityNeeded: 0.04,
  },

  // SET DOSA
  {
    menuSku: 'SID-DOS-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'SID-DOS-001',
    ingredient: 'Potato Masala',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'SID-DOS-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'SID-DOS-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.05,
  },

  // KESARI BATH
  {
    menuSku: 'SID-KES-001',
    ingredient: 'Rava',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'SID-KES-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'SID-KES-001',
    ingredient: 'Ghee',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'SID-KES-001',
    ingredient: 'Cardamom Powder',
    quantityNeeded: 0.001,
  },

  // ============================================================
  // DOSA
  // ============================================================

  // PLAIN DOSA
  {
    menuSku: 'DOS-PLA-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'DOS-PLA-001',
    ingredient: 'Oil',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'DOS-PLA-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DOS-PLA-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.05,
  },

  // MASALA DOSA
  {
    menuSku: 'DOS-MAS-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'DOS-MAS-001',
    ingredient: 'Potato',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'DOS-MAS-001',
    ingredient: 'Onion',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'DOS-MAS-001',
    ingredient: 'Green Chilli',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'DOS-MAS-001',
    ingredient: 'Oil',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'DOS-MAS-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DOS-MAS-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.05,
  },

  // MYSORE MASALA DOSA
  {
    menuSku: 'DOS-MYS-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'DOS-MYS-001',
    ingredient: 'Potato',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DOS-MYS-001',
    ingredient: 'Tomato Chutney',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'DOS-MYS-001',
    ingredient: 'Onion',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'DOS-MYS-001',
    ingredient: 'Oil',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'DOS-MYS-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },

  // BUTTER MASALA DOSA
  {
    menuSku: 'DOS-BUT-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'DOS-BUT-001',
    ingredient: 'Potato Masala',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DOS-BUT-001',
    ingredient: 'Butter',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'DOS-BUT-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DOS-BUT-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.05,
  },

  // PANEER MASALA DOSA
  {
    menuSku: 'DOS-PAN-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'DOS-PAN-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'DOS-PAN-001',
    ingredient: 'Potato',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'DOS-PAN-001',
    ingredient: 'Onion',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'DOS-PAN-001',
    ingredient: 'Oil',
    quantityNeeded: 0.015,
  },

  // CHEESE MASALA DOSA
  {
    menuSku: 'DOS-CHE-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'DOS-CHE-001',
    ingredient: 'Potato',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DOS-CHE-001',
    ingredient: 'Cheddar Cheese',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'DOS-CHE-001',
    ingredient: 'Oil',
    quantityNeeded: 0.015,
  },

  // GHEE ROAST
  {
    menuSku: 'DOS-GHE-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'DOS-GHE-001',
    ingredient: 'Ghee',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'DOS-GHE-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DOS-GHE-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.05,
  },

  // ============================================================
  // STARTERS
  // ============================================================

  // PANEER TIKKA
  {
    menuSku: 'STR-PAN-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'STR-PAN-001',
    ingredient: 'Curd',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-PAN-001',
    ingredient: 'Capsicum',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-PAN-001',
    ingredient: 'Onion',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-PAN-001',
    ingredient: 'Tandoori Masala',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'STR-PAN-001',
    ingredient: 'Oil',
    quantityNeeded: 0.01,
  },

  // ACHARI PANEER
  {
    menuSku: 'STR-PAN-002',
    ingredient: 'Paneer',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'STR-PAN-002',
    ingredient: 'Curd',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-PAN-002',
    ingredient: 'Onion',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-PAN-002',
    ingredient: 'Capsicum',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-PAN-002',
    ingredient: 'Oil',
    quantityNeeded: 0.01,
  },

  // HARA BHARA KEBAB
  {
    menuSku: 'STR-VEG-001',
    ingredient: 'Spinach',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'STR-VEG-001',
    ingredient: 'Potato',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'STR-VEG-001',
    ingredient: 'Green Peas',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-VEG-001',
    ingredient: 'Besan',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'STR-VEG-001',
    ingredient: 'Oil',
    quantityNeeded: 0.025,
  },

  // VEG SEEKH
  {
    menuSku: 'STR-VEG-002',
    ingredient: 'Potato',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'STR-VEG-002',
    ingredient: 'Carrot',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STR-VEG-002',
    ingredient: 'Green Peas',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STR-VEG-002',
    ingredient: 'Besan',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'STR-VEG-002',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },

  // CHICKEN TIKKA
  {
    menuSku: 'STR-CHK-001',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'STR-CHK-001',
    ingredient: 'Curd',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-CHK-001',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'STR-CHK-001',
    ingredient: 'Tandoori Masala',
    quantityNeeded: 0.006,
  },
  {
    menuSku: 'STR-CHK-001',
    ingredient: 'Lemon',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'STR-CHK-001',
    ingredient: 'Oil',
    quantityNeeded: 0.01,
  },

  // CHICKEN MALAI TIKKA
  {
    menuSku: 'STR-CHK-002',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'STR-CHK-002',
    ingredient: 'Curd',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STR-CHK-002',
    ingredient: 'Cream',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STR-CHK-002',
    ingredient: 'Cheddar Cheese',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'STR-CHK-002',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.01,
  },

  // CHICKEN 65
  {
    menuSku: 'STR-CHK-003',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'STR-CHK-003',
    ingredient: 'Corn Flour',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'STR-CHK-003',
    ingredient: 'Besan',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'STR-CHK-003',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'STR-CHK-003',
    ingredient: 'Oil',
    quantityNeeded: 0.04,
  },

  // CHILLI PANEER
  {
    menuSku: 'STR-IND-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'STR-IND-001',
    ingredient: 'Capsicum',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'STR-IND-001',
    ingredient: 'Onion',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STR-IND-001',
    ingredient: 'Corn Flour',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'STR-IND-001',
    ingredient: 'Soy Sauce',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'STR-IND-001',
    ingredient: 'Chilli Sauce',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'STR-IND-001',
    ingredient: 'Oil',
    quantityNeeded: 0.025,
  },

  // GOBI MANCHURIAN
  {
    menuSku: 'STR-IND-002',
    ingredient: 'Cauliflower',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'STR-IND-002',
    ingredient: 'Corn Flour',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STR-IND-002',
    ingredient: 'Onion',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STR-IND-002',
    ingredient: 'Soy Sauce',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'STR-IND-002',
    ingredient: 'Chilli Sauce',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'STR-IND-002',
    ingredient: 'Oil',
    quantityNeeded: 0.04,
  },

  // CRISPY CORN
  {
    menuSku: 'STR-VEG-003',
    ingredient: 'Corn',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'STR-VEG-003',
    ingredient: 'Corn Flour',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'STR-VEG-003',
    ingredient: 'Green Chilli',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'STR-VEG-003',
    ingredient: 'Oil',
    quantityNeeded: 0.03,
  },

  // ============================================================
  // TANDOOR
  // ============================================================

  {
    menuSku: 'TND-CHK-001',
    ingredient: 'Chicken',
    quantityNeeded: 0.5,
  },
  {
    menuSku: 'TND-CHK-001',
    ingredient: 'Curd',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'TND-CHK-001',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'TND-CHK-001',
    ingredient: 'Tandoori Masala',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'TND-CHK-001',
    ingredient: 'Lemon',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'TND-CHK-002',
    ingredient: 'Chicken',
    quantityNeeded: 1.0,
  },
  {
    menuSku: 'TND-CHK-002',
    ingredient: 'Curd',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'TND-CHK-002',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'TND-CHK-002',
    ingredient: 'Tandoori Masala',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'TND-CHK-003',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'TND-CHK-003',
    ingredient: 'Onion',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'TND-CHK-003',
    ingredient: 'Besan',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'TND-CHK-003',
    ingredient: 'Oil',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'TND-FSH-001',
    ingredient: 'Fish',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'TND-FSH-001',
    ingredient: 'Curd',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'TND-FSH-001',
    ingredient: 'Lemon',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'TND-FSH-001',
    ingredient: 'Tandoori Masala',
    quantityNeeded: 0.005,
  },

  // ============================================================
  // VEGETARIAN CURRIES
  // ============================================================

  {
    menuSku: 'CUR-PAN-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'CUR-PAN-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'CUR-PAN-001',
    ingredient: 'Onion',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-PAN-001',
    ingredient: 'Butter',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'CUR-PAN-001',
    ingredient: 'Cream',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'CUR-PAN-001',
    ingredient: 'Cashew',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'CUR-PAN-002',
    ingredient: 'Paneer',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'CUR-PAN-002',
    ingredient: 'Capsicum',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-PAN-002',
    ingredient: 'Onion',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-PAN-002',
    ingredient: 'Tomato',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'CUR-PAN-002',
    ingredient: 'Garam Masala',
    quantityNeeded: 0.005,
  },

  {
    menuSku: 'CUR-PAN-003',
    ingredient: 'Paneer',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'CUR-PAN-003',
    ingredient: 'Spinach',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'CUR-PAN-003',
    ingredient: 'Cream',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'CUR-PAN-003',
    ingredient: 'Ginger',
    quantityNeeded: 0.005,
  },

  {
    menuSku: 'CUR-PAN-004',
    ingredient: 'Paneer',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'CUR-PAN-004',
    ingredient: 'Tomato',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CUR-PAN-004',
    ingredient: 'Cashew',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'CUR-PAN-004',
    ingredient: 'Cream',
    quantityNeeded: 0.03,
  },

  {
    menuSku: 'CUR-PAN-005',
    ingredient: 'Paneer',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'CUR-PAN-005',
    ingredient: 'Green Peas',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'CUR-PAN-005',
    ingredient: 'Tomato',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'CUR-PAN-005',
    ingredient: 'Onion',
    quantityNeeded: 0.04,
  },

  {
    menuSku: 'CUR-DAL-001',
    ingredient: 'Toor Dal',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CUR-DAL-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'CUR-DAL-001',
    ingredient: 'Onion',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'CUR-DAL-001',
    ingredient: 'Garlic',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'CUR-DAL-001',
    ingredient: 'Ghee',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'CUR-DAL-002',
    ingredient: 'Urad Dal',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CUR-DAL-002',
    ingredient: 'Rajma',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'CUR-DAL-002',
    ingredient: 'Butter',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'CUR-DAL-002',
    ingredient: 'Cream',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'CUR-VEG-001',
    ingredient: 'Chickpeas',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'CUR-VEG-001',
    ingredient: 'Onion',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-VEG-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'CUR-VEG-001',
    ingredient: 'Garam Masala',
    quantityNeeded: 0.005,
  },

  {
    menuSku: 'CUR-VEG-002',
    ingredient: 'Carrot',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'CUR-VEG-002',
    ingredient: 'Green Peas',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'CUR-VEG-002',
    ingredient: 'Cauliflower',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-VEG-002',
    ingredient: 'Potato',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-VEG-002',
    ingredient: 'Cream',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'CUR-VEG-003',
    ingredient: 'Paneer',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'CUR-VEG-003',
    ingredient: 'Potato',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'CUR-VEG-003',
    ingredient: 'Cream',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'CUR-VEG-003',
    ingredient: 'Cashew',
    quantityNeeded: 0.015,
  },

  // ============================================================
  // NON-VEG CURRIES
  // ============================================================

  {
    menuSku: 'CUR-CHK-001',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'CUR-CHK-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'CUR-CHK-001',
    ingredient: 'Onion',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-CHK-001',
    ingredient: 'Butter',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'CUR-CHK-001',
    ingredient: 'Cream',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'CUR-CHK-001',
    ingredient: 'Cashew',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'CUR-CHK-002',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'CUR-CHK-002',
    ingredient: 'Tomato',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CUR-CHK-002',
    ingredient: 'Onion',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-CHK-002',
    ingredient: 'Curd',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'CUR-CHK-002',
    ingredient: 'Garam Masala',
    quantityNeeded: 0.005,
  },

  {
    menuSku: 'CUR-CHK-003',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'CUR-CHK-003',
    ingredient: 'Capsicum',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-CHK-003',
    ingredient: 'Onion',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-CHK-003',
    ingredient: 'Tomato',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'CUR-CHK-003',
    ingredient: 'Garam Masala',
    quantityNeeded: 0.005,
  },

  {
    menuSku: 'CUR-CHK-004',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'CUR-CHK-004',
    ingredient: 'Onion',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'CUR-CHK-004',
    ingredient: 'Tomato',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'CUR-CHK-004',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'CUR-CHK-005',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'CUR-CHK-005',
    ingredient: 'Onion',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'CUR-CHK-005',
    ingredient: 'Tomato',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'CUR-CHK-005',
    ingredient: 'Curry Leaves',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'CUR-CHK-005',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'CUR-MUT-001',
    ingredient: 'Mutton',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'CUR-MUT-001',
    ingredient: 'Onion',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'CUR-MUT-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CUR-MUT-001',
    ingredient: 'Yogurt',
    quantityNeeded: 0.03,
  },

  {
    menuSku: 'CUR-MUT-002',
    ingredient: 'Mutton',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'CUR-MUT-002',
    ingredient: 'Onion',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'CUR-MUT-002',
    ingredient: 'Tomato',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'CUR-MUT-002',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.01,
  },

  // ============================================================
  // BIRYANI & RICE
  // ============================================================

  {
    menuSku: 'RIC-STD-001',
    ingredient: 'Rice',
    quantityNeeded: 0.18,
  },

  {
    menuSku: 'RIC-JEA-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'RIC-JEA-001',
    ingredient: 'Cumin',
    quantityNeeded: 0.003,
  },
  {
    menuSku: 'RIC-JEA-001',
    ingredient: 'Ghee',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'RIC-PUL-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'RIC-PUL-001',
    ingredient: 'Carrot',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'RIC-PUL-001',
    ingredient: 'Green Peas',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'RIC-PUL-001',
    ingredient: 'Beans',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'RIC-PUL-001',
    ingredient: 'Ghee',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BIR-VEG-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.25,
  },
  {
    menuSku: 'BIR-VEG-001',
    ingredient: 'Carrot',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'BIR-VEG-001',
    ingredient: 'Green Peas',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'BIR-VEG-001',
    ingredient: 'Potato',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'BIR-VEG-001',
    ingredient: 'Onion',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'BIR-VEG-001',
    ingredient: 'Biryani Masala',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'BIR-VEG-001',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'BIR-PAN-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.25,
  },
  {
    menuSku: 'BIR-PAN-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'BIR-PAN-001',
    ingredient: 'Onion',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'BIR-PAN-001',
    ingredient: 'Curd',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'BIR-PAN-001',
    ingredient: 'Biryani Masala',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'BIR-PAN-001',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.25,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Onion',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Curd',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Biryani Masala',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Mint',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Coriander',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'BIR-CHK-001',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'BIR-CHK-002',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.25,
  },
  {
    menuSku: 'BIR-CHK-002',
    ingredient: 'Chicken',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'BIR-CHK-002',
    ingredient: 'Onion',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'BIR-CHK-002',
    ingredient: 'Curd',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'BIR-CHK-002',
    ingredient: 'Saffron',
    quantityNeeded: 0.0005,
  },
  {
    menuSku: 'BIR-CHK-002',
    ingredient: 'Biryani Masala',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BIR-MUT-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.25,
  },
  {
    menuSku: 'BIR-MUT-001',
    ingredient: 'Mutton',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'BIR-MUT-001',
    ingredient: 'Onion',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'BIR-MUT-001',
    ingredient: 'Curd',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'BIR-MUT-001',
    ingredient: 'Biryani Masala',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'BIR-MUT-001',
    ingredient: 'Ginger Garlic Paste',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'BIR-EGG-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.22,
  },
  {
    menuSku: 'BIR-EGG-001',
    ingredient: 'Egg',
    quantityNeeded: 2,
  },
  {
    menuSku: 'BIR-EGG-001',
    ingredient: 'Onion',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'BIR-EGG-001',
    ingredient: 'Biryani Masala',
    quantityNeeded: 0.008,
  },

  // ============================================================
  // BREADS
  // ============================================================

  {
    menuSku: 'BRD-ROT-001',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.05,
  },

  {
    menuSku: 'BRD-ROT-002',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'BRD-ROT-002',
    ingredient: 'Butter',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BRD-NAN-001',
    ingredient: 'Maida',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'BRD-NAN-001',
    ingredient: 'Curd',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BRD-NAN-002',
    ingredient: 'Maida',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'BRD-NAN-002',
    ingredient: 'Butter',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BRD-NAN-003',
    ingredient: 'Maida',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'BRD-NAN-003',
    ingredient: 'Garlic',
    quantityNeeded: 0.005,
  },
  {
    menuSku: 'BRD-NAN-003',
    ingredient: 'Butter',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BRD-NAN-004',
    ingredient: 'Maida',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'BRD-NAN-004',
    ingredient: 'Cheddar Cheese',
    quantityNeeded: 0.04,
  },

  {
    menuSku: 'BRD-PAR-001',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'BRD-PAR-001',
    ingredient: 'Oil',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BRD-PAR-002',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'BRD-PAR-002',
    ingredient: 'Potato',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'BRD-PAR-002',
    ingredient: 'Onion',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'BRD-PAR-003',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.07,
  },
  {
    menuSku: 'BRD-PAR-003',
    ingredient: 'Paneer',
    quantityNeeded: 0.06,
  },

  // ============================================================
  // COMBOS
  // ============================================================

  {
    menuSku: 'CMB-SID-001',
    ingredient: 'Rice',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-SID-001',
    ingredient: 'Urad Dal',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'CMB-SID-001',
    ingredient: 'Dosa Batter',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'CMB-SID-001',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'CMB-SID-001',
    ingredient: 'Sambar',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'CMB-SID-001',
    ingredient: 'Coconut Chutney',
    quantityNeeded: 0.07,
  },

  {
    menuSku: 'CMB-THL-001',
    ingredient: 'Rice',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'CMB-THL-001',
    ingredient: 'Toor Dal',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'CMB-THL-001',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-THL-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CMB-THL-001',
    ingredient: 'Curd',
    quantityNeeded: 0.05,
  },

  {
    menuSku: 'CMB-THL-002',
    ingredient: 'Rice',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'CMB-THL-002',
    ingredient: 'Chicken',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-THL-002',
    ingredient: 'Toor Dal',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'CMB-THL-002',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-THL-002',
    ingredient: 'Curd',
    quantityNeeded: 0.05,
  },

  {
    menuSku: 'CMB-PAN-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'CMB-PAN-001',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-PAN-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-PAN-001',
    ingredient: 'Toor Dal',
    quantityNeeded: 0.05,
  },

  {
    menuSku: 'CMB-CHK-001',
    ingredient: 'Chicken',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'CMB-CHK-001',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-CHK-001',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'CMB-CHK-001',
    ingredient: 'Toor Dal',
    quantityNeeded: 0.05,
  },

  // ============================================================
  // STREET FOOD
  // ============================================================

  {
    menuSku: 'STF-SAM-001',
    ingredient: 'Maida',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STF-SAM-001',
    ingredient: 'Potato',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'STF-SAM-001',
    ingredient: 'Green Peas',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'STF-SAM-001',
    ingredient: 'Oil',
    quantityNeeded: 0.025,
  },

  {
    menuSku: 'STF-SAM-002',
    ingredient: 'Maida',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STF-SAM-002',
    ingredient: 'Potato',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'STF-SAM-002',
    ingredient: 'Chickpeas',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STF-SAM-002',
    ingredient: 'Curd',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STF-SAM-002',
    ingredient: 'Tamarind Chutney',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'STF-SAM-002',
    ingredient: 'Sev',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'STF-PAV-001',
    ingredient: 'Potato',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'STF-PAV-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'STF-PAV-001',
    ingredient: 'Onion',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STF-PAV-001',
    ingredient: 'Butter',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'STF-PAV-001',
    ingredient: 'Pav',
    quantityNeeded: 2,
  },

  {
    menuSku: 'STF-VAD-001',
    ingredient: 'Potato',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'STF-VAD-001',
    ingredient: 'Besan',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STF-VAD-001',
    ingredient: 'Pav',
    quantityNeeded: 1,
  },
  {
    menuSku: 'STF-VAD-001',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'STF-PAN-001',
    ingredient: 'Maida',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'STF-PAN-001',
    ingredient: 'Potato',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'STF-PAN-001',
    ingredient: 'Pani',
    quantityNeeded: 0.15,
  },

  {
    menuSku: 'STF-DAH-001',
    ingredient: 'Papdi',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'STF-DAH-001',
    ingredient: 'Potato',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'STF-DAH-001',
    ingredient: 'Curd',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'STF-DAH-001',
    ingredient: 'Tamarind Chutney',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'STF-DAH-001',
    ingredient: 'Sev',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'STF-BHE-001',
    ingredient: 'Puffed Rice',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'STF-BHE-001',
    ingredient: 'Onion',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'STF-BHE-001',
    ingredient: 'Tomato',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'STF-BHE-001',
    ingredient: 'Sev',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'STF-BHE-001',
    ingredient: 'Tamarind Chutney',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'STF-ROL-001',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'STF-ROL-001',
    ingredient: 'Paneer',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'STF-ROL-001',
    ingredient: 'Onion',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'STF-ROL-001',
    ingredient: 'Mint Chutney',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'STF-ROL-002',
    ingredient: 'Wheat Flour',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'STF-ROL-002',
    ingredient: 'Chicken',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'STF-ROL-002',
    ingredient: 'Onion',
    quantityNeeded: 0.025,
  },
  {
    menuSku: 'STF-ROL-002',
    ingredient: 'Mint Chutney',
    quantityNeeded: 0.015,
  },

  // ============================================================
  // BEVERAGES
  // ============================================================

  {
    menuSku: 'BEV-TEA-001',
    ingredient: 'Milk',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'BEV-TEA-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'BEV-COF-001',
    ingredient: 'Milk',
    quantityNeeded: 0.12,
  },
  {
    menuSku: 'BEV-COF-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'BEV-COF-002',
    ingredient: 'Milk',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'BEV-COF-002',
    ingredient: 'Sugar',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'BEV-LAS-001',
    ingredient: 'Curd',
    quantityNeeded: 0.18,
  },
  {
    menuSku: 'BEV-LAS-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'BEV-LAS-002',
    ingredient: 'Curd',
    quantityNeeded: 0.16,
  },
  {
    menuSku: 'BEV-LAS-002',
    ingredient: 'Milk',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'BEV-LAS-002',
    ingredient: 'Sugar',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'BEV-BUT-001',
    ingredient: 'Curd',
    quantityNeeded: 0.15,
  },
  {
    menuSku: 'BEV-BUT-001',
    ingredient: 'Green Chilli',
    quantityNeeded: 0.002,
  },
  {
    menuSku: 'BEV-BUT-001',
    ingredient: 'Ginger',
    quantityNeeded: 0.002,
  },

  {
    menuSku: 'BEV-LIM-001',
    ingredient: 'Lemon',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'BEV-LIM-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'BEV-SHK-001',
    ingredient: 'Milk',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'BEV-SHK-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'BEV-SHK-001',
    ingredient: 'Mango',
    quantityNeeded: 0.1,
  },

  {
    menuSku: 'BEV-MLK-001',
    ingredient: 'Milk',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'BEV-MLK-001',
    ingredient: 'Almond',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'BEV-MLK-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.015,
  },

  {
    menuSku: 'BEV-WAT-001',
    ingredient: 'Mineral Water',
    quantityNeeded: 1,
  },

  // ============================================================
  // DESSERTS
  // ============================================================

  {
    menuSku: 'DES-GUL-001',
    ingredient: 'Khoya',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'DES-GUL-001',
    ingredient: 'Maida',
    quantityNeeded: 0.02,
  },
  {
    menuSku: 'DES-GUL-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.05,
  },
  {
    menuSku: 'DES-GUL-001',
    ingredient: 'Oil',
    quantityNeeded: 0.02,
  },

  {
    menuSku: 'DES-RAS-001',
    ingredient: 'Milk',
    quantityNeeded: 0.25,
  },
  {
    menuSku: 'DES-RAS-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'DES-RAS-001',
    ingredient: 'Saffron',
    quantityNeeded: 0.0005,
  },
  {
    menuSku: 'DES-RAS-001',
    ingredient: 'Cardamom Powder',
    quantityNeeded: 0.001,
  },

  {
    menuSku: 'DES-GAJ-001',
    ingredient: 'Carrot',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'DES-GAJ-001',
    ingredient: 'Milk',
    quantityNeeded: 0.1,
  },
  {
    menuSku: 'DES-GAJ-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.04,
  },
  {
    menuSku: 'DES-GAJ-001',
    ingredient: 'Ghee',
    quantityNeeded: 0.015,
  },
  {
    menuSku: 'DES-GAJ-001',
    ingredient: 'Cashew',
    quantityNeeded: 0.01,
  },

  {
    menuSku: 'DES-KUL-001',
    ingredient: 'Milk',
    quantityNeeded: 0.2,
  },
  {
    menuSku: 'DES-KUL-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'DES-KUL-001',
    ingredient: 'Saffron',
    quantityNeeded: 0.0005,
  },
  {
    menuSku: 'DES-KUL-001',
    ingredient: 'Cardamom Powder',
    quantityNeeded: 0.001,
  },

  {
    menuSku: 'DES-JAL-001',
    ingredient: 'Maida',
    quantityNeeded: 0.06,
  },
  {
    menuSku: 'DES-JAL-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.08,
  },
  {
    menuSku: 'DES-JAL-001',
    ingredient: 'Oil',
    quantityNeeded: 0.03,
  },

  {
    menuSku: 'DES-RAB-001',
    ingredient: 'Milk',
    quantityNeeded: 0.25,
  },
  {
    menuSku: 'DES-RAB-001',
    ingredient: 'Sugar',
    quantityNeeded: 0.03,
  },
  {
    menuSku: 'DES-RAB-001',
    ingredient: 'Almond',
    quantityNeeded: 0.01,
  },
  {
    menuSku: 'DES-RAB-001',
    ingredient: 'Cardamom Powder',
    quantityNeeded: 0.001,
  },

  // ============================================================
  // MODIFIER RECIPES
  // ============================================================

  {
    modifierGroup: 'Dosa Extras',
    modifierName: 'Extra Butter',
    ingredient: 'Butter',
    quantityNeeded: 0.015,
  },

  {
    modifierGroup: 'Dosa Extras',
    modifierName: 'Extra Masala',
    ingredient: 'Potato Masala',
    quantityNeeded: 0.05,
  },

  {
    modifierGroup: 'Dosa Extras',
    modifierName: 'Cheese',
    ingredient: 'Cheddar Cheese',
    quantityNeeded: 0.025,
  },

  {
    modifierGroup: 'Dosa Extras',
    modifierName: 'Paneer',
    ingredient: 'Paneer',
    quantityNeeded: 0.04,
  },

  {
    modifierGroup: 'Biryani Options',
    modifierName: 'Extra Egg',
    ingredient: 'Egg',
    quantityNeeded: 1,
  },

  {
    modifierGroup: 'Biryani Options',
    modifierName: 'Extra Rice',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.1,
  },

  {
    modifierGroup: 'Biryani Options',
    modifierName: 'Extra Chicken',
    ingredient: 'Chicken',
    quantityNeeded: 0.08,
  },

  {
    modifierGroup: 'Rice Extras',
    modifierName: 'Extra Ghee',
    ingredient: 'Ghee',
    quantityNeeded: 0.01,
  },

  {
    modifierGroup: 'Rice Extras',
    modifierName: 'Extra Rice',
    ingredient: 'Basmati Rice',
    quantityNeeded: 0.1,
  },

  {
    modifierGroup: 'Bread Extras',
    modifierName: 'Extra Butter',
    ingredient: 'Butter',
    quantityNeeded: 0.015,
  },

  {
    modifierGroup: 'Bread Extras',
    modifierName: 'Extra Garlic',
    ingredient: 'Garlic',
    quantityNeeded: 0.005,
  },

  {
    modifierGroup: 'Bread Extras',
    modifierName: 'Cheese',
    ingredient: 'Cheddar Cheese',
    quantityNeeded: 0.025,
  },
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

async function findOrCreateCategory(name: string, sortOrder: number) {
  const existing = await prisma.menuCategory.findFirst({
    where: { name },
  });

  if (existing) {
    return prisma.menuCategory.update({
      where: { id: existing.id },
      data: {
        sortOrder,
        isActive: true,
      },
    });
  }

  return prisma.menuCategory.create({
    data: {
      name,
      sortOrder,
      isActive: true,
    },
  });
}

async function findOrCreateModifierGroup(group: {
  name: string;
  sortOrder: number;
  minSelections: number;
  maxSelections: number;
}) {
  const existing = await prisma.modifierGroup.findFirst({
    where: {
      name: group.name,
    },
  });

  if (existing) {
    return prisma.modifierGroup.update({
      where: {
        id: existing.id,
      },
      data: {
        sortOrder: group.sortOrder,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isActive: true,
      },
    });
  }

  return prisma.modifierGroup.create({
    data: {
      name: group.name,
      sortOrder: group.sortOrder,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      isActive: true,
    },
  });
}

async function findOrCreateModifier(
  groupId: string,
  modifier: {
    name: string;
    extraPrice: number;
    sortOrder: number;
  },
) {
  const existing = await prisma.modifier.findFirst({
    where: {
      groupId,
      name: modifier.name,
    },
  });

  if (existing) {
    return prisma.modifier.update({
      where: {
        id: existing.id,
      },
      data: {
        extraPrice: new Prisma.Decimal(modifier.extraPrice),
        sortOrder: modifier.sortOrder,
        isActive: true,
      },
    });
  }

  return prisma.modifier.create({
    data: {
      groupId,
      name: modifier.name,
      extraPrice: new Prisma.Decimal(modifier.extraPrice),
      sortOrder: modifier.sortOrder,
      isActive: true,
    },
  });
}

async function findOrCreateIngredient(name: string, uom: string) {
  const existing = await prisma.ingredient.findFirst({
    where: { name },
  });

  if (existing) {
    return prisma.ingredient.update({
      where: { id: existing.id },
      data: {
        uom,
        isActive: true,
      },
    });
  }

  return prisma.ingredient.create({
    data: {
      name,
      uom,
      isActive: true,
    },
  });
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log('');
  console.log('============================================');
  console.log(' FoodMatrix Catalog Database Seed');
  console.log('============================================');
  console.log('');

  /*
  |--------------------------------------------------------------------------
  | 1. CATEGORIES
  |--------------------------------------------------------------------------
  */

  console.log('Creating categories...');

  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const result = await findOrCreateCategory(
      category.name,
      category.sortOrder,
    );

    categoryMap.set(category.name, result.id);
  }

  console.log(`✓ ${categoryMap.size} categories`);

  /*
  |--------------------------------------------------------------------------
  | 2. MODIFIER GROUPS
  |--------------------------------------------------------------------------
  */

  console.log('Creating modifier groups...');

  const modifierGroupMap = new Map<string, string>();

  for (const group of modifierGroups) {
    const result = await findOrCreateModifierGroup({
      name: group.name,
      sortOrder: group.sortOrder,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
    });

    modifierGroupMap.set(group.name, result.id);

    for (const modifier of group.modifiers) {
      await findOrCreateModifier(result.id, modifier);
    }
  }

  console.log(`✓ ${modifierGroupMap.size} modifier groups`);

  /*
  |--------------------------------------------------------------------------
  | 3. INGREDIENTS
  |--------------------------------------------------------------------------
  */

  console.log('Creating ingredients...');

  const ingredientMap = new Map<string, string>();

  for (const ingredient of ingredients) {
    const result = await findOrCreateIngredient(
      ingredient.name,
      ingredient.uom,
    );

    ingredientMap.set(ingredient.name, result.id);
  }

  console.log(`✓ ${ingredientMap.size} ingredients`);

  /*
  |--------------------------------------------------------------------------
  | 4. MENU ITEMS
  |--------------------------------------------------------------------------
  */

  console.log('Creating menu items...');

  const menuItemMap = new Map<string, string>();

  for (const item of menuItems) {
    const categoryId = categoryMap.get(item.category);

    if (!categoryId) {
      throw new Error(`Category not found: ${item.category}`);
    }

    let menuItem = await prisma.menuItem.findUnique({
      where: {
        sku: item.sku,
      },
    });

    if (menuItem) {
      menuItem = await prisma.menuItem.update({
        where: {
          id: menuItem.id,
        },
        data: {
          categoryId,
          name: item.name,
          description: item.description,
          basePrice: new Prisma.Decimal(item.price),
          isAvailable: true,
        },
      });
    } else {
      menuItem = await prisma.menuItem.create({
        data: {
          categoryId,
          name: item.name,
          sku: item.sku,
          description: item.description,
          basePrice: new Prisma.Decimal(item.price),
          isAvailable: true,
        },
      });
    }

    menuItemMap.set(item.sku, menuItem.id);

    /*
    |--------------------------------------------------------------------------
    | MENU ITEM → MODIFIER GROUP
    |--------------------------------------------------------------------------
    */

    for (const groupName of item.modifierGroups ?? []) {
      const groupId = modifierGroupMap.get(groupName);

      if (!groupId) {
        throw new Error(`Modifier group not found: ${groupName}`);
      }

      await prisma.itemModifierGroup.upsert({
        where: {
          menuItemId_groupId: {
            menuItemId: menuItem.id,
            groupId,
          },
        },
        update: {},
        create: {
          menuItemId: menuItem.id,
          groupId,
        },
      });
    }
  }

  console.log(`✓ ${menuItemMap.size} menu items`);

  /*
  |--------------------------------------------------------------------------
  | 5. RESTAURANT MENU
  |--------------------------------------------------------------------------
  |
  | Every restaurant gets the same base menu initially.
  | Restaurant-specific overrides are configured below.
  |
  |--------------------------------------------------------------------------
  */

  console.log('Creating restaurant menus...');

  /*
  |--------------------------------------------------------------------------
  | Restaurant-specific price overrides
  |--------------------------------------------------------------------------
  |
  | If an item is not listed here, its global MenuItem price
  | will be used.
  |--------------------------------------------------------------------------
  */

  const priceOverrides: Record<string, Record<string, number>> = {
    'FoodMatrix Indiranagar': {
      'BIR-CHK-001': 299,
      'CUR-PAN-001': 279,
      'DOS-MAS-001': 139,
    },

    'FoodMatrix Whitefield': {
      'BIR-CHK-001': 319,
      'CUR-PAN-001': 289,
      'DOS-MAS-001': 149,
    },

    'FoodMatrix Koramangala': {
      'BIR-CHK-001': 329,
      'CUR-PAN-001': 299,
      'DOS-MAS-001': 159,
    },
  };

  /*
  |--------------------------------------------------------------------------
  | Restaurant-specific unavailable items
  |--------------------------------------------------------------------------
  */

  const unavailableItems: Record<string, string[]> = {
    'FoodMatrix Indiranagar': ['TND-FSH-001'],

    'FoodMatrix Whitefield': ['CUR-MUT-002'],

    'FoodMatrix Koramangala': [],
  };

  for (const restaurant of restaurants) {
    console.log(`  → ${restaurant.name}`);

    for (const item of menuItems) {
      const menuItemId = menuItemMap.get(item.sku);

      if (!menuItemId) {
        throw new Error(`Menu item not found: ${item.sku}`);
      }

      const overridePrice = priceOverrides[restaurant.name]?.[item.sku];

      const price = overridePrice ?? item.price;

      const isAvailable = !unavailableItems[restaurant.name]?.includes(
        item.sku,
      );

      await prisma.restaurantMenuItem.upsert({
        where: {
          restaurantId_menuItemId: {
            restaurantId: restaurant.id,
            menuItemId: menuItemId,
          },
        },

        update: {
          price: new Prisma.Decimal(price),
          isAvailable,
        },

        create: {
          restaurantId: restaurant.id,
          menuItemId: menuItemId,
          price: new Prisma.Decimal(price),
          isAvailable,
        },
      });
    }
  }

  console.log(
    `✓ Restaurant menus created for ${restaurants.length} restaurants`,
  );

  /*
  |--------------------------------------------------------------------------
  | 6. RECIPES
  |--------------------------------------------------------------------------
  */

  console.log('Creating recipes...');

  let recipeCount = 0;

  for (const recipe of recipes) {
    const ingredientId = ingredientMap.get(recipe.ingredient);
    if (!ingredientId) {
      console.error(
        `❌ Missing ingredient in ingredient master: ${recipe.ingredient}`,
      );
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | MENU ITEM RECIPE
    |--------------------------------------------------------------------------
    */

    if (recipe.menuSku) {
      const menuItemId = menuItemMap.get(recipe.menuSku);

      if (!menuItemId) {
        throw new Error(`Menu item not found: ${recipe.menuSku}`);
      }

      const existing = await prisma.recipeItem.findFirst({
        where: {
          menuItemId,
          ingredientId,
        },
      });

      if (existing) {
        await prisma.recipeItem.update({
          where: {
            id: existing.id,
          },
          data: {
            quantityNeeded: new Prisma.Decimal(recipe.quantityNeeded),
          },
        });
      } else {
        await prisma.recipeItem.create({
          data: {
            menuItemId,
            ingredientId,
            quantityNeeded: new Prisma.Decimal(recipe.quantityNeeded),
          },
        });
      }

      recipeCount++;
    }

    /*
    |--------------------------------------------------------------------------
    | MODIFIER RECIPE
    |--------------------------------------------------------------------------
    */

    if (recipe.modifierGroup && recipe.modifierName) {
      const groupId = modifierGroupMap.get(recipe.modifierGroup);

      if (!groupId) {
        throw new Error(`Modifier group not found: ${recipe.modifierGroup}`);
      }

      const modifier = await prisma.modifier.findFirst({
        where: {
          groupId,
          name: recipe.modifierName,
        },
      });

      if (!modifier) {
        throw new Error(`Modifier not found: ${recipe.modifierName}`);
      }

      const existing = await prisma.recipeItem.findFirst({
        where: {
          modifierId: modifier.id,
          ingredientId,
        },
      });

      if (existing) {
        await prisma.recipeItem.update({
          where: {
            id: existing.id,
          },
          data: {
            quantityNeeded: new Prisma.Decimal(recipe.quantityNeeded),
          },
        });
      } else {
        await prisma.recipeItem.create({
          data: {
            modifierId: modifier.id,
            ingredientId,
            quantityNeeded: new Prisma.Decimal(recipe.quantityNeeded),
          },
        });
      }

      recipeCount++;
    }
  }

  console.log(`✓ ${recipeCount} recipe records`);

  /*
  |--------------------------------------------------------------------------
  | FINAL SUMMARY
  |--------------------------------------------------------------------------
  */

  const [
    categoryCount,
    menuItemCount,
    restaurantMenuCount,
    modifierGroupCount,
    modifierCount,
    ingredientCount,
    recipeItemCount,
  ] = await Promise.all([
    prisma.menuCategory.count(),

    prisma.menuItem.count(),

    prisma.restaurantMenuItem.count({
      where: {
        restaurantId: {
          in: restaurants.map((restaurant) => restaurant.id),
        },
      },
    }),

    prisma.modifierGroup.count(),

    prisma.modifier.count(),

    prisma.ingredient.count(),

    prisma.recipeItem.count(),
  ]);

  console.log('');
  console.log('============================================');
  console.log(' SEED COMPLETED');
  console.log('============================================');
  console.log(`Categories        : ${categoryCount}`);
  console.log(`Menu Items        : ${menuItemCount}`);
  console.log(`Restaurant Menus  : ${restaurantMenuCount}`);
  console.log(`Modifier Groups   : ${modifierGroupCount}`);
  console.log(`Modifiers         : ${modifierCount}`);
  console.log(`Ingredients       : ${ingredientCount}`);
  console.log(`Recipe Items      : ${recipeItemCount}`);
  console.log(`Restaurants       : ${restaurants.length}`);
  console.log('============================================');
  console.log('');
}

/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

main()
  .catch((error) => {
    console.error('');
    console.error('❌ Seed failed');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
