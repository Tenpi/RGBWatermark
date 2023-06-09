import React, {useContext, useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {TypeContext, SpeedContext, AttackModeContext} from "../renderer"
import functions from "../structures/Functions"
import fileType from "magic-bytes.js"
import path from "path"
import "./styles/footer.less"

const Footer: React.FunctionComponent = (props) => {
    const {speed, setSpeed} = useContext(SpeedContext)
    const {type, setType} = useContext(TypeContext)
    const {attackMode, setAttackMode} = useContext(AttackModeContext)

    const recombineGIF = async (event: any) => {
        const files = event.target.files
        if (!files?.length) return
        const fileReader = new FileReader()
        let images = [] as any
        let name = ""
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            name = file.name
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: any) => {
                    let bytes = new Uint8Array(f.target.result)
                    const result = fileType(bytes)?.[0]
                    const jpg = result?.mime === "image/jpeg"
                    const png = result?.mime === "image/png"
                    const webp = result?.mime === "image/webp"
                    if (jpg || png || webp) {
                        const blob = new Blob([bytes])
                        const url = URL.createObjectURL(blob)
                        const link = `${url}#.${result?.typename}`
                        images.push(link)
                    }
                    resolve()
                }
                fileReader.readAsArrayBuffer(file)
            })
        }
        if (event.target) event.target.value = ""

        let frames = [] as any
        let delays = [] as any
        const arraybuffer = await fetch(images[0]).then((r) => r.arrayBuffer())
        const firstBlob = new Blob([new Uint8Array(arraybuffer)])
        const firstURL = URL.createObjectURL(firstBlob)
        const firstLink = `${firstURL}#.png`
        const dimensions = await functions.imageDimensions(firstLink)

        for (let i = 0; i < images.length; i++) {
            const canvas = document.createElement("canvas")
            canvas.width = dimensions.width 
            canvas.height  = dimensions.height
            const ctx = canvas.getContext("2d")!
            const img = document.createElement("img")
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.src = images[i]
            })
            ctx.drawImage(img, 0, 0)
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            frames.push(imgData.data.buffer)
            let delay = speed
            if (type === "image") delay *= 2
            if (type === "pattern") delay *= 5
            delays.push(delay)
        }

        const buffer = await functions.encodeGIF(frames, delays, dimensions.width, dimensions.height, {transparentColor: "#000000"})
        const blob = new Blob([buffer])
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(name, path.extname(name))}_rgbwatermark.gif`, url)
        window.URL.revokeObjectURL(url)
    }

    const recombineMP4 = async (event: any) => {
        const files = event.target.files
        if (!files?.length) return
        const fileReader = new FileReader()
        let images = [] as any
        let name = ""
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            name = file.name
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: any) => {
                    let bytes = new Uint8Array(f.target.result)
                    const result = fileType(bytes)?.[0]
                    const jpg = result?.mime === "image/jpeg"
                    const png = result?.mime === "image/png"
                    const webp = result?.mime === "image/webp"
                    if (jpg || png || webp) {
                        const blob = new Blob([bytes])
                        const url = URL.createObjectURL(blob)
                        const link = `${url}#.${result?.typename}`
                        images.push(link)
                    }
                    resolve()
                }
                fileReader.readAsArrayBuffer(file)
            })
        }
        if (event.target) event.target.value = ""

        let frames = [] as any
        let delays = [] as any
        const arraybuffer = await fetch(images[0]).then((r) => r.arrayBuffer())
        const firstBlob = new Blob([new Uint8Array(arraybuffer)])
        const firstURL = URL.createObjectURL(firstBlob)
        const firstLink = `${firstURL}#.png`
        const dimensions = await functions.imageDimensions(firstLink)

        for (let i = 0; i < images.length; i++) {
            const canvas = document.createElement("canvas")
            canvas.width = dimensions.width 
            canvas.height  = dimensions.height
            const ctx = canvas.getContext("2d")!
            const img = document.createElement("img")
            await new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.src = images[i]
            })
            ctx.drawImage(img, 0, 0)
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            frames.push(imgData.data.buffer)
            let delay = speed
            if (type === "image") delay *= 2
            if (type === "pattern") delay *= 5
            delays.push(delay)
        }

        const url = await functions.encodeVideo(frames, functions.msToFps(delays[0]))
        functions.download(`${path.basename(name, path.extname(name))}_rgbwatermark.mp4`, url)
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="footer">
            <div className="footer-container">
                {attackMode === "rainbow watermarks" ?
                <div className="footer-row">
                    <span className="footer-text-2">Rainbow watermarks will result in a lot of noise and grain in the outputs. It is recommended to use dotted fonts and particles to make them difficult to remove.</span>
                </div> : null}
                {attackMode === "pointifiction" ?
                <div className="footer-row">
                    <span className="footer-text-4">Pointifiction/Lineifiction/Trifiction/Rectifiction deletes pixels in the image to make the picture look like random noise to the AI. Make sure that you set the spacing high enough so that it can't be removed with gaussian blur. This will completely destroy the model and make it only generate noise.</span>
                </div> : null}
                {attackMode === "pixel shift" ?
                <div className="footer-row">
                    <span className="footer-text-5">Pixel shifting shifts the pixels in the image horizontally and vertically, breaking continuity. This significantly degrades quality and will make the output produce blocky images.</span>
                </div> : null}
                {attackMode === "high contrast" ?
                <div className="footer-row">
                    <span className="footer-text-2" style={{color: "#ffffff"}}>High contrast alternation is similar to pointification but will increase the contrast between points instead of deleting them. It will result in high contrast images and the pattern grid showing up in the output.</span>
                </div> : null}
                {attackMode === "pixelation" ?
                <div className="footer-row">
                    <span className="footer-text-2">Pixelation will downscale the image while preserving hard edges and is a method to deliberately lower the quality. It will lead to pixelated images in the output.</span>
                </div> : null}
                {attackMode === "noise" ?
                <div className="footer-row">
                    <span className="footer-text-4">Noise interpolation shifts the pixels closer to a grid of noise, which most notably impacts img2img and controlnet.</span>
                </div> : null}
                {attackMode === "edge blur" ?
                <div className="footer-row">
                    <span className="footer-text-5">Edge blur is a controlnet specific method that applies a blur onto the edges of the image. Make sure that you recover the eyes in a separate program.</span>
                </div> : null}
                {attackMode === "sprinkles" ?
                <div className="footer-row">
                    <span className="footer-text-5">Sprinkles is a controlnet specific method that applies multiple copies of pointifiction and scatters them. When used in conjuction with edge blur, it should break all controlnet models.</span>
                </div> : null}
                {attackMode === "conversion" ?
                <div className="footer-row">
                    <span className="footer-text-4">File conversion converts the file to a lesser used format, which should help avoid web crawlers.</span>
                </div> : null}
                {attackMode === "inflation" ?
                <div className="footer-row">
                    <span className="footer-text-5">File inflation appends random bytes to inflate the filesize, which should slow down web crawlers.</span>
                </div> : null}
                {attackMode === "ai watermark" ?
                <div className="footer-row">
                    <span className="footer-text-6">AI watermark adds a watermark to identify content as AI-generated. Any metadata from the original file is preserved.</span>
                </div> : null}
                {attackMode === "fence" ?
                <div className="footer-row">
                    <span className="footer-text-4">The fence adds a diamond fence that looks better than trifiction but is a bit weaker.</span>
                </div> : null}
                {attackMode === "adversarial noise" ?
                <div className="footer-row">
                    <span className="footer-text-5">Adversarial noise adds pre-computed adversarial noise, which should add grain and interfere with controlnet.</span>
                </div> : null}
                {attackMode === "crt" ?
                <div className="footer-row">
                    <span className="footer-text-5">CRT adds a texture similar to old CRT TV's that interferes with controlnet.</span>
                </div> : null}
                {attackMode === "rgb split" ?
                <div className="footer-row">
                    <span className="footer-text-2">RGB Split is a modified version of lineifiction only applied on certain color channels.</span>
                </div> : null}
                {attackMode === "steganography" ?
                <div className="footer-row">
                    <span className="footer-text-3">Steganography hides secret messages in PNG/JPG files. You could use this to track your image.</span>
                </div> : null}
                {attackMode === "invisible watermark" ?
                <div className="footer-row">
                    <span className="footer-text-5">Invisible watermark applies an invisible watermark that is more resilient to adjustments and compression.</span>
                </div> : null}
                {attackMode === "clip breaker" ?
                <div className="footer-row">
                    <span className="footer-text-4">CLIP Breaker computes adversarial noise in order to break the interrogator. You can combine the noise from multiple models and check the predictions.</span>
                </div> : null}
                {attackMode === "glyph swap" ?
                <div className="footer-row">
                    <span className="footer-text-5">Glyph swapping swaps the glyphs of a font file, allowing you to post encrypted text online and display it normally.</span>
                </div> : null}
                {attackMode === "text spoof" ?
                <div className="footer-row">
                    <span className="footer-text-3">Text spoofing replaces the text characters with unicode look-alikes. It works on sites that you don't control, but it is easy to bypass. Text is automatically copied.</span>
                </div> : null}
                {attackMode === "bitcrush" ?
                <div className="footer-row">
                    <span className="footer-text">Bitcrush reduces the sample rate and/or bitdepth of the audio, which reduces the quality and makes it sound crushy.</span>
                </div> : null}
                {attackMode === "pitch shift" ?
                <div className="footer-row">
                    <span className="footer-text-5">Pitch shifting changes the pitch and/or speed of the audio. You can also apply this effect with a square LFO.</span>
                </div> : null}
                {attackMode === "block reverse" ?
                <div className="footer-row">
                    <span className="footer-text-2">Block reverse reverses the audio file, divides it into blocks, and plays the blocks in the forward direction.</span>
                </div> : null}
                {attackMode === "pink noise" ?
                <div className="footer-row">
                    <span className="footer-text-5">Pink noise adds pink noise to the audio file at regular intervals.</span>
                </div> : null}
                {attackMode === "decimation" ?
                <div className="footer-row">
                    <span className="footer-text-2">Decimation reduces the amount of polygons and texture resolution while retaining the overall shape.</span>
                </div> : null}
                {attackMode === "subdivision" ?
                <div className="footer-row">
                    <span className="footer-text">Subdivision drastically increases the amount of vertices by subdividing the polygons.</span>
                </div> : null}
                {attackMode === "apng" ?
                <div className="footer-row">
                    <span className="footer-text-5">APNG is a lesser known extension to png that supports animations. We will create an animation with your art as the last frame.</span>
                </div> : null}
                {attackMode === "dissolve" ?
                <div className="footer-row">
                    <span className="footer-text-3">Dissolve deletes random pixels in the image and fills it with color, alpha, or noise.</span>
                </div> : null}
                {attackMode === "rainbow watermarks" ?
                <div className="footer-column">
                    <span className="footer-text-3">If you are using the watermarks with Glaze, it is better to add them before. If you want animation, download the ZIP file, glaze all the images, 
                    and click the button below to recombine it back into a GIF/MP4. The speed slider will control the delay between frames.</span>
                    <div className="footer-button-container">
                        <label htmlFor="gif" className="footer-button recombine-gif">
                            <span className="footer-button-hover">
                                <span className="footer-button-text">Recombine GIF</span>
                            </span>
                        </label>
                        <input id="gif" type="file" multiple={true} onChange={(event) => recombineGIF(event)}/>
                        <label htmlFor="mp4" className="footer-button recombine-mp4">
                            <span className="footer-button-hover">
                                <span className="footer-button-text">Recombine MP4</span>
                            </span>
                        </label>
                        <input id="mp4" type="file" multiple={true} onChange={(event) => recombineMP4(event)}/>
                    </div>
                </div> : null}
            </div>
        </div>
    )
}

export default Footer