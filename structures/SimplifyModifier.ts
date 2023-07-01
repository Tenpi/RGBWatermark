import {BufferGeometry, Float32BufferAttribute, Vector3, Vector2, BufferAttribute, InterleavedBufferAttribute} from "three"
import {Geometry, Face3} from "three-stdlib"

/**
   * @param {BufferGeometry} geometry
   * @param {number} tolerance
   * @return {BufferGeometry>}
   */
 export function mergeVertices(geometry: BufferGeometry, tolerance = 1e-4): BufferGeometry {
  tolerance = Math.max(tolerance, Number.EPSILON)

  // Generate an index buffer if the geometry doesn't have one, or optimize it
  // if it's already available.
  const hashToIndex: {
    [key: string]: number
  } = {}
  const indices = geometry.getIndex()
  const positions = geometry.getAttribute('position')
  const vertexCount = indices ? indices.count : positions.count

  // next value for triangle indices
  let nextIndex = 0

  // attributes and new attribute arrays
  const attributeNames = Object.keys(geometry.attributes)
  const attrArrays: {
    [key: string]: []
  } = {}
  const morphAttrsArrays: {
    [key: string]: Array<Array<BufferAttribute | InterleavedBufferAttribute>>
  } = {}
  const newIndices = [] as any
  const getters = ['getX', 'getY', 'getZ', 'getW']

  // initialize the arrays
  for (let i = 0, l = attributeNames.length; i < l; i++) {
    const name = attributeNames[i]

    attrArrays[name] = [] as any

    const morphAttr = geometry.morphAttributes[name]
    if (morphAttr) {
      morphAttrsArrays[name] = new Array(morphAttr.length).fill(0).map(() => [])
    }
  }

  // convert the error tolerance to an amount of decimal places to truncate to
  const decimalShift = Math.log10(1 / tolerance)
  const shiftMultiplier = Math.pow(10, decimalShift)
  for (let i = 0; i < vertexCount; i++) {
    const index = indices ? indices.getX(i) : i

    // Generate a hash for the vertex attributes at the current index 'i'
    let hash = ''
    for (let j = 0, l = attributeNames.length; j < l; j++) {
      const name = attributeNames[j]
      const attribute = geometry.getAttribute(name)
      const itemSize = attribute.itemSize

      for (let k = 0; k < itemSize; k++) {
        // double tilde truncates the decimal value
        // @ts-ignore no
        hash += `${~~(attribute[getters[k]](index) * shiftMultiplier)},`
      }
    }

    // Add another reference to the vertex if it's already
    // used by another index
    if (hash in hashToIndex) {
      newIndices.push(hashToIndex[hash])
    } else {
      // copy data to the new index in the attribute arrays
      for (let j = 0, l = attributeNames.length; j < l; j++) {
        const name = attributeNames[j]
        const attribute = geometry.getAttribute(name)
        const morphAttr = geometry.morphAttributes[name]
        const itemSize = attribute.itemSize
        const newarray = attrArrays[name]
        const newMorphArrays = morphAttrsArrays[name]

        for (let k = 0; k < itemSize; k++) {
          const getterFunc = getters[k]
          // @ts-ignore
          newarray.push(attribute[getterFunc](index))

          if (morphAttr) {
            for (let m = 0, ml = morphAttr.length; m < ml; m++) {
              // @ts-ignore
              newMorphArrays[m].push(morphAttr[m][getterFunc](index))
            }
          }
        }
      }

      hashToIndex[hash] = nextIndex
      newIndices.push(nextIndex)
      nextIndex++
    }
  }

  // Generate typed arrays from new attribute arrays and update
  // the attributeBuffers
  const result = geometry.clone()
  for (let i = 0, l = attributeNames.length; i < l; i++) {
    const name = attributeNames[i]
    const oldAttribute = geometry.getAttribute(name)
    //@ts-expect-error  something to do with functions and constructors and new
    const buffer = new (oldAttribute.array as TypedArray).constructor(attrArrays[name])
    const attribute = new BufferAttribute(buffer, oldAttribute.itemSize, oldAttribute.normalized)

    result.setAttribute(name, attribute)

    // Update the attribute arrays
    if (name in morphAttrsArrays) {
      for (let j = 0; j < morphAttrsArrays[name].length; j++) {
        const oldMorphAttribute = geometry.morphAttributes[name][j]
        //@ts-expect-error something to do with functions and constructors and new
        const buffer = new (oldMorphAttribute.array as TypedArray).constructor(morphAttrsArrays[name][j])
        const morphAttribute = new BufferAttribute(buffer, oldMorphAttribute.itemSize, oldMorphAttribute.normalized)
        result.morphAttributes[name][j] = morphAttribute
      }
    }
  }

  // indices

  result.setIndex(newIndices)

  return result
}

