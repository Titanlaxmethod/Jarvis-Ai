
export interface SearchResult {
  title: string;
  url: string;
  description: string;
  type: 'web' | 'video' | 'image';
}

class SearchService {
  async searchWeb(query: string): Promise<SearchResult[]> {
    // Using DuckDuckGo Instant Answer API for web search
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      const results: SearchResult[] = [];
      
      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          description: data.AbstractText,
          type: 'web'
        });
      }
      
      // Add related topics
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0],
              url: topic.FirstURL,
              description: topic.Text,
              type: 'web'
            });
          }
        });
      }
      
      // Fallback to direct search if no results
      if (results.length === 0) {
        results.push({
          title: `Search results for "${query}"`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          description: `Click to see search results for ${query}`,
          type: 'web'
        });
      }
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [{
        title: `Search for "${query}"`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        description: `Click to search for ${query}`,
        type: 'web'
      }];
    }
  }
}

export const searchService = new SearchService();
