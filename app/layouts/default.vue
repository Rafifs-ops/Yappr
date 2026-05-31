<template>
    <div class="min-h-screen flex flex-col relative">
        <div class="scanlines"></div>
        <NavTop />
        <main class="flex-1 w-full max-w-4xl mx-auto px-2 py-4 md:py-8 z-10 pb-36">
            <slot />
        </main>
        <NavBottom />
    </div>
</template>

<style>
html {
    background-color: var(--cyber-bg);
}

body {
    min-height: 100vh;
    margin: 0;
    overflow-x: hidden;
}
</style>