let globalGeometry
const cb = new Vector3()
const ab = new Vector3()

function pushIfUnique<TItem>(array: TItem[], object: TItem): void {
  if (array.indexOf(object) === -1) array.push(object)
}

function removeFromArray<TItem>(array: TItem[], object: TItem): void {
  const k = array.indexOf(object)
  if (k > -1) array.splice(k, 1)
}

class Vertex {
  public position: Vector3
  private id: number

  public faces: Triangle[]
  public neighbors: Vertex[]

  public collapseCost: number
  public collapseNeighbor: null | Vertex

  public minCost: number = 0
  public totalCost: number = 0
  public costCount: number = 0

  constructor(v: Vector3, id: number) {
    this.position = v
    this.id = id // old index id

    this.faces = [] // faces vertex is connected
    this.neighbors = [] // neighbouring vertices aka "adjacentVertices"

    // these will be computed in computeEdgeCostAtVertex()
    this.collapseCost = 0 // cost of collapsing this vertex, the less the better. aka objdist
    this.collapseNeighbor = null // best candinate for collapsing
  }

  public addUniqueNeighbor(vertex: Vertex): void {
    pushIfUnique(this.neighbors, vertex)
  }

  public removeIfNonNeighbor(n: Vertex): void {
    const neighbors = this.neighbors
    const faces = this.faces

    const offset = neighbors.indexOf(n)
    if (offset === -1) return
    for (let i = 0; i < faces.length; i++) {
      if (faces[i].hasVertex(n)) return
    }

    neighbors.splice(offset, 1)
  }
}

// we use a triangle class to represent structure of face slightly differently
class Triangle {
  private a: number
  private b: number
  private c: Number

  public v1: Vertex
  public v2: Vertex
  public v3: Vertex

  public normal = new Vector3()
  public faceVertexUvs = [] as Vector2[]
  public materialIndex

  constructor(v1: Vertex, v2: Vertex, v3: Vertex, a: number, b: number, c: number, fvuv: any, materialIndex: number) {
    this.a = a
    this.b = b
    this.c = c

    this.v1 = v1
    this.v2 = v2
    this.v3 = v3
    this.faceVertexUvs = fvuv
    this.materialIndex = materialIndex

    this.computeNormal()

    v1.faces.push(this)
    v1.addUniqueNeighbor(v2)
    v1.addUniqueNeighbor(v3)

    v2.faces.push(this)
    v2.addUniqueNeighbor(v1)
    v2.addUniqueNeighbor(v3)

    v3.faces.push(this)
    v3.addUniqueNeighbor(v1)
    v3.addUniqueNeighbor(v2)
  }

  private computeNormal(): void {
    const vA = this.v1.position
    const vB = this.v2.position
    const vC = this.v3.position

    cb.subVectors(vC, vB)
    ab.subVectors(vA, vB)
    cb.cross(ab).normalize()

    this.normal.copy(cb)
  }

  public hasVertex(v: Vertex): boolean {
    return v === this.v1 || v === this.v2 || v === this.v3
  }

  public replaceVertex(oldv: Vertex, newv: Vertex): void {
    if (oldv === this.v1) this.v1 = newv
    else if (oldv === this.v2) this.v2 = newv
    else if (oldv === this.v3) this.v3 = newv

    removeFromArray(oldv.faces, this)
    newv.faces.push(this)

    oldv.removeIfNonNeighbor(this.v1)
    this.v1.removeIfNonNeighbor(oldv)

    oldv.removeIfNonNeighbor(this.v2)
    this.v2.removeIfNonNeighbor(oldv)

    oldv.removeIfNonNeighbor(this.v3)
    this.v3.removeIfNonNeighbor(oldv)

    this.v1.addUniqueNeighbor(this.v2)
    this.v1.addUniqueNeighbor(this.v3)

    this.v2.addUniqueNeighbor(this.v1)
    this.v2.addUniqueNeighbor(this.v3)

    this.v3.addUniqueNeighbor(this.v1)
    this.v3.addUniqueNeighbor(this.v2)

    this.computeNormal()
  }
}

