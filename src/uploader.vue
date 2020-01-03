<template>
  <div class="elder-image__uploader">
    <div>{{ value | floor }} %</div>
    <div class="elder-image__uploader-bar">
      <div class="elder-image__uploader-bar-value" :style="{ width: value + '%' }"></div>
    </div>
    <div class="elder-image__uploader-meta">
      <div v-if="hasMultiple">{{ current }} / {{ total }}</div>
      <div v-if="bytes">({{ size }})</div>
    </div>
  </div>
</template>

<script>
import { BytesToSize } from './utils'
export default {
  props: {
    value: Number,
    bytes: Number,
    current: {
      type: Number,
      default: 1,
    },
    total: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    hasMultiple() {
      return this.total > 1
    },
    size() {
      return BytesToSize(this.bytes)
    },
  },
  filters: {
    floor: Math.floor,
  },
}
</script>

<style lang="scss">
.elder-image__uploader {
  @import './variables.scss';

  background-color: white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 0.7em;

  &-bar {
    flex-grow: 1;
    margin: 0 1rem;
    border-radius: $border-radius;
    height: 5px;
    background-color: $border-color;
  }

  &-bar-value {
    background-color: $primary;
    height: inherit;
    border-radius: inherit;
    transition: width 100ms ease;
  }

  &-meta {
    display: flex;
    align-items: center;

    & > * + * {
      margin-left: 5px;
    }
  }
}
</style>
