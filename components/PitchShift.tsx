import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {Dropdown, DropdownButton} from "react-bootstrap"
import {SiteHueContext, SiteSaturationContext, SiteLightnessContext, AttackModeContext, AudioContext, 
AudioNameContext, AudioSpeedContext, AudioReverseContext, SourceNodeContext, SecondsProgressContext, ProgressContext, VolumeContext,
PreviousVolumeContext, PreservesPitchContext, StartTimeContext, ElapsedTimeContext, ReverseActiveContext, DurationContext, PauseContext,
SeekToContext, UpdateEffectContext, SavedTimeContext, OriginalDurationContext, EffectNodeContext, patterns} from "../renderer"
import functions from "../structures/Functions"
import Slider from "react-slider"
import audioReverseIcon from "../assets/icons/audio-reverse.png"
import audioSpeedIcon from "../assets/icons/audio-speed.png"
import audioClearIcon from "../assets/icons/audio-clear.png"
import audioPlayIcon from "../assets/icons/audio-play.png"
import audioPauseIcon from "../assets/icons/audio-pause.png"
import audioRewindIcon from "../assets/icons/audio-rewind.png"
import audioFastforwardIcon from "../assets/icons/audio-fastforward.png"
import audioPreservePitchIcon from "../assets/icons/audio-preservepitch.png"
import audioPreservePitchOnIcon from "../assets/icons/audio-preservepitch-on.png"
import audioFullscreenIcon from "../assets/icons/audio-fullscreen.png"
import audioVolumeIcon from "../assets/icons/audio-volume.png"
import audioVolumeLowIcon from "../assets/icons/audio-volume-low.png"
import audioVolumeMuteIcon from "../assets/icons/audio-volume-mute.png"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import audioPlaceholder from "../assets/images/audio-placeholder.png"
// @ts-ignore
import {createScheduledSoundTouchNode} from "@dancecuts/soundtouchjs-scheduled-audio-worklet"
import "./styles/bitcrush.less"

interface Props {
    audioContext: AudioContext
}

let gainNode = null as any
let lfoNode = null as any
let highpassFilterNode = null as any

