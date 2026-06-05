<script setup>
const route = useRoute();
const hashtag = route.params.hashtag;
</script>

<template>
    <main class="w-full">
        <Twits :hashtag="hashtag" />
    </main>
</template>

<style scoped>
.twit-content :deep(ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
}

.twit-content :deep(ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
}

.twit-content :deep(li) {
    margin-bottom: 0.25rem;
}

.twit-content :deep(a) {
    color: #93c5fd;
    /* blue-300 */
    text-decoration: underline;
    transition: color 0.2s;
}

.twit-content :deep(a:hover) {
    color: #bfdbfe;
    /* blue-200 */
}

.twit-content :deep(h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: white;
}

.twit-content :deep(h2) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: white;
}

.twit-content :deep(h3) {
    font-size: 1.125rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: white;
}

.twit-content :deep(p) {
    margin-bottom: 0.5rem;
}

.twit-content :deep(p:last-child) {
    margin-bottom: 0;
}

.twit-content :deep(strong) {
    font-weight: 700;
    color: white;
}

.twit-content :deep(em) {
    font-style: italic;
}

.twit-content :deep(u) {
    text-decoration: underline;
}

.twit-content :deep(s) {
    text-decoration: line-through;
}
</style>