// Anime character configurations and image URLs
export interface AnimeCharacter {
  name: string;
  avatar: string;
  personality: string;
  greeting: string;
  color: string;
  description: string;
}

export const ANIME_CHARACTERS: AnimeCharacter[] = [
  {
    name: "Luna",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
    personality: "friendly and helpful",
    greeting: "Hi! I'm Luna, your TrustLedger assistant! How can I help you today? 🌟",
    color: "purple",
    description: "A cheerful and energetic assistant who loves helping users explore the platform"
  },
  {
    name: "Kai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
    personality: "professional and knowledgeable",
    greeting: "Hello! I'm Kai, your financial transparency guide. What would you like to know? 💼",
    color: "blue",
    description: "A professional and reliable assistant focused on financial data and analytics"
  },
  {
    name: "Maya",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format&q=80",
    personality: "enthusiastic and supportive",
    greeting: "Hey there! I'm Maya! Ready to explore your fund flows together? ✨",
    color: "pink",
    description: "An enthusiastic and creative assistant who makes complex data easy to understand"
  }
];

// Fallback avatar for when images fail to load
export const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format&q=80";

// Character selection utilities
export const getCharacterByName = (name: string): AnimeCharacter | undefined => {
  return ANIME_CHARACTERS.find(char => char.name.toLowerCase() === name.toLowerCase());
};

export const getRandomCharacter = (): AnimeCharacter => {
  const randomIndex = Math.floor(Math.random() * ANIME_CHARACTERS.length);
  return ANIME_CHARACTERS[randomIndex];
};

export const getCharacterByColor = (color: string): AnimeCharacter | undefined => {
  return ANIME_CHARACTERS.find(char => char.color === color);
};
