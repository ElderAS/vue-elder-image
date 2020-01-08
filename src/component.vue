<template>
  <div class="elder-image" :class="['elder-image--' + placement]">
    <label v-if="label" :for="id" class="elder-image__label">
      {{ label }}
      <span v-if="isRequired" class="elder-image__label-required">*</span>
    </label>
    <div
      class="elder-image__droparea"
      :class="{ 'elder-image__droparea--selected': selected }"
      :style="dropareaStyle"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <input type="text" :value="value" :required="isRequired" />
      <input
        type="file"
        accept="image/*"
        ref="input"
        @change="onChange"
        :disabled="!canUpload"
        :multiple="multiple"
      />
      <div class="elder-image__droparea-instruction">
        <slot name="drop-message">
          <div v-html="dropMessage"></div>
        </slot>
      </div>
      <div
        v-if="!multiple && selected"
        class="elder-image__thumbnail-delete"
        @click="remove(selected)"
      >
        <FontAwesomeIcon icon="trash"></FontAwesomeIcon>
      </div>
    </div>
    <Draggable
      v-if="multiple"
      v-model="thumbnails"
      :disabled="!sortable"
      class="elder-image__thumbnails"
    >
      <thumbnail
        v-for="(item, index) in thumbnails"
        :key="index"
        :selected="selected === item"
        :value="serializeComp(item)"
        @click="selected = item"
        @delete="remove(item)"
      />
    </Draggable>
    <Uploader
      v-if="queue.total"
      :value="queue.progress"
      :bytes="queue.bytes"
      :current="queue.counter"
      :total="queue.total"
    ></Uploader>
  </div>
</template>

<script>
import { AttributeBoolean, Clone } from './utils'
import { Options } from '../index'
import Uploader from './uploader'
import Thumbnail from './thumbnail'
import Draggable from 'vuedraggable'

import './icons'

const QueueTemplate = {
  counter: 0,
  total: 0,
  progress: 0,
  bytes: 0,
  result: [],
}

/* Value format
{
  url: '...',
  type: '...'
}
------------ */

export default {
  props: {
    value: [Array, Object, String],
    label: String,
    multiple: Boolean,
    sortable: {
      type: Boolean,
      default: true,
    },
    upload: Function,
    serialize: Function,
    size: {
      type: String,
      default: 'cover',
    },
    placement: {
      type: String,
      enum: ['outside', 'inside'],
    },
  },
  data() {
    return {
      id: null,
      selected: null,
      queue: Clone(QueueTemplate),
    }
  },
  computed: {
    isRequired: AttributeBoolean('required'),
    isDisabled: AttributeBoolean('disabled'),
    serializeComp() {
      return this.serialize || Options.serialize
    },
    dropMessage() {
      return Options.dropMessage
    },
    uploadComp() {
      return this.upload || Options.upload
    },
    canUpload() {
      return !this.isDisabled && !this.queue.total
    },
    thumbnails: {
      get() {
        if (!this.value) return []
        return this.value instanceof Array ? this.value : [this.value]
      },
      set(val) {
        if (!this.multiple) return
        this.$emit('input', val)
      },
    },
    dropareaStyle() {
      if (!this.selected) return {}
      return {
        backgroundImage: `url(${this.serializeComp(this.selected).url})`,
        backgroundSize: this.size,
        backgroundOrigin: this.size === 'contain' ? 'content-box' : undefined,
        borderStyle: 'solid',
        borderWidth: '1px',
      }
    },
  },
  methods: {
    run(files) {
      files = Array.from(files).filter(f => f.type.match(/image.*/))

      this.queue.total = files.length
      this.queue.counter = 0
      this.queue.bytes = files.reduce((res, cur) => (res += cur.size), 0)
      let progress = files.map(() => 0)

      Promise.all(
        files.map((file, index) => {
          return this.uploadComp(file, val => {
            progress[index] = val
            this.queue.progress = progress.reduce((r, c) => (r += c), 0) / progress.length
          }).then(res => {
            this.queue.counter++
            return res
          })
        }),
      ).then(result => {
        if (!result || !result.length) return
        this.$emit('input', this.multiple ? [...(this.value || []), ...result] : result[0])
        this.resetQueue()
        if (!this.selected || !this.multiple) this.$nextTick(() => this.select())
      })
    },
    remove(item) {
      this.$emit('input', this.multiple ? this.value.filter(v => v !== item) : null)
      if (this.selected === item) this.$nextTick(() => this.select())
    },
    onChange(e) {
      this.run(e.target.files)
      this.$refs.input.value = null
    },
    onDrop(e) {
      e.preventDefault()
      if (this.isReadonly || !e.dataTransfer.files.length) return
      this.run(e.dataTransfer.files)
    },
    onDragOver(e) {
      e.preventDefault()
    },
    resetQueue() {
      this.queue = Clone(QueueTemplate)
    },
    select(val) {
      if (!this.value) return (this.selected = null)
      if (this.multiple && !this.value.length) return (this.selected = null)
      if (val) return (this.selected = val)

      return (this.selected = this.multiple ? this.value[0] : this.value)
    },
  },
  created() {
    this.id = this._uid
    this.select()
  },
  components: {
    Uploader,
    Thumbnail,
    Draggable,
  },
}
</script>

<style lang="scss">
.elder-image {
  @import './variables.scss';

  display: flex;
  flex-direction: column;
  text-align: left;
  position: relative;

  &__label {
    display: block;
    font-weight: bold;
    margin-bottom: 0.5em;

    &-required {
      color: $error;
    }
  }

  &__droparea {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    border: 2px dashed $border-color;
    background-position: center;
    background-repeat: no-repeat;
    background-color: $input-color;
    border-radius: $border-radius;
    padding: 1rem;
    text-align: center;
    flex-grow: 1;

    &:hover .elder-image__thumbnail-delete {
      opacity: 1;
      transform: translateY(0);
    }

    .elder-image__thumbnail-delete {
      top: initial;
      bottom: 1rem;
      right: 1rem;
    }

    &-instruction {
      transition: opacity 250ms ease;
      font-size: 0.9em;

      .elder-image__droparea:hover & {
        opacity: 1;
      }

      @media (hover: hover) {
        .elder-image__droparea--selected & {
          opacity: 0;
          background-color: rgba(white, 0.75);
          padding: 1rem;
          border-radius: $border-radius;
        }
      }
    }

    input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;

      &[type='text'] {
        pointer-events: none;
        z-index: -1;
      }
    }

    b {
      color: $primary;
    }
  }

  &__uploader {
    margin-top: 1rem;

    .elder-image--inside & {
      position: absolute;
      top: 0;
      right: 0;
      margin-top: 2rem;
      margin-right: 2rem;
    }
  }

  &__thumbnails {
    $space: 1rem;

    display: flex;
    margin-top: 1rem;
    flex-wrap: wrap;

    margin-left: -$space;
    margin-bottom: -$space;

    & > * {
      margin-left: $space;
      margin-bottom: $space;
    }

    .elder-image--inside & {
      position: absolute;
      bottom: 2rem;
      right: 2rem;
    }
  }
}
</style>
