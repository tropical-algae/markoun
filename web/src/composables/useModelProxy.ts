import { computed } from 'vue'

type ModelUpdateEmitter<T> = (event: 'update:modelValue', value: T) => void

export const useModelProxy = <T>(
  props: { modelValue: T },
  emit: ModelUpdateEmitter<T>,
) => {
  return computed({
    get: () => props.modelValue,
    set: (value: T) => emit('update:modelValue', value),
  })
}
