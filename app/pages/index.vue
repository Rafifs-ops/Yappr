<script setup>
useHead({
    title: 'Beranda - Yappr',
    meta: [
        { name: 'description', content: 'Yappr, Media Sosial' }
    ]
})
definePageMeta({
    layout: 'default'
})
</script>

<template>
    <main>
        <Twits />
    </main>
</template>