/**
 *	Simplification Geometry Modifier
 *    - based on code and technique
 *	  - by Stan Melax in 1998
 *	  - Progressive Mesh type Polygon Reduction Algorithm
 *    - http://www.melax.com/polychop/
 */

class SimplifyModifier {
  constructor() {}

  private computeEdgeCollapseCost = (u: Vertex, v: Vertex): number => {
    // if we collapse edge uv by moving u to v then how
    // much different will the model change, i.e. the "error".
  
    let edgelength = v.position.distanceTo(u.position)
    let curvature = 0
  
    let sideFaces = [] as Triangle[]
    let uFaces = u.faces
    let il = u.faces.length
    let face: Triangle
    let sideFace: Triangle
  
    // find the "sides" triangles that are on the edge uv
    for (let i = 0; i < il; i++) {
      face = u.faces[i]
  
      if (face.hasVertex(v)) {
        sideFaces.push(face)
      }
    }
  
    // use the triangle facing most away from the sides
    // to determine our curvature term
    for (let i = 0; i < il; i++) {
      let minCurvature = 1
      face = u.faces[i]
  
      for (let j = 0; j < sideFaces.length; j++) {
        sideFace = sideFaces[j]
        // use dot product of face normals.
        let dotProd = face.normal.dot(sideFace.normal)
        minCurvature = Math.min(minCurvature, (1.001 - dotProd) / 2)
      }
  
      curvature = Math.max(curvature, minCurvature)
    }
  
    // crude approach in attempt to preserve borders
    // though it seems not to be totally correct
    let borders = 0
    if (sideFaces.length < 2) {
      // we add some arbitrary cost for borders,
      // borders += 10
      curvature = 1
    }
  
    let amt = edgelength * curvature + borders + this.computeUVsCost(u, v)
  
    return amt
  }

  private removeVertex(v: Vertex, vertices: Vertex[]): void {
    console.assert(v.faces.length === 0)
  
    while (v.neighbors.length) {
      let n = v.neighbors.pop()
      if (n) removeFromArray(n.neighbors, v)
    }
  
    removeFromArray(vertices, v)
  }

  private computeEdgeCostAtVertex = (v: Vertex): void => {
    // compute the edge collapse cost for all edges that start
    // from vertex v.  Since we are only interested in reducing
    // the object by selecting the min cost edge at each step, we
    // only cache the cost of the least cost edge at this vertex
    // (in member variable collapse) as well as the value of the
    // cost (in member variable collapseCost).
  
    if (v.neighbors.length === 0) {
      // collapse if no neighbors.
      v.collapseNeighbor = null
      v.collapseCost = -0.01
  
      return;
    }
  
    v.collapseCost = 100000
    v.collapseNeighbor = null
  
    // search all neighboring edges for "least cost" edge
    for (let i = 0; i < v.neighbors.length; i++) {
      let collapseCost = this.computeEdgeCollapseCost(v, v.neighbors[i])
  
      if (!v.collapseNeighbor) {
        v.collapseNeighbor = v.neighbors[i]
        v.collapseCost = collapseCost
        v.minCost = collapseCost
        v.totalCost = 0
        v.costCount = 0
      }
  
      v.costCount++
      v.totalCost += collapseCost
  
      if (collapseCost < v.minCost) {
        v.collapseNeighbor = v.neighbors[i]
        v.minCost = collapseCost
      }
    }
  
    // we average the cost of collapsing at this vertex
    v.collapseCost = v.totalCost / v.costCount
    // v.collapseCost = v.minCost
  }

  private removeFace = (f: Triangle, faces: Triangle[]): void => {
    removeFromArray(faces, f)
  
    if (f.v1) removeFromArray(f.v1.faces, f)
    if (f.v2) removeFromArray(f.v2.faces, f)
    if (f.v3) removeFromArray(f.v3.faces, f)
  
    // TODO optimize this!
    let vs = [f.v1, f.v2, f.v3]
    let v1, v2
  
    for (let i = 0; i < 3; i++) {
      v1 = vs[i]
      v2 = vs[(i + 1) % 3]
  
      if (!v1 || !v2) continue
      v1.removeIfNonNeighbor(v2)
      v2.removeIfNonNeighbor(v1)
    }
  }

