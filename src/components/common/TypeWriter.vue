<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    phrases: string[];
    typeSpeed?: number;
    deleteSpeed?: number;
    hold?: number;
  }>(),
  { typeSpeed: 90, deleteSpeed: 40, hold: 1800 }
);

const text = ref('');
const cursorVisible = ref(true);

let phraseIndex = 0;
let charIndex = 0;
let deleting = false;
let timer: number | undefined;
let blink: number | undefined;

function schedule(ms: number): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(tick, ms);
}

function tick(): void {
  const phrase = props.phrases[phraseIndex];
  if (!phrase) return;
  if (!deleting) {
    charIndex += 1;
    text.value = phrase.slice(0, charIndex);
    if (charIndex >= phrase.length) {
      deleting = true;
      schedule(props.hold);
      return;
    }
    schedule(props.typeSpeed);
  } else {
    charIndex -= 1;
    text.value = phrase.slice(0, charIndex);
    if (charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % props.phrases.length;
      schedule(props.typeSpeed);
      return;
    }
    schedule(props.deleteSpeed);
  }
}

onMounted(() => {
  schedule(props.typeSpeed);
  blink = window.setInterval(() => {
    cursorVisible.value = !cursorVisible.value;
  }, 520);
});

onBeforeUnmount(() => {
  window.clearTimeout(timer);
  window.clearInterval(blink);
});
</script>

<template>
  <span class="typewriter inline-flex items-center">
    <span>{{ text }}</span>
    <span
      class="ml-0.5 text-primary"
      :style="{ visibility: cursorVisible ? 'visible' : 'hidden' }"
    >
      ▍
    </span>
  </span>
</template>