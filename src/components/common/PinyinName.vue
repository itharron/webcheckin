<script setup lang="ts">
import { computed } from 'vue';
import { getPinyinSyllables } from '@/utils/pinyin';

const props = defineProps<{
  name: string;
}>();

const syllables = computed(() => getPinyinSyllables(props.name));
</script>

<template>
  <span class="inline-flex flex-wrap items-baseline justify-center gap-x-1">
    <ruby v-for="(s, i) in syllables" :key="i">
      {{ s.char }}<rt v-if="s.pinyin">{{ s.pinyin }}</rt>
    </ruby>
  </span>
</template>

<style scoped>
ruby {
  ruby-align: center;
}
rt {
  font-size: 0.5em;
  line-height: 1.2;
  color: var(--color-text-sub);
  font-weight: 400;
  letter-spacing: 0.02em;
  user-select: none;
}
</style>