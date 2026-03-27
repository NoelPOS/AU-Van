export interface ProfileImageStoragePort {
  save(file: File, userId: string): Promise<{ url: string; key: string }>;
  remove(key: string): Promise<void>;
}
