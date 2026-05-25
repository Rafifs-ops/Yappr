<script setup>
useHead({
    title: 'Beranda - RTwit',
    meta: [
        { name: 'description', content: 'Aplikasi sosial RTwit' }
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