import ImageComponent from './src/component.vue'

const Options = {
  upload(file, onProgress) {
    console.warn('[vue-elder-image]: You need to setup the upload function before using this plugin')
    onProgress(50)
    return new Promise((resolve, reject) => {
      let reader = new FileReader()
      reader.onloadend = function() {
        resolve({
          url: reader.result,
          type: file.type,
        })
      }
      reader.readAsDataURL(file)
    })
  },
  serialize(val) {
    return val
  },
  dropMessage: 'Drag an image here or <b>browse</b> to upload.',
}

const install = Vue => {
  Vue.component('image-component', ImageComponent)
}

const setup = options => {
  for (let key in options) {
    if (!(key in Options)) return
    Options[key] = options[key]
  }
}

export default {
  install,
}

export { ImageComponent, install as ImageComponentInstaller, setup, Options }
