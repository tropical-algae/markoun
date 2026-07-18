import { COMPACT_LAYOUT_MEDIA_QUERY } from '@/constants/layout'
import { useMediaQuery } from '@/composables/useMediaQuery'

export const useCompactLayout = () => {
  return useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY)
}
