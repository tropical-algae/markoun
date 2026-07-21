<template>
  <div ref="profileMotionShellRef">
    <div ref="profileMotionContentRef" class="user-profile-motion-content">
      <AsyncGate
        :status="userStore.currentUserProfileState"
        :is-empty="!userStore.currentUserProfile"
      >
        <template #loading>
          <div class="user-profile-shell">
            <BaseSkeleton
              width="var(--skeleton-width-md)"
              height="var(--skeleton-text-height-lg)"
            />

            <div class="user-meta-shell user-meta-shell-loading">
              <BaseSkeleton
                width="var(--skeleton-width-xl)"
                height="var(--skeleton-text-height-xs)"
              />
              <div class="user-tag-shell">
                <BaseSkeleton
                  width="var(--skeleton-width-xs)"
                  height="var(--meta-tag-height)"
                />
                <BaseSkeleton
                  width="var(--skeleton-width-xs)"
                  height="var(--meta-tag-height)"
                />
              </div>

              <BaseSkeleton
                width="var(--skeleton-width-lg)"
                height="var(--skeleton-text-height-xs)"
              />
              <BaseSkeleton
                width="var(--skeleton-width-sm)"
                height="var(--skeleton-text-height-sm)"
              />

              <BaseSkeleton
                width="var(--skeleton-width-lg)"
                height="var(--skeleton-text-height-xs)"
              />
              <BaseSkeleton
                width="var(--skeleton-width-md)"
                height="var(--skeleton-text-height-sm)"
              />
            </div>
          </div>
        </template>

        <template #empty>
          <div class="user-profile-empty f-s fc-sec">
            User information is temporarily unavailable.
          </div>
        </template>

        <div class="user-profile-card">
          <div class="user-name f-m fw-bold fc-pri">
            {{ userStore.currentUserProfile?.full_name || 'Unnamed user' }}
          </div>
          <div class="user-email f-s">
            {{ userStore.currentUserProfile?.email }}
          </div>

          <div class="user-meta-grid">
            <span class="user-meta-label f-s">Scopes</span>
            <div class="user-scopes">
              <span
                v-for="scope in userStore.currentUserProfile?.scopes || []"
                :key="scope"
                class="meta-tag"
              >
                {{ scope }}
              </span>
            </div>

            <span class="user-meta-label f-s">Status</span>
            <span class="user-meta-value f-s">
              {{ userStore.currentUserProfile?.is_active ? 'Active' : 'Inactive' }}
            </span>

            <span class="user-meta-label f-s">Joined</span>
            <span class="user-meta-value f-s">
              {{ userStore.currentUserProfile?.joined_at || 'Unknown' }}
            </span>
          </div>
        </div>
      </AsyncGate>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useHeightMotion } from '@/composables/useHeightMotion'
import { readCssNumber } from '@/utils/css'
import AsyncGate from '@/components/base/AsyncGate.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'

const userStore = useUserStore()
const profileMotionShellRef = ref<HTMLElement | null>(null)
const profileMotionContentRef = ref<HTMLElement | null>(null)
const profileMotion = useHeightMotion(profileMotionShellRef, profileMotionContentRef, {
  duration: readCssNumber('--motion-height-user-duration', 0.35),
  enterEase: 'power2.out',
})

onMounted(async () => {
  await nextTick()
  profileMotion.connectResizeObserver()
  void userStore.refreshCurrentUserProfile().catch(() => null)
})

watch(
  [
    () => userStore.currentUserProfileState,
    () => userStore.currentUserProfile,
  ],
  async () => {
    await nextTick()
    profileMotion.animateHeightToContent()
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  profileMotion.disconnectResizeObserver()
})
</script>

<style scoped>
.user-profile-motion-content {
  width: 100%;
  min-width: 0;
}

.user-profile-card,
.user-profile-shell,
.user-profile-empty {
  width: 100%;
  box-sizing: border-box;
  border: 0;
  border-radius: var(--radius-lg);
  white-space: normal;
  background-color: var(--color-bg-sec);
  box-shadow: inset 0 0 0 var(--line-width) var(--color-line);
  padding: var(--space-lg);
  transition:
    background-color var(--motion-theme-duration) ease,
    box-shadow var(--motion-theme-duration) ease;
}

.user-profile-empty {
  color: var(--color-text-sec);
}

.user-name {
  line-height: var(--profile-name-line-height);
}

.user-email {
  color: var(--color-text-sec);
  line-height: var(--profile-meta-line-height);
  overflow-wrap: anywhere;
}

.user-scopes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-compact);
}

.user-meta-grid,
.user-meta-shell {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-sm) var(--space-md);
  align-items: center;
}

.user-meta-grid {
  margin-top: var(--space-lg);
}

.user-meta-label {
  color: var(--color-text-sec);
  text-transform: uppercase;
  font-weight: 700;
}

.user-meta-value {
  min-width: 0;
  color: var(--color-text-pri);
  line-height: var(--profile-meta-line-height);
  word-break: break-word;
}

.user-tag-shell {
  display: flex;
  flex-wrap: wrap;
  min-width: 0;
  gap: var(--space-compact);
}

.user-meta-shell-loading {
  margin-top: var(--space-lg);
  grid-template-columns: minmax(0, 28%) minmax(0, 1fr);
}
</style>
