import { Schema, model } from 'mongoose';

/**
 * Mongoose Schema for a Twit (Post).
 * Represents a user's post, which can include text, an image, and hashtags.
 * It also supports threading (SubTwit) to represent replies or quote-retwits.
 */
const twitSchema = new Schema({
    /** Reference to the User who created the twit */
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    /** Main content of the twit. Can include HTML from the rich text editor */
    text: { type: String, required: true },
    /** Optional image attachment as a URL or base64 string */
    image: { type: String },
    video: { type: String },
    /** Counter for likes to avoid frequent aggregation queries */
    likesCount: { type: Number, default: 0 },
    /** Counter for comments (replies) */
    commentCount: { type: Number, default: 0 },
    /** Counter for reposts */
    repostCount: { type: Number, default: 0 },
    /** Nested object to handle replies or quotes */
    SubTwit: {
        isSubTwit: { type: Boolean, default: false },
        /** The parent Twit being replied to or quoted */
        reference: { type: Schema.Types.ObjectId, ref: 'Twit', default: null }
    },
    /** Extracted hashtags for quick filtering and trending features */
    hashtags: [{ type: String, lowercase: true, trim: true }]
}, { timestamps: true });

// Indexing hashtags for faster text search queries
twitSchema.index({ hashtags: 1 });

export const Twit = model('Twit', twitSchema);