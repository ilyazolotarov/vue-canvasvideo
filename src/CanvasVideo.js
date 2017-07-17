import debounce from 'lodash.debounce'
import CanvasVideoControls from './CanvasVideoControls'
import {
  videoWrapStyles,
  videoWrapInnerStyles,
  videoCanvasStyles,
  videoStyles,
  mediaCoveringStyles
} from './styles/player/base'
import { hidden } from './styles/helpers'

export default {
  render (h) {
    return (
      h(
        'div',
        {
          attrs: { class: 'vue-canvasvideo-wrap' },
          style: videoWrapStyles,
          ref: 'videoWrapper'
        },
        [
          h(
            'div',
            {
              attrs: { class: 'vue-canvasvideo-inner' },
              style: this.computedWrapStyles
            },
            [
              h(
                'video',
                {
                  attrs: { class: 'vue-canvasvideo-video', src: this.src },
                  style: this.computedVideoStyles,
                  ref: 'video'
                }
              ),
              h(
                'canvas',
                {
                  attrs: {
                    class: 'vue-canvasvideo-canvas',
                    width: this.width,
                    height: this.height
                  },
                  style: this.computedCanvasStyles,
                  ref: 'videoCanvas'
                }
              ),
              (this.controls && h(CanvasVideoControls))
            ]
          )

        ]
      )
    )
  },
  data () {
    return {
      playing: false,
      aspectRatioPercentage: '',
      lastTime: 0,
      width: 0,
      height: 0
    }
  },
  methods: {
    init () {
      this.ctx = this.$refs.videoCanvas.getContext('2d')
      this.$refs.video.load()
      this.setCanvasSize()
      if (this.autoplay) this.play()
    },
    bind () {
      const { video } = this.$refs
      // Draw a frame on every timeupdate
      video.addEventListener('timeupdate', () => this.drawFrame())
      // Draw the first frame
      video.addEventListener('canplay', () => this.drawFrame())
      // Set the canvas size to the video size once we know it...
      video.addEventListener('loadedmetadata', () => this.setCanvasSize())
      // in case 'canplay' already fired
      if (video.readyState >= 2) this.drawFrame()
      // debounce window resize
      window.addEventListener('resize', debounce(() => {
        this.setCanvasSize()
        this.drawFrame()
      }, 1000))
    },
    updateTimeline () {
      // const percentage = (this.video.currentTime * 100 / this.video.duration).toFixed(2)
      // this.timelinePassed.style.width = percentage + '%'
    },
    setCanvasSize () {
      const { video } = this.$refs
      this.width = video.videoWidth
      this.height = video.videoHeight
      this.aspectRatioPercentage = `${(this.height / this.width) * 100}%`
    },
    play () {
      this.lastTime = Date.now()
      this.playing = true
      this.renderVideo()
      // @TODO: set and resync audio
    },
    pause () {
      this.playing = false
    },
    togglePlay () {
      if (this.playing) this.pause()
      else this.play()
    },
    renderVideo () {
      const { video } = this.$refs
      const time = Date.now()
      const elapsed = (time - this.lastTime) / 1000
      // set video time, trigger render
      if (elapsed >= (1 / this.fps)) {
        video.currentTime = video.currentTime + elapsed
        this.lastTime = time
      }

      if (video.currentTime >= video.duration) {
        if (!this.loop) this.playing = false
        if (this.resetOnLast || this.loop) video.currentTime = 0
      }

      if (this.playing) this.animationFrame = window.requestAnimationFrame(() => this.renderVideo())
      else window.cancelAnimationFrame(this.animationFrame)
    },
    drawFrame () {
      const { video } = this.$refs
      this.ctx.drawImage(video, 0, 0, this.width, this.height)
    }
  },
  computed: {
    computedWrapStyles () {
      return (this.cover)
        ? Object.assign({}, { paddingBottom: this.aspectRatioPercentage }, videoWrapInnerStyles, mediaCoveringStyles)
        : { paddingBottom: this.aspectRatioPercentage, ...videoWrapInnerStyles }
    },
    computedVideoStyles () {
      const cover = Object.assign({}, videoStyles, mediaCoveringStyles)
      if (this.showVideo) {
        if (this.cover) return cover
        return videoStyles
      }
      return hidden
    },
    computedCanvasStyles () {
      const cover = Object.assign({}, videoCanvasStyles, mediaCoveringStyles)
      if (this.showVideo) return hidden
      if (this.cover) return cover
      return videoCanvasStyles
    }
  },
  mounted () {
    this.init()
    this.bind()
  },
  props: {
    src: {
      type: String,
      required: true
    },
    fps: {
      type: Number,
      default: () => 25
    },
    showVideo: {
      type: Boolean,
      default: () => false
    },
    autoplay: {
      type: Boolean,
      default: () => false
    },
    loop: {
      type: Boolean,
      default: () => false
    },
    pauseOnClick: {
      type: Boolean,
      default: () => false
    },
    resetOnLast: {
      type: Boolean,
      default: () => false
    },
    audio: {
      type: Boolean,
      default: () => false
    },
    cover: {
      type: Boolean,
      default: () => false
    },
    controls: {
      type: Boolean,
      default: () => false
    }
  }
}