  private computeUVsCost = (u: Vertex, v: Vertex) => {
    if (!u.faces[0].faceVertexUvs || !u.faces[0].faceVertexUvs) return 0
    if (!v.faces[0].faceVertexUvs || !v.faces[0].faceVertexUvs) return 0
    let UVsAroundVertex = [] as any
    let UVcost = 0
    // check if all coordinates around V have the same value
    for (let i = v.faces.length - 1; i >= 0; i--) {
      let f = v.faces[i]
      if (f.hasVertex(u)) UVsAroundVertex.push(this.getUVsOnVertex(f, v))
    }
    UVsAroundVertex.reduce((prev, uv) => {
      if (prev.x && (prev.x !== uv.x || prev.y !== uv.y)) {
        UVcost += 1
      }
      return uv
    }, {})
  
    UVsAroundVertex.length = 0;
    // check if all coordinates around U have the same value
    for (let i = u.faces.length - 1; i >= 0; i--) {
      let f = u.faces[i]
      if (f.hasVertex(v)) UVsAroundVertex.push(this.getUVsOnVertex(f, u))
    }
    UVsAroundVertex.reduce((prev, uv) => {
      if (prev.x && (prev.x !== uv.x || prev.y !== uv.y)) {
        UVcost += 1
      }
      return uv
    }, {})
    return UVcost
  }

  private getVertexIndexOnFace = (face: Triangle, vertex: Vertex) => {
    return [face.v1, face.v2, face.v3].indexOf(vertex)
  }

  private getUVsOnVertex = (face: Triangle, vertex: Vertex) => {
    return face.faceVertexUvs[this.getVertexIndexOnFace(face, vertex)]
  }

  private minimumCostEdge = (vertices: Vertex[]) => {
    // O(n * n) approach. TODO optimize this
  
    let least = vertices[0]
  
    for (let i = 0; i < vertices.length; i++) {
      if (vertices[i].collapseCost < least.collapseCost) {
        least = vertices[i]
      }
    }
  
    return least
  }

  private collapse = (vertices: Vertex[], faces: Triangle[], u: Vertex, v: Vertex, preserveTexture = true): void => {
    let max = 100
    // u and v are pointers to vertices of an edge
    // Collapse the edge uv by moving vertex u onto v
  
    if (!v) {
      // u is a vertex all by itself so just delete it..
      this.removeVertex(u, vertices)
      return
    }
  
    let i
    let tmpVertices = [] as any
  
    for (i = 0; i < u.neighbors.length; i++) {
      tmpVertices.push(u.neighbors[i])
    }
  
    let moveToThisUvsValues = [] as any
  
    // delete triangles on edge uv
    for (i = u.faces.length - 1; i >= 0; i--) {
      if (u.faces[i].hasVertex(v)) {
        if (preserveTexture) moveToThisUvsValues = this.getUVsOnVertex(u.faces[i], v)
        this.removeFace(u.faces[i], faces)
      }
    }
  
    if (preserveTexture) {
      for (i = u.faces.length - 1; i >= 0; i--) {
        if (max > 0) {
          max--
        }
        let faceVerticeUVs = this.getUVsOnVertex(u.faces[i], u)
  
        let verticeDistance = u.position.distanceTo(v.position)
        let size = globalGeometry.boundingSphere.radius * 2
        let percentageChangeVertexShift = 100 / size * verticeDistance
  
        let deltaX = Math.abs(100 * (moveToThisUvsValues.x - faceVerticeUVs.x))
        let deltaY = Math.abs(100 * (moveToThisUvsValues.y - faceVerticeUVs.y))
        let percentageChangeTextureCorrds = Math.max(deltaX, deltaY)
  
        // safety check from strange results:
        // if texture shift percentage is much higher than
        // vertex position shift in relation to object size
        if (
          Math.abs(percentageChangeTextureCorrds - percentageChangeVertexShift) >
          5
        ) {
          continue;
        }
  
        faceVerticeUVs.x = moveToThisUvsValues.x
        faceVerticeUVs.y = moveToThisUvsValues.y
      }
    }
  
    // update remaining triangles to have v instead of u
    for (i = u.faces.length - 1; i >= 0; i--) {
      u.faces[i].replaceVertex(u, v)
    }
  
    this.removeVertex(u, vertices)
  
    // recompute the edge collapse costs in neighborhood
    for (i = 0; i < tmpVertices.length; i++) {
      this.computeEdgeCostAtVertex(tmpVertices[i])
    }
  }

