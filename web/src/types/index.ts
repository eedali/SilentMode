export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    superUpvoteUsedToday: boolean;
    lastSuperUpvoteDate: string | null;
    contentCount?: number;
    // Settings
    notifyOnRemix?: boolean;
    notifyOnQAAnswer?: boolean;
    hideArchivedPosts?: boolean;
    autoLoadImages?: boolean;
    showNSFW?: boolean;
    blurNSFW?: boolean;
}

export interface QAAnswer {
    id: string;
    text: string;
    score: number;
    userVote?: 'upvote' | 'downvote' | null;
    createdAt: string;
}

export interface Content {
    id: string;
    userId: string;
    contentType: 'text' | 'image' | 'video' | 'qa';
    title: string;
    description: string;
    mainHashtag: string;
    mediaUrl: string | null;
    mediaUrls?: string[];
    score: number;
    answers?: QAAnswer[];
    viewCount: number;
    createdAt: string;
    isArchived: boolean;
    isNSFW: boolean;
    userVote?: 'upvote' | 'downvote' | 'super_upvote' | null;
    hashtags: string[];
    updatedAt: string;
    editedAt?: string | null;
    isSaved?: boolean;
    // Remix fields
    remixedFromId?: string | null;
    remixCount?: number;
    remixedFrom?: {
        id: string;
        title: string;
        description: string;
        contentType: string;
        mediaUrls: string[];
        createdAt: string;
        hashtags: string[];
    };
    _count?: {
        answers?: number;
        remixes?: number;
    };
    answerCount?: number;
}


export interface Vote {
    id: string;
    userId: string;
    contentId: string;
    voteType: 'upvote' | 'downvote' | 'super_upvote';
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
}

export interface CreateContentData {
    title: string;
    description: string;
    hashtags: string[];
    contentType: 'text' | 'image' | 'video' | 'qa';
    mediaUrl?: string;
    mediaUrls?: string[];
    isNSFW?: boolean;
    remixedFromId?: string;  // NEW: For remixing content
}

export interface VoteData {
    contentId: string;
    voteType: 'upvote' | 'downvote' | 'super_upvote';
}