const PitchShift: React.FunctionComponent<Props> = (props) => {
    const {audio, setAudio} = useContext(AudioContext)
    const {audioName, setAudioName} = useContext(AudioNameContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {attackMode, setAttackMode} = useContext(AttackModeContext)
    const [pitchShift, setPitchShift] = useState(0)
    const [audioRate, setAudioRate] = useState(1)
    const [lfoMode, setLFOMode] = useState(false)
    const [lfoRate, setLFORate] = useState(1)
    const [lfoShape, setLFOShape] = useState("square")
    const [highpassCutoff, setHighpassCutoff] = useState(0)
    const [restartFlag, setRestartFlag] = useState(false)
    const {sourceNode, setSourceNode} = useContext(SourceNodeContext)
    const {effectNode, setEffectNode} = useContext(EffectNodeContext)
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const [showSpeedSlider, setShowSpeedSlider] = useState(false)
    const coverRef = useRef<HTMLCanvasElement>(null)
    const audioControls = useRef<HTMLDivElement>(null)
    const audioSliderRef = useRef<any>(null)
    const audioSpeedRef = useRef(null) as any
    const audioVolumeRef = useRef(null) as any
    const audioVolumeSliderRef = useRef<any>(null)
    const audioSpeedSliderRef = useRef<any>(null)
    const {secondsProgress, setSecondsProgress} = useContext(SecondsProgressContext)
    const {progress, setProgress} = useContext(ProgressContext)
    const [dragProgress, setDragProgress] = useState(0) as any
    const {audioReverse, setAudioReverse} = useContext(AudioReverseContext)
    const {audioSpeed, setAudioSpeed} = useContext(AudioSpeedContext)
    const {volume, setVolume} = useContext(VolumeContext)
    const {previousVolume, setPreviousVolume} = useContext(PreviousVolumeContext)
    const {paused, setPaused} = useContext(PauseContext)
    const {preservesPitch, setPreservesPitch} = useContext(PreservesPitchContext)
    const {duration, setDuration} = useContext(DurationContext)
    const {originalDuration, setOriginalDuration} = useContext(OriginalDurationContext)
    const [dragging, setDragging] = useState(false)
    const [coverImg, setCoverImg] = useState(null) as any
    const {startTime, setStartTime} = useContext(StartTimeContext)
    const {elapsedTime, setElapsedTime} = useContext(ElapsedTimeContext)
    const {seekTo, setSeekTo} = useContext(SeekToContext)
    const {updateEffect, setUpdateEffect} = useContext(UpdateEffectContext)
    const {reverseActive, setReverseActive} = useContext(ReverseActiveContext)
    const {savedTime, setSavedTime} = useContext(SavedTimeContext)
    const history = useHistory()
    
    const audioContext = props.audioContext

    useEffect(() => {
        if (audioSliderRef.current) audioSliderRef.current.resize()
        if (audioSpeedSliderRef.current) audioSpeedSliderRef.current.resize()
        if (audioVolumeSliderRef.current) audioVolumeSliderRef.current.resize()
    })

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const getFilter2 = () => {
        return ""
        //return `hue-rotate(${siteHue - 189}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 50}%)`
    }

    const getCurrentTime = () => {
        let currentTime = 0
        if (sourceNode && sourceNode.playbackState === sourceNode.PLAYING_STATE) {
          currentTime = elapsedTime + audioContext.currentTime - startTime
        } else {
          currentTime = elapsedTime
        }
        while (currentTime > duration) currentTime -= duration
        return currentTime
    }

    useEffect(() => {
        let timeout = null as any
        const updatePosition = async () => {
            let currentTime = getCurrentTime()
            let percent = (currentTime / duration)
            if (!Number.isFinite(percent)) return
            if (!dragging) {
                if (audioReverse) {
                    setProgress((1-percent) * 100)
                    setSecondsProgress(duration - currentTime)
                } else {
                    setProgress(percent * 100)
                    setSecondsProgress(currentTime)
                }
            }
            setSavedTime(currentTime)
            if (String(sourceNode?.playing) === "false") {
                setSeekTo(0)
            }
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                    resolve()
                }, 1000)
            }).then(updatePosition)
        }
        updatePosition()
        return () => {
            clearTimeout(timeout)
        }
    }, [sourceNode, duration, dragging, audioReverse, startTime, elapsedTime])

    const loadAudio = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const wav = result?.mime === "audio/x-wav"
                const mp3 = result?.mime === "audio/mpeg"
                const ogg = result?.mime === "audio/ogg"
                const aiff = result?.mime === "audio/x-aiff"
                if (wav || mp3 || ogg || aiff) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setAudio(link)
                    setAudioName(file.name.slice(0, 30))
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const applyPitchShift = async (offset: number = 0) => {
        if (!audio) return
        if (!offset) stop()
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        let audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        setDuration(audioBuffer.duration / audioSpeed / audioRate)
        setOriginalDuration(audioBuffer.duration)
        if (lfoMode) {
            const {bpm} = await functions.getBPM(audioBuffer)
            gainNode?.disconnect()
            gainNode = audioContext.createGain()
            gainNode.gain.value = volume 
            highpassFilterNode?.disconnect()
            highpassFilterNode = audioContext.createBiquadFilter()
            highpassFilterNode.type = "highpass"
            highpassFilterNode.frequency.value = highpassCutoff
            highpassFilterNode.Q.value = 2
            await audioContext.audioWorklet.addModule("./soundtouch.js")
            sourceNode?.disconnect()
            effectNode?.disconnect()
            const source = createScheduledSoundTouchNode(audioContext, audioBuffer)
            const effect = createScheduledSoundTouchNode(audioContext, audioBuffer)
            source.loop = true
            effect.loop = true
            const pitchCorrect = preservesPitch ? 1 / audioSpeed : 1
            source.parameters.get("pitch").value = functions.semitonesToScale(pitchShift) * pitchCorrect
            source.parameters.get("tempo").value = audioRate
            source.parameters.get("rate").value = audioSpeed
            effect.parameters.get("pitch").value = pitchCorrect
            effect.parameters.get("tempo").value = audioRate
            effect.parameters.get("rate").value = audioSpeed
            await functions.timeout(300)
            await audioContext.audioWorklet.addModule("./lfo.js")
            lfoNode?.disconnect()
            lfoNode = new AudioWorkletNode(audioContext, "lfo-processor", {numberOfInputs: 2, outputChannelCount: [2]})
            lfoNode.parameters.get("bpm").value = bpm
            lfoNode.parameters.get("lfoRate").value = lfoRate
            lfoNode.port.postMessage({lfoShape})
            source.connect(lfoNode, 0, 0)
            effect.connect(lfoNode, 0, 1)
            lfoNode.connect(highpassFilterNode)
            highpassFilterNode.connect(gainNode)
            gainNode.connect(audioContext.destination)
            source.start(0, offset)
            effect.start(0, offset)
            setSourceNode(source)
            setEffectNode(effect)
            setStartTime(audioContext.currentTime)
            audioContext.resume()
            setPaused(false)
        } else {
            if (audioReverse) audioBuffer = functions.reverseAudioBuffer(audioBuffer)
            const pitchCorrect = preservesPitch ? 1 / audioSpeed : 1
            gainNode?.disconnect()
            gainNode = audioContext.createGain()
            gainNode.gain.value = volume
            highpassFilterNode?.disconnect()
            highpassFilterNode = audioContext.createBiquadFilter()
            highpassFilterNode.type = "highpass"
            highpassFilterNode.frequency.value = highpassCutoff
            highpassFilterNode.Q.value = 2
            await audioContext.audioWorklet.addModule("./soundtouch.js")
            sourceNode?.disconnect()
            effectNode?.disconnect()
            const source = createScheduledSoundTouchNode(audioContext, audioBuffer)
            source.loop = true
            source.parameters.get("pitch").value = functions.semitonesToScale(pitchShift) * pitchCorrect
            source.parameters.get("tempo").value = audioRate
            source.parameters.get("rate").value = audioSpeed
            await functions.timeout(300)
            source.connect(highpassFilterNode)
            highpassFilterNode.connect(gainNode)
            gainNode.connect(audioContext.destination)
            source.start(0, offset)
            setSourceNode(source)
            setEffectNode(null)
            setStartTime(audioContext.currentTime)
            audioContext.resume()
            setPaused(false)
        }
    }

    const updateSongCover = async () => {
        try {
            const songCover = await functions.songCover(audio)
            setCoverImg(songCover)
        } catch {
            setCoverImg("")
        }
    }

    useEffect(() => {
        applyPitchShift()
        updateSongCover()
    }, [audio])

    useEffect(() => {
        const pitchCorrect = preservesPitch ? 1 / audioSpeed : 1
        if (sourceNode) {
            sourceNode.parameters.get("pitch").value = functions.semitonesToScale(pitchShift) * pitchCorrect
            sourceNode.parameters.get("tempo").value = audioRate
            sourceNode.parameters.get("rate").value = audioSpeed
        }
        if (effectNode) {
            effectNode.parameters.get("pitch").value = pitchCorrect
            effectNode.parameters.get("tempo").value = audioRate
            effectNode.parameters.get("rate").value = audioSpeed
        }
        if (lfoNode) {
            lfoNode.parameters.get("lfoRate").value = lfoRate
            lfoNode.port.postMessage({lfoShape})
        }

        if (highpassFilterNode) {
            highpassFilterNode.frequency.value = highpassCutoff
        }
        setDuration(originalDuration / audioSpeed / audioRate)
    }, [pitchShift, audioRate, audioSpeed, preservesPitch, highpassCutoff, lfoMode, lfoRate, lfoShape, originalDuration])

    useEffect(() => {
        if (updateEffect) {
            if (restartFlag) {
                applyPitchShift()
                setRestartFlag(false)
            } else {
                applyPitchShift(getCurrentTime())
            }
            setUpdateEffect(false)
        }
    }, [sourceNode, effectNode, pitchShift, audioRate, startTime, elapsedTime, duration, audioReverse, audioSpeed, preservesPitch, highpassCutoff, updateEffect, lfoMode, lfoRate, lfoShape, restartFlag])

    useEffect(() => {
        if (gainNode) {
            gainNode.gain.value = functions.logSlider(volume)
        }
    }, [volume])

    const removeAudio = () => {
        setAudio("")
        setAudioName("")
        stop()
    }

    const reset = () => {
        setPitchShift(0)
        setAudioRate(1)
        setLFORate(1)
        setLFOMode(false)
        setLFOShape("square")
        setHighpassCutoff(0)
    }

    useEffect(() => {
        const savedPitchShift = localStorage.getItem("pitchShift")
        if (savedPitchShift) setPitchShift(Number(savedPitchShift))
        const savedAudioRate = localStorage.getItem("audioRate")
        if (savedAudioRate) setAudioRate(Number(savedAudioRate))
        const savedPitchShiftLFORate = localStorage.getItem("pitchShiftLFORate")
        if (savedPitchShiftLFORate) setLFORate(Number(savedPitchShiftLFORate))
        const savedPitchShiftLFOMode = localStorage.getItem("pitchShiftLFOMode")
        if (savedPitchShiftLFOMode) setLFOMode(savedPitchShiftLFOMode === "true")
        const savedPitchShiftLFOShape = localStorage.getItem("pitchShiftLFOShape")
        if (savedPitchShiftLFOShape) setLFOShape(savedPitchShiftLFOShape)
        const savedVolume = localStorage.getItem("volume")
        if (savedVolume) setVolume(Number(savedVolume))
        const savedPreviousVolume = localStorage.getItem("previousVolume")
        if (savedPreviousVolume) setPreviousVolume(Number(savedPreviousVolume))
        const savedPreservesPitch = localStorage.getItem("preservesPitch")
        if (savedPreservesPitch) setPreservesPitch(Number(savedPreservesPitch))
        const savedPitchShiftHighpassCutoff = localStorage.getItem("pitchShiftHighpassCutoff")
        if (savedPitchShiftHighpassCutoff) setHighpassCutoff(Number(savedPitchShiftHighpassCutoff))
        setTimeout(() => {
            setRestartFlag(true)
            setUpdateEffect(true)
            setTimeout(() => {
                setSeekTo(savedTime)
            }, 300)
        }, 400)
    }, [])

    useEffect(() => {
        localStorage.setItem("pitchShift", String(pitchShift))
        localStorage.setItem("audioRate", String(audioRate))
        localStorage.setItem("pitchShiftLFORate", String(lfoRate))
        localStorage.setItem("pitchShiftLFOMode", String(lfoMode))
        localStorage.setItem("pitchShiftLFOShape", String(lfoShape))
        localStorage.setItem("volume", String(volume))
        localStorage.setItem("previousVolume", String(volume))
        localStorage.setItem("preservesPitch", String(preservesPitch))
        localStorage.setItem("pitchShiftHighpassCutoff", String(highpassCutoff))
    }, [volume, previousVolume, preservesPitch, pitchShift, audioRate, lfoRate, lfoMode, lfoShape, highpassCutoff])

    const render = async () => {
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        let audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        if (audioReverse) audioBuffer = functions.reverseAudioBuffer(audioBuffer)
        const offlineContext = new OfflineAudioContext({
            numberOfChannels: audioBuffer.numberOfChannels, 
            length: audioBuffer.length / audioSpeed, 
            sampleRate: audioBuffer.sampleRate
        })
        let rendered = null as any
        if (lfoMode) {
            const {bpm} = await functions.getBPM(audioBuffer)
            const gainNode = offlineContext.createGain()
            gainNode.gain.value = 1
            const highpassFilterNode = offlineContext.createBiquadFilter()
            highpassFilterNode.type = "highpass"
            highpassFilterNode.frequency.value = highpassCutoff
            highpassFilterNode.Q.value = 2
            const pitchCorrect = preservesPitch ? 1 / audioSpeed : 1
            await offlineContext.audioWorklet.addModule("./soundtouch.js")
            const source = createScheduledSoundTouchNode(offlineContext, audioBuffer)
            const effect = createScheduledSoundTouchNode(offlineContext, audioBuffer)
            source.loop = true
            effect.loop = true
            source.parameters.get("pitch").value = functions.semitonesToScale(pitchShift) * pitchCorrect
            source.parameters.get("tempo").value = audioRate
            source.parameters.get("rate").value = audioSpeed
            effect.parameters.get("pitch").value = pitchCorrect
            effect.parameters.get("tempo").value = audioRate
            effect.parameters.get("rate").value = audioSpeed
            await functions.timeout(300)
            await offlineContext.audioWorklet.addModule("./lfo.js")
            const lfoNode = new AudioWorkletNode(offlineContext, "lfo-processor", {numberOfInputs: 2, outputChannelCount: [2]}) as any
            lfoNode.parameters.get("bpm").value = bpm
            lfoNode.parameters.get("lfoRate").value = lfoRate
            source.connect(lfoNode, 0, 0)
            effect.connect(lfoNode, 0, 1)
            lfoNode.connect(highpassFilterNode)
            highpassFilterNode.connect(gainNode)
            gainNode.connect(offlineContext.destination)
            source.start()
            effect.start()
            rendered = await offlineContext.startRendering()
        } else {
            const pitchCorrect = preservesPitch ? 1 / audioSpeed : 1
            const gainNode = offlineContext.createGain()
            gainNode.gain.value = volume
            const highpassFilterNode = offlineContext.createBiquadFilter()
            highpassFilterNode.type = "highpass"
            highpassFilterNode.frequency.value = highpassCutoff
            highpassFilterNode.Q.value = 2
            await offlineContext.audioWorklet.addModule("./soundtouch.js")
            const source = createScheduledSoundTouchNode(offlineContext, audioBuffer)
            source.loop = true
            source.parameters.get("pitch").value = functions.semitonesToScale(pitchShift) * pitchCorrect
            source.parameters.get("tempo").value = audioRate
            source.parameters.get("rate").value = audioSpeed
            await functions.timeout(300)
            source.connect(highpassFilterNode)
            highpassFilterNode.connect(gainNode)
            gainNode.connect(offlineContext.destination)
            source.start()
            rendered = await offlineContext.startRendering()
        }
        return rendered
    }

    const mp3 = async () => {
        const audioBuffer = await render()
        const wav = functions.encodeWAV(audioBuffer)
        let mp3 = await functions.convertToMP3(wav)
        if (coverImg) mp3 = await functions.writeSongCover(mp3, coverImg, audio)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.mp3`, mp3)
    }

    const wav = async () => {
        const audioBuffer = await render()
        const wav = functions.encodeWAV(audioBuffer)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.wav`, wav)
    }

    const ogg = async () => {
        const audioBuffer = await render()
        const ogg = await functions.encodeOGG(audioBuffer, coverImg, audio)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.ogg`, ogg)
    }

    const flac = async () => {
        const audioBuffer = await render()
        const flac = await functions.encodeFLAC(audioBuffer)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.flac`, flac)
    }

    useEffect(() => {
        if (!dragging && dragProgress !== null) {
            setSecondsProgress(dragProgress)
            setProgress((dragProgress / duration) * 100)
            setDragProgress(null)
        }
    }, [dragging, dragProgress, duration])

    const getPreservePitchIcon = () => {
        if (preservesPitch) return audioPreservePitchIcon
        return audioPreservePitchOnIcon
    }

    const getAudioSpeedMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = 4
        return `${raw + offset}px`
    }

    const getAudioVolumeMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -7
        return `${raw + offset}px`
    }

    const updateProgressText = (value: number) => {
        let percent = value / 100
        if (audioReverse === true) {
            const secondsProgress = (1-percent) * duration
            setDragProgress(duration - secondsProgress)
        } else {
            const secondsProgress = percent * duration
            setDragProgress(secondsProgress)
        }
    }

    useEffect(() => {
        if (seekTo !== null) {
            let progress = (100 / duration) * seekTo
            if (audioReverse) progress = 100 - progress
            start(seekTo)
            setProgress(progress)
            setSecondsProgress(seekTo)
            setSeekTo(null)
        }
    }, [seekTo, audioReverse, pitchShift, audioRate, audioSpeed, preservesPitch, reverseActive, elapsedTime, startTime, duration, lfoMode])

    const updatePlay = async (alwaysPlay?: boolean) => {
        if (paused || alwaysPlay) {
            audioContext.resume()
            setPaused(false)
        } else {
            audioContext.suspend()
            setPaused(true)
        }
    }

    const start = async (offset: number) => {
        if (!sourceNode) return
        sourceNode.stop()
        sourceNode.disconnect()
        effectNode?.stop()
        effectNode?.disconnect()
        setSourceNode(null)
        let audioBuffer = sourceNode.audioBuffer
        let effectBuffer = effectNode?.audioBuffer
        if (audioReverse && !reverseActive) {
            audioBuffer = functions.reverseAudioBuffer(audioBuffer)
            if (effectBuffer) effectBuffer = functions.reverseAudioBuffer(effectBuffer)
            setReverseActive(true)
        } else if (!audioReverse && reverseActive) {
            audioBuffer = functions.reverseAudioBuffer(audioBuffer)
            if (effectBuffer) effectBuffer = functions.reverseAudioBuffer(effectBuffer)
            setReverseActive(false)
        }
        const pitchCorrect = preservesPitch ? 1 / audioSpeed : 1
        if (lfoMode) {
            const source = createScheduledSoundTouchNode(audioContext, audioBuffer)
            const effect = createScheduledSoundTouchNode(audioContext, audioBuffer)
            source.parameters.get("pitch").value = functions.semitonesToScale(pitchShift) * pitchCorrect
            source.parameters.get("tempo").value = audioRate
            source.parameters.get("rate").value = audioSpeed
            effect.parameters.get("pitch").value = pitchCorrect
            effect.parameters.get("tempo").value = audioRate
            effect.parameters.get("rate").value = audioSpeed
            await functions.timeout(300)
            source.loop = true
            effect.loop = true
            source.connect(lfoNode, 0, 0)
            effect.connect(lfoNode, 0, 1)
            source.start(0, offset)
            effect.start(0, offset)
            setSourceNode(source)
            setEffectNode(effect)
        } else {
            const source = createScheduledSoundTouchNode(audioContext, audioBuffer)
            source.parameters.get("pitch").value = functions.semitonesToScale(pitchShift) * pitchCorrect
            source.parameters.get("tempo").value = audioRate
            source.parameters.get("rate").value = audioSpeed
            await functions.timeout(300)
            source.loop = true
            source.connect(highpassFilterNode)
            source.start(0, offset)
            setSourceNode(source)
            setEffectNode(null)
        }
        setStartTime(audioContext.currentTime)
        setElapsedTime(offset)
        audioContext.resume()
    }

    const stop = () => {
        sourceNode?.stop()
        sourceNode?.disconnect()
        effectNode?.stop()
        effectNode?.disconnect()
        audioContext.suspend()
        setStartTime(audioContext.currentTime)
        setElapsedTime(0)
        setProgress(0)
        setSecondsProgress(0)
        setSourceNode(null)
        setEffectNode(null)
    }

    const updateMute = () => {
        if (volume > 0) {
            setVolume(0)
        } else {
            const newVol = previousVolume ? previousVolume : 1
            setVolume(newVol)
        }
        setShowVolumeSlider((prev) => !prev)
    }

    const updateVolume = (value: number) => {
        if (value > 1) value = 1
        if (value < 0) value = 0
        if (Number.isNaN(value)) value = 0
        setVolume(value)
        setPreviousVolume(value)
    }

    const rewind = (value?: number) => {
        if (!value) value = Math.floor(duration / 10)
        const current = getCurrentTime()
        let seconds = current - value
        if (audioReverse) seconds = current + value
        if (seconds < 0) seconds = 0
        if (seconds > duration) seconds = duration
        setSeekTo(seconds)
    }

    const fastforward = (value?: number) => {
        if (!value) value = Math.floor(duration / 10)
        const current = getCurrentTime()
        let seconds = current + value
        if (audioReverse) seconds = current - value
        if (seconds < 0) seconds = 0
        if (seconds > duration) seconds = duration
        setSeekTo(seconds)
    }

    const seek = (position: number) => {
        let secondsProgress = audioReverse ? ((100 - position) / 100) * duration : (position / 100) * duration
        let progress = audioReverse ? 100 - position : position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !audioReverse 
        let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        setAudioReverse(val)
        setSeekTo(secondsProgress)
    }

    const updateSpeed = (speed: number) => {
        setAudioSpeed(speed)
        let secondsProgress = audioReverse ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        setDuration(originalDuration / speed / audioRate)
        //setSeekTo(secondsProgress / speed)
    }

    const changePreservesPitch = (value?: boolean) => {
        const val = value !== undefined ? value : !preservesPitch
        setPreservesPitch(val)
    }

    const getAudioPlayIcon = () => {
        if (paused) return audioPlayIcon
        return audioPauseIcon
    }

    const getAudioVolumeIcon = () => {
        if (volume > 0.5) {
            return audioVolumeIcon
        } else if (volume > 0) {
            return audioVolumeLowIcon
        } else {
            return audioVolumeMuteIcon
        }
    }

    const audioReset = () => {
        changeReverse(false)
        changePreservesPitch(false)
        setAudioSpeed(1)
        setPaused(false)
        setShowSpeedDropdown(false)
        updatePlay(true)
        setSeekTo(0)
    }

    const loadImage = async () => {
        if (!coverRef.current) return
        let src = coverImg ? coverImg : audioPlaceholder
        const img = document.createElement("img")
        img.src = src 
        img.onload = () => {
            if (!coverRef.current) return
            const refCtx = coverRef.current.getContext("2d")
            coverRef.current.width = img.width
            coverRef.current.height = img.height
            refCtx?.drawImage(img, 0, 0, img.width, img.height)
        }
    }

    useEffect(() => {
        loadImage()
    }, [coverImg])

    const getLFORate = () => {
        if (lfoRate === 5) return "1/1"
        if (lfoRate === 4) return "1/2"
        if (lfoRate === 3) return "1/4"
        if (lfoRate === 2) return "1/8"
        if (lfoRate === 1) return "1/16"
        if (lfoRate === 0) return "1/32"
        return "1/16"
    }

    const updateLFOMode = () => {
        setLFOMode((prev) => !prev)
        setUpdateEffect(true)
    }

    return (
        <div className="bitcrush-image-component">
            <div className="bitcrush-upload-container">
                <div className="bitcrush-row">
                    <span className="bitcrush-text">Audio:</span>
                </div>
                <div className="bitcrush-row">
                    <label htmlFor="img" className="bitcrush-button" style={{width: "92px"}}>
                        <span className="button-hover">
                            <span className="button-text">Upload</span>
                            <img className="button-image" src={uploadIcon}/>
                        </span>
                    </label>
                    <input id="img" type="file" onChange={(event) => loadAudio(event)}/>
                    {audio ? 
                        <div className="button-image-name-container">
                            <img className="button-image-icon" src={xIcon} onClick={removeAudio}/>
                            <span className="button-image-name">{audioName}</span>
                        </div>
                    : null}
                </div>
            </div>
            <div className="relative-ref">
                <canvas className="bitcrush-cover" ref={coverRef}></canvas>
                <div className="audio-controls" ref={audioControls} onMouseUp={() => setDragging(false)}>
                    <div className="audio-control-row" style={{filter: getFilter2()}}>
                        <p className="audio-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                        <Slider ref={audioSliderRef} className="audio-slider" trackClassName="audio-slider-track" thumbClassName="audio-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                        <p className="audio-control-text">{functions.formatSeconds(duration)}</p>
                    </div>
                    <div className="audio-control-row">
                        <div className="audio-control-row-container">
                            <img className="audio-control-img" onClick={() => changeReverse()} src={audioReverseIcon} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" ref={audioSpeedRef} src={audioSpeedIcon} onMouseEnter={() => setShowSpeedSlider(true)} onMouseLeave={() => setShowSpeedSlider(false)} onClick={() => setShowSpeedSlider((prev: boolean) => !prev)} style={{filter: getFilter2()}}/>
                        </div>
                        <div className="audio-ontrol-row-container">
                            <img className="audio-control-img" src={audioRewindIcon} onClick={() => rewind()} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" onClick={() => updatePlay()} src={getAudioPlayIcon()} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" src={audioFastforwardIcon} onClick={() => fastforward()} style={{filter: getFilter2()}}/>
                        </div>    
                        <div className="audio-control-row-container">
                            <img className="audio-control-img" onClick={() => changePreservesPitch()} src={getPreservePitchIcon()} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" src={audioClearIcon} onClick={audioReset} style={{filter: getFilter2()}}/>
                        </div>
                        <div className="audio-control-row-container" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                            <img className="audio-control-img" ref={audioVolumeRef} src={getAudioVolumeIcon()} onClick={updateMute} style={{filter: getFilter2()}}/>
                        </div>
                    </div>
                    <div className={`audio-speed-dropdown ${showSpeedSlider ? "" : "hide-speed-dropdown"}`} style={{marginRight: getAudioSpeedMarginRight(), marginTop: "-95px"}}
                    onMouseEnter={() => {setShowSpeedSlider(true)}} onMouseLeave={() => {setShowSpeedSlider(false)}}>
                        <Slider ref={audioSpeedSliderRef} invert orientation="vertical" className="audio-speed-slider" trackClassName="audio-speed-slider-track" thumbClassName="audio-speed-slider-thumb"
                        value={audioSpeed} min={0.5} max={2} step={0.1} onChange={(value) => updateSpeed(value)}/>
                    </div>
                    <div className={`audio-volume-dropdown ${showVolumeSlider ? "" : "hide-volume-dropdown"}`} style={{marginRight: getAudioVolumeMarginRight(), marginTop: "-110px"}}
                    onMouseEnter={() => {setShowVolumeSlider(true)}} onMouseLeave={() => {setShowVolumeSlider(false)}}>
                        <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="audio-volume-slider" trackClassName="audio-volume-slider-track" thumbClassName="audio-volume-slider-thumb"
                        value={volume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
                    </div>
                </div>
            </div>
            <div className="bitcrush-options-container">
                <div className="bitcrush-row">
                    <span className="bitcrush-text-mini" style={{width: "auto", fontSize: "17px"}}>LFO?</span>
                    <img className="bitcrush-checkbox" src={lfoMode ? checkboxChecked : checkbox} onClick={() => updateLFOMode()} style={{marginLeft: "5px"}}/>
                    <span className="bitcrush-text-mini" style={{width: "92px", fontSize: "17px", marginLeft: "20px"}}>LFO Shape:</span>
                    <DropdownButton title={functions.toProperCase(lfoShape)} drop="down">
                        <Dropdown.Item active={lfoShape === "square"} onClick={() => setLFOShape("square")}>Square</Dropdown.Item>
                        <Dropdown.Item active={lfoShape === "sine"} onClick={() => setLFOShape("sine")}>Sine</Dropdown.Item>
                        <Dropdown.Item active={lfoShape === "triangle"} onClick={() => setLFOShape("triangle")}>Triangle</Dropdown.Item>
                        <Dropdown.Item active={lfoShape === "sawtooth"} onClick={() => setLFOShape("sawtooth")}>Sawtooth</Dropdown.Item>
                    </DropdownButton>
                </div>
                <div className="bitcrush-row">
                    <span className="bitcrush-text">LFO Rate: </span>
                    <Slider className="bitcrush-slider" trackClassName="bitcrush-slider-track" thumbClassName="bitcrush-slider-thumb" onChange={(value) => setLFORate(value)} min={0} max={5} step={1} value={lfoRate}/>
                    <span className="bitcrush-text-mini">{getLFORate()}</span>
                </div>
                <div className="bitcrush-row">
                    <span className="bitcrush-text">Pitch Shift: </span>
                    <Slider className="bitcrush-slider" trackClassName="bitcrush-slider-track" thumbClassName="bitcrush-slider-thumb" onChange={(value) => setPitchShift(value)} min={-12} max={12} step={0.25} value={pitchShift}/>
                    <span className="bitcrush-text-mini">{pitchShift}</span>
                </div>
                <div className="bitcrush-row">
                    <span className="bitcrush-text">Audio Rate: </span>
                    <Slider className="bitcrush-slider" trackClassName="bitcrush-slider-track" thumbClassName="bitcrush-slider-thumb" onChange={(value) => setAudioRate(value)} min={0.5} max={2} step={0.05} value={audioRate}/>
                    <span className="bitcrush-text-mini">{audioRate}</span>
                </div>
                <div className="bitcrush-row">
                    <span className="bitcrush-text">High Pass: </span>
                    <Slider className="bitcrush-slider" trackClassName="bitcrush-slider-track" thumbClassName="bitcrush-slider-thumb" onChange={(value) => setHighpassCutoff(value)} min={0} max={5000} step={1} value={highpassCutoff}/>
                    <span className="bitcrush-text-mini">{highpassCutoff}</span>
                </div>
            </div>
            {audio ?
            <div className="bitcrush-image-container">
                <div className="bitcrush-image-buttons-container">
                    <button className="bitcrush-image-button" onClick={mp3}>MP3</button>
                    <button className="bitcrush-image-button" onClick={wav}>WAV</button>
                    <button className="bitcrush-image-button" onClick={ogg}>OGG</button>
                    <button className="bitcrush-image-button" onClick={flac}>FLAC</button>
                </div>
            </div> : null}
            <div className="bitcrush-options-container">
                <div className="bitcrush-row">
                    <button className="bitcrush-button" onClick={reset} style={{padding: "0px 5px", marginTop: "7px"}}>
                        <span className="button-hover">
                            <span className="button-text">Reset</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PitchShift