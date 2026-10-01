/**
 * Food guidance shown on the Food tab.
 *
 * Static on purpose: this is reference reading, not something logged, so it
 * lives in code and loads with the page. Edit the lists here to change it.
 *
 * Written for the current goal — waist and visceral fat — so the emphasis is
 * protein to protect muscle, fibre to stay full, and cutting the calories that
 * arrive without being noticed: sugar in drinks, oil in fried food.
 */

export const RULES = [
  { title: "Protein every meal", text: "A palm-sized portion. It keeps you full and protects muscle while fat comes off." },
  { title: "Half the plate vegetables", text: "Fills you up for very few calories. Rice gets a fist-sized share, not the whole plate." },
  { title: "Drinks count", text: "Most hidden sugar arrives in a cup. Default to water, plain tea or black coffee." },
];

export const EVERYDAY = {
  eat: [
    { name: "Eggs, chicken, fish, lean beef", note: "Your main protein. Grilled, boiled, steamed or stir-fried." },
    { name: "Tempe and tofu", note: "Cheap, filling protein — steamed, grilled or tumis, not deep-fried." },
    { name: "Vegetables", note: "Sayur bening, cap cay, lalapan, gado-gado with the peanut sauce kept light." },
    { name: "Whole fruit", note: "Papaya, guava, apple, orange. Whole beats juice: the fibre stays in." },
    { name: "Rice in a measured portion", note: "One fist per meal. Brown rice, potatoes or sweet potato for a change." },
    { name: "Greek yogurt, plain milk", note: "Protein for snacks. Pick unsweetened." },
    { name: "Water, plain tea, black coffee", note: "Drink these by default; aim for a big bottle of water a day." },
  ],
  limit: [
    { name: "Sweet drinks", note: "Es teh manis, boba, soda, packaged juice. The biggest single source of sugar for most people." },
    { name: "Fried food", note: "Gorengan, fried chicken skin, kerupuk. Oil doubles the calories without filling you up." },
    { name: "Big portions of refined carbs", note: "Extra rice, white bread, instant noodles, nasi or mie goreng." },
    { name: "Sweets and pastries", note: "Martabak manis, cakes, biscuits. Fine as a treat, not as a habit." },
    { name: "Coconut-milk dishes", note: "Rendang, gulai, opor. Good sometimes — just heavy, so not every day." },
    { name: "Alcohol", note: "Calories with nothing to show for them, and fat burning pauses while you process it." },
    { name: "Late, heavy meals and grazing", note: "Snacking out of boredom adds up faster than any single meal." },
  ],
};

export const CAFE = {
  eat: [
    { name: "Americano, long black, espresso", note: "Close to zero calories." },
    { name: "Cold brew or plain iced coffee", note: "Add a splash of milk if you like, not syrup." },
    { name: "Latte or flat white, no syrup", note: "The milk adds some protein. Ask for less sugar or none." },
    { name: "Unsweetened tea", note: "Hot or iced — say “no sugar” when ordering, it is often added by default." },
    { name: "Egg dishes", note: "Scrambled eggs, omelette, eggs on toast." },
    { name: "A bowl or sandwich with real protein", note: "Grilled chicken, tuna or beef — a rice bowl or sandwich, not a pastry." },
    { name: "Salad with protein", note: "Dressing on the side, so you decide how much goes on." },
  ],
  limit: [
    { name: "Kopi susu gula aren", note: "Palm-sugar lattes carry several teaspoons of sugar per cup." },
    { name: "Frappés and blended drinks", note: "Basically a milkshake, especially with whipped cream on top." },
    { name: "Flavoured syrups", note: "Caramel, hazelnut, vanilla — each pump is sugar." },
    { name: "Matcha, chocolate, red velvet lattes", note: "Usually made from pre-sweetened powder, so “less sugar” barely helps." },
    { name: "Croissants, pastries, cakes, cookies", note: "Butter and sugar, gone in minutes, hungry again soon after." },
    { name: "Fries, nachos, snack platters", note: "Fried and easy to overeat while talking." },
    { name: "Cream pasta", note: "Carbonara and alfredo are mostly cream and refined carbs." },
  ],
  swaps: [
    { from: "Kopi susu gula aren", to: "Latte, less sugar" },
    { from: "Caramel frappé", to: "Cold brew with milk" },
    { from: "Es teh manis", to: "Unsweetened iced tea" },
    { from: "Croissant", to: "Eggs on toast" },
    { from: "Fries", to: "Side salad or soup" },
    { from: "Carbonara", to: "Grilled chicken rice bowl" },
  ],
};
