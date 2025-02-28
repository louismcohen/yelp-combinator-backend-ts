// Provides a mock implementation for Mongoose
// This is useful for unit tests where we don't want to hit the real database

export const mockMongoose = () => {
  jest.mock('mongoose', () => {
    // Mock document implementation
    const mockDocument = {
      save: jest.fn().mockResolvedValue(this),
    };

    // Mock query implementation
    const mockQuery = {
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
    };

    // Mock model implementation
    const mockModel = {
      find: jest.fn().mockReturnValue(mockQuery),
      findById: jest.fn().mockReturnValue(mockQuery),
      findOne: jest.fn().mockReturnValue(mockQuery),
      findByIdAndUpdate: jest.fn().mockReturnValue(mockQuery),
      findByIdAndDelete: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockImplementation((data) => ({ ...data, ...mockDocument })),
      updateOne: jest.fn().mockResolvedValue({ nModified: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      aggregate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    // Return the mocked mongoose object
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      connection: {
        close: jest.fn().mockResolvedValue(undefined),
      },
      Schema: jest.fn().mockReturnValue({}),
      model: jest.fn().mockReturnValue(mockModel),
      Document: class {},
      Types: {
        ObjectId: jest.fn().mockImplementation((id) => id),
      },
    };
  });
};