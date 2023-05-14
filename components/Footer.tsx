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
    
    const version = "1.0.8"

    const windows = async () => {
        const filename = `RGBWatermark-Setup-${version}.exe`
        return functions.download(filename, `https://github.com/Tenpi/RGBWatermark/releases/download/v${version}/${filename}`)
    }

    const mac = async () => {
        const filename = `RGBWatermark-${version}.dmg`
        return functions.download(filename, `https://github.com/Tenpi/RGBWatermark/releases/download/v${version}/${filename}`)
    }

    const linux = async () => {
        const filename = `RGBWatermark-${version}.AppImage`
        return functions.download(filename, `https://github.com/Tenpi/RGBWatermark/releases/download/v${version}/${filename}`)
    }

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

    return (
        <div className="footer">
            <div className="footer-container">
                {attackMode === "pointifiction" ?
                <div className="footer-row">
                    <span className="footer-text-4">Pointifiction deletes pixels in the image to make the picture look like random noise to the AI. Make sure that you set the spacing high enough so that it can't be removed with gaussian blur. Randomness looks very bad, but it might make the removal even harder.</span>
                </div> : null}
                {attackMode === "pixel shift" ?
                <div className="footer-row">
                    <span className="footer-text-5">Pixel shifting shifts the pixels in the image horizontally and vertically, breaking continuity. This significantly degrades quality and will make the output produce blocky images.</span>
                </div> : null}
                {attackMode === "rainbow watermarks" ?
                <div className="footer-column">
                    <span className="footer-text-3">If you are using the watermarks with Glaze, it is better to add them before. If you want animation, download the ZIP file, glaze all the images, 
                    and click the button below to recombine it back into a GIF. The speed slider will control the delay between frames.</span>
                    <label htmlFor="gif" className="footer-button recombine-gif">
                        <span className="footer-button-hover">
                            <span className="footer-button-text">Recombine GIF</span>
                        </span>
                    </label>
                    <input id="gif" type="file" multiple={true} onChange={(event) => recombineGIF(event)}/>
                </div> : null}
            </div>
        </div>
    )
}

export default Footer