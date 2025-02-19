export interface UploadedFile {
    id: string;
    url?: string;
    mime_type: string;
    caption?: string;
    thumbnail?: string;
    sha256?: string;
    thumbnail_url?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'audio' | 'sticker';
    transcription?: string;
}