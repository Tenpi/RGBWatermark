const fs = require("fs")
const path = require("path")

const data = fs.readFileSync(path.join(__dirname, "dist/index.html"))
fs.writeFileSync(path.join(__dirname, "dist/index.html"), `${data}\n<script src="jphs.js"></script>`)