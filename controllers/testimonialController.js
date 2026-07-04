import { readData, writeData } from '../utils/db.js';

export const testimonialController = {
  /**
   * Retrieves all testimonials
   */
  getTestimonials: async (req, res) => {
    try {
      const testimonials = await readData('testimonials');
      // Sort reviews so latest reviews appear first
      const sorted = [...testimonials].sort((a, b) => b.id - a.id);
      res.json(sorted);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve reviews' });
    }
  },

  /**
   * Creates a new testimonial/review
   */
  createTestimonial: async (req, res) => {
    const { name, treatment, rating, review } = req.body;
    
    // Server-side validation
    const errors = {};
    if (!name || !name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!treatment || !treatment.trim()) {
      errors.treatment = 'Treatment received is required';
    }
    if (!review || !review.trim() || review.trim().length < 10) {
      errors.review = 'Review comments are required (min 10 characters)';
    }
    const score = parseInt(rating, 10);
    if (isNaN(score) || score < 1 || score > 5) {
      errors.rating = 'Invalid rating score (must be between 1 and 5)';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const testimonials = await readData('testimonials');
      
      const newTestimonial = {
        id: Date.now(), // Unique ID
        name: name.trim(),
        treatment: treatment.trim(),
        rating: score,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        review: review.trim(),
        avatar: name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      };

      testimonials.push(newTestimonial);
      await writeData('testimonials', testimonials);
      
      res.status(201).json({
        success: true,
        testimonial: newTestimonial
      });
    } catch (error) {
      console.error('Failed to create review:', error);
      res.status(500).json({ 
        success: false, 
        errors: { global: 'Internal server error. Failed to save review.' } 
      });
    }
  }
};
export default testimonialController;
