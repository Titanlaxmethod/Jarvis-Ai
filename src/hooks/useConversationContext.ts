
import { useState, useCallback } from 'react';

interface ConversationMemory {
  lastJokes: string[];
  userPreferences: Record<string, any>;
  conversationHistory: Array<{
    topic: string;
    timestamp: Date;
    context: string;
  }>;
}

export const useConversationContext = () => {
  const [memory, setMemory] = useState<ConversationMemory>({
    lastJokes: [],
    userPreferences: {},
    conversationHistory: []
  });

  const addJokeToMemory = useCallback((joke: string) => {
    setMemory(prev => ({
      ...prev,
      lastJokes: [...prev.lastJokes.slice(-4), joke] // Keep last 5 jokes
    }));
  }, []);

  const hasRecentlyToldJoke = useCallback((joke: string) => {
    return memory.lastJokes.includes(joke);
  }, [memory.lastJokes]);

  const addToHistory = useCallback((topic: string, context: string) => {
    setMemory(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory.slice(-9), // Keep last 10 entries
        {
          topic,
          timestamp: new Date(),
          context
        }
      ]
    }));
  }, []);

  const getRecentContext = useCallback((topic: string) => {
    return memory.conversationHistory
      .filter(entry => entry.topic === topic)
      .slice(-3); // Get last 3 related conversations
  }, [memory.conversationHistory]);

  return {
    addJokeToMemory,
    hasRecentlyToldJoke,
    addToHistory,
    getRecentContext,
    memory
  };
};
