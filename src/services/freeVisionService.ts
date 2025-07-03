import { pipeline } from '@huggingface/transformers';

class FreeVisionService {
  private imageClassifier: any = null;
  private isInitializing = false;
  private initialized = false;

  async initialize() {
    if (this.initialized || this.isInitializing) {
      return;
    }
    
    this.isInitializing = true;
    
    try {
      console.log('Initializing free vision analysis...');
      
      // Initialize image classification pipeline with a lightweight model
      this.imageClassifier = await pipeline(
        'image-classification',
        'Xenova/vit-base-patch16-224',
        { device: 'webgpu' }
      );
      
      this.initialized = true;
      console.log('Free vision analysis initialized successfully');
    } catch (error) {
      console.error('Failed to initialize vision service:', error);
      // Fallback to CPU if WebGPU fails
      try {
        this.imageClassifier = await pipeline(
          'image-classification',
          'Xenova/vit-base-patch16-224'
        );
        this.initialized = true;
        console.log('Free vision analysis initialized with CPU fallback');
      } catch (fallbackError) {
        console.error('Vision service initialization failed completely:', fallbackError);
        throw fallbackError;
      }
    } finally {
      this.isInitializing = false;
    }
  }

  async analyzeImage(imageDataUrl: string): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.imageClassifier) {
        throw new Error('Vision service not properly initialized');
      }

      console.log('Analyzing image with free AI model...');
      
      // Convert data URL to image element for processing
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            // Get predictions from the model
            const predictions = await this.imageClassifier(img);
            
            // Format the results into a JARVIS-style response
            const topPredictions = predictions.slice(0, 3);
            let response = "Sir, I can analyze this image for you. ";
            
            if (topPredictions.length > 0) {
              const mainPrediction = topPredictions[0];
              const confidence = Math.round(mainPrediction.score * 100);
              
              response += `I detect this appears to be ${mainPrediction.label.toLowerCase()} with ${confidence}% confidence. `;
              
              if (topPredictions.length > 1) {
                response += "Other possibilities include ";
                const otherPredictions = topPredictions.slice(1).map(p => 
                  `${p.label.toLowerCase()} (${Math.round(p.score * 100)}%)`
                ).join(' and ');
                response += otherPredictions + ". ";
              }
            }
            
            response += "This analysis is performed using advanced computer vision models running directly in your browser, requiring no external API calls.";
            
            console.log('Image analysis completed successfully');
            resolve(response);
          } catch (error) {
            console.error('Error during image analysis:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for analysis'));
        };
        
        img.src = imageDataUrl;
      });
      
    } catch (error) {
      console.error('Vision analysis error:', error);
      // Provide a helpful fallback response
      return "Sir, I'm experiencing some technical difficulties with my vision analysis system. The image has been received, but I'm unable to process it at the moment. This could be due to browser compatibility or model loading issues. Please try again in a moment.";
    }
  }
}

export const freeVisionService = new FreeVisionService();