  public modify2 = (geometry: BufferGeometry, percentage: number, preserveTexture = true): BufferGeometry => {
    const lowerLimit = 51
    geometry = geometry.clone()

    globalGeometry = geometry
    if (!globalGeometry.boundingSphere) {
      globalGeometry.computeBoundingSphere()
    }

    geometry = mergeVertices(geometry)
    geometry.computeVertexNormals()
    

    // put data of original geometry in different data structures
    const vertices = [] as any
    const faces = [] as any
    const faceUVs = [] as any

    const positionAttribute = geometry.getAttribute("position")
    const uvAttribute = geometry.getAttribute("uv")

    if (positionAttribute.count < lowerLimit * 3) {
      return geometry
    }

    // add vertices
    for (let i = 0; i < positionAttribute.count; i++) {
      const v = new Vector3().fromBufferAttribute(positionAttribute, i)
      const vertex = new Vertex(v, i)
      vertices.push(vertex)
    }

    const geomIndex = geometry.getIndex()

    // add uvs
    if (geomIndex !== null) {
      for (let i = 0; i < geomIndex.count; i += 3) {
        const a = geomIndex.getX(i)
        const b = geomIndex.getX(i+1)
        const c = geomIndex.getX(i+2)
        //@ts-ignore
        const uv1 = new Vector2().fromBufferAttribute(uvAttribute, a)
        //@ts-ignore
        const uv2 = new Vector2().fromBufferAttribute(uvAttribute, b)
        //@ts-ignore
        const uv3 = new Vector2().fromBufferAttribute(uvAttribute, c)
        faceUVs.push([uv1, uv2, uv3])
      }
    } else {
      for (let i = 0; i < uvAttribute.count; i += 3) {
        //@ts-ignore
        const uv1 = new Vector2().fromBufferAttribute(uvAttribute, i)
        //@ts-ignore
        const uv2 = new Vector2().fromBufferAttribute(uvAttribute, i+1)
        //@ts-ignore
        const uv3 = new Vector2().fromBufferAttribute(uvAttribute, i+2)
        faceUVs.push([uv1, uv2, uv3])
      }
    }

    // add faces
    let uvIndex = 0
    if (geomIndex !== null) {
      for (let i = 0; i < geomIndex.count; i += 3) {
        const a = geomIndex.getX(i)
        const b = geomIndex.getX(i + 1)
        const c = geomIndex.getX(i + 2)

        //@ts-ignore
        const triangle = new Triangle(vertices[a], vertices[b], vertices[c], a, b, c, faceUVs[uvIndex])
        faces.push(triangle)
        uvIndex++
      }
    } else {
      for (let i = 0; i < positionAttribute.count; i += 3) {
        const a = i
        const b = i + 1
        const c = i + 2

        //@ts-ignore
        const triangle = new Triangle(vertices[a], vertices[b], vertices[c], a, b, c, faceUVs[uvIndex])
        faces.push(triangle)
        uvIndex++
      }
    }

    // compute all edge collapse costs

    for (let i = 0, il = vertices.length; i < il; i++) {
      this.computeEdgeCostAtVertex(vertices[i])
    }

    let nextVertex
    let z = Math.round(positionAttribute.count * percentage)

    while (z--) {
      nextVertex = this.minimumCostEdge(vertices)
      if (!nextVertex) {
        break
      } else {
        this.collapse(vertices, faces, nextVertex, nextVertex.collapseNeighbor, preserveTexture)
      }
    }

    let simplifiedGeometry = new BufferGeometry()
    const position = [] as any
    const uvs = [] as any
    let index = [] as any

    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i].position
      position.push(vertex.x, vertex.y, vertex.z)
    }

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i]

      const a = vertices.indexOf(face.v1)
      const b = vertices.indexOf(face.v2)
      const c = vertices.indexOf(face.v3)

      index.push(a, b, c)

      if (preserveTexture && faceUVs.length) {
        const uv = faces[i].faceVertexUvs
        for (let i = 0; i < uv.length; i++) {
          uvs.push(uv[i].x, uv[i].y)
        }
      }
    }

    simplifiedGeometry.setAttribute("position", new Float32BufferAttribute(position, 3))
    if (uvs.length) {
      simplifiedGeometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2))
    }
    simplifiedGeometry.setIndex(index)

    simplifiedGeometry = mergeVertices(simplifiedGeometry)
    simplifiedGeometry.computeVertexNormals()

    return simplifiedGeometry
  }

  public modify = (geometryRaw: Geometry, percentage: number, preserveTexture = true) => {
    geometryRaw = geometryRaw.clone()
    const lowerLimit = 51
    let isBufferGeometry = false
    let geometry = geometryRaw
  
    if (
      geometry instanceof BufferGeometry &&
      !geometry.vertices &&
      !geometry.faces
    ) {
      if (geometry.attributes.position.count < lowerLimit * 3) {
        return geometry
      }
      geometry = new Geometry().fromBufferGeometry(geometry)
      isBufferGeometry = true
    }
  
    globalGeometry = geometry
    if (!globalGeometry.boundingSphere) {
      globalGeometry.computeBoundingSphere()
    }
  
    if (geometry.vertices.length < 50) {
      return geometryRaw;
    }
  
    geometry.mergeVertices()
    geometry.computeVertexNormals()
  
    var oldVertices = geometry.vertices // Three Position
    var oldFaces = geometry.faces // Three Face
    var oldFaceUVs = geometry.faceVertexUvs[0]
  
    // conversion
    var vertices = new Array(oldVertices.length) // Simplify Custom Vertex Struct
    var faces = new Array(oldFaces.length) // Simplify Custom Traignle Struct
    var faceUVs = [] as any // rebuild UVs
  
    var i, il, face
  
    //
    // put data of original geometry in different data structures
    //
  
    // add vertices
    for (i = 0, il = oldVertices.length; i < il; i++) {
      vertices[i] = new Vertex(oldVertices[i], i)
    }
  
    if (preserveTexture && oldFaceUVs.length) {
      // add UVs
      for (i = 0; i < oldFaceUVs.length; i++) {
        const faceUV = oldFaceUVs[i]
  
        faceUVs.push([
          new Vector2(faceUV[0].x, faceUV[0].y),
          new Vector2(faceUV[1].x, faceUV[1].y),
          new Vector2(faceUV[2].x, faceUV[2].y)
        ]);
      }
    }
  
    // add faces
    for (i = 0, il = oldFaces.length; i < il; i++) {
      face = oldFaces[i];
      faces[i] = new Triangle(
        vertices[face.a],
        vertices[face.b],
        vertices[face.c],
        face.a,
        face.b,
        face.c,
        faceUVs[i],
        face.materialIndex
      );
    }
  
    // compute all edge collapse costs
    for (i = 0, il = vertices.length; i < il; i++) {
      this.computeEdgeCostAtVertex(vertices[i])
    }
  
    var nextVertex
    var z = Math.round(geometry.vertices.length * percentage)
  
    // console.time('z')
    // console.profile('zz');
  
    while (z--) {
      nextVertex = this.minimumCostEdge(vertices)
      if (!nextVertex) {
        //console.log("no next vertex");
        break;
      }
  
      this.collapse(
        vertices,
        faces,
        nextVertex,
        nextVertex.collapseNeighbor,
        preserveTexture
      );
    }
  
    // TODO convert to buffer geometry.
    var newGeo = new Geometry()
    if (oldFaceUVs.length) newGeo.faceVertexUvs[0] = []
  
    for (i = 0; i < vertices.length; i++) {
      var v = vertices[i]
      newGeo.vertices.push(v.position)
    }
    for (i = 0; i < faces.length; i++) {
      var tri = faces[i];
      newGeo.faces.push(
        new Face3(
          vertices.indexOf(tri.v1),
          vertices.indexOf(tri.v2),
          vertices.indexOf(tri.v3),
          undefined,
          undefined,
          tri.materialIndex
        )
      )
      if (oldFaceUVs.length) newGeo.faceVertexUvs[0].push(faces[i].faceVertexUvs)
    }
  
    newGeo.mergeVertices()
    newGeo.computeVertexNormals()
    newGeo.computeFaceNormals()
    newGeo.computeBoundingSphere()
    newGeo.name = geometry.name

    return isBufferGeometry ? new BufferGeometry().fromGeometry(newGeo) : newGeo
  }
}

export {SimplifyModifier}