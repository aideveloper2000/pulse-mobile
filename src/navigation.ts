export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Album: { id: number };
  Artist: { id: number };
  Playlist: { id: number };
  Genre: { genre: string };
  Upload: undefined;
  Player: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  UploadTab: undefined;
};
