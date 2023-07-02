import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {EnableDragContext, MobileContext, SiteHueContext, MTLContext, TexturesContext, TextureNamesContext, SiteSaturationContext, SiteLightnessContext, AttackModeContext, ModelContext, ModelNameContext, patterns} from "../renderer"
import functions from "../structures/Functions"
import Slider from "react-slider"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import $3dPlaceHolder from "../assets/images/3d-placeholder.png"
import * as THREE from "three"
import {OrbitControls, OBJLoader, MTLLoader, FBXLoader, STLLoader, STLExporter, MMDLoader, MMDExporter} from "three-stdlib"
import {SubdivisionModifier} from "../structures/SubdivisionModifier"
import {OBJExporter} from "../structures/OBJExporter"
import {GLTFLoader} from "../structures/GLTFLoader"
import {GLTFExporter} from "../structures/GLTFExporter"
import {ColladaLoader} from "../structures/ColladaLoader"
import {ColladaExporter} from "../structures/ColladaExporter"
import JSZip from "jszip"
import "./styles/decimation.less"

let id = null as any

const Subdivision: React.FunctionComponent= (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {model, setModel} = useContext(ModelContext)
    const {mtl, setMTL} = useContext(MTLContext)
    const {textures, setTextures} = useContext(TexturesContext)
    const {textureNames, setTextureNames} = useContext(TextureNamesContext)
    const {modelName, setModelName} = useContext(ModelNameContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [subdivisions, setSubdivisions] = useState(0)
    const [wireframe, setWireframe] = useState(false)
    const [matcap, setMatcap] = useState(false)
    const [ambient, setAmbient] = useState(0.5)
    const [directionalFront, setDirectionalFront] = useState(0.2)
    const [directionalBack, setDirectionalBack] = useState(0.2)
    const [lights, setLights] = useState([]) as any
    const [scene, setScene] = useState(null) as any
    const [objMaterials, setObjMaterials] = useState([]) as any
    const [objGeometries, setObjGeometries] = useState([]) as any
    const [ref, setRef] = useState(null) as any
    const [object3D, setObject3D] = useState(null) as any
    const [displayModel, setDisplayModel] = useState(null) as any
    const [updateEffect, setUpdateEffect] = useState(false)
    const rendererRef = useRef(null) as any
    const controlRef = useRef(null) as any
    const history = useHistory()

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const getFilter2 = () => {
        return `hue-rotate(${siteHue - 189}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 50}%)`
    }

    const wireColor = () => {
        return functions.rotateColor("#4d5eff", siteHue, siteSaturation, siteLightness)
    }

    const loadModel = async (event: any) => {
        const files = event.target.files 
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
        if (event.target) event.target.value = ""
    }

    const removeModel = () => {
        setModel("")
        setModelName("")
        setMTL("")
        setTextures([])
        setTextureNames([])
    }

    const updateColorSpace = (object3D: any) => {
        object3D.traverse((obj: any) => {
            if (obj.isMesh) {
                if (obj.material.length) {
                    for (let i = 0; i < obj.material.length; i++) {
                            obj.material[i].map.encoding = THREE.sRGBEncoding
                            obj.material[i].needsUpdate = true
                    }
                } else {
                    if (obj.material.map) {
                        obj.material.map.encoding = THREE.sRGBEncoding
                        obj.material.needsUpdate = true
                    }
                }
            }
        })
    }

    const drawModel = async () => {
        const element = rendererRef.current
        window.cancelAnimationFrame(id)
        while (element?.lastChild) element?.removeChild(element.lastChild)
        const width = window.innerWidth - 700
        const height = window.innerHeight - 300
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const light = new THREE.AmbientLight(0xffffff, ambient)
        scene.add(light)
        const light2 = new THREE.DirectionalLight(0xffffff, directionalFront)
        light2.position.set(30, 100, 100)
        scene.add(light2)
        const light3 = new THREE.DirectionalLight(0xffffff, directionalBack)
        light3.position.set(-30, 100, -100)
        scene.add(light3)
        setLights([light, light2, light3])
        
        const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, preserveDrawingBuffer: true})
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        element?.appendChild(renderer.domElement)

        let object3D = null as any
        const manager = new THREE.LoadingManager()
        manager.setURLModifier((url: string) => {
            if (path.extname(url) === ".obj") return url
            if (path.extname(url) === ".mtl") return url
            if (path.extname(url) === ".dae") return url
            if (path.extname(url) === ".fbx") return url
            if (path.extname(url) === ".gltf") return url
            if (path.extname(url) === ".glb") return url
            if (path.extname(url) === ".mmd") return url
            if (path.extname(url) === ".stl") return url
            const decoded = decodeURIComponent(url)
            const base = path.basename(decoded, path.extname(decoded))
            const index = textureNames.findIndex((t: string) => t === base)
            return textures[index] ? textures[index] : url
        })
        if (functions.isGLTF(model)) {
            const loader = new GLTFLoader(manager)
            const gltf = await loader.loadAsync(model)
            object3D = gltf.scene
        } else if (functions.isOBJ(model)) {
            const loader = new OBJLoader(manager)
            if (mtl) {
                const mtlLoader = new MTLLoader(manager)
                const materials = await mtlLoader.loadAsync(mtl)
                materials.preload()
                loader.setMaterials(materials)
            }
            object3D = await loader.loadAsync(model)
            updateColorSpace(object3D)
        } else if (functions.isFBX(model)) {
            const loader = new FBXLoader(manager)
            object3D = await loader.loadAsync(model)
        } else if (functions.isSTL(model)) {
            const loader = new STLLoader(manager)
            const geometry = await loader.loadAsync(model)
            const material = new THREE.MeshStandardMaterial()
            object3D = new THREE.Mesh(geometry, material)
        } else if (functions.isMMD(model)) {
            const loader = new MMDLoader(manager)
            object3D = await loader.loadAsync(model)
        } else if (functions.isDAE(model)) {
            const loader = new ColladaLoader(manager)
            const collada = await loader.loadAsync(model)
            object3D = collada.scene
            updateColorSpace(object3D)
        }

        if (wireframe) {
            object3D.traverse((obj: any) => {
                if (obj.isMesh) {
                    const geometry = new THREE.WireframeGeometry(obj.geometry)
                    const material = new THREE.LineBasicMaterial({color: wireColor()})
                    const wireframe = new THREE.LineSegments(geometry, material)
                    wireframe.name = "wireframe"
                    object3D.add(wireframe)
                }
            })
        }
        let objMaterials = [] as any
        let objGeometries = [] as any
        const matcapMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.5, metalness: 1.0, envMap: scene.environment})
        object3D.traverse((obj: any) => {
            if (obj.isMesh) {
                objGeometries.push(obj.geometry)
                if (obj.material.length) {
                    for (let i = 0; i < obj.material.length; i++) {
                        objMaterials.push(obj.material[i])
                    }
                } else {
                    objMaterials.push(obj.material)
                }
                if (matcap) obj.material = matcapMaterial
            }
        })
        setObject3D(object3D)
        setDisplayModel(object3D)
        setScene(scene)
        setObjMaterials(objMaterials)
        setObjGeometries(objGeometries)

        object3D.name = "model"
        scene.add(object3D)

        const controlElement = controlRef.current || undefined
        const controls = new OrbitControls(camera, controlElement) as any

        const box = new THREE.Box3().setFromObject(object3D)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())

        object3D.position.x += (object3D.position.x - center.x)
        object3D.position.y += (object3D.position.y - center.y)
        object3D.position.z += (object3D.position.z - center.z)

        camera.near = size / 100
        camera.far = size * 100
        camera.updateProjectionMatrix()

        camera.position.copy(center)
        camera.position.x += size / 2.0
        camera.position.y += size / 5.0
        camera.position.z += size / 2.0
        camera.lookAt(center)

        controls.maxDistance = size * 10
        controls.update()

        const clock = new THREE.Clock()

        const animate = () => {
            id = window.requestAnimationFrame(animate)
            const delta = clock.getDelta()
            controls.update()
            renderer.render(scene, camera)
        }

        animate()
        setRef(renderer.domElement)

        window.addEventListener("resize", () => {
            let width = window.innerWidth - 700
            let height = window.innerHeight - 300
            // @ts-ignore
            if (document.fullscreenElement || document.webkitIsFullScreen) {
                width = window.innerWidth
                height = window.innerHeight
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            } else {
                if (width < 1000) return
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            }
        })
    }

    const applySubdivision = async () => {
        if (!scene || !object3D) return
        const modifier = new SubdivisionModifier(subdivisions)
        object3D.traverse(async (obj: any) => {
            if (obj.name === "wireframe") object3D.remove(obj)
            if (obj.isMesh) {
                const subdivided = modifier.modify(obj.geometry)
                obj.geometry = subdivided
                if (wireframe) {
                    const wireGeometry = new THREE.WireframeGeometry(obj.geometry)
                    const wireMaterial = new THREE.LineBasicMaterial({color: wireColor()})
                    const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial)
                    wireframe.name = "wireframe"
                    object3D.add(wireframe)
                }
            }
        })
    }

    useEffect(() => {
        const init = async () => {
            await drawModel()
            applySubdivision()
        }
        if (model) init()
    }, [model, mtl, textures, textureNames])

    useEffect(() => {
        if (updateEffect) {
            applySubdivision()
            setUpdateEffect(false)
        }
    }, [scene, object3D, displayModel, objGeometries, objMaterials, subdivisions, wireframe, updateEffect])

    useEffect(() => {
        setUpdateEffect(true)
    }, [subdivisions, wireframe])

    const reset = () => {
        setSubdivisions(0)
        setWireframe(false)
    }

    useEffect(() => {
        const savedSubdivions = localStorage.getItem("subdivisions")
        if (savedSubdivions) setSubdivisions(Number(savedSubdivions))
        const savedWireframe = localStorage.getItem("wireframe")
        if (savedWireframe) setWireframe(savedWireframe === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("subdivisions", String(subdivisions))
        localStorage.setItem("wireframe", String(wireframe))
    }, [])

    const obj = async () => {
        const exporter = new OBJExporter()
        const data = exporter.parse(object3D, path.basename(modelName, path.extname(modelName)))
        if (!data.mtl) {
            const objBlob = new Blob([data.obj])
            const objUrl = URL.createObjectURL(objBlob)
            return functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.obj`, objUrl)
        }
        const zip = new JSZip()
        zip.file(`${path.basename(modelName, path.extname(modelName))}_decimated.obj`, data.obj)
        zip.file(`${path.basename(modelName, path.extname(modelName))}_decimated.mtl`, data.mtl)
        for (let i = 0; i < data.tex.length; i++) {
            zip.file(`${data.tex[i].name}.${data.tex[i].ext}`, data.tex[i].data)
        }
        const blob = await zip.generateAsync({type: "blob"})
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.zip`, url)
    }

    const gltfBuffer = async (binary?: boolean) => {
        let options = {binary: false, embedImages: true} as any
        if (binary) options = {binary: true, embedImages: true}
        const exporter = new GLTFExporter()
        let data = null as any
        await new Promise<void>((resolve, reject) => {
            exporter.parse(object3D, (gltf) => {
                data = gltf
                resolve()
            }, () => null, options)
        })
        return data
    }

    const glb = async () => {
        const glb = await gltfBuffer(true)
        const blob = new Blob([new Uint8Array(glb as ArrayBuffer)])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.glb`, url)
    }

    const gltf = async () => {
        const gltf = await gltfBuffer()
        const blob = new Blob([functions.jsonToArray(gltf)])
        const url = URL.createObjectURL(blob)
        return functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.gltf`, url)
    }

    const fbx = async () => {
    }

    const stl = () => {
        const exporter = new STLExporter()
        const data = exporter.parse(object3D, {binary: true}) as DataView
        const blob = new Blob([new Uint8Array(data.buffer)])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.stl`, url)
    }

    const mmd = () => {
        const exporter = new MMDExporter()
        const data = exporter.parseVpd(object3D, true, true)
        const blob = new Blob([data!])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.mmd`, url)
    }

    const dae = async () => {
        const exporter = new ColladaExporter()
        const collada = exporter.parse(object3D, () => null)!
        if (!collada.textures.length) {
            const colladaBlob = new Blob([collada.data])
            const colladaURL = URL.createObjectURL(colladaBlob)
            return functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.dae`, colladaURL)
        }
        const zip = new JSZip()
        zip.file(`${path.basename(modelName, path.extname(modelName))}_decimated.dae`, collada.data)
        for (let i = 0; i < collada.textures.length; i++) {
            const texture = collada.textures[i] as any
            zip.file(`${texture.name}.${texture.ext}`, texture.data)
        }
        const blob = await zip.generateAsync({type: "blob"})
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(modelName, path.extname(modelName))}_decimated.zip`, url)
    }

    return (
        <div className="decimation-image-component" onMouseEnter={() => setEnableDrag(true)}>
            <div className="decimation-upload-container">
                <div className="decimation-row">
                    <span className="decimation-text">3D Model:</span>
                </div>
                <div className="decimation-row">
                    <label htmlFor="img" className="decimation-button" style={{width: "92px"}}>
                        <span className="button-hover">
                            <span className="button-text">Upload</span>
                            <img className="button-image" src={uploadIcon}/>
                        </span>
                    </label>
                    <input id="img" type="file" multiple onChange={(event) => loadModel(event)}/>
                    {model ? 
                        <div className="button-image-name-container">
                            <img className="button-image-icon" src={xIcon} onClick={removeModel}/>
                            <span className="button-image-name">{modelName}</span>
                        </div>
                    : null}
                </div>
            </div>
            {model ?
            <div className="relative-ref" ref={controlRef} style={{alignItems: "center", justifyContent: "center"}}>
                <div className="model-renderer" ref={rendererRef}></div>
            </div> : <img src={$3dPlaceHolder} className="model-cover"/>}
            <div className="decimation-options-container">
                <div className="decimation-row">
                    <span className="decimation-text-mini" style={{width: "auto", fontSize: "17px"}}>Wireframe?</span>
                    <img className="decimation-checkbox" src={wireframe ? checkboxChecked : checkbox} onClick={() => setWireframe((prev: boolean) => !prev)} style={{marginLeft: "5px"}}/>
                </div>
                <div className="decimation-row">
                    <span className="decimation-text">Subdivisions: </span>
                    <Slider className="decimation-slider" trackClassName="decimation-slider-track" thumbClassName="decimation-slider-thumb" onChange={(value) => setSubdivisions(value)} min={0} max={7} step={1} value={subdivisions}/>
                    <span className="decimation-text-mini">{subdivisions}</span>
                </div>
            </div>
            {model ?
            <div className="decimation-image-container">
                <div className="decimation-image-buttons-container">
                    <button className="decimation-image-button" onClick={obj}>OBJ</button>
                    <button className="decimation-image-button" onClick={glb}>GLB</button>
                    <button className="decimation-image-button" onClick={gltf}>GLTF</button>
                    <button className="decimation-image-button" onClick={dae}>DAE</button>
                    <button className="decimation-image-button" onClick={stl}>STL</button>
                </div>
            </div> : null}
            <div className="decimation-options-container">
                <div className="decimation-row">
                    <button className="decimation-button" onClick={reset} style={{padding: "0px 5px", marginTop: "7px"}}>
                        <span className="button-hover">
                            <span className="button-text">Reset</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Subdivision