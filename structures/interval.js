class IntervalProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            {name: "interval", defaultValue: 30000, minValue: 0, maxValue: 1000000}, 
            {name: "duration", defaultValue: 1000, minValue: 0, maxValue: 1000000},
            {name: "volume", defaultValue: 0.5, minValue: 0, maxValue: 1}
        ]
    }

    constructor() {
      super()
      this.interval = 30000
      this.duration = 1000
      this.volume = 0.5
      this.intervalTimer = 0
      this.durationTimer = 0
      this.switch = false
    }
  
    process(inputs, outputs, parameters) {
      const input1 = inputs[0]
      const input2 = inputs[1]
      const output = outputs[0]

      if (!input1?.[0]) return true
      const fillerInput2 = new Float32Array(input1[0]?.length || 128).fill(0)
  
      const interval = parameters.interval[0]
      const duration = parameters.duration[0]
      const volume = parameters.volume[0]
      if (!Number.isNaN(interval)) this.interval = interval
      if (!Number.isNaN(duration)) this.duration = duration
      if (!Number.isNaN(volume)) this.volume = volume

      const intervalSamples = Math.round(this.interval * (sampleRate / 1000) * 2)
      const durationSamples = Math.round(this.duration * (sampleRate / 1000) * 2)
  
      for (let channel = 0; channel < output.length; channel++) {
        const outputChannel = output[channel]
        const input1Channel = input1[channel]
        const input2Channel = input2 ? input2[channel] : fillerInput2
  
        for (let i = 0; i < outputChannel.length; i++) {
          if (this.intervalTimer >= intervalSamples) {
            this.switch = !this.switch
            this.intervalTimer = 0
          }
          if (this.switch) {
            let merged = input1Channel[i] + input2Channel[i] * this.volume * 1.8
            if (merged > 1) merged = input2Channel[i]
            outputChannel[i] = merged
            if (this.durationTimer >= durationSamples) {
                this.switch = !this.switch
                this.durationTimer= 0
            }
            this.durationTimer++
          } else {
            outputChannel[i] = input1Channel[i]
          }
          this.intervalTimer++
        }
      }
      return true
    }
  }
  
  registerProcessor("interval-processor", IntervalProcessor)