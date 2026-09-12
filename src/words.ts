export interface WordPair {
  civilian: string;
  undercover: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export const WORD_PAIRS: WordPair[] = [
  // Food
  { civilian: "Pizza", undercover: "Calzone", category: "Food", difficulty: "hard" },
  { civilian: "Pizza", undercover: "Burger", category: "Food", difficulty: "medium" },
  { civilian: "Sushi", undercover: "Sashimi", category: "Food", difficulty: "hard" },
  { civilian: "Burger", undercover: "Sandwich", category: "Food", difficulty: "hard" },
  { civilian: "Pasta", undercover: "Noodles", category: "Food", difficulty: "hard" },
  { civilian: "Taco", undercover: "Burrito", category: "Food", difficulty: "hard" },
  { civilian: "Pancake", undercover: "Waffle", category: "Food", difficulty: "hard" },
  { civilian: "Donut", undercover: "Bagel", category: "Food", difficulty: "medium" },
  { civilian: "Ice Cream", undercover: "Gelato", category: "Food", difficulty: "hard" },
  { civilian: "Chocolate", undercover: "Candy", category: "Food", difficulty: "medium" },
  { civilian: "Apple", undercover: "Pear", category: "Food", difficulty: "hard" },
  { civilian: "Banana", undercover: "Plantain", category: "Food", difficulty: "hard" },
  { civilian: "Bread", undercover: "Toast", category: "Food", difficulty: "hard" },
  { civilian: "Soup", undercover: "Stew", category: "Food", difficulty: "hard" },
  { civilian: "Fries", undercover: "Chips", category: "Food", difficulty: "hard" },
  { civilian: "Cupcake", undercover: "Muffin", category: "Food", difficulty: "hard" },
  { civilian: "Cookie", undercover: "Biscuit", category: "Food", difficulty: "hard" },
  { civilian: "Ramen", undercover: "Pho", category: "Food", difficulty: "hard" },
  { civilian: "Croissant", undercover: "Brioche", category: "Food", difficulty: "hard" },
  { civilian: "Lemon", undercover: "Lime", category: "Food", difficulty: "hard" },
  { civilian: "Strawberry", undercover: "Raspberry", category: "Food", difficulty: "hard" },
  { civilian: "Peach", undercover: "Nectarine", category: "Food", difficulty: "hard" },

  // Drinks
  { civilian: "Coffee", undercover: "Espresso", category: "Drinks", difficulty: "hard" },
  { civilian: "Latte", undercover: "Cappuccino", category: "Drinks", difficulty: "hard" },
  { civilian: "Whiskey", undercover: "Bourbon", category: "Drinks", difficulty: "hard" },
  { civilian: "Milk", undercover: "Cream", category: "Drinks", difficulty: "hard" },
  { civilian: "Smoothie", undercover: "Milkshake", category: "Drinks", difficulty: "hard" },
  { civilian: "Cocktail", undercover: "Mocktail", category: "Drinks", difficulty: "hard" },
  { civilian: "Sake", undercover: "Soju", category: "Drinks", difficulty: "hard" },
  { civilian: "Coffee", undercover: "Black Tea", category: "Drinks", difficulty: "medium" },
  { civilian: "Beer", undercover: "Cider", category: "Drinks", difficulty: "medium" },
  { civilian: "Cola", undercover: "Root Beer", category: "Drinks", difficulty: "medium" },
  { civilian: "Wine", undercover: "Champagne", category: "Drinks", difficulty: "medium" },
  { civilian: "Tea", undercover: "Coffee", category: "Drinks", difficulty: "medium" },
  { civilian: "Matcha", undercover: "Green Tea", category: "Drinks", difficulty: "hard" },
  { civilian: "Vodka", undercover: "Gin", category: "Drinks", difficulty: "hard" },
  { civilian: "Tequila", undercover: "Mezcal", category: "Drinks", difficulty: "hard" },
  { civilian: "Lemonade", undercover: "Limeade", category: "Drinks", difficulty: "hard" },

  // Animals
  { civilian: "Lion", undercover: "Tiger", category: "Animals", difficulty: "hard" },
  { civilian: "Crocodile", undercover: "Alligator", category: "Animals", difficulty: "hard" },
  { civilian: "Frog", undercover: "Toad", category: "Animals", difficulty: "hard" },
  { civilian: "Horse", undercover: "Donkey", category: "Animals", difficulty: "hard" },
  { civilian: "Eagle", undercover: "Hawk", category: "Animals", difficulty: "hard" },
  { civilian: "Rabbit", undercover: "Hare", category: "Animals", difficulty: "hard" },
  { civilian: "Bee", undercover: "Wasp", category: "Animals", difficulty: "hard" },
  { civilian: "Penguin", undercover: "Puffin", category: "Animals", difficulty: "hard" },
  { civilian: "Butterfly", undercover: "Moth", category: "Animals", difficulty: "hard" },
  { civilian: "Turtle", undercover: "Tortoise", category: "Animals", difficulty: "hard" },
  { civilian: "Mouse", undercover: "Rat", category: "Animals", difficulty: "hard" },
  { civilian: "Squirrel", undercover: "Chipmunk", category: "Animals", difficulty: "hard" },
  { civilian: "Fox", undercover: "Coyote", category: "Animals", difficulty: "hard" },
  { civilian: "Octopus", undercover: "Squid", category: "Animals", difficulty: "hard" },
  { civilian: "Crab", undercover: "Lobster", category: "Animals", difficulty: "hard" },
  { civilian: "Dog", undercover: "Wolf", category: "Animals", difficulty: "medium" },
  { civilian: "Cat", undercover: "Tiger", category: "Animals", difficulty: "medium" },
  { civilian: "Shark", undercover: "Dolphin", category: "Animals", difficulty: "medium" },
  { civilian: "Bear", undercover: "Panda", category: "Animals", difficulty: "medium" },
  { civilian: "Goat", undercover: "Sheep", category: "Animals", difficulty: "medium" },
  { civilian: "Zebra", undercover: "Horse", category: "Animals", difficulty: "medium" },
  { civilian: "Giraffe", undercover: "Camel", category: "Animals", difficulty: "easy" },
  { civilian: "Whale", undercover: "Shark", category: "Animals", difficulty: "easy" },

  // Places
  { civilian: "Mountain", undercover: "Hill", category: "Places", difficulty: "hard" },
  { civilian: "Forest", undercover: "Jungle", category: "Places", difficulty: "hard" },
  { civilian: "City", undercover: "Town", category: "Places", difficulty: "hard" },
  { civilian: "Library", undercover: "Bookstore", category: "Places", difficulty: "hard" },
  { civilian: "Hospital", undercover: "Clinic", category: "Places", difficulty: "hard" },
  { civilian: "Cinema", undercover: "Theatre", category: "Places", difficulty: "hard" },
  { civilian: "Hotel", undercover: "Motel", category: "Places", difficulty: "hard" },
  { civilian: "Park", undercover: "Garden", category: "Places", difficulty: "hard" },
  { civilian: "Castle", undercover: "Palace", category: "Places", difficulty: "hard" },
  { civilian: "Restaurant", undercover: "Bistro", category: "Places", difficulty: "hard" },
  { civilian: "Bar", undercover: "Pub", category: "Places", difficulty: "hard" },
  { civilian: "Museum", undercover: "Gallery", category: "Places", difficulty: "hard" },
  { civilian: "Stadium", undercover: "Arena", category: "Places", difficulty: "hard" },
  { civilian: "Subway", undercover: "Metro", category: "Places", difficulty: "hard" },
  { civilian: "Harbor", undercover: "Marina", category: "Places", difficulty: "hard" },
  { civilian: "Cabin", undercover: "Chalet", category: "Places", difficulty: "hard" },
  { civilian: "Farm", undercover: "Ranch", category: "Places", difficulty: "hard" },
  { civilian: "Church", undercover: "Cathedral", category: "Places", difficulty: "hard" },
  { civilian: "Beach", undercover: "Lake", category: "Places", difficulty: "medium" },
  { civilian: "Beach", undercover: "Pool", category: "Places", difficulty: "medium" },
  { civilian: "Gym", undercover: "Studio", category: "Places", difficulty: "medium" },
  { civilian: "Airport", undercover: "Train Station", category: "Places", difficulty: "medium" },
  { civilian: "Bakery", undercover: "Cafe", category: "Places", difficulty: "medium" },
  { civilian: "Aquarium", undercover: "Zoo", category: "Places", difficulty: "medium" },
  { civilian: "Island", undercover: "Peninsula", category: "Places", difficulty: "medium" },
  { civilian: "Cave", undercover: "Mine", category: "Places", difficulty: "medium" },
  { civilian: "Desert", undercover: "Beach", category: "Places", difficulty: "easy" },

  // Sports
  { civilian: "Football", undercover: "Rugby", category: "Sports", difficulty: "hard" },
  { civilian: "Tennis", undercover: "Badminton", category: "Sports", difficulty: "hard" },
  { civilian: "Boxing", undercover: "MMA", category: "Sports", difficulty: "hard" },
  { civilian: "Swimming", undercover: "Diving", category: "Sports", difficulty: "hard" },
  { civilian: "Skiing", undercover: "Snowboarding", category: "Sports", difficulty: "hard" },
  { civilian: "Golf", undercover: "Mini Golf", category: "Sports", difficulty: "hard" },
  { civilian: "Hockey", undercover: "Lacrosse", category: "Sports", difficulty: "hard" },
  { civilian: "Soccer", undercover: "Futsal", category: "Sports", difficulty: "hard" },
  { civilian: "Cycling", undercover: "BMX", category: "Sports", difficulty: "hard" },
  { civilian: "Surfing", undercover: "Bodyboarding", category: "Sports", difficulty: "hard" },
  { civilian: "Skateboard", undercover: "Rollerblade", category: "Sports", difficulty: "hard" },
  { civilian: "Fencing", undercover: "Kendo", category: "Sports", difficulty: "hard" },
  { civilian: "Wrestling", undercover: "Judo", category: "Sports", difficulty: "hard" },
  { civilian: "Karate", undercover: "Taekwondo", category: "Sports", difficulty: "hard" },
  { civilian: "Yoga", undercover: "Pilates", category: "Sports", difficulty: "hard" },
  { civilian: "Billiards", undercover: "Snooker", category: "Sports", difficulty: "hard" },
  { civilian: "Rowing", undercover: "Canoeing", category: "Sports", difficulty: "hard" },
  { civilian: "Climbing", undercover: "Bouldering", category: "Sports", difficulty: "hard" },
  { civilian: "Basketball", undercover: "Volleyball", category: "Sports", difficulty: "medium" },
  { civilian: "Cricket", undercover: "Baseball", category: "Sports", difficulty: "medium" },
  { civilian: "Chess", undercover: "Checkers", category: "Sports", difficulty: "medium" },
  { civilian: "Archery", undercover: "Darts", category: "Sports", difficulty: "medium" },
  { civilian: "Bowling", undercover: "Lawn Bowls", category: "Sports", difficulty: "medium" },
  { civilian: "Sailing", undercover: "Windsurfing", category: "Sports", difficulty: "medium" },

  // Tech
  { civilian: "Google", undercover: "Bing", category: "Tech", difficulty: "hard" },
  { civilian: "Netflix", undercover: "Disney+", category: "Tech", difficulty: "hard" },
  { civilian: "Instagram", undercover: "Snapchat", category: "Tech", difficulty: "hard" },
  { civilian: "Twitter", undercover: "Threads", category: "Tech", difficulty: "hard" },
  { civilian: "WhatsApp", undercover: "Telegram", category: "Tech", difficulty: "hard" },
  { civilian: "PlayStation", undercover: "Xbox", category: "Tech", difficulty: "hard" },
  { civilian: "Bitcoin", undercover: "Ethereum", category: "Tech", difficulty: "hard" },
  { civilian: "MacBook", undercover: "Surface", category: "Tech", difficulty: "hard" },
  { civilian: "Chrome", undercover: "Firefox", category: "Tech", difficulty: "hard" },
  { civilian: "Spotify", undercover: "Apple Music", category: "Tech", difficulty: "hard" },
  { civilian: "Twitch", undercover: "Kick", category: "Tech", difficulty: "hard" },
  { civilian: "Zoom", undercover: "Teams", category: "Tech", difficulty: "hard" },
  { civilian: "Uber", undercover: "Lyft", category: "Tech", difficulty: "hard" },
  { civilian: "Airbnb", undercover: "Vrbo", category: "Tech", difficulty: "hard" },
  { civilian: "Steam", undercover: "Epic Games", category: "Tech", difficulty: "hard" },
  { civilian: "Fortnite", undercover: "Apex Legends", category: "Tech", difficulty: "hard" },
  { civilian: "Router", undercover: "Modem", category: "Tech", difficulty: "hard" },
  { civilian: "Headphones", undercover: "Earbuds", category: "Tech", difficulty: "hard" },
  { civilian: "iPhone", undercover: "Android", category: "Tech", difficulty: "medium" },
  { civilian: "YouTube", undercover: "TikTok", category: "Tech", difficulty: "medium" },
  { civilian: "Facebook", undercover: "LinkedIn", category: "Tech", difficulty: "medium" },
  { civilian: "Reddit", undercover: "Quora", category: "Tech", difficulty: "medium" },
  { civilian: "Discord", undercover: "Slack", category: "Tech", difficulty: "medium" },
  { civilian: "Nintendo", undercover: "Sega", category: "Tech", difficulty: "medium" },
  { civilian: "Minecraft", undercover: "Roblox", category: "Tech", difficulty: "medium" },
  { civilian: "Wi-Fi", undercover: "Bluetooth", category: "Tech", difficulty: "medium" },
  { civilian: "Monitor", undercover: "Television", category: "Tech", difficulty: "medium" },

  // Nature
  { civilian: "River", undercover: "Stream", category: "Nature", difficulty: "hard" },
  { civilian: "Ocean", undercover: "Sea", category: "Nature", difficulty: "hard" },
  { civilian: "Tornado", undercover: "Hurricane", category: "Nature", difficulty: "hard" },
  { civilian: "Rose", undercover: "Tulip", category: "Nature", difficulty: "hard" },
  { civilian: "Oak", undercover: "Maple", category: "Nature", difficulty: "hard" },
  { civilian: "Pine", undercover: "Fir", category: "Nature", difficulty: "hard" },
  { civilian: "Sunflower", undercover: "Daisy", category: "Nature", difficulty: "hard" },
  { civilian: "Lily", undercover: "Orchid", category: "Nature", difficulty: "hard" },
  { civilian: "Mushroom", undercover: "Truffle", category: "Nature", difficulty: "hard" },
  { civilian: "Thunder", undercover: "Lightning", category: "Nature", difficulty: "hard" },
  { civilian: "Fog", undercover: "Mist", category: "Nature", difficulty: "hard" },
  { civilian: "Hail", undercover: "Sleet", category: "Nature", difficulty: "hard" },
  { civilian: "Cliff", undercover: "Bluff", category: "Nature", difficulty: "hard" },
  { civilian: "Canyon", undercover: "Valley", category: "Nature", difficulty: "hard" },
  { civilian: "Glacier", undercover: "Iceberg", category: "Nature", difficulty: "hard" },
  { civilian: "Comet", undercover: "Asteroid", category: "Nature", difficulty: "hard" },
  { civilian: "Rain", undercover: "Snow", category: "Nature", difficulty: "medium" },
  { civilian: "Cactus", undercover: "Succulent", category: "Nature", difficulty: "medium" },
  { civilian: "Coral", undercover: "Sponge", category: "Nature", difficulty: "medium" },
  { civilian: "Earthquake", undercover: "Landslide", category: "Nature", difficulty: "medium" },
  { civilian: "Aurora", undercover: "Eclipse", category: "Nature", difficulty: "medium" },
  { civilian: "Sun", undercover: "Moon", category: "Nature", difficulty: "easy" },

  // Objects
  { civilian: "Pen", undercover: "Pencil", category: "Objects", difficulty: "hard" },
  { civilian: "Guitar", undercover: "Ukulele", category: "Objects", difficulty: "hard" },
  { civilian: "Piano", undercover: "Keyboard", category: "Objects", difficulty: "hard" },
  { civilian: "Clock", undercover: "Watch", category: "Objects", difficulty: "hard" },
  { civilian: "Camera", undercover: "Phone Camera", category: "Objects", difficulty: "hard" },
  { civilian: "Chair", undercover: "Stool", category: "Objects", difficulty: "hard" },
  { civilian: "Sofa", undercover: "Couch", category: "Objects", difficulty: "hard" },
  { civilian: "Pillow", undercover: "Cushion", category: "Objects", difficulty: "hard" },
  { civilian: "Blanket", undercover: "Quilt", category: "Objects", difficulty: "hard" },
  { civilian: "Lamp", undercover: "Lantern", category: "Objects", difficulty: "hard" },
  { civilian: "Hammer", undercover: "Mallet", category: "Objects", difficulty: "hard" },
  { civilian: "Scissors", undercover: "Shears", category: "Objects", difficulty: "hard" },
  { civilian: "Mug", undercover: "Cup", category: "Objects", difficulty: "hard" },
  { civilian: "Bowl", undercover: "Plate", category: "Objects", difficulty: "hard" },
  { civilian: "Bottle", undercover: "Flask", category: "Objects", difficulty: "hard" },
  { civilian: "Umbrella", undercover: "Parasol", category: "Objects", difficulty: "hard" },
  { civilian: "Wallet", undercover: "Purse", category: "Objects", difficulty: "hard" },
  { civilian: "Glasses", undercover: "Goggles", category: "Objects", difficulty: "hard" },
  { civilian: "Necklace", undercover: "Pendant", category: "Objects", difficulty: "hard" },
  { civilian: "Trophy", undercover: "Medal", category: "Objects", difficulty: "hard" },
  { civilian: "Telescope", undercover: "Binoculars", category: "Objects", difficulty: "hard" },
  { civilian: "Flute", undercover: "Clarinet", category: "Objects", difficulty: "hard" },
  { civilian: "Violin", undercover: "Cello", category: "Objects", difficulty: "hard" },
  { civilian: "Phone", undercover: "Tablet", category: "Objects", difficulty: "medium" },
  { civilian: "Laptop", undercover: "Desktop", category: "Objects", difficulty: "medium" },
  { civilian: "Book", undercover: "Magazine", category: "Objects", difficulty: "medium" },
  { civilian: "Backpack", undercover: "Suitcase", category: "Objects", difficulty: "medium" },
  { civilian: "Mirror", undercover: "Window", category: "Objects", difficulty: "medium" },
  { civilian: "Bicycle", undercover: "Motorbike", category: "Objects", difficulty: "medium" },
  { civilian: "Bed", undercover: "Mattress", category: "Objects", difficulty: "medium" },
  { civilian: "Door", undercover: "Gate", category: "Objects", difficulty: "medium" },
  { civilian: "Key", undercover: "Lock", category: "Objects", difficulty: "medium" },
  { civilian: "Rope", undercover: "Cable", category: "Objects", difficulty: "medium" },
  { civilian: "Fork", undercover: "Spoon", category: "Objects", difficulty: "medium" },

  // People & Roles
  { civilian: "Teacher", undercover: "Professor", category: "People & Roles", difficulty: "hard" },
  { civilian: "Chef", undercover: "Baker", category: "People & Roles", difficulty: "hard" },
  { civilian: "Author", undercover: "Journalist", category: "People & Roles", difficulty: "hard" },
  { civilian: "Magician", undercover: "Illusionist", category: "People & Roles", difficulty: "hard" },
  { civilian: "Dentist", undercover: "Orthodontist", category: "People & Roles", difficulty: "hard" },
  { civilian: "Surgeon", undercover: "Anesthesiologist", category: "People & Roles", difficulty: "hard" },
  { civilian: "Carpenter", undercover: "Mason", category: "People & Roles", difficulty: "hard" },
  { civilian: "Mechanic", undercover: "Technician", category: "People & Roles", difficulty: "hard" },
  { civilian: "Tattoo Artist", undercover: "Piercer", category: "People & Roles", difficulty: "hard" },
  { civilian: "Barber", undercover: "Hairdresser", category: "People & Roles", difficulty: "hard" },
  { civilian: "Florist", undercover: "Gardener", category: "People & Roles", difficulty: "hard" },
  { civilian: "Photographer", undercover: "Videographer", category: "People & Roles", difficulty: "hard" },
  { civilian: "Painter", undercover: "Illustrator", category: "People & Roles", difficulty: "hard" },
  { civilian: "Sculptor", undercover: "Potter", category: "People & Roles", difficulty: "hard" },
  { civilian: "Dancer", undercover: "Choreographer", category: "People & Roles", difficulty: "hard" },
  { civilian: "Referee", undercover: "Umpire", category: "People & Roles", difficulty: "hard" },
  { civilian: "King", undercover: "Emperor", category: "People & Roles", difficulty: "hard" },
  { civilian: "Prince", undercover: "Duke", category: "People & Roles", difficulty: "hard" },
  { civilian: "Knight", undercover: "Samurai", category: "People & Roles", difficulty: "hard" },
  { civilian: "Pirate", undercover: "Buccaneer", category: "People & Roles", difficulty: "hard" },
  { civilian: "Doctor", undercover: "Nurse", category: "People & Roles", difficulty: "medium" },
  { civilian: "Pilot", undercover: "Flight Attendant", category: "People & Roles", difficulty: "medium" },
  { civilian: "Firefighter", undercover: "Police Officer", category: "People & Roles", difficulty: "medium" },
  { civilian: "Lawyer", undercover: "Judge", category: "People & Roles", difficulty: "medium" },
  { civilian: "Singer", undercover: "Rapper", category: "People & Roles", difficulty: "medium" },
  { civilian: "Actor", undercover: "Comedian", category: "People & Roles", difficulty: "medium" },
  { civilian: "Engineer", undercover: "Architect", category: "People & Roles", difficulty: "medium" },
  { civilian: "Plumber", undercover: "Electrician", category: "People & Roles", difficulty: "medium" },
  { civilian: "Tailor", undercover: "Cobbler", category: "People & Roles", difficulty: "medium" },
  { civilian: "Director", undercover: "Producer", category: "People & Roles", difficulty: "medium" },
  { civilian: "Athlete", undercover: "Coach", category: "People & Roles", difficulty: "medium" },
  { civilian: "Spy", undercover: "Detective", category: "People & Roles", difficulty: "medium" },

  // Movies & TV
  { civilian: "Star Wars", undercover: "Star Trek", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Avengers", undercover: "Justice League", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Spider-Man", undercover: "Daredevil", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Frozen", undercover: "Tangled", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Pokémon", undercover: "Digimon", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Superman", undercover: "Captain America", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Joker", undercover: "Thanos", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Inception", undercover: "Interstellar", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Shrek", undercover: "Monsters Inc", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Toy Story", undercover: "Cars", category: "Movies & TV", difficulty: "hard" },
  { civilian: "The Lion King", undercover: "The Jungle Book", category: "Movies & TV", difficulty: "hard" },
  { civilian: "The Matrix", undercover: "Equilibrium", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Breaking Bad", undercover: "Better Call Saul", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Friends", undercover: "How I Met Your Mother", category: "Movies & TV", difficulty: "hard" },
  { civilian: "The Office", undercover: "Parks and Recreation", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Game of Thrones", undercover: "The Witcher", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Seinfeld", undercover: "Curb Your Enthusiasm", category: "Movies & TV", difficulty: "hard" },
  { civilian: "The Simpsons", undercover: "Family Guy", category: "Movies & TV", difficulty: "hard" },
  { civilian: "Batman", undercover: "Iron Man", category: "Movies & TV", difficulty: "medium" },
  { civilian: "Mario", undercover: "Sonic", category: "Movies & TV", difficulty: "medium" },
  { civilian: "Thor", undercover: "Hulk", category: "Movies & TV", difficulty: "medium" },
  { civilian: "Stranger Things", undercover: "Dark", category: "Movies & TV", difficulty: "medium" },
  { civilian: "Harry Potter", undercover: "Lord of the Rings", category: "Movies & TV", difficulty: "easy" },
  { civilian: "Titanic", undercover: "Avatar", category: "Movies & TV", difficulty: "easy" },

  // Music
  { civilian: "Beyonce", undercover: "Rihanna", category: "Music", difficulty: "hard" },
  { civilian: "Taylor Swift", undercover: "Olivia Rodrigo", category: "Music", difficulty: "hard" },
  { civilian: "Drake", undercover: "Kendrick", category: "Music", difficulty: "hard" },
];

export interface DrawnPair {
  civilian: string;
  undercover: string;
  category: string;
}

// A pair's stable id is its index into WORD_PAIRS (the array order never changes at runtime).
export function wordPairId(index: number): string {
  return String(index);
}

export function listWordPairs(): Array<WordPair & { id: string }> {
  return WORD_PAIRS.map((p, i) => ({ ...p, id: wordPairId(i) }));
}

// Host-written pairs are always eligible — they were added on purpose, so they
// skip both the difficulty filter and the per-pair toggles.
export function pickWordPair(
  difficulty: "any" | "easy" | "medium" | "hard",
  disabledIds: string[] = [],
  customPairs: Array<{ civilian: string; undercover: string }> = [],
  mode: "all" | "pick" | "custom" = "all"
): DrawnPair {
  const custom: DrawnPair[] = customPairs.map((p) => ({
    civilian: p.civilian,
    undercover: p.undercover,
    category: "Your words",
  }));

  if (mode === "custom" && custom.length > 0) {
    return custom[Math.floor(Math.random() * custom.length)];
  }

  const disabled = new Set(disabledIds);
  const matchesDifficulty = (p: WordPair) => difficulty === "any" || p.difficulty === difficulty;
  const builtin = WORD_PAIRS.filter(
    (p, i) => matchesDifficulty(p) && (mode === "all" || !disabled.has(wordPairId(i)))
  );

  let pool: DrawnPair[] = [...builtin, ...custom];
  if (pool.length === 0) pool = WORD_PAIRS.filter(matchesDifficulty);
  if (pool.length === 0) pool = WORD_PAIRS;
  return pool[Math.floor(Math.random() * pool.length)];
}
