import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {AttackModeContext, StopAnimationContext} from "../renderer"
import functions from "../structures/Functions"
import Slider from "react-slider"
import "./styles/navbar.less"

import pointifaction from "../assets/icons/pointifaction.png"
import rainbowWatermarks from "../assets/icons/rainbowwatermarks.png"

const NavBar: React.FunctionComponent = (props) => {
    const {attackMode, setAttackMode} = useContext(AttackModeContext)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    useEffect(() => {
        const savedAttackMode = localStorage.getItem("attackMode")
        if (savedAttackMode) setAttackMode(savedAttackMode)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        localStorage.setItem("attackMode", attackMode)
    }, [attackMode])

    return (
        <div className="navbar">
            <img className="navbar-item" src={rainbowWatermarks} onClick={() => setAttackMode("rainbow watermarks")}/>
            <img className="navbar-item" src={pointifaction} onClick={() => setAttackMode("pointifaction")}/>
        </div>
    )
}

export default NavBar