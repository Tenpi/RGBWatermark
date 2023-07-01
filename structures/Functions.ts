import {app, ipcRenderer, session} from "electron"
import fs from "fs"
import path from "path"
import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import fileType from "magic-bytes.js"
import gifFrames from "gif-frames"
import crypto from "crypto"
import axios from "axios"
import {createFFmpeg, fetchFile} from "@ffmpeg/ffmpeg"
import {hexToRgb, Color, Solver} from "./Color"
import gdirecturl from "gddirecturl"
import * as mm from "music-metadata-browser"
import {ID3Writer} from "browser-id3-writer"
import lamejs from "lamejs"
import * as oggEncoder from "vorbis-encoder-js"
import * as Flac from "libflacjs/dist/libflac.js"
import {FlacEncoder} from "./FlacEncoder"
import {guess} from "web-audio-beat-detector"

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"]
const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]

const ffmpeg = createFFmpeg()

export default class Functions {
    public static arrayIncludes = (str: string, arr: string[]) => {
        for (let i = 0; i < arr.length; i++) {
            if (str.includes(arr[i])) return true
        }
        return false
    }

    public static isGIF = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".gif"
        }
        return path.extname(file) === ".gif"
    }

    public static isWebP = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webp"
        }
        return path.extname(file) === ".webp"
    }

    public static isGLTF = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".glb" || ext === ".gltf"
        }
        return path.extname(file) === ".glb" || path.extname(file) === ".gltf"
    }

    public static isOBJ = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".obj"
        }
        return path.extname(file) === ".obj"
    }

    public static isFBX = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".fbx"
        }
        return path.extname(file) === ".fbx"
    }

    public static isSTL = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".stl"
        }
        return path.extname(file) === ".stl"
    }

    public static isDAE = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".dae"
        }
        return path.extname(file) === ".dae"
    }

    public static isMTL = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mtl"
        }
        return path.extname(file) === ".mtl"
    }

    public static isMMD = (file?: string) => {
        if (!file) return false
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mmd"
        }
        return path.extname(file) === ".mmd"
    }

    public static isAnimatedWebp = async (buffer: ArrayBuffer) => {
        let str: any
        if (typeof window === "undefined") {
            str = buffer
        } else {
            str = await new Blob([buffer]).text()
        }
        if (str.indexOf("ANMF") != -1) {
            return true
        } else {
            return false
        }
    }

    public static cleanTitle = (str: string) => {
        const ext = path.extname(str)
        const split = str.match(/.{1,30}/g)?.join(" ").replace(ext, "")!
        return `${split.slice(0, 70)}${ext}`
    }

    public static arrayRemove = <T>(arr: T[], val: T) => {
        return arr.filter((item) => item !== val)
    }

    public static timeout = async (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    public static removeDirectory = (dir: string) => {
        if (dir === "/" || dir === "./") return
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(function(entry) {
                const entryPath = path.join(dir, entry)
                if (fs.lstatSync(entryPath).isDirectory()) {
                    Functions.removeDirectory(entryPath)
                } else {
                    fs.unlinkSync(entryPath)
                }
            })
            try {
                fs.rmdirSync(dir)
            } catch (e) {
                console.log(e)
            }
        }
    }

    public static logoDrag = (enable?: boolean) => {
        if (enable) {
            // @ts-expect-error
            document.querySelector(".logo-bar-drag")?.style["-webkit-app-region"] = "drag"
        } else {
            // @ts-expect-error
            document.querySelector(".logo-bar-drag")?.style["-webkit-app-region"] = "no-drag"
        }
    }

    public static newDest = (dest: string, active: any[]) => {
        let duplicate = active.find((a) => a.dest === dest)
        let i = 1
        let newDest = dest
        while (fs.existsSync(newDest) || duplicate) {
            newDest = `${path.dirname(dest)}\\${path.basename(dest, path.extname(dest))}_${i}${path.extname(dest)}`
            duplicate = active.find((a) => a.dest === newDest)
            i++
        }
        return newDest
    }

    public static countDecimals = (value: number, max?: number) => {
        const count = value % 1 ? value.toString().split(".")[1].length : 0
        if (max && count > max) return max
        return count
    }

    public static download = (filename: string, url: string) => {
        const a = document.createElement("a")
        a.setAttribute("href", url)
        a.setAttribute("download", decodeURIComponent(filename))
        a.style.display = "none"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    public static calculateFilter = (hexColor: string) => {
        const rgb = hexToRgb(hexColor) as any
        if (!rgb) return ""
        const color = new Color(rgb[0], rgb[1], rgb[2])
        const solver = new Solver(color)
        const result = solver.solve()
        return result.filter
    }

    public static hexToRgb = (hexColor: string) => {
        const rgb = hexToRgb(hexColor) as any
        if (!rgb) return {r: 0, g: 0, b: 0}
        return {r: rgb[0], g: rgb[1], b: rgb[2]}
    }

    private static parseTransparentColor = (color: string) => {
        return Number(`0x${color.replace(/^#/, "")}`)
    }

    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks)))
        })
        return buffer
    }

    public static encodeGIF = async (frames: Buffer[], delays: number[], width: number, height: number, options?: {transparentColor?: string}) => {
        if (!options) options = {} as {transparentColor?: string}
        const gif = new GifEncoder(width, height, {highWaterMark: 5 * 1024 * 1024})
        gif.setQuality(10)
        gif.setRepeat(0)
        gif.writeHeader()
        //if (options?.transparentColor) gif.setTransparent(Functions.parseTransparentColor(options.transparentColor))
        let counter = 0

        const addToGif = async (frames: Buffer[]) => {
            if (!frames[counter]) {
                gif.finish()
            } else {
                const {data} = await pixels(frames[counter], {width, height})
                gif.setDelay(delays[counter])
                gif.addFrame(data)
                counter++
                addToGif(frames)
            }
        }
        await addToGif(frames)
        return Functions.streamToBuffer(gif as NodeJS.ReadableStream)
    }

    public static msToFps = (ms: number) => {
        return Math.floor(1 / ((ms / 2) / 100))
    }
    
    public static encodeVideo = async (frames: string[], framerate?: number, audio?: string) => {
        if (!ffmpeg.isLoaded()) await ffmpeg.load()
        console.log(frames)
        for (let i = 0; i < frames.length; i++) {
            const num = `00${i}`.slice(-3)
            ffmpeg.FS("writeFile", `${num}.png`, await fetchFile(frames[i]))
        }
        if (!framerate) framerate = 30
        if (audio) {
            ffmpeg.FS("writeFile", "audio.wav", await fetchFile(audio))
            await ffmpeg.run("-framerate", String(framerate), "-pattern_type", "glob", "-i", "*.png", "-i", "audio.wav", "-c:a", "aac", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "video.mp4")
        } else {
            await ffmpeg.run("-framerate", String(framerate), "-pattern_type", "glob", "-i", "*.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "video.mp4")
        }
        const binary = ffmpeg.FS("readFile", "video.mp4")
        let url = ""
        if (binary) {
            const blob = new Blob([new DataView(binary.buffer)], {type: "video/mp4"})
            url = URL.createObjectURL(blob)
        }
        try {
            for (let i = 0; i < frames.length; i++) {
                const num = `00${i}`.slice(-3)
                ffmpeg.FS("unlink", `${num}.png`)
            }
            ffmpeg.FS("unlink", "video.mp4")
            if (audio) ffmpeg.FS("unlink", "audio.wav")
        } catch {
            // ignore
        }
        return url
    }

    public static toProperCase = (str: string) => {
        if (!str) return ""
        return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            }
        )
    }

    public static formatSeconds = (duration: number) => {
        let seconds = Math.floor(duration % 60) as any
        let minutes = Math.floor((duration / 60) % 60) as any
        let hours = Math.floor((duration / (60 * 60)) % 24) as any
        if (Number.isNaN(seconds) || seconds < 0) seconds = 0
        if (Number.isNaN(minutes) || minutes < 0) minutes = 0
        if (Number.isNaN(hours) || hours < 0) hours = 0

        hours = (hours === 0) ? "" : ((hours < 10) ? "0" + hours + ":" : hours + ":")
        minutes = hours && (minutes < 10) ? "0" + minutes : minutes
        seconds = (seconds < 10) ? "0" + seconds : seconds
        return `${hours}${minutes}:${seconds}`
    }

    public static extractGIFFrames = async (gif: string) => {
        const data = await fetch(gif).then((r) => r.arrayBuffer())
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/gif", preferAnimation: true})

        let result = [] as any

        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas") as any
                canvas.width = decoded.codedWidth 
                canvas.height = decoded.codedHeight
                const canvasContext = canvas.getContext("2d")
                canvasContext.drawImage(decoded.image, 0, 0)
                result.push({frame: await createImageBitmap(decoded.image), delay: decoded.image.duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static extractAnimatedWebpFrames = async (webp: string) => {
        const data = await fetch(webp).then((r) => r.arrayBuffer())
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/webp", preferAnimation: true})

        let result = [] as any

        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas") as any
                const canvasContext = canvas.getContext("2d")
                canvasContext.drawImage(decoded.image, 0, 0)
                result.push({frame: await createImageBitmap(decoded.image), delay: decoded.image.duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static random = (seed: number) => {
        var t = seed += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }

    public static isVideo = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, videoExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), videoExtensions)
    }

    public static readableFileSize = (bytes: number) => {
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Number((bytes / Math.pow(1024, i)).toFixed(2))} ${["B", "KB", "MB", "GB", "TB"][i]}`
    }

    public static imageDimensions = async (image: string) => {
        return new Promise<any>((resolve) => {
            if (Functions.isVideo(image)) {
                const video = document.createElement("video")
                video.addEventListener("loadedmetadata", async () => {
                    let width = video.videoWidth 
                    let height = video.videoHeight
                    try {
                        const r = await fetch(image)
                        const size = Number(r.headers.get("Content-Length"))
                        resolve({width, height, size})
                    } catch {
                        resolve({width, height, size: 0})
                    }
                })
                video.src = image
            } else {
                const img = document.createElement("img")
                img.addEventListener("load", async () => {
                    let width = img.width
                    let height = img.height
                    try {
                        const r = await fetch(image)
                        const size = Number(r.headers.get("Content-Length"))
                        resolve({width, height, size})
                    } catch {
                        resolve({width, height, size: 0})
                    }
                })
                img.src = image
            }
        })
    }

    public static escapeQuotes = (str: string) => {
        return `${str.replace(/"/g, `"\\""`)}`
    }

    public static truncateColor = (value: number) => {
        if (value < 0) {
          value = 0
        } else if (value > 255) {
          value = 255
        }
        return value
    }

    public static radians (angle: number) {
        return angle * (Math.PI / 180)
    }

    public static randomRange(min: number, max: number, seed: number = 1) {
        return Math.floor(Functions.random(seed) * (max - min + 1)) + min
    }

    public static concatTypedArrays = (a: any, b: any) => {
        var c = new (a.constructor)(a.length + b.length)
        c.set(a, 0)
        c.set(b, a.length)
        return c
    }

    public static padString = (str: string, length: number) => {
        while (str.length <= length) {
            str += " "
        }
        return str.slice(0, length)
    }

    public static encrypt = (data: string, encryptionKey: string) => {
        const iv = Buffer.from(crypto.randomBytes(16))
        const key = crypto.createHash("sha256").update(encryptionKey).digest("base64").slice(0, 16)
        const cipher = crypto.createCipheriv("aes-128-gcm", key, iv)
        const result = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()])
        const authTag = cipher.getAuthTag()
        return Buffer.concat([iv, authTag, result]).toString("hex")
    }

    public static decrypt = (data: string, encryptionKey: string) => {
        let encrypted = Buffer.from(data)
        const iv = encrypted.slice(0, 16)
        encrypted = encrypted.slice(16)
        const authTag = encrypted.slice(0, 16)
        encrypted = encrypted.slice(16)
        const key = crypto.createHash("sha256").update(encryptionKey).digest("base64").slice(0, 16)
        const decipher = crypto.createDecipheriv("aes-128-gcm", key, iv)
        decipher.setAuthTag(authTag)
        let buffer = Buffer.concat([decipher.update(encrypted), decipher.final()])
        return buffer.toString("hex")
     }

     public static base64ToBuffer = (base64: string) => {
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)!
        return Buffer.from(matches[2], "base64")
    }

    public static downloadGoogleDriveFile = async (id: string) => {
        const link = await gdirecturl.getMediaLink(id)
        const headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 OPR/99.0.0.0"}
        const data = await axios.get(link.src, {responseType: "arraybuffer", headers}).then((r) => r.data)
        return data
    }

    public static logSlider = (position: number) => {
        const minPos = 0
        const maxPos = 1
        const minValue = Math.log(0.01)
        const maxValue = Math.log(1)
        const scale = (maxValue - minValue) / (maxPos - minPos)
        const value = Math.exp(minValue + scale * (position - minPos))
        return value
    }

    public static noteFactor = (scaleFactor: number) => {
        if (scaleFactor === 1) return 0
        if (scaleFactor < 1) {
            return (-1 * ((1 / scaleFactor) * 6)).toFixed(2)
        } else {
            return (scaleFactor * 6).toFixed(2)
        }
    }

    public static semitonesToScale = (semitones: number) => {
        var scaleFactor = Math.pow(2, semitones / 12)
        scaleFactor = Math.max(0.5, scaleFactor)
        scaleFactor = Math.min(2, scaleFactor)
        return scaleFactor
    }

    public static convertToWAV = async (audio: string) => {
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        const audioContext = new AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        return Functions.encodeWAV(audioBuffer)
    }

    public static convertToMP3 = async (audio: string, bitrate: number = 320) => {
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        const audioContext = new window.AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        return Functions.encodeMP3(audioBuffer, bitrate)
    }

    public static getOggTags = async (image?: string, metaAudio?: string) => {
        let tags = {} as any
        if (image) tags["COVERART"] = image
        if (metaAudio) {
            const metaBuffer = await fetch(metaAudio).then((r) => r.arrayBuffer())
            const tagInfo = await mm.parseBuffer(new Uint8Array(metaBuffer))
            if (tagInfo.common.title) tags["TITLE"] = tagInfo.common.title
            if (tagInfo.common.artist) tags["ARTIST"] = tagInfo.common.artist
            if (tagInfo.common.album) tags["ALBUM"] = tagInfo.common.album
            if (tagInfo.common.genre) tags["GENRE"] = tagInfo.common.genre?.join(" ")
            if (tagInfo.common.date) tags["DATE"] = tagInfo.common.date
            let comment = tagInfo.common.comment?.join(" ")
            if (!comment) {
                const key = Object.keys(tagInfo.native)[0]
                const comm = tagInfo.native[key].find((t) => t.id === "COMM:Description")
                if (comm) comment = comm.value.text
            }
            if (comment) tags["COMMENT"] = comment
        }
        return tags
    }

    public static interleave = (audioBuffer: AudioBuffer) => {
        const numChannels = audioBuffer.numberOfChannels
        const bufferLength = audioBuffer.length
        const interleavedBufferLength = numChannels * bufferLength
        const interleavedBuffer = new Int32Array(interleavedBufferLength)

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel)
            for (let i = 0; i < bufferLength; i++) {
                const interleavedIndex = i * numChannels + channel
                interleavedBuffer[interleavedIndex] = Math.round(channelData[i] * (2 ** 31 - 1))
            }
        }
        return interleavedBuffer
    }

    public static getWavInfo = (header: Uint8Array) => {
        function int32ToDec(bin: string) {
            const binArr = bin.split("-")
            let binDigits = ""
            for (let i = 0; i < binArr.length; i++) {
                binDigits += ("00000000"+Number(binArr[i]).toString(2)).slice(-8)
            }
            const num = parseInt(binDigits, 2)
            return num
        }
        let littleEndian = false
        let bitDepth = 0
        let sampleRate = 0
        let channels = 0
        let topCode = ""
        for (let i = 0; i < 4; i++) {
            topCode += String.fromCharCode(header[i])
        }
        if (topCode === "RIFF") {
            littleEndian = true
        }
        if (littleEndian) {
            bitDepth = Number(`${header[35]}${header[34]}`)
            sampleRate = Number(int32ToDec(`${(header[27])}-${(header[26])}-${(header[25])}-${(header[24])}`))
            channels = Number(`${header[23]}${header[22]}`)
        } else {
            bitDepth = Number(`${header[34]}${header[35]}`)
            sampleRate = Number(int32ToDec(`${header[24]}-${(header[25])}-${(header[26])}-${(header[27])}`))
            channels = Number(`${header[22]}${header[23]}`)
        }
        const byteDepth = (bitDepth) / 8
        return {byteDepth, bitDepth, sampleRate, channels}
    }

    public static songCover = async (audio: string) => {
        const buffer = await fetch(audio).then((r) => r.arrayBuffer())
        const tagInfo = await mm.parseBuffer(new Uint8Array(buffer))
        const picture = tagInfo.common.picture
        if (picture) {
            let buffer = new Uint8Array() as Buffer
            for (let i = 0; i < picture.length; i++) {
                buffer = Buffer.concat([buffer, picture[i].data])
            }
            return `data:${picture[0].format};base64,${buffer.toString("base64")}`
        } else {
            return ""
        }
    }

    public static writeSongCover = async (audio: string, image: string, metaAudio?: string) => {
        const audioBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        const imageBuffer = await fetch(image).then((r) => r.arrayBuffer())
        const writer = new ID3Writer(audioBuffer)
        writer.setFrame("APIC", {
            type: 3,
            data: imageBuffer,
            description: "Cover"
        })
        if (metaAudio) {
            const metaBuffer = await fetch(metaAudio).then((r) => r.arrayBuffer())
            const tagInfo = await mm.parseBuffer(new Uint8Array(metaBuffer))
            if (tagInfo.common.title) writer.setFrame("TIT2", tagInfo.common.title)
            if (tagInfo.common.artist) writer.setFrame("TPE1", [tagInfo.common.artist])
            if (tagInfo.format.duration) writer.setFrame("TLEN", String(tagInfo.format.duration))
            if (tagInfo.common.year) writer.setFrame("TYER", String(tagInfo.common.year))
            if (tagInfo.common.bpm) writer.setFrame("TBPM", String(tagInfo.common.bpm))
            if (tagInfo.common.key) writer.setFrame("TKEY", tagInfo.common.key)
            if (tagInfo.common.genre) writer.setFrame("TCON", tagInfo.common.genre)
            if (tagInfo.common.album) writer.setFrame("TALB", tagInfo.common.album)
            if (tagInfo.common.albumartist) writer.setFrame("TPE2", tagInfo.common.albumartist)
            if (tagInfo.common.track.no) writer.setFrame("TRCK", String(tagInfo.common.track.no))
            let comment = tagInfo.common.comment?.join(" ")
            if (!comment) {
                const key = Object.keys(tagInfo.native)[0]
                const comm = tagInfo.native[key].find((t) => t.id === "COMM:Description")
                if (comm) comment = comm.value.text
            }
            if (comment) writer.setFrame("COMM", {
                description: "Description",
                text: comment ?? "",
                language: "eng"
            })
        }
        writer.addTag()
        return writer.getURL()
    }

    public static reverseAudioBuffer = (audioBuffer: AudioBuffer) => {
        const channels = audioBuffer.numberOfChannels
      
        const reversedBuffer = new AudioBuffer({
          numberOfChannels: channels,
          length: audioBuffer.length,
          sampleRate: audioBuffer.sampleRate
        })
      
        for (let channel = 0; channel < channels; channel++) {
          const samples = audioBuffer.getChannelData(channel)
          const newSamples = reversedBuffer.getChannelData(channel)
          for (let i = 0; i < audioBuffer.length; i++) {
            newSamples[i] = samples[audioBuffer.length - 1 - i]
          }
        }
        return reversedBuffer
    }

    public static upsampleAudioBuffer = (audioBuffer: AudioBuffer, sampleRate: number) => {
        let originalSampleRate = audioBuffer.sampleRate
        let ratio = sampleRate / originalSampleRate
        let length = audioBuffer.length
        let upsampledLength = Math.floor(length * ratio)
        let result = new Float32Array(upsampledLength)
      
        for (let i = 0; i < upsampledLength; i++) {
          let originalIndex = Math.floor(i / ratio)
          result[i] = audioBuffer.getChannelData(0)[originalIndex]
        }
      
        let audioContext = new AudioContext()
        let newBuffer = audioContext.createBuffer(1, upsampledLength, sampleRate)
        newBuffer.getChannelData(0).set(result)
        return newBuffer
    }

    public static encodeWAV = (audioBuffer: AudioBuffer) => {
        let HEADER_LENGTH = 44
        let MAX_AMPLITUDE = 0x7FFF
        let nChannels = audioBuffer.numberOfChannels
        let bufferLength = audioBuffer.length
        let arrayBuffer = new ArrayBuffer(HEADER_LENGTH + 2 * bufferLength * nChannels)
        let int16 = new Int16Array(arrayBuffer)
        let uint8 = new Uint8Array(arrayBuffer)
        let sr = audioBuffer.sampleRate;
        let l2 = bufferLength * nChannels * 2
        let l1 = l2 + 36
        let br = sr * nChannels * 2
        uint8.set([
            0x52, 0x49, 0x46, 0x46, // R I F F
            l1 & 255, (l1 >> 8) & 255, (l1 >> 16) & 255, (l1 >> 24) & 255, // chunk size
            0x57, 0x41, 0x56, 0x45, // W A V E
            0x66, 0x6D, 0x74, 0x20, // F T M █
            0x10, 0x00, 0x00, 0x00, // sub chunk size = 16
            0x01, 0x00, // audio format = 1 (PCM, linear quantization)
            nChannels, 0x00, // number of channels
            sr & 255, (sr >> 8) & 255, (sr >> 16) & 255, (sr >> 24) & 255, // sample rate
            br & 255, (br >> 8) & 255, (br >> 16) & 255, (br >> 24) & 255, // byte rate
            0x04, 0x00, // block align = 4
            0x10, 0x00, // bit per sample = 16
            0x64, 0x61, 0x74, 0x61, // d a t a
            l2 & 255, (l2 >> 8) & 255, (l2 >> 16) & 255, (l2 >> 24) & 255 // sub chunk 2 size
        ])
        let buffers = [] as any
        for (let channel = 0; channel < nChannels; channel++) {
            buffers.push(audioBuffer.getChannelData(channel))
        }
        for (let i = 0, index = HEADER_LENGTH / 2; i < bufferLength; i++) {
            for (let channel = 0; channel < nChannels; channel++) {
                let sample = buffers[channel][i]
                sample = Math.min(1, Math.max(-1, sample))
                sample = Math.round(sample * MAX_AMPLITUDE)
                int16[index++] = sample
            }
        }
        let blob = new Blob([uint8], {type: "audio/x-wav"})
        return URL.createObjectURL(blob)
    }

    public static encodeMP3 = async (audioBuffer: AudioBuffer, bitrate: number = 128) => {
        let MAX_AMPLITUDE = 0x7FFF
        let nChannels = audioBuffer.numberOfChannels
        if (bitrate < 96) {
            nChannels = 1
        }
        let bufferLength = audioBuffer.length
        let buffers = [] as any

        for (let channel = 0; channel < nChannels; channel++) {
            let buffer = audioBuffer.getChannelData(channel)
            let samples = new Int16Array(bufferLength)

            for (let i = 0; i < bufferLength; ++i) {
                let sample = buffer[i]
                sample = Math.min(1, Math.max(-1, sample))
                sample = Math.round(sample * MAX_AMPLITUDE)
                samples[i] = sample
            }
            buffers.push(samples)
        }
        let BLOCK_SIZE = 1152
        let mp3encoder = new lamejs.Mp3Encoder(nChannels, 44100, bitrate);
        let mp3Data = [] as any

        let blockIndex = 0
        const encodeChunk = () => {
            let mp3buf = []
            if (nChannels === 1) {
                let chunk = buffers[0].subarray(blockIndex, blockIndex + BLOCK_SIZE)
                mp3buf = mp3encoder.encodeBuffer(chunk)
            } else {
                let chunkL = buffers[0].subarray(blockIndex, blockIndex + BLOCK_SIZE)
                let chunkR = buffers[1].subarray(blockIndex, blockIndex + BLOCK_SIZE)
                mp3buf = mp3encoder.encodeBuffer(chunkL, chunkR)
            }
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf)
            }
            blockIndex += BLOCK_SIZE
        }

        return new Promise<string>((resolve) => {
            const update = () => {
                if (blockIndex >= bufferLength) {
                    let mp3buf = mp3encoder.flush()
                    if (mp3buf.length > 0) {
                        mp3Data.push(mp3buf)
                    }
                    const blob = new Blob(mp3Data, { type: "audio/mp3"})
                    const url = URL.createObjectURL(blob)
                    resolve(url)
                }
                let start = performance.now()
                while (blockIndex < bufferLength && performance.now() - start < 15) {
                    encodeChunk()
                }
                setTimeout(update, 16.7)
            }
            update()
        })
    }

    public static encodeOGG = async (audioBuffer: AudioBuffer, coverImg?: string, metaAudio?: string) => {
        let sampleRate = audioBuffer.sampleRate
        let numberOfChannels = audioBuffer.numberOfChannels
        let quality = 0
        let tags = await Functions.getOggTags(coverImg, metaAudio)
        let encoder = new oggEncoder.encoder(sampleRate, numberOfChannels, quality, tags)
        encoder.encodeFrom(audioBuffer)
        let blob = encoder.finish()
        return URL.createObjectURL(blob)
    }

    public static encodeFLAC = async (audioBuffer: AudioBuffer) => {
        const wav = Functions.encodeWAV(audioBuffer)
        const arrayBuffer = await fetch(wav).then((r) => r.arrayBuffer())
        const encoder = new FlacEncoder(Flac, {
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            bitsPerSample: 16,
            compression: 5,
            verify: true,
            isOgg: false
        })
        let encData = []
	    let result = encoder.encodeFlac(arrayBuffer, encData, true, false)
	    let metadata = result.metaData
        const blob = encoder.exportFlacFile(encData, metadata, false)
        return URL.createObjectURL(blob)
    }

    /*
    public static audioBufferSamples = (audioBuffer: AudioBuffer) => {
        const channelCount = audioBuffer.numberOfChannels
        const frameCount = audioBuffer.length
        const float32Array = new Float32Array(channelCount * frameCount)

        for (let channel = 0; channel < channelCount; channel++) {
            const channelData = audioBuffer.getChannelData(channel)
            float32Array.set(channelData, channel * frameCount)
        }
        return float32Array
    }*/
    
    public static audioBufferSamples = (audioBuffer: AudioBuffer) => {
        const numberOfChannels = audioBuffer.numberOfChannels
        const length = audioBuffer.length
        const samples = new Uint8Array(length * numberOfChannels)
      
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel)
      
          for (let i = 0; i < length; i++) {
            const sample = Math.floor((channelData[i] + 1) * 0.5 * 255)
            samples[i * numberOfChannels + channel] = sample
          }
        }
        return samples
    }

    public static getBPM = async (audioBuffer: AudioBuffer) => {
        return guess(audioBuffer)
    }

    public static createWavHeader = (numSamples: number, sampleRate: number, numChannels: number, bitsPerSample: number) => {
        const dataSize = numSamples * numChannels * (bitsPerSample / 8)
        const buffer = new ArrayBuffer(44)
        const view = new DataView(buffer)
        function writeString(offset, string) {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        }
        writeString(0, 'R')
        writeString(1, 'I')
        writeString(2, 'F')
        writeString(3, 'F')
        view.setUint32(4, dataSize + 36, true)
        writeString(8, 'W')
        writeString(9, 'A')
        writeString(10, 'V')
        writeString(11, 'E')
        writeString(12, 'f')
        writeString(13, 'm')
        writeString(14, 't')
        writeString(15, ' ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, numChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true)
        view.setUint16(32, numChannels * (bitsPerSample / 8), true)
        view.setUint16(34, bitsPerSample, true)
        writeString(36, 'd')
        writeString(37, 'a')
        writeString(38, 't')
        writeString(39, 'a')
        view.setUint32(40, dataSize, true)
        return new Uint8Array(buffer)
    }

    public static createAudioBuffer = (left: Float32Array, right: Float32Array, sampleRate: number) => {
        const audioContext = new AudioContext()
        const audioBuffer = audioContext.createBuffer(2, left.length, sampleRate)
        const channelDataL = audioBuffer.getChannelData(0)
        const channelDataR = audioBuffer.getChannelData(1)
        for (let i = 0; i < left.length; i++) {
          channelDataL[i] = left[i]
          channelDataR[i] = right[i]
        }
        return audioBuffer
    }

    public static jsonToArray = (json: any) => {
        let str = JSON.stringify(json, null, 0)
        let ret = new Uint8Array(str.length)
        for (let i = 0; i < str.length; i++) {
            ret[i] = str.charCodeAt(i)
        }
        return ret
    }
}