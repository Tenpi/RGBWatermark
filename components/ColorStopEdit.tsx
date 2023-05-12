import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ColorStopContext} from "../renderer"
import functions from "../structures/Functions"
import xIcon from "../assets/icons/x.png"
import "./styles/colorstopedit.less"

const ColorStopEdit: React.FunctionComponent = (props) => {
    const {colorStops, setColorStops} = useContext(ColorStopContext)
    const ref = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!ref.current) return
        const width = 300
        const height = 15
        ref.current.width = width
        ref.current.height = height
        const refCtx = ref.current.getContext("2d")!
        const gradient = refCtx.createLinearGradient(0, 0, width, height)
        for (let i = 0; i < colorStops.length; i++) {
            gradient.addColorStop(colorStops[i].position, colorStops[i].color)
        }
        refCtx.fillStyle = gradient
        refCtx.fillRect(0, 0, width, height)
    }, [colorStops])

    const removeColorStop = (mousePosition: number) => {
        if (!ref.current) return
        const calculated = mousePosition / ref.current.width
        const toRemove = colorStops.reduce((p: any, c: any) => Math.abs(c.position - calculated) < Math.abs(p.position - calculated) ? c : p)
        let newColorStops = [] as any
        let k = 0
        let totalK = colorStops.length - 1
        if (totalK < 2) return
        for (let i = 0; i < colorStops.length; i++) {
            if (colorStops[i].position === toRemove.position && colorStops[i].color === toRemove.color) {
                continue
            } else {
                newColorStops.push({position: k/totalK, color: colorStops[i].color})
            }
            k++
        }
        setColorStops(newColorStops)
    }

    const modifyColorStop = (position: number, value: string) => {
        let newColorStops = [] as any
        for (let i = 0; i < colorStops.length; i++) {
            if (i === position) {
                newColorStops.push({position: colorStops[i].position, color: value})
            } else {
                newColorStops.push({position: colorStops[i].position, color: colorStops[i].color})
            }
        }
        setColorStops(newColorStops)
    }

    const generateColorStops = () => {
        let jsx = [] as any
        for (let i = 0; i < colorStops.length; i++) {
            jsx.push(<input className="colorstop" type="color" value={colorStops[i].color} onChange={(event) => modifyColorStop(i, event.target.value)}/>)
        }
        return jsx
    }

    return (
        <div className="colorstopedit">
            <canvas className="colorstop-visual" ref={ref} onClick={(event) => removeColorStop(event.clientX)}></canvas>
            <div className="colorstop-edit-container">{generateColorStops()}</div>
        </div>
    )
}

export default ColorStopEdit