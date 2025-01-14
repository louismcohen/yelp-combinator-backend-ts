interface IBusiness {
  _id: string;
  alias: string;
  url: string;
  note?: string;
  addedIndex: number;
  yelpData?: YelpBusinessData;
  lastUpdated: Date;
}
