import {ipcRenderer} from "electron"
import {getCurrentWindow, shell} from "@electron/remote"
import {StopAnimationContext, ImageContext} from "../renderer"
import React, {useEffect, useState, useContext, useRef} from "react"
import closeButtonHover from "../assets/icons/closeButton-hover.png"
import closeButton from "../assets/icons/closeButton.png"
import appIcon from "../assets/icons/icon.png"
import maximizeButtonHover from "../assets/icons/maximizeButton-hover.png"
import maximizeButton from "../assets/icons/maximizeButton.png"
import minimizeButtonHover from "../assets/icons/minimizeButton-hover.png"
import minimizeButton from "../assets/icons/minimizeButton.png"
import updateButtonHover from "../assets/icons/updateButton-hover.png"
import updateButton from "../assets/icons/updateButton.png"
import starButtonHover from "../assets/icons/starButton-hover.png"
import starButton from "../assets/icons/starButton.png"
import placeholder from "../assets/images/placeholder.png"
import pack from "../package.json"
import "./styles/titlebar.less"

const TitleBar: React.FunctionComponent = (props) => {
    const [hover, setHover] = useState(false)
    const [hoverClose, setHoverClose] = useState(false)
    const [hoverMin, setHoverMin] = useState(false)
    const [hoverMax, setHoverMax] = useState(false)
    const [hoverReload, setHoverReload] = useState(false)
    const [hoverStar, setHoverStar] = useState(false)
    const {stopAnimations, setStopAnimations} = useContext(StopAnimationContext)
    const {image, setImage} = useContext(ImageContext)
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        ipcRenderer.invoke("check-for-updates", true)
    }, [])

    useEffect(() => {
        if (!image) setImage(placeholder)
    }, [image])

    const minimize = () => {
        getCurrentWindow().minimize()
    }

    const maximize = () => {
        const window = getCurrentWindow()
        if (window.isMaximized()) {
            window.unmaximize()
        } else {
            window.maximize()
        }
    }

    const close = () => {
        getCurrentWindow().close()
    }
    
    const star = () => {
        shell.openExternal(pack.repository.url)
    }

    const update = () => {
        ipcRenderer.invoke("check-for-updates", false)
    }

    const generateVersionJSX = () => {
        let jsx = [] as any
        let str = `v${pack.version}`
        for (let i = 0; i < str.length; i+=3) {
            if (!str[i]) break
            jsx.push(<span className="title color-r">{str[i]}</span>)
            if (!str[i+1]) break
            jsx.push(<span className="title color-g">{str[i+1]}</span>)
            if (!str[i+2]) break
            jsx.push(<span className="title color-b">{str[i+2]}</span>)
        }
        return jsx 
    }

    return (
        <section className="title-bar">
                <div className="title-bar-drag-area">
                    <div className="title-container">
                        <img className="app-icon" height="22" width="22" src={appIcon}/>
                        {/* <canvas className="titlebar-img" ref={ref}></canvas> */}
                        <span className="title color-r">R</span>
                        <span className="title color-g">G</span>
                        <span className="title color-b">B</span>
                        <span className="title color-r">W</span>
                        <span className="title color-g">a</span>
                        <span className="title color-b">t</span>
                        <span className="title color-r">e</span>
                        <span className="title color-g">r</span>
                        <span className="title color-b">m</span>
                        <span className="title color-r">a</span>
                        <span className="title color-g">r</span>
                        <span className="title color-b" style={{marginRight: "10px"}}>k</span>
                        {generateVersionJSX()}
                        {/* <span className="title color-r">v{pack.version}</span> */}
                    </div>
                    <div className="title-bar-buttons">
                        <img src={hoverStar ? starButtonHover : starButton} height="20" width="20" className="title-bar-button star-button" onClick={star} onMouseEnter={() => setHoverStar(true)} onMouseLeave={() => setHoverStar(false)}/>
                        <img src={hoverReload ? updateButtonHover : updateButton} height="20" width="20" className="title-bar-button update-button" onClick={update} onMouseEnter={() => setHoverReload(true)} onMouseLeave={() => setHoverReload(false)}/>
                        <img src={hoverMin ? minimizeButtonHover : minimizeButton} height="20" width="20" className="title-bar-button" onClick={minimize} onMouseEnter={() => setHoverMin(true)} onMouseLeave={() => setHoverMin(false)}/>
                        <img src={hoverMax ? maximizeButtonHover : maximizeButton} height="20" width="20" className="title-bar-button" onClick={maximize} onMouseEnter={() => setHoverMax(true)} onMouseLeave={() => setHoverMax(false)}/>
                        <img src={hoverClose ? closeButtonHover : closeButton} height="20" width="20" className="title-bar-button" onClick={close} onMouseEnter={() => setHoverClose(true)} onMouseLeave={() => setHoverClose(false)}/>
                    </div>
                </div>
        </section>
    )
}

export default TitleBar
