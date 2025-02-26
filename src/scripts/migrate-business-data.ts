import mongoose, { Schema, Document, Connection } from 'mongoose';
import { env } from '../config/env';

// Replace these with your actual MongoDB connection strings
const OLD_DB_URI: string = env.MONGODB_OLD_URI;
const NEW_DB_URI: string = env.MONGODB_URI;

// Define interfaces
interface BusinessDocument extends Document {
  alias: string;
  visited?: boolean; // Make visited optional
  [key: string]: unknown;
}

async function migrateVisitedField(): Promise<void> {
  // Create connections to both databases
  const oldConnection: Connection = mongoose.createConnection(OLD_DB_URI);
  const newConnection: Connection = mongoose.createConnection(NEW_DB_URI);

  try {
    // Wait for connections to be established
    await Promise.all([
      new Promise<void>((resolve) =>
        oldConnection.once('connected', () => resolve()),
      ),
      new Promise<void>((resolve) =>
        newConnection.once('connected', () => resolve()),
      ),
    ]);

    console.log('Connected to both databases');

    // Define the schema (keep it minimal for migration purposes)
    const BusinessSchema = new Schema(
      {
        alias: String,
        visited: Boolean,
      },
      { strict: false },
    ); // Allow other fields

    // Create models for both databases
    const OldBusiness = oldConnection.model<BusinessDocument>(
      'Business',
      BusinessSchema,
      'yelpbusinesses',
    );
    const NewBusiness = newConnection.model<BusinessDocument>(
      'Business',
      BusinessSchema,
      'businesses',
    );

    let updateCount: number = 0;
    let skipCount: number = 0;

    const old = await OldBusiness.find();

    console.log(old);

    // Stream the documents from the old collection
    const cursor = OldBusiness.find({}).cursor();

    for (
      let oldDoc = await cursor.next();
      oldDoc != null;
      oldDoc = await cursor.next()
    ) {
      if (oldDoc.alias) {
        // Only check for alias, not visited
        // Check if document exists in new collection
        const newDoc = await NewBusiness.findOne({
          alias: oldDoc.alias,
        }).exec();

        if (newDoc) {
          // Set visited to its value in oldDoc or false if undefined
          const visitedValue =
            oldDoc.visited !== undefined ? oldDoc.visited : false;

          // Update the visited field in the new collection
          await NewBusiness.updateOne(
            { alias: oldDoc.alias },
            { $set: { visited: visitedValue } },
          );
          updateCount++;

          if (updateCount % 100 === 0) {
            console.log(`Progress: ${updateCount} documents updated`);
          }
        } else {
          skipCount++;
        }
      }
    }

    console.log(`Migration complete!`);
    console.log(`Updated ${updateCount} documents`);
    console.log(`Skipped ${skipCount} documents (not found in new collection)`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close connections
    await oldConnection.close();
    await newConnection.close();
    console.log('Database connections closed');
  }
}

// Run the migration
migrateVisitedField().catch(console.error);
