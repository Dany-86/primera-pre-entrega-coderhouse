// ------------------------- Importaciones -----------------------

const express = require('express')
const { Router } = express

const ContenedorArchivo = require('./ContenedorArchivo.js')

//--------- instanciacion servidor y persistencia (archivos)------

const app = express()

const contenedorProductos = new ContenedorArchivo('./persistencia/archivoProductos.json')
const contenedorCarritos = new ContenedorArchivo('./persistencia/archivoCarritos.json')


//-------------- configuracion del servidor -----------------------

const PORT = 8080
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const server = app.listen(PORT, () => {
    console.log(`Servidor http escuchando en el puerto ${server.address().port}`)
})
server.on('error', error => console.log(`Error en servidor ${error}`))

//--------------------- Routers -----------------------------------

const productosRouter = new Router()
const carritosRouter = new Router()
app.use('/api/productos', productosRouter)
app.use('/api/carritos', carritosRouter)

//-------------- permisos de administrador -----------------------
const esAdmin = true

function soloAdmins(req, res, next) {
    if (!esAdmin) {
        res.json({ message: "Usuario no autorizado para la ruta especificada" })
    } else {
        next()
    }
}

//------------------- rutas de productos --------------------------

productosRouter.get('/', async (req, res) => {
    const productos = await contenedorProductos.getAll()
    res.json(productos)
})

productosRouter.get('/:id', async (req, res) => {
    res.json(await contenedorProductos.getById(req.params.id))
})

productosRouter.post('/', soloAdmins, async (req, res) => {
    res.json({ id: await contenedorProductos.save(req.body) })
})

productosRouter.put('/:id', soloAdmins, async (req, res) => {
    res.json(await contenedorProductos.update(req.body, req.params.id))
})

productosRouter.delete('/:id', soloAdmins, async (req, res) => {
    res.json(await contenedorProductos.deleteById(req.params.id))
})

// ----------------- rutas de carritos ------------------------

carritosRouter.get('/', async (req, res) => {
    res.json((await contenedorCarritos.getAll()).map(c => c.id))
})

carritosRouter.post('/', async (req, res) => {
    res.json({ id: await contenedorCarritos.save({ productos: [] }) })
})

carritosRouter.delete('/:id', async (req, res) => {
    res.json(await contenedorCarritos.deleteById(req.params.id))
})

carritosRouter.get('/:id/productos', async (req, res) => {
    const carrito = await contenedorCarritos.getById(req.params.id)
    res.json(carrito.productos)
})

carritosRouter.post('/:id/productos', async (req, res) => {
    const carrito = await contenedorCarritos.getById(req.params.id)
    const producto = await contenedorProductos.getById(req.body.id)
    carrito.productos.push(producto)
    await contenedorCarritos.update(carrito, req.params.id)
    res.end()
})

carritosRouter.delete('/:id/productos/:idProd', async (req, res) => {
    const carrito = await contenedorCarritos.getById(req.params.id)
    const index = carrito.productos.findIndex(p => p.id == req.params.idProd)
    if (index != -1) {
        carrito.productos.splice(index, 1)
        await contenedorCarritos.update(carrito, req.params.id)
    }
    res.end()
})



