import mongoose from 'mongoose';
import { Business } from '../types/schemas';
import tz_lookup from '@photostructure/tz-lookup';

const businessSchema = new mongoose.Schema(
  {
    alias: { type: String, required: true, unique: true },
    note: String,
    addedIndex: { type: Number, required: true },
    lastUpdated: { type: Date, required: true, index: true },
    collectionId: { type: String, required: true, index: true },
    visited: {
      type: Boolean,
      default: false,
      index: true, // Add index for efficient filtering
    },
    geoPoint: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    embedding: {
      type: [Number], // Store as array of numbers
      validate: {
        validator: (v: number[]) => {
          // Validate embedding dimension - adjust 384 to match your model's output dimension
          return v.length === 384;
        },
        message: 'Embedding must have exactly 384 dimensions',
      },
      index: true,
      sparse: true,
    },
    yelpData: {
      name: String,
      image_url: String,
      rating: Number,
      review_count: Number,
      coordinates: {
        latitude: Number,
        longitude: Number,
        _id: false,
      },
      location: {
        address1: String,
        city: String,
        state: String,
        zip_code: String,
        timezone: String,
        _id: false,
      },
      categories: [
        {
          alias: String,
          title: String,
          _id: false,
        },
      ],
      hours: [
        {
          open: [
            {
              start: String,
              end: String,
              day: Number,
              _id: false,
            },
          ],
          _id: false,
        },
      ],
    },
  },
  { timestamps: true },
);

// Middleware to automatically set timezone before saving
businessSchema.pre('save', function (next) {
  if (this.yelpData?.coordinates) {
    const { latitude, longitude } = this.yelpData.coordinates;
    try {
      if (this.yelpData && this.yelpData.location && latitude && longitude) {
        this.yelpData.location.timezone = tz_lookup(latitude, longitude);
      }
    } catch (error) {
      console.error('Error setting timezone:', error);
      // Default to the timezone you mentioned earlier if lookup fails
      if (this.yelpData.location) {
        this.yelpData.location.timezone = 'America/Los_Angeles';
      }
    }
  }
  next();
});

// Index for geospatial queries if needed
businessSchema.index({ geoPoint: '2dsphere' });

export const BusinessModel = mongoose.model<Business>(
  'Business',
  businessSchema,
);
