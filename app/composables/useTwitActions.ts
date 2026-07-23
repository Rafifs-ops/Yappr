import { useNuxtApp } from '#app';

import type { Ref } from 'vue';

/**
 * Composable to handle common twit actions like toggling like, repost, and deleting.
 * It expects a reactive array of twits to perform optimistic UI updates.
 *
 * @param {Ref<Array>} twits - The reactive array containing twit objects.
 * @returns {Object} Methods for toggling like, repost, and deleting a twit.
 */
export function useTwitActions(twits: Ref<any[]>) {
    const { $csrfFetch } = useNuxtApp();

    /**
     * Toggles the like status of a twit optimistically.
     * @param {string} twitId - The ID of the twit to like/unlike.
     */
    async function toggleLike(twitId: string) {
        const index = twits.value.findIndex(t => t._id === twitId);
        if (index === -1) return;

        const targetTwit = twits.value[index];
        const previousIsLiked = targetTwit.isLiked;

        // Optimistic UI Update
        targetTwit.isLiked = !targetTwit.isLiked;
        targetTwit.isLiked ? targetTwit.likesCount++ : targetTwit.likesCount--;

        try {
            const endpoint = previousIsLiked ? '/api/like/remove' : '/api/like/add';
            await $csrfFetch(endpoint, {
                method: 'POST',
                body: { twitId: targetTwit._id }
            });
        } catch (err: any) {
            // Rollback on failure
            targetTwit.isLiked = previousIsLiked;
            targetTwit.isLiked ? targetTwit.likesCount++ : targetTwit.likesCount--;
            alert(err.statusMessage || 'Gagal mengubah status like');
        }
    }

    /**
     * Toggles the repost status of a twit optimistically.
     * @param {string} twitId - The ID of the twit to repost/unrepost.
     */
    async function toggleRepost(twitId: string) {
        const index = twits.value.findIndex(t => t._id === twitId);
        if (index === -1) return;

        const targetTwit = twits.value[index];
        const previousIsReposted = targetTwit.isReposted;

        // Optimistic UI Update
        targetTwit.isReposted = !targetTwit.isReposted;
        targetTwit.isReposted ? targetTwit.repostCount++ : targetTwit.repostCount--;

        try {
            const endpoint = previousIsReposted ? '/api/repost/remove' : '/api/repost/add';
            await $csrfFetch(endpoint, {
                method: 'POST',
                body: { twitId: targetTwit._id }
            });
        } catch (err: any) {
            // Rollback on failure
            targetTwit.isReposted = previousIsReposted;
            targetTwit.isReposted ? targetTwit.repostCount++ : targetTwit.repostCount--;
            alert(err.statusMessage || 'Gagal mengubah status repost');
        }
    }

    /**
     * Deletes a twit and removes it from the local state.
     * @param {string} twitId - The ID of the twit to delete.
     */
    async function deleteTwit(twitId: string) {
        try {
            await $csrfFetch('/api/twits', {
                method: 'DELETE',
                body: { twitId: twitId }
            });

            // Remove twit from local state
            twits.value = twits.value.filter(t => t._id !== twitId);
        } catch (err: any) {
            alert(err.statusMessage || 'Gagal menghapus twit');
        }
    }

    return {
        toggleLike,
        toggleRepost,
        deleteTwit
    };
}
