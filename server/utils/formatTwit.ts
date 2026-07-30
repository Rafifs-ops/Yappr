/**
 * Helper to format Prisma Twit object for frontend compatibility
 */
export const formatTwit = (twit: any) => {
    if (!twit) return null;
    return {
        ...twit,
        _id: twit.id,
        hashtags: twit.hashtags
            ? twit.hashtags
                  .map((h: any) => (typeof h === 'string' ? h : (h?.tag || ''))?.replace(/^#/, ''))
                  .filter(Boolean)
            : [],
        user: twit.user ? {
            ...twit.user,
            _id: twit.user.id
        } : null,
        SubTwit: {
            isSubTwit: twit.isSubTwit,
            reference: twit.reference ? {
                ...twit.reference,
                _id: twit.reference.id,
                hashtags: twit.reference.hashtags
                    ? twit.reference.hashtags
                          .map((h: any) => (typeof h === 'string' ? h : (h?.tag || ''))?.replace(/^#/, ''))
                          .filter(Boolean)
                    : [],
                user: twit.reference.user ? {
                    ...twit.reference.user,
                    _id: twit.reference.user.id
                } : null
            } : null
        }
    };
};
