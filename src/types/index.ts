// Tipos de datos para la aplicación Alerta Ilo

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  reportCount?: number; // Para compatibilidad con código legacy
}

export interface UserProfile {
  displayName: string;
  photoURL?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

// ============================================
// TIPOS DE REPORTES COMUNITARIOS - ALERTA ILO
// ============================================

export type ReportCategory =
  | 'infrastructure'  // Infraestructura (baches, veredas, etc.)
  | 'utilities'       // Servicios públicos (agua, luz, etc.)
  | 'safety'          // Seguridad (robos, accidentes, etc.)
  | 'environment'     // Medio ambiente (basura, contaminación, etc.)
  | 'events'          // Eventos comunitarios
  | 'other';          // Otros

export type ReportStatus = 'active' | 'in_progress' | 'resolved';

export interface ReportType {
  id: ReportCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
  examples: string[];
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  category: ReportCategory;
  title: string;
  description: string;
  location: Location;
  imageUrl?: string;
  status: ReportStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  likedBy: string[];
  comments: number;
}

export interface CreateReportData {
  category: ReportCategory;
  title: string;
  description: string;
  location: Location;
  imageUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  retry?: () => Promise<void>;
}

export interface ErrorContextType {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (errorCode: string) => void;
  clearErrors: () => void;
  hasErrors: boolean;
  handleError: (error: any, context?: string) => AppError;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnlineTime: number | null;
  queuedOperations: number;
}

// ============================================
// SPOTSHARE TYPES - Red Social Geolocalizada
// ============================================

export interface Location {
  lat: number;
  lng: number;
  address: string;
  placeName?: string;
}

export interface PostContent {
  description: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export interface PostInteractions {
  likes: number;
  comments: number;
  shares: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  location: Location;
  content: PostContent;
  interactions: PostInteractions;
  likedBy: string[];
  createdAt: Date;
  updatedAt: Date;
  visibility: 'public' | 'followers' | 'private';
}

export interface CreatePostData {
  location: Location;
  content: PostContent;
  visibility?: 'public' | 'followers' | 'private';
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

export interface CreateCommentData {
  postId: string;
  text: string;
}

export interface UserStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  placesVisited: number;
}

export interface ExtendedUserProfile extends UserProfile {
  uid: string;
  email: string;
  bio?: string;
  location?: string;
  stats: UserStats;
  following: string[];
  followers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedFilter {
  radius?: number; // en kilómetros
  sortBy?: 'recent' | 'popular' | 'nearby';
  visibility?: 'all' | 'following';
}

export interface PostsContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  createPost: (data: CreatePostData) => Promise<Post>;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  addComment: (data: CreateCommentData) => Promise<Comment>;
  getPostComments: (postId: string) => Promise<Comment[]>;
  fetchNearbyPosts: (location: Location, radius: number) => Promise<Post[]>;
  refreshPosts: () => Promise<void>;
}