export interface Collection {
  id: string
  name: string
  created_at: string
}

export interface Tag {
  id: string
  name: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  collection_id: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface Comment {
  id: string
  note_id: string
  author_id: string
  author_email: string
  body: string
  created_at: string
}

export interface NoteShare {
  id: string
  note_id: string
  shared_with_user_id: string
  shared_with_email: string
  created_at: string
}
