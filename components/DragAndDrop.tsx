import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ImageContext, ImageNameContext, ImagePathContext, AudioNameContext, AudioContext, ModelContext, ModelNameContext, MTLContext,
TexturesContext, TextureNamesContext} from "../renderer"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import path from "path"
import fileType from "magic-bytes.js"
import "./styles/draganddrop.less"

let showDrag = false
let timeout = null as any

const DragAndDrop: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const [visible, setVisible] = useState(false)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {imagePath, setImagePath} = useContext(ImagePathContext)
    const {audio, setAudio} = useContext(AudioContext)
    const {audioName, setAudioName} = useContext(AudioNameContext)
    const {model, setModel} = useContext(ModelContext)
    const {mtl, setMTL} = useContext(MTLContext)
    const {textures, setTextures} = useContext(TexturesContext)
    const {textureNames, setTextureNames} = useContext(TextureNamesContext)
    const {modelName, setModelName} = useContext(ModelNameContext)
    const [uploadHover, setUploadHover] = useState(false)
    const history = useHistory()

    const placebo = (event: any) => {
        event.preventDefault()
    }

    const dragOver = (event: any) => {
        event.preventDefault()
        setVisible(true)
    }

    const dragEnd = (event: any) => {
        event.preventDefault()
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            if (!showDrag) setVisible(false) 
        }, 0)
    }

    useEffect(() => {
        window.addEventListener("dragover", placebo)
        window.addEventListener("dragenter", dragOver)
        window.addEventListener("dragleave", dragEnd)
        return () => {
            window.removeEventListener("dragover", placebo)
            window.removeEventListener("dragenter", dragOver)
            window.removeEventListener("dragleave", dragEnd)
        }
    }, [])

    
    useEffect(() => {
        if (!uploadHover) {
            showDrag = false
            setVisible(false)
        }
    }, [uploadHover])

    const dragEnter = (event: React.DragEvent, type: string) => {
        event.preventDefault()
        // window.focus()
        showDrag = true
        setUploadHover(true)
    }

    const dragLeave = (event: React.DragEvent, type: string) => {
        event.preventDefault()
        setUploadHover(false)
    }

    const loadImage = async (file: any) => {
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0] || {}
                const jpg = result?.mime === "image/jpeg" 
                || path.extname(file.name) === ".jpg"
                || path.extname(file.name) === ".jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                const bmp = result?.mime === "image/bmp"
                const avif = path.extname(file.name) === ".avif"
                if (jpg || png || gif || webp || bmp || avif) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    if (jpg) result.typename = "jpg"
                    if (avif) result.typename = "avif"
                    const link = `${url}#.${result.typename}`
                    setImage(link)
                    setImageName(file.name.slice(0, 30))
                    setImagePath(file.path)
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
    }

    const loadAudio = async (file: any) => {
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0] || {}
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
    }

    const loadModel = async (files: any) => {
        let textures = [] as string[]
        let textureNames = [] as string[]
        let hasModel = false
        let hasMaterial = false
        const fileReader = new FileReader()
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            await new Promise<void>((resolve) => {
                fileReader.onloadend = async (f: any) => {
                    let bytes = new Uint8Array(f.target.result)
                    const result = fileType(bytes)?.[0] || {}
                    const obj = path.extname(file.name) === ".obj"
                    const mtl = path.extname(file.name) === ".mtl"
                    const glb = path.extname(file.name) === ".glb"
                    const gltf = path.extname(file.name) === ".gltf"
                    const fbx = path.extname(file.name) === ".fbx"
                    const dae = path.extname(file.name) === ".dae"
                    const mmd = path.extname(file.name) === ".mmd"
                    const stl = path.extname(file.name) === ".stl"
                    const png = path.extname(file.name) === ".png"
                    const jpg = path.extname(file.name) === ".jpg" || path.extname(file.name) === ".jpeg"
                    if (glb) result.typename = "glb"
                    if (gltf) result.typename = "gltf"
                    if (fbx) result.typename = "fbx"
                    if (obj) result.typename = "obj"
                    if (mtl) result.typename = "mtl"
                    if (png) result.typename = "png"
                    if (jpg) result.typename = "jpg"
                    if (stl) result.typename = "stl"
                    if (dae) result.typename = "dae"
                    if (mmd) result.typename = "mmd"
                    if (obj || glb || gltf || fbx || stl || dae || mmd) {
                        const blob = new Blob([bytes])
                        const url = URL.createObjectURL(blob)
                        const link = `${url}#.${result.typename}`
                        setModel(link)
                        setModelName(file.name.slice(0, 30))
                        hasModel = true
                    }
                    if (mtl) {
                        const blob = new Blob([bytes])
                        const url = URL.createObjectURL(blob)
                        const link = `${url}#.${result.typename}`
                        setMTL(link)
                        hasMaterial = true
                    }
                    if (png || jpg) {
                        const blob = new Blob([bytes])
                        const url = URL.createObjectURL(blob)
                        const link = `${url}#.${result.typename}`
                        textures.push(link)
                        textureNames.push(path.basename(file.name, path.extname(file.name)))
                        if (hasModel) hasMaterial = true
                    }
                    resolve()
                }
                fileReader.readAsArrayBuffer(file)
            })
        }
        if (hasMaterial) {
            setTextures(textures)
            setTextureNames(textureNames)
        }
    }

    const uploadDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setUploadHover(false)
        const files = event.dataTransfer.files 
        if (!files?.[0]) return
        loadImage(files[0])
        loadAudio(files[0])
        loadModel(files)
    }

    return (
        <div className="dragdrop" style={{display: visible ? "flex" : "none"}}>
            <div className="dragdrop-container">
                <div className={`dragdrop-box ${uploadHover ? "dragdrop-hover" : ""}`} onDrop={uploadDrop}
                onDragEnter={(event) => dragEnter(event, "upload")} 
                onDragLeave={(event) => dragLeave(event, "upload")}>
                    Upload
                </div>
            </div>
        </div>
    )
}

export default DragAndDrop