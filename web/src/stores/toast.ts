import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SysNotice } from '@/types/system'

let noticeId = 0

export const useToastStore = defineStore('notice', () => {
  const queue = ref<SysNotice[]>([])

  const pushNotice = (type: 'error' | 'warning' | 'info', message: string) => {
    queue.value = [{
      id: ++noticeId,
      type: type,
      message: message
    }]
  }

  const popNotice = () => {
    queue.value.shift()
  }

  return { queue, pushNotice, popNotice }
})