<template>
    <div class="min-h-screen flex flex-col relative">
        <div class="scanlines"></div>
        <main class="flex-1 flex items-center justify-center p-4 z-10">
            <slot />
        </main>
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