interface ICollection {
  _id: string;
  collectionId: string;
  title: string;
  itemCount: number;
  lastUpdated: Date;
  businesses: string[]; // references to business IDs
}
