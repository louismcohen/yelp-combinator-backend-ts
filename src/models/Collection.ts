import mongoose from 'mongoose';
import { Collection } from '../types/schemas';

const collectionSchema = new mongoose.Schema(
  {
    yelpCollectionId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    itemCount: { type: Number, required: true },
    lastUpdated: { type: Date, required: true, index: true },
    businesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }],
  },
  { timestamps: true },
);

export const CollectionModel = mongoose.model<Collection>(
  'Collection',
  collectionSchema,
);
