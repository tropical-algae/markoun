<template>
  <div class="auth-wrapper">
    <header class="site-brand">
      <slot name="brand">
        <span class="site-brand-logo" aria-hidden="true"></span>
        <span>MARKOUN.</span>
      </slot>
    </header>

    <main class="auth-container">
      <section class="auth-panel">
        <slot></slot>
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100dvh;
  width: 100%;
  box-sizing: border-box;
  padding: var(--auth-wrapper-current-padding);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.site-brand {
  display: flex;
  align-items: center;
  height: var(--auth-brand-current-height);
  width: 100%;
  color: var(--color-text-pri);
  font-weight: bold;
  font-size: var(--auth-brand-current-font-size);
  gap: var(--auth-brand-logo-gap);
}

.site-brand-logo {
  height: var(--auth-brand-logo-height);
  aspect-ratio: var(--brand-logo-aspect-ratio);
  flex-shrink: 0;
  background-color: currentColor;
  mask: url('@/assets/icons/markoun-logo.svg') center / contain no-repeat;
}

.auth-container {
  display: flex;
  flex: 1 1 auto;
  align-items: var(--auth-container-current-align-items);
  justify-content: center;
  width: 100%;
  background-color: var(--color-bg-sec);
  border: var(--divider-line-width) solid var(--color-line);
  box-sizing: border-box;
  padding: var(--auth-container-current-padding);
  border-top-left-radius: var(--auth-container-current-radius-top-left);
  border-top-right-radius: var(--auth-container-current-radius-top-right);
  border-bottom-right-radius: var(--auth-container-current-radius-bottom-right);
  border-bottom-left-radius: var(--auth-container-current-radius-bottom-left);
}

.auth-panel {
  width: 100%;
  max-width: var(--auth-panel-max-width);
  min-width: var(--auth-panel-current-min-width);
}
</style>
