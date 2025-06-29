
export interface Joke {
  setup?: string;
  punchline?: string;
  joke?: string;
  type: string;
}

export const fetchJoke = async (): Promise<string> => {
  try {
    // Try Official Joke API first
    const response = await fetch('https://official-joke-api.appspot.com/random_joke');
    if (response.ok) {
      const joke: Joke = await response.json();
      if (joke.setup && joke.punchline) {
        return `${joke.setup} ${joke.punchline}`;
      }
    }
  } catch (error) {
    console.log('Official Joke API failed, trying backup...');
  }

  try {
    // Backup: JokeAPI
    const response = await fetch('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single');
    if (response.ok) {
      const data = await response.json();
      if (data.joke) {
        return data.joke;
      }
    }
  } catch (error) {
    console.log('JokeAPI failed, using fallback jokes...');
  }

  // Fallback jokes array
  const fallbackJokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "Why don't skeletons fight each other? They don't have the guts.",
    "What do you call a fake noodle? An impasta!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why don't eggs tell jokes? They'd crack each other up!",
    "What do you call a sleeping bull? A bulldozer!",
    "Why did the math book look so sad? Because it had too many problems!",
    "What's the best thing about Switzerland? I don't know, but the flag is a big plus!"
  ];

  return fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
};
