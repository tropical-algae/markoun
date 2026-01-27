import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SysNotice } from '@/scripts/types'


let noticeId = 0

export const useNoticeStore = defineStore('notice', () => {
  const queue = ref<SysNotice[]>([])

  const pushNotice = (type: 'error' | 'warning' | 'info', message: string) => {
    queue.value.push({
      id: ++noticeId,
      type: type,
      message: message
    })
    console.log(message)
  }

  const popNotice = () => {
    queue.value.shift()
  }

  return { queue, pushNotice, popNotice }
})