// Sample Yelp API business search response
export const mockYelpBusinessSearchResponse = {
  businesses: [
    {
      id: 'abc123',
      alias: 'test-restaurant',
      name: 'Test Restaurant',
      image_url: 'https://test.com/image.jpg',
      is_closed: false,
      url: 'https://test.com',
      review_count: 100,
      categories: [
        {
          alias: 'italian',
          title: 'Italian',
        },
      ],
      rating: 4.5,
      coordinates: {
        latitude: 37.786882,
        longitude: -122.399972,
      },
      location: {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94105',
      },
      phone: '+14155551234',
      display_phone: '(415) 555-1234',
      distance: 1000,
    },
  ],
  total: 1,
  region: {
    center: {
      longitude: -122.399972,
      latitude: 37.786882,
    },
  },
};

// Sample Yelp API business details response
export const mockYelpBusinessDetailsResponse = {
  id: 'abc123',
  alias: 'test-restaurant',
  name: 'Test Restaurant',
  image_url: 'https://test.com/image.jpg',
  is_claimed: true,
  is_closed: false,
  url: 'https://test.com',
  phone: '+14155551234',
  display_phone: '(415) 555-1234',
  review_count: 100,
  categories: [
    {
      alias: 'italian',
      title: 'Italian',
    },
  ],
  rating: 4.5,
  location: {
    address1: '123 Main St',
    address2: '',
    address3: '',
    city: 'San Francisco',
    zip_code: '94105',
    country: 'US',
    state: 'CA',
    display_address: ['123 Main St', 'San Francisco, CA 94105'],
  },
  coordinates: {
    latitude: 37.786882,
    longitude: -122.399972,
  },
  photos: ['https://test.com/photo1.jpg', 'https://test.com/photo2.jpg'],
  price: '$$',
  hours: [
    {
      open: [
        {
          is_overnight: false,
          start: '1000',
          end: '2200',
          day: 0,
        },
        {
          is_overnight: false,
          start: '1000',
          end: '2200',
          day: 1,
        },
      ],
      hours_type: 'REGULAR',
      is_open_now: true,
    },
  ],
  transactions: ['delivery', 'pickup'],
};