export interface WordPair {
  civilian: string;
  undercover: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

// Original word pairs written for Mr. Black. "civilian" is the common word,
// "undercover" is the close-but-different word the Undercover role receives.
export const CATEGORIES = [
  "Food & Drink",
  "Animals",
  "Places",
  "Everyday Objects",
  "Occupations",
  "Entertainment & Sports",
  "Nature",
] as const;

export const WORD_PAIRS: WordPair[] = [
  // Easy — clearly different concepts, low overlap
  { civilian: "Pizza", undercover: "Burger", category: "Food & Drink", difficulty: "easy" },
  { civilian: "Coffee", undercover: "Tea", category: "Food & Drink", difficulty: "easy" },
  { civilian: "Apple", undercover: "Orange", category: "Food & Drink", difficulty: "easy" },
  { civilian: "Cat", undercover: "Dog", category: "Animals", difficulty: "easy" },
  { civilian: "Lion", undercover: "Tiger", category: "Animals", difficulty: "easy" },
  { civilian: "Beach", undercover: "Desert", category: "Places", difficulty: "easy" },
  { civilian: "School", undercover: "Office", category: "Places", difficulty: "easy" },
  { civilian: "Chair", undercover: "Table", category: "Everyday Objects", difficulty: "easy" },
  { civilian: "Phone", undercover: "Laptop", category: "Everyday Objects", difficulty: "easy" },
  { civilian: "Doctor", undercover: "Teacher", category: "Occupations", difficulty: "easy" },
  { civilian: "Football", undercover: "Basketball", category: "Entertainment & Sports", difficulty: "easy" },
  { civilian: "Movie", undercover: "Book", category: "Entertainment & Sports", difficulty: "easy" },
  { civilian: "Rain", undercover: "Snow", category: "Nature", difficulty: "easy" },
  { civilian: "Sun", undercover: "Moon", category: "Nature", difficulty: "easy" },
  { civilian: "Bicycle", undercover: "Car", category: "Everyday Objects", difficulty: "easy" },
  { civilian: "Guitar", undercover: "Piano", category: "Entertainment & Sports", difficulty: "easy" },
  { civilian: "Mountain", undercover: "Hill", category: "Nature", difficulty: "easy" },
  { civilian: "Library", undercover: "Museum", category: "Places", difficulty: "easy" },
  { civilian: "Chef", undercover: "Waiter", category: "Occupations", difficulty: "easy" },
  { civilian: "Ice Cream", undercover: "Cake", category: "Food & Drink", difficulty: "easy" },
  { civilian: "Elephant", undercover: "Rhino", category: "Animals", difficulty: "easy" },
  { civilian: "Airport", undercover: "Train Station", category: "Places", difficulty: "easy" },
  { civilian: "Umbrella", undercover: "Raincoat", category: "Everyday Objects", difficulty: "easy" },
  { civilian: "Police Officer", undercover: "Firefighter", category: "Occupations", difficulty: "easy" },
  { civilian: "Swimming", undercover: "Diving", category: "Entertainment & Sports", difficulty: "easy" },

  // Medium — same general category, but a sharper distinction is needed
  { civilian: "Burger", undercover: "Sandwich", category: "Food & Drink", difficulty: "medium" },
  { civilian: "Wolf", undercover: "Fox", category: "Animals", difficulty: "medium" },
  { civilian: "River", undercover: "Lake", category: "Nature", difficulty: "medium" },
  { civilian: "Hotel", undercover: "Hostel", category: "Places", difficulty: "medium" },
  { civilian: "Backpack", undercover: "Suitcase", category: "Everyday Objects", difficulty: "medium" },
  { civilian: "Nurse", undercover: "Doctor", category: "Occupations", difficulty: "medium" },
  { civilian: "Tennis", undercover: "Badminton", category: "Entertainment & Sports", difficulty: "medium" },
  { civilian: "Sofa", undercover: "Armchair", category: "Everyday Objects", difficulty: "medium" },
  { civilian: "Pasta", undercover: "Noodles", category: "Food & Drink", difficulty: "medium" },
  { civilian: "Butterfly", undercover: "Moth", category: "Animals", difficulty: "medium" },
  { civilian: "Village", undercover: "Town", category: "Places", difficulty: "medium" },
  { civilian: "Novel", undercover: "Short Story", category: "Entertainment & Sports", difficulty: "medium" },
  { civilian: "Sculptor", undercover: "Painter", category: "Occupations", difficulty: "medium" },
  { civilian: "Volcano", undercover: "Earthquake", category: "Nature", difficulty: "medium" },
  { civilian: "Sunglasses", undercover: "Goggles", category: "Everyday Objects", difficulty: "medium" },
  { civilian: "Croissant", undercover: "Bagel", category: "Food & Drink", difficulty: "medium" },
  { civilian: "Falcon", undercover: "Eagle", category: "Animals", difficulty: "medium" },
  { civilian: "Castle", undercover: "Palace", category: "Places", difficulty: "medium" },
  { civilian: "Violin", undercover: "Cello", category: "Entertainment & Sports", difficulty: "medium" },
  { civilian: "Pilot", undercover: "Astronaut", category: "Occupations", difficulty: "medium" },
  { civilian: "Forest", undercover: "Jungle", category: "Nature", difficulty: "medium" },
  { civilian: "Sandcastle", undercover: "Snowman", category: "Everyday Objects", difficulty: "medium" },
  { civilian: "Milkshake", undercover: "Smoothie", category: "Food & Drink", difficulty: "medium" },
  { civilian: "Dolphin", undercover: "Shark", category: "Animals", difficulty: "medium" },
  { civilian: "Stadium", undercover: "Arena", category: "Places", difficulty: "medium" },

  // Hard — near-synonyms, very subtle distinction
  { civilian: "Ocean", undercover: "Sea", category: "Nature", difficulty: "hard" },
  { civilian: "Actor", undercover: "Actress", category: "Occupations", difficulty: "hard" },
  { civilian: "Cup", undercover: "Mug", category: "Everyday Objects", difficulty: "hard" },
  { civilian: "Soda", undercover: "Cola", category: "Food & Drink", difficulty: "hard" },
  { civilian: "Street", undercover: "Road", category: "Places", difficulty: "hard" },
  { civilian: "Rabbit", undercover: "Hare", category: "Animals", difficulty: "hard" },
  { civilian: "Jog", undercover: "Run", category: "Entertainment & Sports", difficulty: "hard" },
  { civilian: "Jacket", undercover: "Coat", category: "Everyday Objects", difficulty: "hard" },
  { civilian: "Lawyer", undercover: "Attorney", category: "Occupations", difficulty: "hard" },
  { civilian: "Storm", undercover: "Hurricane", category: "Nature", difficulty: "hard" },
  { civilian: "Bread", undercover: "Toast", category: "Food & Drink", difficulty: "hard" },
  { civilian: "Alley", undercover: "Lane", category: "Places", difficulty: "hard" },
  { civilian: "Frog", undercover: "Toad", category: "Animals", difficulty: "hard" },
  { civilian: "Comedy", undercover: "Sitcom", category: "Entertainment & Sports", difficulty: "hard" },
  { civilian: "Wallet", undercover: "Purse", category: "Everyday Objects", difficulty: "hard" },
  { civilian: "Professor", undercover: "Lecturer", category: "Occupations", difficulty: "hard" },
  { civilian: "Breeze", undercover: "Wind", category: "Nature", difficulty: "hard" },
  { civilian: "Juice", undercover: "Squash", category: "Food & Drink", difficulty: "hard" },
  { civilian: "Alley Cat", undercover: "Stray Cat", category: "Animals", difficulty: "hard" },
  { civilian: "Cinema", undercover: "Theatre", category: "Places", difficulty: "hard" },
  { civilian: "Sprint", undercover: "Dash", category: "Entertainment & Sports", difficulty: "hard" },
  { civilian: "Boots", undercover: "Shoes", category: "Everyday Objects", difficulty: "hard" },
  { civilian: "Chef", undercover: "Cook", category: "Occupations", difficulty: "hard" },
  { civilian: "Fog", undercover: "Mist", category: "Nature", difficulty: "hard" },
  { civilian: "Cupcake", undercover: "Muffin", category: "Food & Drink", difficulty: "hard" },
];

export function pickWordPair(
  difficulty: "easy" | "medium" | "hard" | "any",
  categories: string[]
): WordPair {
  let pool = WORD_PAIRS;
  if (difficulty !== "any") {
    pool = pool.filter((p) => p.difficulty === difficulty);
  }
  if (categories.length > 0) {
    const filtered = pool.filter((p) => categories.includes(p.category));
    if (filtered.length > 0) pool = filtered;
  }
  if (pool.length === 0) pool = WORD_PAIRS;
  return pool[Math.floor(Math.random() * pool.length)];
}
